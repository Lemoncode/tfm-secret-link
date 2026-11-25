import type { Connect, Plugin } from "vite";

/**
 * Maps a page route written without its trailing slash (`/como-funciona`) to
 * the directory that holds its `index.html`; any other URL is returned as is.
 */
export function pageUrl(url: string, pages: readonly string[]): string {
  const queryAt = url.indexOf("?");
  const path = queryAt === -1 ? url : url.slice(0, queryAt);
  const query = queryAt === -1 ? "" : url.slice(queryAt);
  return pages.includes(path) ? `${path}/${query}` : url;
}

/**
 * Serves the multi-page routes at their clean URLs in `vite dev` and
 * `vite preview` (with `appType: "mpa"` neither maps `/x` to `/x/index.html`).
 */
export function cleanUrls(pages: readonly string[]): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    if (req.url) req.url = pageUrl(req.url, pages);
    next();
  };
  return {
    name: "secret-link:clean-urls",
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
}
