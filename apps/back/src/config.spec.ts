import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { staticRootFor } from "./config.ts";

const frontDist = fileURLToPath(new URL("../../front/dist", import.meta.url));

describe("staticRootFor", () => {
  it("serves the built front when NODE_ENV=production", () => {
    expect(staticRootFor({ NODE_ENV: "production" })).toBe(frontDist);
  });

  it.each([{}, { NODE_ENV: "development" }, { NODE_ENV: "test" }])(
    "serves no static files outside production (%o)",
    (env) => {
      expect(staticRootFor(env)).toBeUndefined();
    },
  );
});
