# The router — which path a request takes

> Vendor companion to `.claude/agents/orchestrator.md`, read on trigger: a request for
> new work with no command, `/triage` once the cause is found, `/define`, and a pending
> stub's pickup (`.claude/agents/task-flow.md` step 2). The Orchestrator (an LLM)
> routes — there is **no runtime scorer**: a keyword heuristic would be less accurate
> and would bias toward the expensive failure.

## The paths

| Path          | What runs                                                                                  | For                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task flow** | Grill if open → issue + branch → plan (`tasks.md`) → implement (TDD) → review → merge gate | Every request the harness takes — features, changes and bugs, closed or open — and every part of a cut feature (`.claude/agents/partition.md`) |
| **Bypass**    | None — no issue, no task state, no review                                                  | Typos, internal renames, lockfile bumps, comment fixes — only on the human's `/bypass`                                                         |

Telemetry records the task flow as `L2` and the bypass as `L3` (`L1`, the retired spec flow of 0.11.x and earlier,
is never written). The human does not know these codes: name the path in words.

## Open or closed: the list

Before any plan or code, read the request and the repository, and list the decisions you
would otherwise have to guess: product or behaviour choices the request leaves open, where
two reasonable implementers could choose differently and the requester would notice the
difference. For a bug, the list is about the fix, once triage has found the cause: the
right behaviour, where the report and the code leave it open.

What is not a listed decision:

