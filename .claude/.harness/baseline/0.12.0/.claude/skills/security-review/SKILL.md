---
name: security-review
description: 🍋 Security review of a change — OWASP-style vectors plus AI/LLM-specific risks, one checklist section per risk class — input validation, authorization, injection, secrets, transport, supply chain, LLM, shell and subprocess, money, destructive writes, executable surface, output injection, outbound requests and resource limits. Every risk class a change can be declared under, except `other`, names one section, and a declaration handed over with the invocation deepens that section; `other` arrives with the prose that names its damage. Use after `senior-review` on any change touching user input, auth, data access, money, destructive writes, a subprocess, file modes, terminal or log output, a dependency or CI, an outbound request, or an LLM.
origin: vendor
vendor_version: '0.12.0'
phase: post-implementation
invoked-by: [reviewer]
---

# Security Review

Review the change for security risk with **fresh context**. Scope the depth to what
the change touches — a pure refactor of internal logic needs a lighter pass than a new
endpoint or an LLM call. The checklist below is the generic floor. Flag only findings
you're confident are real, ranked by severity.

The project's own security rules (deployment model, auth scheme, secret tooling) are
Claude Code rules, and they reach you through the `Read` tool: `Read` each file the
change adds or modifies (not a lockfile or generated output) whole, not only its diff
(a `cat` brings none). A surface such as auth,
secrets or deployment can be governed by a rule scoped to other paths: when the change
reaches one, look for that rule under `.claude/rules/`, and read any reference doc a
rule cites for it.

## Declared risk surfaces

Your invocation may carry a **declaration**: the kind of damage this change can do, named
at the structuring moment — before a line of it was written — as a class paired with the
group or the file it was declared against. When one reaches you, it
is a **floor for depth, never a bound on scope**:

- Every section below still runs. The declaration says where to press harder, not what to
  skip: it was written before the code existed, so it cannot know what the diff ended up
  touching. Deriving the surface from the change itself remains your job.
