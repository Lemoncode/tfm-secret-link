import { describe, expect, it } from "vitest";
import { pageUrl } from "./clean-urls.ts";

const PAGES = ["/como-funciona", "/s"];

describe("pageUrl", () => {
  it("serves a page route without its trailing slash from its directory", () => {
    expect(pageUrl("/como-funciona", PAGES)).toBe("/como-funciona/");
  });

  it("keeps the query string", () => {
    expect(pageUrl("/como-funciona?x=1", PAGES)).toBe("/como-funciona/?x=1");
  });

  it.each(["/", "/como-funciona/", "/s/", "/nope", "/src/main.ts"])(
    "leaves %s untouched",
    (url) => {
      expect(pageUrl(url, PAGES)).toBe(url);
    },
  );
});
