import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import { linkNamed, parsePage } from "./parse-page.ts";

const page = parsePage(html);

describe("/ (E01 Inicio)", () => {
  it("is titled «Secret Link»", () => {
    expect(page.title).toBe("Secret Link");
  });

  it("has a single <h1> with the mockup's headline", () => {
    const headings = page.querySelectorAll("h1");

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe("Envía secretos sin dejar rastro");
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

  it("links the brand to / and «Cómo funciona» to /como-funciona", () => {
    expect(page.querySelector(".sl-brand")?.getAttribute("href")).toBe("/");
    expect(page.querySelector(".sl-header__nav a")?.getAttribute("href")).toBe(
      "/como-funciona",
    );
    expect(linkNamed(page, "¿Cómo funciona?")?.getAttribute("href")).toBe(
      "/como-funciona",
    );
  });

  it("makes «Crear transferencia segura» a link to /s/ styled as the primary button", () => {
    const create = linkNamed(page, "Crear transferencia segura");

    expect(create?.getAttribute("href")).toBe("/s/");
    expect(create?.classList.contains("sl-btn--primary")).toBe(true);
    expect(page.querySelector("button")).toBeNull();
  });

  it("no longer shows the server health indicator", () => {
    expect(page.querySelector("#health")).toBeNull();
    expect(page.body.textContent).not.toMatch(/Servidor|Comprobando/);
  });

  it("carries nothing from the handoff prototype", () => {
    expect(html).not.toMatch(/prototype|data-proto|E0\d/);
  });
});
