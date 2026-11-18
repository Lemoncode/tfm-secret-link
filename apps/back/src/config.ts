import { fileURLToPath } from "node:url";

const FRONT_DIST = fileURLToPath(new URL("../../front/dist", import.meta.url));

/**
 * Where the back serves the built front from, or `undefined` when it must not.
 * Only in production: in dev Vite serves the front, and a stale `dist` must not leak in.
 */
export function staticRootFor(
  env: Record<string, string | undefined>,
): string | undefined {
  return env["NODE_ENV"] === "production" ? FRONT_DIST : undefined;
}
