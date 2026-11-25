import { ICON_SHAPES } from "./icon-shapes.ts";

const SVG_NS = "http://www.w3.org/2000/svg";

export type IconName = keyof typeof ICON_SHAPES;

export interface IconOptions {
  /** Adds the `sl-icon--<size>` modifier. */
  size?: "sm" | "lg";
  /** Extra classes, space separated. */
  className?: string;
  /** Makes the icon meaningful: `role="img"` with this accessible name. */
  label?: string;
}

/**
 * Creates an `<svg class="sl-icon">` drawing the named icon: decorative
 * (`aria-hidden`) unless `label` names it.
 */
export function icon(name: IconName, options: IconOptions = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  if (options.label) {
    // Why: the handoff sets the label after filling, leaving a labelled icon
    // aria-hidden; labelling first keeps it in the accessibility tree.
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
  }
  fillIcon(svg, name);
  const classes = ["sl-icon"];
  if (options.size) classes.push(`sl-icon--${options.size}`);
  if (options.className) classes.push(options.className);
  svg.setAttribute("class", classes.join(" "));
  return svg;
}

/** Draws every `<svg data-icon="name">` under `root` and marks it `sl-icon`. */
export function hydrateIcons(root: ParentNode = document): void {
  for (const svg of root.querySelectorAll<SVGSVGElement>("svg[data-icon]")) {
    fillIcon(svg, svg.getAttribute("data-icon") ?? "");
    svg.classList.add("sl-icon");
  }
}

function fillIcon(svg: SVGSVGElement, name: string): void {
  if (!isIconName(name)) {
    console.warn(`[SecretLink] icono desconocido: ${name}`);
    return;
  }
  const shapes: readonly (typeof ICON_SHAPES)[IconName][number][] =
    ICON_SHAPES[name];
  svg.replaceChildren();
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("focusable", "false");
  if (!svg.hasAttribute("aria-label")) svg.setAttribute("aria-hidden", "true");
  for (const [tag, attributes] of shapes) {
    const shape = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      shape.setAttribute(key, value);
    }
    svg.append(shape);
  }
}

function isIconName(name: string): name is IconName {
  return Object.hasOwn(ICON_SHAPES, name);
}
