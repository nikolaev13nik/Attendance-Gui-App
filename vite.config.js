import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const accounting = env.ACCOUNTING_TARGET || "http://localhost:8081";
  const timetracking = env.TIMETRACKING_TARGET || "http://localhost:8082";
  const ingressHost = env.INGRESS_HOST;

  const route = (target) =>
    ingressHost
      ? { target, changeOrigin: false, headers: { Host: ingressHost } }
      : { target, changeOrigin: true };

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/account": route(accounting),
        "/attendance": route(timetracking),
      },
    },
  };
});
