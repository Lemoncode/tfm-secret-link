import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import home from "../index.html?raw";
import { parsePage } from "./pages/parse-page.ts";
import { defineThemeSwitch } from "./theme-switch.ts";

const html = document.documentElement;
const THEME_INIT = readFileSync(
  resolve(import.meta.dirname, "../public/theme-init.js"),
  "utf8",
);

defineThemeSwitch();

function mountSwitch(): HTMLElement {
  const template = parsePage(home).getElementById("sl-theme-switch-template");
  document.body.append(document.importNode(template!, true));
  const element = document.createElement("sl-theme-switch");
  document.body.append(element);
  return element;
}

function radios(element: HTMLElement): HTMLElement[] {
  return [...element.querySelectorAll<HTMLElement>('[role="radio"]')];
}

function radioNamed(element: HTMLElement, name: string): HTMLElement {
  const radio = radios(element).find(
    (option) => option.getAttribute("aria-label") === name,
  );
  if (!radio) throw new Error(`no radio named ${name}`);
  return radio;
}

function checkedName(element: HTMLElement): (string | null)[] {
  return radios(element)
    .filter((radio) => radio.getAttribute("aria-checked") === "true")
    .map((radio) => radio.getAttribute("aria-label"));
}

describe("<sl-theme-switch>", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
    html.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("is a radio group «Tema» of Claro, Oscuro and Según el sistema, each with its icon", () => {
    const element = mountSwitch();

    const group = element.querySelector('[role="radiogroup"]');
    expect(group?.getAttribute("aria-label")).toBe("Tema");
    expect(
      radios(element).map((radio) => [
        radio.getAttribute("aria-label"),
        radio.getAttribute("title"),
      ]),
    ).toEqual([
      ["Claro", "Claro"],
      ["Oscuro", "Oscuro"],
      ["Según el sistema", "Según el sistema"],
    ]);
    for (const radio of radios(element)) {
      expect(
        radio.querySelector("svg.sl-icon")?.childElementCount,
      ).toBeGreaterThan(0);
    }
  });

  it("checks «Según el sistema», alone and tabbable, when <html> has no theme", () => {
    const element = mountSwitch();

    expect(checkedName(element)).toEqual(["Según el sistema"]);
    expect(radios(element).map((radio) => radio.tabIndex)).toEqual([-1, -1, 0]);
  });

  it.each([
    ["light", "Claro", [0, -1, -1]],
    ["dark", "Oscuro", [-1, 0, -1]],
  ])(
    "checks the option of the theme <html> already shows (%s)",
    (theme, name, tabIndexes) => {
      html.setAttribute("data-theme", theme);

      const element = mountSwitch();

      expect(checkedName(element)).toEqual([name]);
      expect(radios(element).map((radio) => radio.tabIndex)).toEqual(
        tabIndexes,
      );
    },
  );

  it.each([
    ["Claro", "light"],
    ["Oscuro", "dark"],
  ])("«%s» applies and stores %s when clicked", (name, theme) => {
    const element = mountSwitch();

    radioNamed(element, name).click();

    expect(html.getAttribute("data-theme")).toBe(theme);
    expect(localStorage.getItem("sl-theme")).toBe(theme);
    expect(checkedName(element)).toEqual([name]);
    expect(radioNamed(element, name).tabIndex).toBe(0);
    expect(
      radios(element).filter((radio) => radio.tabIndex === 0),
    ).toHaveLength(1);
  });

  it("«Según el sistema» removes both the theme and the stored key when clicked", () => {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("sl-theme", "dark");
    const element = mountSwitch();

    radioNamed(element, "Según el sistema").click();

    expect(html.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem("sl-theme")).toBeNull();
    expect(checkedName(element)).toEqual(["Según el sistema"]);
  });

  it.each([
    ["Según el sistema", "ArrowRight", "Claro", "light"],
    ["Según el sistema", "ArrowDown", "Claro", "light"],
    ["Claro", "ArrowRight", "Oscuro", "dark"],
    ["Claro", "ArrowLeft", "Según el sistema", null],
    ["Claro", "ArrowUp", "Según el sistema", null],
    ["Oscuro", "ArrowUp", "Claro", "light"],
  ])(
    "from «%s», %s moves focus to «%s» and selects it, wrapping at the ends",
    (from, key, to, theme) => {
      const element = mountSwitch();
      radioNamed(element, from).click();
      radioNamed(element, from).focus();

      pressKey(radioNamed(element, from), key);

      expect(document.activeElement).toBe(radioNamed(element, to));
      expect(checkedName(element)).toEqual([to]);
      expect(html.getAttribute("data-theme")).toBe(theme);
    },
  );

  it.each([
    ["writing", () => vi.spyOn(localStorage, "setItem")],
    ["removing", () => vi.spyOn(localStorage, "removeItem")],
  ])(
    "still switches the page, without an error, when %s storage throws",
    (_action, spy) => {
      spy().mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });
      const element = mountSwitch();

      expect(() => radioNamed(element, "Oscuro").click()).not.toThrow();
      expect(() =>
        radioNamed(element, "Según el sistema").click(),
      ).not.toThrow();
      expect(html.hasAttribute("data-theme")).toBe(false);
      expect(checkedName(element)).toEqual(["Según el sistema"]);

      radioNamed(element, "Claro").click();
      expect(html.getAttribute("data-theme")).toBe("light");
      expect(checkedName(element)).toEqual(["Claro"]);
    },
  );

  it("still switches the page, without an error, when storage is unavailable", () => {
    const element = mountSwitch();
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(() => radioNamed(element, "Oscuro").click()).not.toThrow();
    expect(html.getAttribute("data-theme")).toBe("dark");
    expect(checkedName(element)).toEqual(["Oscuro"]);
  });

  it("writes nothing to browser storage but the sl-theme key, holding light or dark", () => {
    const setItem = vi.spyOn(localStorage, "setItem");
    const sessionSetItem = vi.spyOn(sessionStorage, "setItem");
    const element = mountSwitch();

    for (const name of ["Claro", "Oscuro", "Según el sistema", "Oscuro"]) {
      radioNamed(element, name).click();
    }
    pressKey(radioNamed(element, "Oscuro"), "ArrowRight");
    pressKey(radioNamed(element, "Según el sistema"), "ArrowRight");

    expect(setItem.mock.calls).toEqual([
      ["sl-theme", "light"],
      ["sl-theme", "dark"],
      ["sl-theme", "dark"],
      ["sl-theme", "light"],
    ]);
    expect(Object.keys(localStorage)).toEqual(["sl-theme"]);
    expect(sessionSetItem).not.toHaveBeenCalled();
    expect(sessionStorage).toHaveLength(0);
    expect(document.cookie).toBe("");
  });

  it.each(["Claro", "Oscuro", "Según el sistema"])(
    "a choice of «%s» is what theme-init.js applies on the next load",
    (name) => {
      const element = mountSwitch();
      radioNamed(element, name).click();
      const chosen = html.getAttribute("data-theme");

      html.removeAttribute("data-theme");
      new Function(THEME_INIT)();

      expect(html.getAttribute("data-theme")).toBe(chosen);
    },
  );

  it("leaves other keys alone", () => {
    const element = mountSwitch();
    const event = pressKey(radioNamed(element, "Según el sistema"), "Home");

    expect(event.defaultPrevented).toBe(false);
    expect(checkedName(element)).toEqual(["Según el sistema"]);
  });
});

function pressKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}
