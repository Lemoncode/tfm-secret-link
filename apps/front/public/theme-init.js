// Applies the stored theme before first paint, so a stored dark theme never
// flashes light. Loaded as a classic, blocking, same-origin script in each
// page's <head> (CSP script-src 'self', no inline script). The key and values
// are shared with src/theme.ts: "light" or "dark"; anything else = system.
(function () {
  try {
    var theme = window.localStorage.getItem("sl-theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (error) {
    // Storage unavailable (private mode, blocked): follow the system theme.
  }
})();