- anything the request (for a bug, the report or the repository) already decides;
- anything the request puts out of scope;
- implementation details with no visible effect on behaviour or output;
- edge cases of inputs the request does not mention: the plan picks the conservative
  option and records it (the Planner's `## Agent-decided`), so they need no question.

A decision is listed only if a wrong guess would make the requester reject or redo the
result. A requester who says "use your defaults" has not closed a decision: still list it.

**An incompatible change to a surface others consume always lists one decision** (the
surfaces and what is not such a change: the bypass section below): break its consumers, or
keep the old form working alongside the new one — unless the request or the repository
already says which
("rename it outright, no alias"). The request names the new form, rarely what happens to
the old one, and a wrong guess found at the merge gate costs a fresh pass; asked first, it
is one question before the plan, and the Reviewer's external-effect question later only
confirms it.

**Verdict: `closed` when the list is empty, `open` otherwise.** One entry is enough to make
a request open: a call made by the agent surfaces only at the task flow's gate, once the
plan is written around it, so a single material decision is asked first (a one-question
grill) instead of guessed.

**How a new output for people is presented: one more entry, never the one that opens a
request.** When the request asks for a new output that people read (a table, a summary, a
report, a printed document) and neither the request nor the repository fixes how it is
presented, in whole or in part (its layout, how it writes values, what goes alongside it,
such as a heading or a note), that presentation is a decision: two reasonable implementers
present the same content differently, and the requester sees the difference each time they
read it. Nothing breaks when it changes, so it reads like a detail, and the plan would
settle it among its other calls, which the gate before code shows in a long list that is
easy to skim past. Decide the verdict without it. When the list without it holds anything,
or the request came by `/define`, add the presentation as one entry, with the one you would
pick, so the grill settles it in a single answer. Otherwise leave it out: the plan settles
it and the gate shows it, because a presentation changed at the gate breaks nothing, and a
grill only for it costs more than that line. What the output contains, when the request
leaves that open, is a decision like any other. A screen's layout is not this entry: the UI
design settles it (task flow step 5).

**A request that asks to cut the work into parts is always `open`**, whatever the list
holds ("it is big, cut it"): it goes to the grill, as `/define` would, because the feature
grill is what writes the feature PRD every part reads (`.claude/agents/partition.md`,
its section "A cut on the requester's word"). Its proposal names that: "A feature grill
on what crosses the parts, then the cut." It offers no _just do it_: the cut needs the
feature PRD, and only the grill writes it.

## The proposal

Say the verdict, the path and why in one message, with the listed decisions when there
are any, and offer one step up or down:

- **Closed** → "Task flow, no open decisions: <why>." Then go on in the same turn; the
  human can still step up by saying _grill_ (the grill runs first). **A bypass candidate**
  (the criterion below) is the one exception: the proposal asks one question instead —
  "Type `/bypass` and I make it directly, or say go on and it takes the task flow", with
  no recommendation — and waits, before any issue or branch is opened; a reply that leaves
  the choice to you is the task flow. Only the human types `/bypass`.
- **Open** → "Task flow after a short grill on these decisions: <list>. Say _just do it_
  and I will pick the defaults and record them." Then ask the grill's first question in
  the same turn, so the proposal costs the human no extra answer. _Just do it_ takes the
  request down: you decide the listed decisions, and they are recorded as agent-decided
  `PD<n>` in a short PRD (task flow step 3), so the Reviewer checks them like any
  other.

What is skipped stays written: taking a request down never drops its decisions, it only
changes who decides them.

## Bypass: specifiable, verifiable, or reviewable

A task deserves the harness if it is at least **one** of:

- **Specifiable** — you could write down, ahead of time, what "done" means in a way that
  could be wrong.
- **Verifiable** — there is a behaviour a test could pin down (a red test today, green
  after).
- **Reviewable** — a second reader could catch a real mistake in it (logic, naming that
  encodes intent, an edge case).

A task that meets **none** of the three — nothing to specify, nothing a test would
meaningfully assert, nothing a reviewer would catch — is a bypass candidate: ask the
human once — `/bypass` (typed by them) or the task flow — and wait, before opening anything;
any answer but `/bypass` takes the task flow, so it never blocks. The question states the
facts (what the change is, what `/bypass` skips) and **recommends neither route**: you cannot
take `/bypass`, so a reply that leaves the choice to you ("go on", "you decide", "as you think
best") is the task flow — start it, never ask again. **Only the human types
`/bypass`**: never run it, and never follow its steps by hand — a bypass the agent takes
is a review nobody chose to skip. **When in doubt, keep it in the harness**: a wasted bit
of ceremony is cheaper than an unreviewed bug.

**Never a bypass candidate — do not offer it: an incompatible change to a surface others
consume** — something renamed or removed, a name kept with a new meaning, input it
accepted now refused. Such surfaces are: machine-readable output (stdout meant for
scripts, JSON, exit codes), a CLI flag or command, an API or package export, a config key
or environment variable, a file format or data schema (and names other tools match on,
such as labels), a setting users set up around. Recognise it before code from what the
request changes and what the repository says about it (a README naming callers, a
documented output, a `git grep` of the name); it counts whether or not you find a
consumer, since consumers outside the repo are invisible to you, and when you cannot tell
whether a name is consumed, do not offer the bypass. Such a change always goes to the
task flow, where the Reviewer checks its external effect. Not such a change: anything
purely additive (a new command, flag, field, optional key or accepted value); a change
that only relaxes a surface (accepts more, flags less, keeps more), so whatever worked
before still works; text written for people to read (usage and help text, error messages,
log lines, docs, comments) unless the project documents it as machine-readable; internal
changes; a fix of clearly wrong behaviour nobody could rely on.

## Worked examples

| Request                                                                                      | Listed decisions                                                                                                                 | Verdict                                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| An invoices endpoint whose request states the response, its order, paging, access and errors | none (unmentioned inputs are the plan's conservative calls)                                                                      | **closed**                                                 |
| A new export of orders whose contents and filters nobody has decided yet                     | which orders are in (cancelled, refunded), whether and by which date it filters, the columns, CSV or a workbook                  | **open**                                                   |
| A packing slip whose request names what it lists, not whether back-ordered items appear      | whether back-ordered items appear, and the slip's presentation as one entry: how items are grouped, how sizes are written        | **open**                                                   |
| A low-stock email whose request states who gets it, when, and which products it lists        | none: how it is presented is the plan's call, which the gate before code shows                                                   | **closed**                                                 |
| Bug: the cart badge counts one item fewer than the cart holds                                | none: the right behaviour is obvious once the cause is found                                                                     | **closed**                                                 |
| Bug: the footer shows the shop's old support email while the shop settings hold the new one  | none                                                                                                                             | **closed**                                                 |
| Bug: two discount codes on one order are both applied and the price fell below cost          | reject the second code or keep the better one, and whether the customer is told at checkout                                      | **open**                                                   |
| Bug: the API answers 200 with an empty body when the order does not exist                    | a 404 or a 200 with an error field, and whether callers that check for today's empty body may break (a public behaviour changes) | **open**                                                   |
| "Rename the `SHOP_DB_URL` environment variable to `DATABASE_URL`"                            | break the deploys that set `SHOP_DB_URL`, or keep reading it too                                                                 | **open** — never bypass: an environment variable users set |
| "Rename `usr` → `user` across the module" (an internal variable, not exported)               | none                                                                                                                             | **closed** — ask once: `/bypass` or the task flow          |
| "Fix a typo in a code comment"                                                               | none                                                                                                                             | **closed** — ask once: `/bypass` or the task flow          |

The borderline cases are the interesting ones. A "rename" of anything others consume — a
public API, a flag, a config key — stays in the harness (a reviewer should see what it
breaks). A "typo fix" in a
user-facing error message that other code matches on stays too (something could break).
The properties, not the surface verb, decide.

## Escape hatches

- **`/bypass`** — typed only by the human: skip the harness on a task the router would
  otherwise take. It checks the surfaces others consume first (one question if the change
  touches one), emits
  exactly one `l3_bypass` telemetry event (so misrouting is observable later) and then
  does the work with no issue, no task state, no review.
- **`/hotfix`** — an urgent task-flow fix that skips the _human-wait_ gates (no gate
  before code) while the Reviewer still runs asynchronously. The urgency buys speed, not the
  loss of a second pair of eyes; the retroactive issue and a short postmortem are
  backfilled after the fire is out.

The concrete mechanic of each lives in its command file (`commands/bypass.md`,
`commands/hotfix.md`, `commands/define.md`).
