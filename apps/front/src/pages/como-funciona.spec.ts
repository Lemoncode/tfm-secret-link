import { describe, expect, it } from "vitest";
import html from "../../como-funciona/index.html?raw";
import { linkNamed, parsePage } from "./parse-page.ts";

const page = parsePage(html);

describe("/como-funciona (E02 Cómo funciona)", () => {
  it("is titled «Cómo funciona · Secret Link»", () => {
    expect(page.title).toBe("Cómo funciona · Secret Link");
  });

  it("has a single <h1> «Cómo funciona»", () => {
    const headings = page.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe("Cómo funciona");
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

  it("links the brand to / and the nav to /como-funciona", () => {
    expect(page.querySelector(".sl-brand")?.getAttribute("href")).toBe("/");
    expect(page.querySelector(".sl-header__nav a")?.getAttribute("href")).toBe(
      "/como-funciona",
    );
  });

  it("makes «Crear transferencia segura» a link to /s/ styled as the primary button", () => {
    const create = linkNamed(page, "Crear transferencia segura");

    expect(create?.getAttribute("href")).toBe("/s/");
    expect(create?.classList.contains("sl-btn--primary")).toBe(true);
    expect(page.querySelector("button")).toBeNull();
  });

  it("keeps the four steps, the table and the five limits of the mockup", () => {
    expect(page.querySelectorAll(".sl-ordered > li")).toHaveLength(4);
    expect(page.querySelectorAll(".sl-table tbody tr")).toHaveLength(6);
    expect(page.querySelectorAll(".sl-details")).toHaveLength(5);
  });

  it("carries nothing from the handoff prototype", () => {
    expect(html).not.toMatch(/prototype|data-proto|E0\d/);
  });
});
