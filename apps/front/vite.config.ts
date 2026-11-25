import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import { cleanUrls } from "./src/build/clean-urls.ts";

const BACK = "http://127.0.0.1:3000";

export default defineConfig({
  appType: "mpa",
  plugins: [cleanUrls(["/como-funciona", "/s"])],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": BACK,
      "/ws": { target: BACK, ws: true },
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        comoFunciona: resolve(import.meta.dirname, "como-funciona/index.html"),
        session: resolve(import.meta.dirname, "s/index.html"),
      },
    },
  },
  test: {
    environment: "happy-dom",
    environmentOptions: {
      // Page specs parse real pages: their stylesheet links are not fetched.
      happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: true } },
    },
    include: ["src/**/*.spec.ts"],
  },
});
