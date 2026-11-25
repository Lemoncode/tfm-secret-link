/** A theme choice: forced light, forced dark, or following the system. */
export type Theme = "light" | "dark" | "system";

/** The theme `<html>` is showing: its `data-theme`, or the system when absent. */
export function currentTheme(): Theme {
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "light" || theme === "dark" ? theme : "system";
}

/** The `localStorage` key, shared with `public/theme-init.js`. */
export const THEME_STORAGE_KEY = "sl-theme";

/**
 * Shows `theme` and remembers it: light and dark set `data-theme` on `<html>`
 * and store that value; system removes both, so the page follows
 * `prefers-color-scheme`. The page switches even when storage fails.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  remember(theme);
}

function remember(theme: Theme): void {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Why: storage can be unavailable (private mode, blocked). The choice
    // then lasts for this page view only, and the next load follows the
    // system (feature PD3): there is nothing to tell the user.
  }
}
