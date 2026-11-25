import { afterEach, describe, expect, it, vi } from "vitest";
import { hydrateIcons, icon } from "./icons.ts";
import source from "./icons.ts?raw";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("icon", () => {
  it("builds a decorative 24×24 sl-icon from the icon set, in the SVG namespace", () => {
    const svg = icon("lock");

    expect(svg.namespaceURI).toBe(SVG_NS);
    expect(svg.getAttribute("class")).toBe("sl-icon");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect([...svg.children].map((child) => child.tagName)).toEqual([
      "rect",
      "path",
      "path",
    ]);
    expect(svg.children[0]?.namespaceURI).toBe(SVG_NS);
    expect(svg.children[1]?.getAttribute("d")).toBe("M8 11V7a4 4 0 0 1 8 0v4");
  });

  it("gives a labelled icon an image role and accessible name instead of hiding it", () => {
    const svg = icon("shield-check", { label: "Verificado" });

    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Verificado");
    expect(svg.hasAttribute("aria-hidden")).toBe(false);
  });

  it("adds the size modifier and extra classes", () => {
    const svg = icon("clock", { size: "lg", className: "sl-timer__icon" });

    expect(svg.getAttribute("class")).toBe(
      "sl-icon sl-icon--lg sl-timer__icon",
    );
  });
});

it("builds icons node by node, never from HTML strings (Trusted Types)", () => {
  expect(source).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/);
});

describe("hydrateIcons", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("draws every svg[data-icon] under the root as an sl-icon", () => {
    document.body.append(svgFor("clock"), svgFor("x"));

    hydrateIcons(document);

    const [clock, x] = document.querySelectorAll("svg");
    expect(clock?.classList.contains("sl-icon")).toBe(true);
    expect(clock?.querySelector("circle")?.getAttribute("r")).toBe("9");
    expect(x?.querySelector("path")?.getAttribute("d")).toBe(
      "M6 6l12 12M18 6L6 18",
    );
  });

  it("only touches icons under the given root", () => {
    const inside = document.createElement("div");
    inside.append(svgFor("check"));
    document.body.append(inside, svgFor("check"));

    hydrateIcons(inside);

    expect(inside.querySelector("svg")?.childElementCount).toBe(1);
    expect(document.body.lastElementChild?.childElementCount).toBe(0);
  });

  it("warns about an unknown icon and leaves its svg empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unknown = svgFor("nope");
    document.body.append(unknown);

    hydrateIcons(document);

    expect(unknown.childElementCount).toBe(0);
    expect(warn).toHaveBeenCalledWith("[SecretLink] icono desconocido: nope");
  });
});

function svgFor(name: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-icon", name);
  return svg;
}
