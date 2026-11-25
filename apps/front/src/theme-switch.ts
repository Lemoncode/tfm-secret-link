import { hydrateIcons } from "./design-system/icons.ts";
import { applyTheme, currentTheme, type Theme } from "./theme.ts";

const TEMPLATE_ID = "sl-theme-switch-template";

/** Arrow keys of the WAI-ARIA radio group pattern: the step they move. */
const ARROW_STEP: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * `<sl-theme-switch>`: the Claro / Oscuro / Según el sistema radio group.
 * Light DOM: it clones its page's `<template>` so `components.css` and the
 * tokens style it as any other markup.
 */
class ThemeSwitch extends HTMLElement {
  connectedCallback(): void {
    if (this.childElementCount > 0) return;
    const template = document.getElementById(TEMPLATE_ID);
    if (!(template instanceof HTMLTemplateElement)) return;
    const content = template.content.cloneNode(true) as DocumentFragment;
    hydrateIcons(content);
    this.append(content);
    this.addEventListener("click", this.onClick);
    this.addEventListener("keydown", this.onKeydown);
    this.render();
  }

  private readonly onClick = (event: MouseEvent): void => {
    const option = (event.target as Element | null)?.closest<HTMLElement>(
      "[data-theme-option]",
    );
    if (option && this.contains(option)) this.select(option);
  };

  private readonly onKeydown = (event: KeyboardEvent): void => {
    const step = ARROW_STEP[event.key];
    if (step === undefined) return;
    const options = this.options;
    const from = options.findIndex(
      (option) => option.getAttribute("aria-checked") === "true",
    );
    // Wraps around: past the last option comes the first, and vice versa.
    const next = options[(from + step + options.length) % options.length];
    if (!next) return;
    event.preventDefault();
    this.select(next);
    next.focus();
  };

  private select(option: HTMLElement): void {
    applyTheme(option.dataset["themeOption"] as Theme);
    this.render();
  }

  private get options(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>("[data-theme-option]")];
  }

  private render(): void {
    const theme = currentTheme();
    for (const option of this.options) {
      const checked = option.dataset["themeOption"] === theme;
      option.setAttribute("aria-checked", String(checked));
      option.tabIndex = checked ? 0 : -1;
    }
  }
}

/** Registers `<sl-theme-switch>` once. */
export function defineThemeSwitch(): void {
  if (!customElements.get("sl-theme-switch")) {
    customElements.define("sl-theme-switch", ThemeSwitch);
  }
}
