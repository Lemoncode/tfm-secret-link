import { describe, expect, it } from "vitest";
import { ICON_SHAPES } from "./icon-shapes.ts";
import sprite from "./icons/sprite.svg?raw";

const files = import.meta.glob<string>("./icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const STYLE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.75",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

const names = Object.keys(ICON_SHAPES) as (keyof typeof ICON_SHAPES)[];

describe("the icon set", () => {
  it("has the theme selector's sun, moon and monitor", () => {
    expect(names).toEqual(expect.arrayContaining(["sun", "moon", "monitor"]));
  });

  it.each(names)(
    "draws %s the same in the icon map, its .svg file and the sprite, in the handoff's style",
    (name) => {
      const file = parseSvg(files[`./icons/${name}.svg`] ?? "");
      const symbol = parseSvg(sprite).getElementById(`i-${name}`);

      expect(file.documentElement.tagName).toBe("svg");
      expect(symbol).not.toBeNull();
      for (const drawing of [file.documentElement, symbol!]) {
        expect(attributesOf(drawing, Object.keys(STYLE))).toEqual(STYLE);
        expect(shapesOf(drawing)).toEqual(
          ICON_SHAPES[name].map(([tag, attributes]) => [tag, attributes]),
        );
      }
    },
  );

  it("has an .svg file and a sprite symbol for nothing outside the map", () => {
    const fileNames = Object.keys(files)
      .map((path) => path.replace(/^\.\/icons\/(.*)\.svg$/, "$1"))
      .filter((name) => name !== "sprite");
    const symbolNames = [...parseSvg(sprite).querySelectorAll("symbol")].map(
      (symbol) => symbol.id.replace(/^i-/, ""),
    );

    expect(fileNames.sort()).toEqual([...names].sort());
    expect(symbolNames.sort()).toEqual([...names].sort());
  });
});

function parseSvg(source: string): Document {
  return new DOMParser().parseFromString(source, "image/svg+xml");
}

function attributesOf(
  element: Element,
  keys: readonly string[],
): Record<string, string | null> {
  return Object.fromEntries(
    keys.map((key) => [key, element.getAttribute(key)]),
  );
}

function shapesOf(element: Element): [string, Record<string, string>][] {
  return [...element.children].map((shape) => [
    shape.tagName.toLowerCase(),
    Object.fromEntries(
      [...shape.attributes].map((attribute) => [
        attribute.name,
        attribute.value,
      ]),
    ),
  ]);
}
