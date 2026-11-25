import { describe, expect, it } from "vitest";
import html from "../../s/index.html?raw";
import { parsePage } from "./parse-page.ts";

const page = parsePage(html);

describe("/s/ (empty session shell)", () => {
  it("is titled «Secret Link»", () => {
    expect(page.title).toBe("Secret Link");
  });

  it("has a single, visually hidden <h1> «Sesión»", () => {
    const headings = page.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe("Sesión");
    expect(headings[0]?.classList.contains("sl-visually-hidden")).toBe(true);
  });

  it("loads tokens.css before components.css and sends no referrer", () => {
    const sheets = [...page.querySelectorAll('link[rel="stylesheet"]')].map(
      (link) => link.getAttribute("href"),
    );

    expect(sheets.slice(0, 2)).toEqual([
      "/src/design-system/tokens.css",
      "/src/design-system/components.css",
    ]);
    expect(
      page.querySelector('meta[name="referrer"]')?.getAttribute("content"),
    ).toBe("no-referrer");
  });

  it("has the shared header with the brand linking to /", () => {
    expect(
      page.querySelector(".sl-header .sl-brand")?.getAttribute("href"),
    ).toBe("/");
  });

  it("holds an empty session mount point in sl-main", () => {
    const mount = page.querySelector(".sl-main #session");

    expect(mount).not.toBeNull();
    expect(mount?.childNodes).toHaveLength(0);
  });

  it("has no footer", () => {
    expect(page.querySelector("footer")).toBeNull();
  });
});
