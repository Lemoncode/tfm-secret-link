import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// The no-flash script is plain JavaScript served from public/: run it as the
// browser would, as a classic script against the current document.
const source = readFileSync(
  resolve(import.meta.dirname, "../public/theme-init.js"),
  "utf8",
);
const runThemeInit = () => new Function(source)();
const html = document.documentElement;

describe("theme-init.js", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    html.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("applies a stored dark theme to <html>", () => {
    localStorage.setItem("sl-theme", "dark");

    runThemeInit();

    expect(html.getAttribute("data-theme")).toBe("dark");
  });

  it("applies a stored light theme to <html>", () => {
    localStorage.setItem("sl-theme", "light");

    runThemeInit();

    expect(html.getAttribute("data-theme")).toBe("light");
  });

  it("follows the system when nothing is stored", () => {
    runThemeInit();

    expect(html.hasAttribute("data-theme")).toBe(false);
  });

  it.each(["", "system", "DARK", "blue"])(
    "ignores an unrecognised stored value (%j) and leaves it in storage",
    (value) => {
      localStorage.setItem("sl-theme", value);

      runThemeInit();

      expect(html.hasAttribute("data-theme")).toBe(false);
      expect(localStorage.getItem("sl-theme")).toBe(value);
    },
  );

  it("follows the system without an error when reading storage throws", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(runThemeInit).not.toThrow();
    expect(html.hasAttribute("data-theme")).toBe(false);
  });

  it("follows the system without an error when storage itself is unavailable", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(runThemeInit).not.toThrow();
    expect(html.hasAttribute("data-theme")).toBe(false);
  });
});
