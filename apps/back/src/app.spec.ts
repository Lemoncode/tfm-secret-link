import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

describe("GET /api/health", () => {
  it("responds 200 with { status: 'ok' }", async () => {
    const app = createApp();

    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

const EXPECTED_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
];

describe.each(["/api/health", "/does-not-exist"])(
  "security headers on %s",
  (path) => {
    it("sends the strict Content-Security-Policy", async () => {
      const res = await createApp().request(path);

      const directives = (res.headers.get("content-security-policy") ?? "")
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean);
      expect(directives.sort()).toEqual([...EXPECTED_CSP].sort());
    });

    it("sends Cache-Control: no-store", async () => {
      const res = await createApp().request(path);

      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("does not send X-Powered-By", async () => {
      const res = await createApp().request(path);

      expect(res.headers.has("x-powered-by")).toBe(false);
    });
  },
);
