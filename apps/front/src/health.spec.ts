import { describe, expect, it } from "vitest";
import { checkHealth } from "./health.ts";

const respondWith = (response: Response) => () => Promise.resolve(response);

describe("checkHealth", () => {
  it("is up when the server answers { status: 'ok' }", async () => {
    const state = await checkHealth(
      respondWith(Response.json({ status: "ok" })),
    );

    expect(state).toBe("up");
  });

  it.each([
    ["another status", Response.json({ status: "degraded" })],
    ["a non-object body", Response.json(null)],
    [
      "an error status with an ok body",
      Response.json({ status: "ok" }, { status: 503 }),
    ],
  ])("is down for %s", async (_label, response) => {
    expect(await checkHealth(respondWith(response))).toBe("down");
  });

  it("is down when the body is not JSON", async () => {
    const response = new Response("<html>proxy error</html>", { status: 200 });

    expect(await checkHealth(respondWith(response))).toBe("down");
  });

  it("is down on a network error", async () => {
    const failing = () => Promise.reject(new TypeError("Failed to fetch"));

    expect(await checkHealth(failing)).toBe("down");
  });
});