- For each declared class, go to the section whose heading carries it. Every class in the
  vocabulary but `other` names **exactly one** section below — the backticked class at the
  end of the heading (`` ## 2. Authorization … — `auth` ``) — and a guard pins both
  directions — every numbered section carries one class, and the set of classes in these
  headings and the vocabulary without `other` are the same set — so no heading ends in
  `` — `token` `` unless `token` is a class. Go deep there: read the declared file whole
  rather than sampling its diff, and follow the vector out of the change into the code it
  reaches.
- A declared class other than `other` that matches **no heading** is drift between the
  vocabulary and this checklist — a guard should have caught it — not a class you may skip. Review it against
  the project's rules you received and the generic floor, and **name it in the report** as
  covered without a dedicated section, so the gap surfaces as a gap and not as silence.
- Damage no class names arrives as **`other`** with the rationale of its group, which
  names it; on an older task, as an `unclassified: <path> — <what it can do>` line, or as
  the rationale of a group that left its tag off. That is a declaration, not a gap: take
  the prose as the brief and review that path against it.

**No declaration is not a clean bill of health.** A declaration of `none` is a claim that
the change touches no such surface; a _missing_ declaration is no claim at all — the task
may simply predate the section. In both cases scope the depth from the change itself,
exactly as you would without one, and never report a surface as absent on the strength of a
declaration alone.

## 1. Input validation at boundaries — `input-validation`

- Every entry point (request body, query/path params, headers, file, env, third-party
  response) validates **shape, type, required-ness, and max length** before use; a
  body's or an upload's total size, capped while it streams, and a validating pattern's
  backtracking are §14.
- The check that protects the server runs on the server's side of the boundary — in the
  server or the process that acts on the input. A form's own validation is for the user,
  not a control.
- External strings are validated/converted at the boundary, not asserted into the
  internal type.
- **No mass-assignment or prototype pollution**: unexpected fields are rejected, not
  spread into a model, and parsed input is never deep-merged or `Object.assign`ed
  without dropping `__proto__`, `constructor` and `prototype` keys.
- **A list of refused values** (forbidden headers, schemes, file types) is matched against
  the value as its consumer reads it — parsed by the same parser (`new URL(v).protocol`;
  a header name compared lower-cased, as HTTP reads it case-insensitively), not trimmed
  and normalised by hand: the URL parser drops a tab or newline anywhere, so
  `java\tscript:` is `javascript:`. An allow-list is
  preferred where the valid set is known.
- **A parser of an untrusted format is configured safe**: XML with external entities and
  DTDs off (XXE), and no deserializer that can build types or run code from the input (a
  YAML loader with custom tags enabled, `node-serialize`).

## 2. Authorization (not just authentication) — `auth`

- **Authentication** (who are you?) and **authorization** (are you allowed?) are
  distinct checks — a valid session is not permission.
- **Ownership / IDOR**: a resource fetched by id verifies it belongs to the caller. An
  auth guard never substitutes for the ownership check.
- Privileged actions check role/scope server-side, never trusting a client claim.
- **Session & token handling**: a token is verified before it is trusted — signature and
  algorithm pinned (never `none`, never caller-chosen), `exp`/`iss`/`aud` checked, claims
  never read from an unverified decode. Sessions rotate on login and privilege change,
  and logout/revocation invalidates server-side, not just client-side (cookie flags: §5;
  failed-attempt limits on a password, a one-time code or a reset token: §14).

## 3. Injection — `injection`

- **SQL/NoSQL**: parameterized queries / validated ids; never interpolate user input
  into a query, never pass a raw request object to a query (object-injection).
- **Path**: a path built from user input is resolved and then proven to stay under a
  fixed base — `join`/`resolve` alone are not that proof (`join` normalizes `..` through,
  `resolve` lets an absolute segment discard the base); absolute and `..` segments are
  rejected rather than stripped, and `realpath` is used where symlinks can exist.
  Shell-command construction is §8.
- **Output/XSS**: rendered user content is escaped by default; raw-HTML sinks
  (`dangerouslySetInnerHTML`, server-generated HTML, email or PDF) sanitize at render
  time. Markdown the app renders from untrusted text (an LLM's output included) loads no
  image from a host outside an allow-list: an image URL can carry data out. Untrusted
  values echoed into a terminal, a log or non-HTML markup another program renders are
  §12.

## 4. Secrets & logging — `secrets`

- No secret, token, password, key, or PII in code, logs, or error messages (a
  never-log redaction list is configured; emails in failure logs are hashed).
- **At rest**: a secret lives in the platform's secret store or a file only the app can
  read (0600) — never a world-readable config, an image layer, or the repo (`.env`
  gitignored; `.env.example` placeholders only). Passwords are stored under a slow KDF
  (argon2/bcrypt/scrypt), never a bare or fast hash.
- **In transit**: a secret never rides in a URL or query string (proxies, browser history
  and `Referer` capture those) — header or body over TLS only (§5) — and a leaked one has
  a rotation path that does not require a deploy.
- Constant-time comparison for secrets/tokens (no `===` on a hash); strong randomness
  for generated keys.

## 5. Transport, headers & CSRF — `transport`

- TLS on every connection that carries a credential or user data beyond the host or the
  platform's private network (TLS ending at the platform's front end is fine), and no
  client turns certificate or hostname verification off (`rejectUnauthorized: false`,
  `NODE_TLS_REJECT_UNAUTHORIZED=0`, `checkServerIdentity: () => undefined`).
- Security headers present (nosniff, frame-options/ deny, HSTS in prod).
- CORS is closed by default; opened only deliberately for known origins.
- Cookie-based sessions set `httpOnly`, `secure` (prod), and `SameSite` (CSRF
  defense); token/header auth flows are not CSRF-susceptible.
- No source maps served publicly in production; no debug/verbose error bodies leaking
  internals to clients.

## 6. Supply chain — `supply-chain`

- **A new dependency is chosen, not just added**: it is needed, maintained, and the
  package the project meant — not a lookalike name. An internal package lives under a
  scope the organisation owns, mapped to its private registry in `.npmrc`, so the public
  registry cannot answer for it.
- **What gets installed is fixed**: the lockfile is committed and CI installs from it
  frozen (`npm ci`, `pnpm install --frozen-lockfile`). A tool CI or a script runs is a
  devDependency run from the lockfile (`pnpm exec`, `npx --no`):
  `npx <pkg>@<version>` pins only that package, its dependencies still float, and in CI
  `npx` installs an unknown name without asking.
- **A published manifest's ranges are what its users install**: the lockfile does not
  ship, so users of a published package resolve its ranges afresh, and a range is widened
  only on purpose.
- **A new or bumped version has aged**: it has been public for some days before it is
  installed (the package manager's minimum release age: npm `min-release-age`, pnpm
  `minimumReleaseAge`), since a release from a hijacked maintainer account is often
  found and pulled within days. A fix for a published advisory may skip the wait through
  the exclude list (npm `min-release-age-exclude`), named in the change.
- **A dependency's install scripts** (`preinstall`, `install`, `postinstall`) are read,
  or disabled for packages that do not need them (`ignore-scripts`, the package
  manager's allow-list of packages that may build): they run on every developer machine
  and CI runner that installs.
- **Third-party code in CI is pinned and kept current**: actions by full commit SHA (a
  tag can be moved), container images (in CI and in a `FROM`) by digest, and a bot
  (Dependabot, Renovate) bumps those pins — a pin nobody bumps keeps a fixed
  vulnerability.
- **Workflow tokens get the least they need**: `permissions:` is set to what each job
  needs, and `actions/checkout` sets `persist-credentials: false` unless a later step
  pushes.
- **A privileged trigger never runs outsider code**: a run triggered by
  `pull_request_target`, `workflow_run` or `issue_comment` holds the repository's
  secrets, so it never checks out and runs a fork's code nor trusts its artifacts.
- **Outsider text is never expanded into a script**: no `${{ }}` value an outsider
  writes (`github.event.*` titles, bodies and comments, `github.head_ref`) appears inside
  `run:` or an `actions/github-script` `script:`; it goes through `env:` and is quoted
  (`"$TITLE"`).
- **Nothing is fetched and run unverified** (`curl … | sh`, a script from a URL): it is
  pinned by version and checksum, or vendored.
- **The audit is clean**: `npm audit` (or the ecosystem equivalent) at moderate+; the
  change adds no vulnerable dependency.

What the project itself makes runnable — its own hooks, entry points and install scripts
— is §11; its CI workflows are here.

## 7. AI / LLM-specific (when an LLM is in the loop) — `llm`

- **Prompt injection**: untrusted content (user text, fetched pages, tool output) is
  treated as data, not instructions; system prompts are not overridable by user input.
- **Output handling**: LLM output is validated/escaped before it drives an action
  (code execution, a query, a shell command, a network call) — never `eval`'d or run
  unchecked. A URL the model chose is a user-influenced destination (§13). LLM output
  shown to a user (a Markdown image URL that carries data out, a control sequence in a
  terminal) is §12, and §3 when the app renders it to HTML itself.
- **Secret/PII exposure**: no secret or excessive PII placed in a prompt sent to a
  third-party model; tool/function access from the model is least-privilege.
- **Resource limits**: token/cost/loop bounds on agentic calls to prevent runaway use.
  What one caller may spend across calls (a quota per user or organisation) is §14.

## 8. Shell & subprocess — `shell-process`

- **Argument construction**: no untrusted input concatenated into a command string;
  arguments go as an array to an exec-style API (`execFile`/`spawn` without
  `shell: true` — and on Windows a `.cmd`/`.bat` target is shell-parsed regardless),
  never through a shell. An array is not sufficient on its own: a value that can begin
  with `-` is read by the binary as a flag, so untrusted values sit after `--` or are
  validated against a known form.
- **Spawn surface**: every new subprocess is deliberate — the binary resolved from a
  known path rather than the inherited `PATH`, and the child running with no more
  privilege than the caller (no `sudo`, setuid, or elevated container).
- **Secrets across the boundary**: a secret never travels as a command-line argument —
  argv is world-readable in `ps`. It goes via the child's environment (pruned to what the
  child needs), stdin, or a file descriptor.
- **Child I/O**: the child's output is untrusted input at a boundary (§1, plus §7 if it
  reaches an LLM and §12 if it is echoed) before it drives anything; its exit code is
  checked, not assumed; and it cannot hang or flood the parent unbounded (timeout, kill,
  output cap).

