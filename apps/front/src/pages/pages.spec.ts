import { describe, expect, it } from "vitest";
import home from "../../index.html?raw";
import comoFunciona from "../../como-funciona/index.html?raw";
import session from "../../s/index.html?raw";
import { parsePage } from "./parse-page.ts";

const PAGES = { "/": home, "/como-funciona": comoFunciona, "/s/": session };

describe.each(Object.entries(PAGES))("every page: %s", (_route, html) => {
  const page = parsePage(html);

  it("applies the stored theme with a classic, blocking script before its stylesheets", () => {
    const script = page.head.querySelector('script[src="/theme-init.js"]');
    const firstSheet = page.head.querySelector('link[rel="stylesheet"]');

    expect(script).not.toBeNull();
    expect(script?.hasAttribute("type")).toBe(false);
    expect(script?.hasAttribute("defer")).toBe(false);
    expect(script?.hasAttribute("async")).toBe(false);
    expect(
      firstSheet &&
        script!.compareDocumentPosition(firstSheet) &
          Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("ends its header with the theme selector", () => {
    const header = page.querySelector(".sl-header");

    expect(header?.lastElementChild?.tagName.toLowerCase()).toBe(
      "sl-theme-switch",
    );
    expect(page.querySelectorAll("sl-theme-switch")).toHaveLength(1);
  });

  it("loads the selector's own stylesheet right after components.css", () => {
    const sheets = [...page.querySelectorAll('link[rel="stylesheet"]')].map(
      (link) => link.getAttribute("href"),
    );

    expect(sheets).toEqual([
      "/src/design-system/tokens.css",
      "/src/design-system/components.css",
      "/src/theme-switch.css",
    ]);
  });
});

describe("the theme selector's template", () => {
  const templates = Object.values(PAGES).map(
    (html) =>
      parsePage(html).getElementById("sl-theme-switch-template")?.outerHTML,
  );

  it("is on every page, identical", () => {
    expect(templates[0]).toContain("radiogroup");
    expect(new Set(templates).size).toBe(1);
  });
});
