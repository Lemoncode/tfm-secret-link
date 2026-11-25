import { afterEach, describe, expect, it, vi } from "vitest";

describe("the page entry module", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.resetModules();
  });

  it("draws the page's svg[data-icon] icons", async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-icon", "sun");
    document.body.append(svg);

    await import("./main.ts");

    expect(svg.classList.contains("sl-icon")).toBe(true);
    expect(svg.querySelector("circle")).not.toBeNull();
  });

  it("defines <sl-theme-switch>", async () => {
    await import("./main.ts");

    expect(customElements.get("sl-theme-switch")).toBeDefined();
  });
});