## 9. Money, billing & pricing — `payments`

- **Idempotency**: every charge, refund, or transfer is idempotent under retry
  (idempotency key, provider-side dedup) — a replayed webhook or a double submit cannot
  move money twice.
- **Amount & currency integrity**: amount and currency come from the server-side record,
  never from the client; arithmetic is in integer minor units (no floats), the rounding
  rule is explicit, and totals are recomputed rather than trusted.
- **Bounds & entitlement**: amounts, quantities and discounts are range- and sign-checked
  server-side — no negative charge, no refund above what was captured, no coupon reused
  or stacked past its rule — and access a payment buys is granted on settled state and
  revoked when that state reverses.
- **Provider trust boundary**: webhooks are signature-verified against the **raw** request
  body (a JSON body parser mounted ahead of the route silently breaks this) and
  replay-windowed; state transitions (pending → paid → refunded) are enforced server-side
  and written to an audit trail (who, what, when).

## 10. Destructive writes & data — `data-loss`

- **Scoped deletes and updates**: every delete or bulk update carries a bounding
  predicate (tenant/owner/id) that is proven non-empty at runtime, not merely present in
  the source — an `undefined` id the ORM silently drops, or a filter built from a request
  that arrives `{}`, is a collection-wide call wearing a `where`.
- **Irreversibility**: a migration or schema change has a tested rollback, or is
  explicitly one-way and says so; a destructive data migration runs behind a
  backup/snapshot step. Soft-delete where a human may need to recover — and where it is
  used, every read path filters deleted rows and records holding personal data still
  have a real erasure path, not an indefinite tombstone.
