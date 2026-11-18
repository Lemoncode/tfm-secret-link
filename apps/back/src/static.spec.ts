import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

const staticRoot = fileURLToPath(
  new URL("./__fixtures__/static", import.meta.url),
);

describe("static files from staticRoot", () => {
  it("serves index.html at /", async () => {
    const res = await createApp({ staticRoot }).request("/");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/html/);
    expect(await res.text()).toContain("fixture index");
  });

  it("serves an existing asset", async () => {
    const res = await createApp({ staticRoot }).request("/assets/app.js");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(await res.text()).toContain("fixture asset");
  });

  it("does not let a static file shadow /api/health", async () => {
    const res = await createApp({ staticRoot }).request("/api/health");

    expect(await res.json()).toEqual({ status: "ok" });
  });

  // The WHATWG URL parser already collapses a literal "/../" (and "%2e%2e/"),
  // so the attempts that reach the handler are the ones with an encoded separator.
  it.each([
    "/../secret.txt",
    "/%2e%2e/secret.txt",
    "/..%2fsecret.txt",
    "/%2e%2e%2fsecret.txt",
    "/assets/..%2f..%2fsecret.txt",
    "/..%5csecret.txt",
  ])("does not escape staticRoot for %s", async (path) => {
    const res = await createApp({ staticRoot }).request(path);

    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("outside-secret");
  });

  it("keeps the security headers and no-store on static files", async () => {
    const res = await createApp({ staticRoot }).request("/assets/app.js");

    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
  });
});
