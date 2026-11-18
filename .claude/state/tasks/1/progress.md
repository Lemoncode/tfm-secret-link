# Task #1 — monorepo-scaffold

PRD: docs/prds/monorepo-scaffold-2026-11-18.md
Kind: feature
Spikes: 0/0/0
Mode: all-at-once
Auto-commit: off
Agent-decided: shown (gate)
Agent-decided calls: 20 shown, 0 changed

## Status

Implementation done (T1-T13 ticked), everything staged, nothing committed (auto-commit OFF). Awaiting review / human OK.

## Active subtask

None — all groups done.

## Decision log

- Staging: `git add -A -- . ':!doc'` (never plain `-A`: `doc/` is the requester's, untracked). Rollback must protect it too: `git restore . && git clean -fd -e doc`.
- T2 verified in an isolated scratch project: without the exclude, `@lemoncode/lemony@0.12.0` is rejected by minimumReleaseAge; with the exact-version exclude it installs. `pnpm add prettier@3.10.1` (6 days old) is rejected.
- T3: `format:check` is a root script (`prettier --check .`), registered in turbo as root task `//#format:check` (cache off) so `turbo run format:check` works without recursion. README.md is also in `.prettierignore` (documentation, like docs/).
- T4: `@types/node` pinned to 24.x (matches Node 24 runtime) instead of the latest 26.x. TypeScript resolved to 7.0.2.
- T5: secureHeaders removes X-Powered-By (default `removePoweredBy`); test probed with removal disabled -> killed. No-store is set after `next()` so static files can't loosen it.
- T7: `createApp({ staticRoot })`; static middleware after API routes (probe: moving it first is caught). Traversal: serveStatic rejects any `%` path by default; probe with `allowPercentInPath` + decoding rewrite is caught. Production gating lives in `staticRootFor(env)` (config.ts), tested.
- T8: `checkHealth(fetchHealth)` in apps/front/src/health.ts takes the fetch as a parameter (boundary injection), returns "up" | "down"; non-2xx also counts as down.
- T9: status colors use `light-dark()` so both schemes keep contrast; `role="status"` on the status line. No ui-handoff exists (design is out of scope per PRD).
- T10 real run: `pnpm dev` -> headless Chrome on localhost:5173 renders "Servidor operativo". Production (`pnpm build` + `NODE_ENV=production node src/index.ts`) -> same text on :3000, no CSP violations in Chrome's console log (negative control with an injected inline script did log a violation). curl --path-as-is traversal attempts all 404.
- T11: image `mongo:8.0.34` (newest 8.0.x older than 7 days, PD2 spirit) pinned with index digest sha256:b9924c33... Real run needed a scratch override `network_mode: bridge` because this machine's Docker has exhausted its address pools (33 networks from other projects) — environment issue, compose file itself unchanged. Verified healthy, unauthenticated listDatabases rejected, authenticated sees only admin/config/local, bound to 127.0.0.1:27017 only. Torn down with `down -v`, temp `.env` removed.
- T12: actions pinned by SHA (checkout v7.0.1, pnpm/action-setup v6.1.1, setup-node v7.1.0), checkout with `persist-credentials: false`. Steps run locally green; lockfile drift probe -> ERR_PNPM_OUTDATED_LOCKFILE.
- T13: `lemony doctor` -> "5 review gate(s) declared".

## Next action

Orchestrator: review + human OK, then commit. After the first push, confirm the CI workflow goes green on the PR (T12 PR check not runnable before a commit exists).

## Blockers

None.

## Review evidence — pre-gate pass (all-at-once, whole plan)

Verdict: APPROVE. Ledger `.claude/state/tasks/1/review-ledger/full-pass.json` validated green (criteria 25/25, gates 5/5, passes 4/4). No issue comment posted: the pre-gate record guard printed "no record" because the untracked `doc/` folder (the requester's, deliberately not staged) makes the worktree differ from the index; the PR's full pass carries the merge record.

- Gates (re-run fresh, also `turbo --force` uncached): install --frozen-lockfile up to date; typecheck green; format:check clean; test back 21/21, front 6/6; test:coverage 100%/100% both apps; build OK (dist/index.html has no inline script/style); pnpm audit: no known vulnerabilities.
- pnpm policy: `pnpm config get` save-exact=true, minimum-release-age=10080; `pnpm ignored-builds` None; no ^/~ in any manifest.
- Real run, production back (PORT=3917): /api/health 200 {"status":"ok"} with full strict CSP, no-store, no X-Powered-By; / 200 text/html; hashed asset 200 with no-store; `--path-as-is` /../package.json, /..%2fpackage.json, /%2e%2e%2f%2e%2e%2fback%2fpackage.json, /..%5c..%5cpackage.json -> 404; bound 127.0.0.1 only.
- Real run, dev: a `pnpm dev` from this worktree was already running (started 19:31, left untouched); localhost:5173/api/health via the Vite proxy -> {"status":"ok"}; back / in dev -> 404 (no static outside production); back bound 127.0.0.1:3000.
- Real run, Mongo: `docker compose config` without env fails with the `${VAR:?}` message; scratch project `-p tfmreview` with a `network_mode: bridge` override (address pools exhausted) -> healthy in ~14 s, published 127.0.0.1:27017 only, unauthenticated listDatabases rejected, authenticated sees admin/config/local; image mongo:8.0.34@sha256:b9924c33...; `down -v` removed container and volume.
- lemony.sh --version -> 0.12.0; lemony doctor -> 5 review gates declared.
- Mutants (hand probes, all reverted, tree checked clean): app.ts drop no-store KILLED, form-action 'none'->'self' KILLED, static root widened KILLED; config.ts === -> !== KILLED; health.ts drop !ok guard KILLED, status check weakened KILLED; index.ts default HOST -> 0.0.0.0 SURVIVED; main.ts TEXT[state] -> TEXT.up SURVIVED (both entry files have no spec; covered only by real runs).
- Advisory: index.ts:6-7 empty HOST/PORT pass `??` (verified: HOST= binds *:port; PORT= gives port 0); no Dependabot/Renovate bumps the action SHAs and image digest; specs use toEqual/toBe rather than toStrictEqual; main.ts fetch has no timeout (page can stay on "Comprobando servidor…").

## Post-checkpoint note

The checkpoint verb staged the whole worktree, so `doc/` landed in `4ede2aa` (pushed). Requester chose to keep it versioned: PD13.