- **Atomicity**: writes that must succeed together are transactional or idempotently
  replayable — a partial failure cannot leave data half-written and report success.
- **On disk**: a write replaces a file atomically (temp + rename), never truncates or
  deletes a path the change did not create, and never follows a symlink to do it. Any
  destructive path is proven non-empty before use — a path variable that can be empty
  turns a scoped delete into a root-relative one.

## 11. Executable surface — `executable-mode`

- **Permission changes**: no `chmod`/exec-bit change beyond what the feature needs;
  neither the file nor the directory holding it becomes world-writable (a 0755 script in
  a 0777 directory is replaceable), and no write-then-execute path — a file the app
  writes is never later executed without a trust decision.
- **Install-time surface**: files laid down by an installer or updater carry the minimum
  mode; a hook or script that gains executable mode is reviewed as code that runs, not
  as data.
- **What can run**: a change to what the system executes unattended — a new entry point,
  hook, cron or launch agent, service unit, `postinstall`, or a changed interpreter
  shebang — is named in the report with who can write to it and what triggers it, even
  when it looks routine. How this change spawns a process is §8; a third-party
  package's install script and a CI workflow are §6.

## 12. Output & log injection — `output-injection`

- **Escape at the boundary**: an untrusted value — user input, a config file's
  contents, a file or branch name, a subprocess's or an API's output — that reaches a
  terminal, a log line or rendered text is escaped where it is written. Control
  characters are the vector: an ESC/CSI sequence recolours, moves the cursor, rewrites or
  hides lines; an OSC sequence sets the window title, plants a hyperlink (OSC 8) or writes
  the clipboard (OSC 52), so a pasted command differs from the one shown; a backspace or
  a raw CR overwrites what is on screen, and a raw line break forges a new log line. Bidi
  override and isolate controls make a displayed name read differently from the real one.
  A new message that quotes an untrusted value without the escape is the regression this
  section exists to catch.
