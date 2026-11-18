import { defineConfig } from "vitest/config";

const BACK = "http://127.0.0.1:3000";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": BACK,
      "/ws": { target: BACK, ws: true },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
