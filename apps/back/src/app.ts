import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

export interface AppOptions {
  /** Absolute path of the built front to serve from the same origin (production only). */
  staticRoot?: string;
}

export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();

  app.use(
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
      },
    }),
  );

  // Set after the handler runs so no route (static files included) can loosen it.
  app.use(async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  });

  app.get("/api/health", (c) => c.json({ status: "ok" }));

  if (options.staticRoot !== undefined) {
    app.use("*", serveStatic({ root: options.staticRoot }));
  }

  return app;
}