- **One helper, applied once**: the escaping lives in one helper every call site shares,
  applied at the write and not again by a layer above it. Where a value can pass through
  two writers, either the helper is idempotent (it strips or replaces controls, or uses a
  visible notation that leaves `\` alone) or only the writer closest to the sink escapes
  and every layer before it passes the value raw. Its tests cover every C0 and C1 control
  the output does not deliberately keep (tab, and LF only where multi-line output is
  intended), DEL, the Unicode line and paragraph separators, and the bidi controls.
- **Machine-readable output stays verbatim**: JSON, NDJSON and other machine-readable
  output go through their own encoder, never the human-readable escape, and a
  human-readable string never skips it. A structured log carries an untrusted value as a
  field, never interpolated into its message, and a human-readable renderer of those
  logs escapes the fields as any other terminal write.
- **Rendered text**: an untrusted value written into Markdown or another markup (an
  issue or PR body, a comment, a chat message, a generated doc) is quoted for that sink,
  so it cannot add links, images, raw HTML tags, headings, mentions, issue references or
  closing keywords, nor close the fence or code span around it (its delimiter is longer
  than any backtick run in the value). Pages rendered as HTML, including Markdown the app
  renders to HTML itself, are §3.

## 13. Outbound requests and redirects — `outbound-request`

- **The destination is checked on the address, not the string**: a URL or host a user
  can influence (a webhook target, an import from a URL, a preview or avatar link, a
  callback) has its scheme allow-listed, and every address it resolves to must be public
  unicast. Check that with an allow-list: a list of private ranges misses
  `100.64.0.0/10` (one cloud's metadata endpoint is `100.100.100.200`), `0.0.0.0/8`,
  NAT64 `64:ff9b::/96` and the IPv4-mapped form, which the URL parser prints as
  `[::ffff:7f00:1]`. A check on the raw string also misses `2130706433`, `0177.0.0.1` and
  `127.1`, which all parse to loopback.
- **The check runs inside the connection's own lookup**: `lookup` on both the
  `http.Agent` and the `https.Agent` (axios: `httpAgent` and `httpsAgent`; an `https:`
  URL never uses the first), and `connect.lookup` on an undici `Agent` passed as
  `dispatcher` for the global `fetch`, which ignores `agent`. It refuses the request if
  any returned address fails, since Node asks the lookup for every address
  (`all: true`). A check that resolves on its own and then connects lets a DNS answer
  that changes in between (rebinding) show the check a public address and connect to a
  private one.
- **An address in the URL is checked before the request**: Node calls no lookup when the
  host is already an IP address (`127.0.0.1`, `[::1]`, and `2130706433` or `127.1` once
  parsed), so a check inside the lookup alone lets every literal through. The same
  allow-list runs on the parsed `hostname` (brackets stripped) when `net.isIP` says it is
  one.
- **A redirect the response asks for** is not followed, or each hop is checked again by
  the same rules: a redirect to a private address is the usual way past a check made on
  the first URL alone. A lookup on the agent or the dispatcher sees each hop's host name
  but never a literal, so a client that follows redirects itself (`fetch` and axios by
  default) lets `302 → http://169.254.169.254/` through. Either follow redirects by hand
  (`redirect: 'manual'`, `maxRedirects: 0`) and check each `Location`, or run the literal
  check in the connector every hop goes through (`createConnection` on the agent, a
  `connect` function on the undici `Agent`).
- **A user value inside a URL to a fixed host** (`${API}/users/${id}`) is checked against
  its expected form (an id pattern), not only encoded: the URL parser resolves `..` and
  `%2e%2e` segments, and `encodeURIComponent('..')` is `..`, so the request reaches
  another endpoint of that service with the server's credentials.
- **The request carries nothing of the server's**: no service token, internal cookie or
  cloud credential rides to a user-chosen destination, and headers a user supplies are
  validated (§1) and can never set `Host`, a hop-by-hop header or a credential.
- **Bounded**: connect and total timeouts, and a response-size cap enforced while the
  body streams, so a slow or endless response cannot hold a worker; how many such
  requests one caller can trigger is §14.
- **Only what the feature needs goes back**: the caller gets the result the feature
  promises (a title, a resized image), never the raw upstream headers, and a failure is
  one generic error — distinct texts for refused, timed out and unresolved turn the
  endpoint into a port scanner. The response is untrusted input (§1), and §7 when it
  reaches an LLM.
- **Redirects it issues**: a redirect to a user-supplied target (`res.redirect(next)`, a
  `returnTo` after login) goes only to a same-origin path or an allow-listed origin,
  checked after parsing against the app's origin: `//evil.example` and `/\evil.example`
  both resolve off-origin.

## 14. Resource limits & abuse — `resource-limits`

- **Keyed on who pays**: a limit is enforced server-side and keyed on the principal that
  pays for the work (user, organisation, or a token the user cannot create more of),
  never on a value the client can change to get a fresh counter. Behind a proxy the
  client IP is the entry the proxy appended (Express `trust proxy` set to the hop count
  or the proxy's addresses), never the left-most `X-Forwarded-For` entry, which
  `trust proxy: true` returns as `req.ip`. An IPv6 client IP is keyed on its /64 prefix
  or a wider one, since one host can take a fresh address from its prefix for every
  request.
- **Before login, per source and per target**: an endpoint that checks a guessable secret
  (password, one-time code, reset or invite token) limits failed attempts per account as
  well as per client IP; one that costs money or reaches a third party (sign-up, password
  reset, a test send) is limited too.
- **One counter for every instance**: a per-principal window lives in a store every
  instance shares wherever the app can run more than one instance; an in-process window
  then multiplies the limit by the instance count and resets on every deploy.
- **Fails toward a limit**: a missing key, an unreachable store or a limit setting that
  does not parse falls back to a conservative in-process limit (a refusal only where one
  unmetered call costs money), never to unlimited.
- **Bounded size**: page sizes are clamped server-side; bodies and uploads are capped
  while they stream, and a compressed body or archive on its decompressed size. A
  field's max length is §1.
- **Bounded work**: query depth or cost is bounded, a batch counts each item against the
  limit, and one request's fan-out (outbound calls, queued jobs, emails sent) has a
  ceiling. An LLM call's token and cost bounds are §7.
- **No regular expression backtracks on untrusted input**: no nested or overlapping
  quantifier (`(a+)+`, `(a|a)*`) runs on it; it is rewritten without the ambiguity, or a
  linear-time engine (`re2`) runs it. A length cap is no defence for a nested quantifier
  or overlapping alternatives under one: each added character doubles the time, and
  `^(a+)+$` takes hundreds of milliseconds on 26 `a`s and a `!`. A match blocks the event loop,
  and a timer in the request handler cannot interrupt it.
- **A refusal the caller can act on**: over the limit is `429` (or the protocol's
  equivalent) with `Retry-After`, except where telling it apart leaks something — a
  per-target limit on a pre-login form counts every submitted account name, existing or
  not,
  or answers as the form always does. The refusal is logged with the principal (hashed
  where it is personal data, §4) so abuse shows.

## Report

```
## Security Review — <task name>

**Declared surfaces**: <class → where you pressed> | none declared | no declaration handed over
**Critical**: <vector — file:line — fix> | none
**High**: <…> | none
**Medium**: <…> | none
**Low / hardening**: <…> | none

**Verdict**: no blocking issues / <N> issues to fix before merge
```

A finding that the **plan** mandated an insecure approach is a **discovery** (the plan
needs a human decision) — run [`raise-discovery`](.claude/skills/raise-discovery/SKILL.md) rather than silently complying.
