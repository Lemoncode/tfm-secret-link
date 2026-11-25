# UI handoff — #5 Front Part 1: theme y páginas base

**Status**: completed

> Owned by the Orchestrator (authored via `grill-ui`). Sibling of the plan. The implementer builds
> from this via the `build-ui` skill; the design QA lens checks the built UI against it at REVIEW.
> Decisions-altitude; text-first; tokens by reference.

**Design source**: the Claude Design handoff at `/Users/brauliodiez/handoff/handoff` (outside the
repo), adopted **as is** for everything it covers — decided by the requester. Mockups:
`screens/E01-inicio.html`, `screens/E02-como-funciona.html`; design system: `design-system/`
(`tokens.css`, `components.css`, `icons/`, `logos/`); rules: `README.md` «Reglas que no se
negocian», `docs/05-implementacion.md`. This file adds only what the handoff does not decide: the
theme selector and the empty `/s/` page. Feature PRD: `docs/prds/front-theme-y-flujo-2026-11-25.md`
(PD2, PD3 for the theme).

## 1. Personas / users served

No `docs/personas.md`. From the project spec (§1, §2) and the handoff: two people (emisor and
receptor) in the same call (Meet, phone), often **sharing screen**; developers or ops passing a
`.env`, an API key or credentials; desktop mostly, mobile possible (the handoff designs 1280 px and
390 px). What shapes design here: the screen may be shared on a call, so the theme must be
switchable on any page.

## 2. Aesthetic direction

**Tone preset**: controlled
**Dials**: variance = medium · motion = low · density = medium
**Brand references**: the handoff's own design system (Secret Link logo, teal/navy palette).
**Voice / feel**: calm, precise, trustworthy; Spanish, tú.

As in the handoff; nothing redesigned.

## 3. Screen inventory + nav / flow

| Route | Screen | Source |
| --- | --- | --- |
| `/` | E01 Inicio | `screens/E01-inicio.html`, as is |
| `/como-funciona` | E02 Cómo funciona | `screens/E02-como-funciona.html`, as is |
| `/s/` | Session shell, empty | new (below) |

Flow: E01 «¿Cómo funciona?» link and header nav «Cómo funciona» → E02; header brand → E01; E02
«Crear transferencia segura» and E01's primary button → `/s/` (the flow behind it is Part 2).
The current health indicator page is gone (feature PD13).

## 4. Per-screen layout

- **E01, E02**: as the mockups, including the shared header (`sl-header`: brand, nav) with the
  theme selector added at its end (§5).
- **`/s/` (empty)**: the shared header (brand + theme selector; the session's status pill and
  timer arrive in Part 2) and `sl-main` holding the session mount point with **no content** — no
  placeholder text — decided by the requester.

## 5. Components

Everything but the selector is the handoff's `sl-*` component set, used as the mockups use it.

### Theme selector (new — full anatomy)

- **What**: a segmented control of three icon buttons — Claro (sun), Oscuro (moon), Según el sistema
  (monitor) — at the **end of the header**, on **every page** (`/`, `/como-funciona`, `/s/`),
  **visible on mobile** too (the header's `display:none` for the nav at ≤640 px does not apply to
  it). Requester's choice over a cycling button or a footer `<select>`.
- **Semantics**: a radio group — `role="radiogroup"`, `aria-label="Tema"`; each button a radio
  (`role="radio"`, `aria-checked`) with `aria-label` and `title` «Claro», «Oscuro», «Según el
  sistema». Exactly one checked.
