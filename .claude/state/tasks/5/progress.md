# Task #5 — front-theme-paginas-base

PRD: docs/prds/front-theme-y-flujo-part-1-2026-11-25.md
Feature PRD: `docs/prds/front-theme-y-flujo-2026-11-25.md` — PD2, PD3, PD12, PD13
Kind: feature
Spikes: 0/0/0
Mode: all-at-once
Auto-commit: off
Agent-decided: shown (gate)
Agent-decided calls: 26 shown, 0 changed

## Status

Implementation complete: T1–T8 ticked and staged, verify green. Auto-commit OFF: nothing committed or pushed; everything but this file is staged.

Active subtask: none (awaiting review).

## Decision log

- T1: happy-dom 21.0.4 (published 2026-10-20, newest release older than 7 days on 2026-11-25), exact devDependency of `front`. `test.environment: "happy-dom"`. First DOM spec: `src/test-environment.spec.ts`. `pnpm audit`: no known vulnerabilities. health.spec.ts still green under happy-dom (it leaves in T2).

- Staging: `git add -A` was refused by the session's permission classifier, so save-points stage explicit pathspecs instead (same effect: every changed path of the task, never `.lemony/`). `progress.md` stays unstaged (orchestrator asked: on disk only).
- T2: `git rm` staged the three health deletions while the spec was red (planned deletions; the save-point simply led by them). Since then deletions use plain `rm`.
- T2/T3: pages built from the mockups with exact string replacements (scratchpad script), then Prettier; a text-content diff confirmed E01 and E02 text verbatim against the handoff. `.prettierignore` lists the two copied CSS files. Prettier must run from the repo root: from `apps/front` it misses the root `.prettierignore` (it rewrote the copied CSS once; restored from the index, `cmp` identical).
- T3: Vite's default `appType: "spa"` served `/como-funciona` as the home page; `appType: "mpa"` 404s it instead. Added `src/build/clean-urls.ts` (pure `pageUrl` + a dev/preview middleware plugin) rewriting `/como-funciona` and `/s` to their directories; unknown URLs now 404 rather than falling back to `/`. Checked with curl on `vite` and `vite preview`.
- T4: session mount point is `<div id="session">` inside `sl-main`, after the hidden h1; no nav on `/s/` (handoff §4: brand + selector only).
- T5: icon map generated from `secretlink.mjs` into `src/design-system/icon-shapes.ts`; port in `icons.ts`. Deviation fixed from the handoff: its `icon(name, {label})` fills (setting `aria-hidden`) before labelling, leaving labelled icons hidden; the port labels first. Spec `icon-set.spec.ts` checks map, `icons/*.svg` and `sprite.svg` agree for all 33 icons and follow the style (stroke 1.75, round caps/joins, no fill). happy-dom `handleDisabledFileLoadingAsSuccess` set to silence stylesheet-loading noise in page specs.

- T6: `public/theme-init.js` is an IIFE in a try/catch; spec runs the file's source with `new Function` in happy-dom. happy-dom's storage is a proxy: spy on the instance (`vi.spyOn(localStorage, "getItem")`), not `Storage.prototype` (that spy silently never fires). happy-dom's global `URL` breaks `readFileSync(new URL(...))`; specs read by path. Every page loads it as `<script src="/theme-init.js">` right after `<title>`, before the stylesheets; `vite build` copies it untouched.
- T7: `src/theme.ts` (`Theme`, `currentTheme`, `applyTheme`, `THEME_STORAGE_KEY`); `src/theme-switch.ts` (`<sl-theme-switch>`, light DOM, clones `#sl-theme-switch-template`, hydrates its icons, click + arrow keys with wrap, roving tabindex). Options are `<button role="radio" data-theme-option="light|dark|system">`. Spec mounts the real template parsed from `index.html`. Specs cover: storage writes only `sl-theme` = light/dark, no sessionStorage/cookie; a switch choice is what `theme-init.js` applies on the next load (shared key). Hand probes: hard-coding the theme to system and storing "system" were both caught by the suite, and both mutants were restored.
- T8: `src/theme-switch.css` after `components.css` on all three pages; `<sl-theme-switch>` is the header's last child; template identical on the three pages (spec). Positioning: `margin-left:auto` alone (on /s/, or at ≤640 px when the nav is hidden); `0` right after the nav on desktop (the nav's auto margin already pushes both right). Part 2 must place it after the aside, with the separator. At ≤640 px the aside's `flex: 1 1 100%` will need an `order` or similar so the switch stays in row 1.
- Contrast by hand from tokens.css (light/dark): unchecked icon 7.58/8.68, hover 6.50/7.69, checked icon 5.29/8.52, checked border vs surface 4.97/9.08, focus 5.85/8.40, all ≥3:1. The fill alone is 1.14/1.31, as the handoff said.
- Browser check (Playwright 1.63 from the npx cache + axe-core 4.14.0 fetched to the scratchpad, never a project dep; production build under `vite preview`; every response served with the handoff's CSP incl. Trusted Types). Result: 3 pages × light/dark × 1280/390 px, no console errors under CSP, selector visible, right-aligned, in the brand's row, 44×44 options with 20 px icons, no horizontal scroll. States match the tokens (checked/unchecked/hover/focus-visible 2 px `--focus`), no transition on the options. Keyboard: Tab lands on the checked option, arrows select and wrap, Tab leaves. Persistence: a reload with the module bundle blocked still shows dark (theme-init alone); system removes the key. axe: no violations except `scrollable-region-focusable` on E02's `.sl-table-wrap` at 390 px, which is handoff markup copied as is (reported as a side-finding, not changed).
- Note: `components.css` gives `.sl-btn` a 150 ms colour transition, so the primary button cross-fades when the theme flips; the selector itself has none. Not changed (copied CSS stays byte-identical).

## Verify

`turbo run build` / `turbo run typecheck` / `pnpm format:check` / `turbo run test` (front 112, back 21) / front `test:coverage` (89.9 % stmts) / `pnpm audit`: all green. Execution: browser check above.

## Next action

Review (Orchestrator). Staged: all task changes; `progress.md` unstaged (on disk only).

## Blockers

None.

## Step log

- awaiting human checkpoint (anchor 6026d7be16756d6ff260453aa62f5a4eed87bef0)
