# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System context

This repo is the **GUI** — the only non-Java repo in a system of four services plus shared
infrastructure (see `../attendance-project-common/sharedFiles/DEPLOYMENT-GUIDE.md`). It is a React 18 /
Vite 7 single-page app and it holds **no business logic and no persistence**: it consumes `/account/**`
from `../Attendance-Accounting` (which issues the JWT) and `/attendance/**` from
`../Attendance-TimeTracking` (which validates it).

Nothing type-checks the DTOs across that boundary. There is no generated client and no OpenAPI
codegen here, unlike TimeTracking's client for Accounting — so **a backend contract change breaks this
app silently at runtime**, not at build time. When a sibling repo's spec changes, the call sites in
`src/api/` have to be checked by hand.

## The same-origin invariant — do not break this

`src/api/http.js` calls `fetch(path, …)` with **relative** paths (`/account/login`,
`/attendance/sessions/...`). There is no base URL anywhere in this repo, and Accounting disables CORS
outright (`http.cors(cors -> cors.disable())` in its `SecurityConfiguration`). Therefore the app must
be served from the **same origin as the backends**, which is why the ingress routes `/` here.

**Do not introduce `VITE_API_URL` or any absolute API base.** It would require enabling and configuring
CORS in two Spring services and would change the deployment topology; that is a cross-repo decision,
not a frontend one.

`vite.config.js` also sets no `base`, so `index.html` references `/assets/...` absolutely. Moving the
app to a sub-path is three coupled changes, never one: `base: "/gui/"` here, a `basename` on
`BrowserRouter` in `src/main.jsx`, and the ingress path in
`../attendance-project-common/helm/platform/values.yaml`.

## Commands

```bash
npm ci                      # install exactly what package-lock.json pins
npm run dev                 # vite dev server on port 3000, strictPort - fails rather than moving
npm run build               # production bundle into dist/ (gitignored)
npm run preview             # serve the built bundle locally
npm test                    # vitest, run once

docker build -t gui:local . # the real image
docker run --rm -p 8080:8080 gui:local
```

`npm test` (vitest) and `npm run build` are the CI gates; there is no linter. Tests sit next to the
module as `*.test.js` and cover pure logic only — there is no DOM environment configured.

`npm run dev` proxies the two API prefixes; the targets come from env vars read by `vite.config.js`
(`.env.development` is gitignored, `.env.example` is the template):

- `ACCOUNTING_TARGET` / `TIMETRACKING_TARGET` — default to `http://localhost:8081` / `:8082`, the
  Compose host ports.
- `INGRESS_HOST` — when set, the proxy keeps `changeOrigin: false` and sends `Host: <that value>`
  instead. That is how you point the dev server at the cluster via `http://127.0.0.1` while Traefik
  still matches the `attendance.local` rule, skipping macOS mDNS resolution of a `.local` name, which
  is slow and unreliable on this machine.

## Architecture

`src/main.jsx` mounts `BrowserRouter` → `src/App.jsx` holds every route. `src/auth/AuthContext.jsx`
owns the token and the signed-in user; `RequireAuth.jsx` wraps the protected routes and `roles.js`
holds the role checks. `src/api/` is the only place that talks HTTP — `http.js` is the shared
`request()` wrapper, `accounting.js` and `timetracking.js` are the per-service call sites.

`http.js` maps failures to user-facing text rather than letting raw statuses surface, and it treats
502/503/504 and a bodiless 500 as "backend unreachable" via `looksUnreachable`. Keep new calls going
through `request()` so they inherit that handling instead of calling `fetch` directly.

## Container and serving

One `Dockerfile`, deliberately — unlike the Java repos' `Dockerfile` + `Dockerfile.dev` split, whose
purpose is to avoid repeating an expensive Maven build. Here `dist/` is gitignored so there is no
host-built artifact to copy, and the build takes about ten seconds, so CI and Compose use the same
multi-stage build.

