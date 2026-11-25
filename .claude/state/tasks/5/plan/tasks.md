# Tasks — Front Part 1: theme y páginas base

> PRD: `docs/prds/front-theme-y-flujo-part-1-2026-11-25.md`
> Feature PRD: `docs/prds/front-theme-y-flujo-2026-11-25.md` — PD2, PD3, PD12, PD13

## Before code

- **Which `secretlink.mjs` utilities are ported to TypeScript in this part.** Only `icon` and `hydrateIcons` (with the icon map), because the theme selector's three new icons join the icon set through them. The other fourteen (`countdown`, `formatRemaining`, `wipe`, `byteCounter`, `verificationGate`, `copyText`, `copyButton`, `lineNumbers`, `concealToggle`, `readFileAsText`, `dropzone`, `downloadText`, `tabs`, `renderCode`) are ported in Parts 2 and 3, each with the screen that first uses it. Discarded: port all sixteen now, with tests but no caller. Picking the other: Group 3 gains one or two tasks porting and testing the remaining utilities before any screen uses them, and Parts 2 and 3 lose those ports.
- **Prettier would rewrite the copied design system.** CI runs `prettier --check .`, and the handoff's `tokens.css` and `components.css` are not in Prettier's format, so copying them "as is" (feature PD8) fails CI, and `pnpm format` would rewrite them. The plan adds the copied CSS files to `.prettierignore` so they stay byte-identical to the handoff.
- **«Crear transferencia segura» on E01 and E02 becomes a link styled as a button.** `<a class="sl-btn sl-btn--primary …" href="/s/">`, same classes and icon as the mockup, so it works without JavaScript and is announced as a link. Discarded: keep the mockup's `<button>` and navigate from a click handler (the mockup's `data-proto-href` belongs to `prototype/`, which is not copied).
- **Where the selector's styles and new icons go.** The selector's CSS lives in a stylesheet of our own, loaded after `components.css`; `tokens.css` and `components.css` stay byte-identical. The sun, moon and monitor icons are added to the copied icon set (three new `.svg` files, three new symbols in `sprite.svg`, three entries in the TS icon map), as the handoff asks. Discarded: add the selector's rules to the copied `components.css`.
- **The no-flash theme script is plain JavaScript under `public/`.** A classic, blocking `<script src="/theme-init.js">` in each page's `<head>` (the handoff asks for classic, blocking and same-origin, not the module bundle); Vite copies it as is, so it is not type-checked and is tested by running it in happy-dom. Discarded: write it in TypeScript and add a separate non-module build output for it.

## Agent-decided

### User-visible

- **The checked option's non-colour cue.** A 1 px `--primary` border on the checked option, besides `--primary-soft`. Discarded: colour alone (1.14:1 / 1.31:1, fails WCAG 1.4.11 / 1.4.1).
- **Page titles.** Fixed per page («Secret Link», «Cómo funciona · Secret Link», «Secret Link»); never the mockups' `E0x ·` titles, never room data. Discarded: copy the mockups' titles.
- **How the selector's contrast is checked.** By hand from `tokens.css` plus axe on the rendered DOM, since the token gates do not apply. Discarded: leave the selector's contrast to axe alone.
- **Selector position.** Last item of the header; ≤640 px it stays in the first row, right-aligned beside the brand; after `.sl-header__aside` with `.sl-header__sep` once Part 2 adds the aside. Discarded: leave the position to the header's wrapping.
- **Selector size.** Each option `--control-md` (44 px) with an `--icon-md` icon. Discarded: a smaller control.
- **Storage wording and the no-flash script.** «Según el sistema» removes the key; the stored theme is applied by a classic, blocking, same-origin script in `<head>`. Discarded: apply the stored theme from the module bundle.
- **Icon style, keyboard pattern and labels.** Icons stroke 1.75 with round caps and joins, joined to the icon set; roving tabindex; label «Según el sistema» for PRD's «Sistema». Discarded: icons outside the set; every option tabbable.
- **Arrow keys wrap around in the selector.** Right/Down from the last option selects the first, Left/Up from the first selects the last (WAI-ARIA radio group). Discarded: stop at the ends.
- **An unrecognised stored value is ignored.** Anything but `light` or `dark` under the key is treated as «Según el sistema» and left in storage untouched. Discarded: remove the key on load.
- **No sync between open tabs.** Changing the theme in one tab applies to other open tabs on their next load. Discarded: listen to the `storage` event and re-apply live.
- **`/s/` has no footer.** As the handoff's session mockups (E03, E04, R01…), which have none. Discarded: the E01/E02 footer.

### Internal

