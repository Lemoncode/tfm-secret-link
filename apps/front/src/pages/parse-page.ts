/** Parses a page's HTML source into a detached document, scripts not run. */
export function parsePage(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/** The first link whose trimmed text is exactly `name`. */
export function linkNamed(
  page: Document,
  name: string,
): HTMLAnchorElement | undefined {
  return [...page.querySelectorAll("a")].find(
    (a) => a.textContent?.trim() === name,
  );
}