- **States**: unchecked (icon in `--ink-muted`), hover (`--surface-hover`), checked (background
  `--primary-soft`, icon `--on-primary-soft`, **plus a 1 px `--primary` border** — the non-colour cue,
  ≥3:1 against `--surface` in both themes), focus-visible (the handoff's focus ring, `--focus`).
- **Default**: «Según el sistema» checked when nothing is stored.
- **Behaviour**: Claro → `data-theme="light"` on `<html>`; Oscuro → `data-theme="dark"`; Según el
  sistema → no `data-theme`. Storage per feature PD3: only `light` / `dark` is ever written; «Según
  el sistema» **removes the key**; nothing else is stored. The stored theme is applied **before first
  paint** by a small classic, blocking, same-origin script in `<head>` (CSP-compatible: no inline
  script), not by the module bundle, so a stored dark theme never flashes light.
- **Icons**: three new SVGs (sun, moon, monitor) drawn in the handoff icon style (24×24 viewBox,
  stroke `1.75`, round caps and joins, no fill, as `design-system/icons/*.svg`); they join the icon
  set the same way as the existing ones (sprite / `hydrateIcons`).
- **Size**: each option `--control-md` (44 × 44 touch target) with an `--icon-md` icon.
- **Position**: the last item of the header. Desktop: after the nav (or, from Part 2, after the
  aside, separated by `.sl-header__sep`). ≤640 px: stays in the first row, right-aligned beside the
  brand (its own `margin-left: auto`); the aside wraps below it.

## 6. States

- Theme storage unavailable (private mode, blocked): the selector still works for the page view and
  falls back to «Según el sistema» on load; no error shown.
- E01, E02: static, no loading or error states. `/s/`: empty by design (§4), with only a visually
  hidden `<h1>` «Sesión» (`sl-visually-hidden`) — requester's choice — which Part 2 replaces.

## 7. Responsive / breakpoints

The handoff's (`@media (max-width: 640px)` in `components.css`). Selector stays visible at ≤640 px, in
the header's first row (§5 Position); the header wraps as the handoff allows.

## 8. Motion / interaction

Motion low. Switching theme is instant (no colour cross-fade). Keyboard: radio-group pattern with roving
tabindex — only the checked option has `tabindex="0"`; arrow keys move and select; Tab enters and
leaves the group.

## 9. Accessibility

WCAG 2.1 AA, both themes. Selector per §5 semantics; the handoff's own a11y notes
(`docs/05-implementacion.md` §5) apply to E01/E02. `/s/` keeps one `<h1>`, visually hidden (§6).

## 10. Microcopy

Selector group label «Tema»; options «Claro», «Oscuro», «Según el sistema» (the requester approved
these labels; the feature PRD's «Sistema» names the same option). `/s/` hidden heading «Sesión».

Page titles (fixed, never derived from the URL or room data): `/` «Secret Link»; `/como-funciona`
«Cómo funciona · Secret Link»; `/s/` «Secret Link». The mockups' `E01 · …` titles are prototype
labels and are not copied. Every other text is the mockups' verbatim.

## 11. Design tokens

**Source**: the handoff's `design-system/tokens.css`, copied as is (feature PD8) — the single source;
no `docs/design-tokens.json` (requester declined: one source of truth). No design-tool binding
(pure code, requester's choice). Consequently the REVIEW token gates (`lemony design-tokens
validate` / `contrast`) do not apply; the selector's state contrast is checked by hand from
`tokens.css`, plus axe on the rendered DOM.

## Open questions

None.

## Tightened after the critique

- Checked option gets a 1 px `--primary` border: colour alone (`--primary-soft`, 1.14:1 / 1.31:1) failed WCAG 1.4.11 / 1.4.1.
- Page titles fixed per page; the mockups' `E0x ·` prototype titles are not copied; `/s/` never puts room data in the title.
- §11 states the token gates don't apply and how contrast is checked instead.
- Selector position defined for desktop, ≤640 px and Part 2's aside.
- Selector options sized `--control-md` (44 px), icon `--icon-md`.
- Storage wording aligned with PD3 (system removes the key) and the no-flash script named (classic, blocking, same-origin, in `<head>`).
- Icons: stroke 1.75, round caps/joins, joined to the icon set; keyboard: roving tabindex; label wording note.

