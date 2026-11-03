# Attendance GUI

The web front end of the [Attendance Platform](https://github.com/nikolaev13nik/attendance-project-common):
a React single-page app in English, Hebrew (right-to-left) and Russian. It holds no business logic of its
own; it talks to [Accounting](https://github.com/nikolaev13nik/Attendance-Accounting) for sign-up, login and
users, and to [TimeTracking](https://github.com/nikolaev13nik/Attendance-TimeTracking) for everything about
hours.

## What it offers

| Page | For |
| --- | --- |
| Sign up, Log in | anyone — sign-up creates a company and its first administrator, behind a Cloudflare Turnstile captcha |
| Session | employees — clock in and out for today |
| Sessions, Leave days | employees see their own; administrators see and correct everyone's |
| Users | administrators — add and remove employees, grant or revoke the administrator role |
| Statistics | administrators — monthly totals per employee, with an option to receive an AI-written analysis by email |
| Companies | the platform administrator — pick any company and manage it as its administrator |

## How it works

- **Same origin, no CORS.** The app calls the APIs with relative paths (`/account/...`,
  `/attendance/...`). In Kubernetes the ingress routes `/` here and the API prefixes to the services; in
  Docker Compose nginx proxies them; with `npm run dev` Vite does.
- **Auth.** The JWT from Accounting is kept in `sessionStorage` and sent as a bearer token; pages are
  wrapped in a route guard that checks the role the page needs.
- **Runtime configuration.** `/config.json` (the overtime threshold and the public Turnstile site key) is
  read at start-up, so the same image runs in every environment; Kubernetes supplies it from a ConfigMap.
- **Serving.** The production build is static files served by nginx in an unprivileged container.

## Run and test

```bash
npm ci
npm run dev        # Vite on port 3000, proxying the APIs to localhost:8081 / 8082
npm test           # Vitest
npm run build      # production bundle into dist/
```

Requires Node 24 (see `.nvmrc`). To run against real backends, start the Docker Compose stack in
[attendance-project-common](https://github.com/nikolaev13nik/attendance-project-common) and open
http://localhost:8080.

## Deployment

CI (GitHub Actions) runs the tests and the build, pushes the nginx image to GitHub Container Registry, tags
the version and writes it into [`helm/gui`](helm/gui), which is deployed to Kubernetes.