Runtime is `nginxinc/nginx-unprivileged` on **8080** as uid 101. Two config files:

- `nginx/default.conf` is **baked into the image** and must stay proxy-free. nginx resolves literal
  `proxy_pass` hostnames at startup and exits if they do not resolve, so a baked-in backend address
  crash-loops in Kubernetes. It carries `include /etc/nginx/conf.d/proxy/*.conf;` — a glob that
  matches nothing in the cluster, which nginx accepts.
- `nginx/compose-proxy.conf` is mounted into that directory **only by Compose**, where there is no
  Ingress to route `/account` and `/attendance`.

Two things in `default.conf` are load-bearing and non-obvious:

- `listen [::]:8080;` is explicit because the base image's `10-listen-on-ipv6-by-default.sh` cannot
  patch a root-owned config file as uid 101. Without it nginx is IPv4-only and anything resolving
  `localhost` to `::1` is refused.
- `index.html` gets `Cache-Control: no-store` while `/assets/` gets `immutable`. `index.html` is the
  only unhashed file and it names the hashed bundle, so caching it serves assets the new image no
  longer has.

`/healthz` is the probe path, standing in for the Java services' `/actuator/health`.

`/config.json` is the one piece of runtime config, read once by `src/api/config.js` and served
`no-store`. The image ships `public/config.json` with the defaults, which is what Compose and `npm run dev`
see; in Kubernetes the `gui-config` ConfigMap is mounted over it with `subPath`. Its only key is
`overtimeDailyThreshold`, a string in `H.MM` clock time — `"8.40"` is 8h40m, and a single minute digit
is right-padded so an unquoted YAML `8.40` (a float, `8.4`) means the same — parsed by `clockMinutes` in
`src/api/hours.js`. It must match TimeTracking's `overtimeDailyThreshold`, since that service computes the overtime in the monthly statistics while
this app computes the per-row columns.

## Deployment

`helm/gui/` holds a `configmap.yaml` for `config.json` (see above); a `checksum/config` pod annotation
rolls the pod when it changes, since a `subPath` mount never sees ConfigMap updates. It is the only chart
in the system with no `secretKeyRef`, so it installs onto a bare namespace.

Argo CD owns this workload (`../attendance-project-common/argocd/gui-application.yaml`) with
`selfHeal: true`, so a `kubectl edit` is reverted within seconds and a commit is the only way in. To
replace a pod use `kubectl delete pod -l app=gui`, **not** `kubectl rollout restart`, which writes a
pod-template annotation that Argo treats as drift.

**CI owns `appVersion`.** `.github/workflows/ci.yml` builds, pushes to GHCR, tags the version, then
rewrites `appVersion` in `helm/gui/Chart.yaml` and commits it — so pushing to `main` is the whole
deploy, and `paths-ignore: helm/**` is what keeps that commit from retriggering the build. Do not
hand-edit `appVersion` except to pin or roll back to a tag that already exists, and never put a `src/`
change and a `helm/` change in one commit.

`package.json`'s `version` is unrelated to the image tag; the tag comes from git tags.

## Known gaps (don't assume these exist)

- No linter, no TypeScript, no component tests.
- No error boundary: a render-time throw blanks the page rather than showing a fallback.
- No generated API client, so no compile-time check against the backend specs.
- `http.js`'s unreachable message names `docker compose ps`, which is wrong advice when the app is
  running in the cluster.
- No README — `CLAUDE.md` plus the shared `DEPLOYMENT-GUIDE.md` is the convention across all five
  repos.

## General coding principles

- Keep this repo presentational: fetching, routing, auth state and rendering. Logic that belongs to a
  domain belongs to the service that owns it.
- All HTTP goes through `request()` in `src/api/http.js`; add a function to `accounting.js` or
  `timetracking.js` rather than calling `fetch` from a component.
- Follow the idioms already present — function components with hooks, context for auth, plain CSS in
  `src/styles/app.css` — rather than introducing new patterns without a reason.