- **File layout.** Copied CSS, icons and logos under `apps/front/src/design-system/`; the TS icon port beside them; our selector CSS in its own file under `src/`; the no-flash script at `apps/front/public/theme-init.js`. Discarded: copied assets under `public/` (Vite would ship unused PNGs and not fingerprint them).
- **Route files.** `apps/front/index.html`, `apps/front/como-funciona/index.html`, `apps/front/s/index.html`, all three Vite build inputs; links use `/`, `/como-funciona`, `/s/`. Discarded: `como-funciona.html` at the root (needs clean-URL support from whatever serves the build).
- **One entry module for the three pages.** Each page loads the same `src/main.ts`, which defines the selector element and hydrates icons; Part 2 adds the session's own entry. Discarded: one entry per page now.
- **The selector is a light-DOM custom element cloning a `<template>`.** `<sl-theme-switch>` clones the selector's `<template>` held in each page (cross-cutting PD9, PD10); a page spec asserts the three copies are identical. Discarded: build the markup with `createElement` in TS.
- **Storage key.** `sl-theme`, shared by `theme-init.js` and the TS module, both covered by a spec that reads and writes it. Discarded: `theme` (too generic for a shared origin).
- **happy-dom is the default test environment.** `test.environment: "happy-dom"` in `vite.config.ts`; the only node-environment spec (`health.spec.ts`) leaves with PD13. Discarded: per-file `@vitest-environment` comments.
- **happy-dom version.** The newest release older than seven days at install time, exact (the workspace's `saveExact`, `minimumReleaseAge`). Discarded: a pinned version chosen now.
- **The dev proxy for `/api` and `/ws` stays.** Only the health indicator leaves the UI; the back and Part 2's transport still use the proxy. Discarded: remove the proxy with `health.ts`.
- **`src/styles.css` is deleted.** Its body grid centring and health colours conflict with `sl-page`. Discarded: trim it and keep it.
- **Page specs parse the HTML files.** Each page's spec loads its `index.html` into happy-dom and asserts title, single `<h1>`, links, the selector template, and no health element. Discarded: browser e2e (no runner in the repo).

## Group 1 — DOM test environment _(isolates the one new third-party dependency before any code relies on it: a compromised or vulnerable test DOM runs with the developer's and CI's privileges)_ [risk: supply-chain]

- [x] T1 — `apps/front` runs its specs in happy-dom: happy-dom added as an exact-version devDependency within the workspace's release-age policy, `test.environment` switched, and a first DOM spec green under `pnpm test`; `pnpm audit` clean; no runtime `dependencies` added; implements PD12.

## Group 2 — Páginas base _(copies the design system and replaces the health page with the three real routes; leaves `/`, `/como-funciona` and `/s/` runnable in `vite dev`)_

- [x] T2 — `/` is E01 and the health indicator is gone: `tokens.css` and `components.css` copied byte-identical from the handoff (and listed in `.prettierignore`), icons and logos copied, `index.html` rebuilt from `screens/E01-inicio.html` (head per `05-implementacion.md` §1, title «Secret Link», brand → `/`, nav and «¿Cómo funciona?» → `/como-funciona`, «Crear transferencia segura» → `/s/`), `health.ts`, `health.spec.ts`, the health code in `main.ts` and `src/styles.css` removed; nothing from `prototype/` copied; the back's `/api/health` untouched; implements PD13, feature PD8 (design system), cross-cutting PD4.
- [x] T3 — `/como-funciona` serves E02 from `screens/E02-como-funciona.html`, verbatim text, title «Cómo funciona · Secret Link», brand → `/`, «Crear transferencia segura» → `/s/`; added as a Vite build input; `vite dev` and `vite preview` serve it at `/como-funciona`; cross-cutting PD4.
- [x] T4 — `/s/` is the empty session shell: header with brand → `/`, `sl-main` holding the session mount point with no content, a visually hidden `<h1>` «Sesión», title «Secret Link», no footer; added as a Vite build input; cross-cutting PD4.

## Group 3 — Selector de tema _(new behaviour on every page and the only browser storage the front writes; its keyboard pattern can leave the control unreachable for keyboard users without anyone using a mouse noticing)_ [risk: other]

- [x] T5 — `icon` and `hydrateIcons` ported from `secretlink.mjs` to a typed module with specs (creates nodes with `createElementNS`, never `innerHTML`; unknown name warns and leaves the `<svg>` empty), with sun, moon and monitor added to the icon map, to `icons/` as `.svg` files and to `sprite.svg` in the handoff's style; `main.ts` hydrates `svg[data-icon]` on every page; feature PD8 (utilities), cross-cutting PD10.
- [x] T6 — A stored theme is applied before first paint: `public/theme-init.js`, loaded as a classic blocking script in each page's `<head>`, sets `data-theme="light"`/`"dark"` on `<html>` from `localStorage` key `sl-theme`, leaves it absent for no key or any other value, and swallows a throwing storage; spec runs the script in happy-dom for each case; implements PD2, PD3.
- [x] T7 — `<sl-theme-switch>` behaves as the handoff's radio group: clones its page's template in light DOM, `role="radiogroup"` «Tema», three `role="radio"` options with `aria-label`/`title` «Claro», «Oscuro», «Según el sistema», exactly one `aria-checked="true"` (from `<html>`'s `data-theme`, «Según el sistema» when absent), roving tabindex, arrows move-and-select with wrap, click selects; Claro/Oscuro set `data-theme` and write only `light`/`dark`, «Según el sistema» removes the attribute and the key; a throwing storage still switches the page with no error; specs assert nothing else is written to storage; implements PD2, PD3.
- [x] T8 — The selector sits at the end of the header on `/`, `/como-funciona` and `/s/`, with its own stylesheet after `components.css`: states per the handoff (unchecked `--ink-muted`, hover `--surface-hover`, checked `--primary-soft` + `--on-primary-soft` + 1 px `--primary` border, focus ring `--focus`), options `--control-md` with `--icon-md` icons, visible and right-aligned in the first row at ≤640 px; instant switch, no transition; page specs assert the template is present and identical on the three pages; contrast checked by hand from `tokens.css` and with axe in both themes; implements PD2.
