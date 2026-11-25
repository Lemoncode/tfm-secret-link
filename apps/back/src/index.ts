import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { staticRootFor } from "./config.ts";

// Loopback by default so the dev server is not exposed to the local network.
const hostname = process.env["HOST"] ?? "127.0.0.1";
const port = Number(process.env["PORT"] ?? 3000);

const app = createApp({ staticRoot: staticRootFor(process.env) });

serve({ fetch: app.fetch, hostname, port }, (info) => {
  console.log(`back listening on http://${info.address}:${info.port}`);
});
