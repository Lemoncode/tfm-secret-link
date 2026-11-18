# Partition — oversized features into independently mergeable parts — Orchestrator companion

> Vendor companion to `.claude/agents/orchestrator.md` (the hat). **Read on
> demand, never at boot**: when the requester asks to cut a feature into parts (at any
> point of a define, or in a request), when a grill closes a PRD that looks like it bundles
> separable wants (the define's closing question), when RESUME or ORIENT lands on
> an issue carrying `harness:partition-plan`, or when a sub-agent raises an
> oversize discovery.

The router already handles the **floor** — a task too small for the ceremony gets
`/bypass` offered to the human. This companion is the **ceiling**: a
thorough define can produce one enormous task that, however well its groups are
cut inside, lands on **one branch and one PR**. When the work splits into several
**independently mergeable** units, the define should produce several issues —
each with its own branch, PR, merge gate, and revert — instead of one.

## The boundary: an issue is a merge unit

- A **group** (a `tasks.md` step header) is review/checkpoint cadence **inside** one
  merge unit: its tasks share a branch, everything lands in one PR, one revert takes
  it all.
- An **issue** is an **independent merge unit**: its own branch from its base, its
  own PR, merge gate, CI, and revert. Part 1 can be in the default branch while
  Part 2 is being built.
- **Promotion rule** — a group cut promotes to an issue cut **iff both sides are
  independently mergeable**: each side leaves the default branch green and shippable
  without the other (or with only earlier chain links merged). A cut that cannot
  produce independently mergeable units is **not a partition**; forcing it buys
  stacked-PR pain with no benefit.
- **Size is the symptom that triggers looking; mergeability is the criterion that
  decides.** A genuinely inseparable monolith is not partitioned — it is accepted as
  one task, or the feature is renegotiated with the human (an honest define outcome).
- **The partition is a design decision, always proposed to the human**, who
  approves, amends, rejects — or proposes different cuts. Never partition silently.

Partition rides the PRD → task transition, at the close of a grill
(`.claude/agents/task-flow.md` step 3), or at a task's gate before code (§A cut at the
gate before code). Its parts run in the task flow, each with a short grill of its own at
its turn (§Children). A task with no PRD is never cut this way (see the oversize discovery below).

## When to look — soft heuristics, no threshold

Judgment, with named cues and **no binding number** (a mechanical trigger would
measure something other than what matters):

- the PRD bundles **separable wants** — capabilities a user could receive one
  without the other;
- the natural `tasks.md` grouping would exceed **~4–5 groups**;
- the grill closed decisions that **don't touch each other** — distinct seams, distinct
  files, distinct risks.

The human gate absorbs the imprecision: an over-proposal costs one "no, it goes
together"; an under-proposal is visible in the plan (a huge `tasks.md`), where
the human can ask. The residual failure — never proposed, never asked — is today's
behaviour; nothing gets worse.

## A cut on the requester's word — the grill goes high level

The requester usually knows a feature is big. When they say to cut it — before the grill
("it is big, cut it") or in the middle of it — **the cut is decided**: do not ask whether
to cut, and do not wait for the cues above. From that point the grill is a **feature
grill**:

- It walks only what **crosses parts**: the goal, what is out of scope, the contracts
  between parts (an interface, a data shape, a file another part reads), the decisions
  that bind every part, and where the seams are. A topic that only one part touches is
  not walked now: note it as `open: <topic>` for that part, to be grilled when the part
  is picked up, with what its earlier parts taught (§The short grill of a part).
- The PRD records it at once, so a paused grill resumes as a feature grill: the line
  `Cut: asked by the requester.` under its title, and each topic under `## Open Points` as
  `open: <topic> (Part <k>, or the part it will fall in)`.
- The decisions already walked before the cut was asked stay in the PRD as `PD<n>`, as
  any closed decision; none is thrown away or asked again. The cut's `Decisions` column
  (below) assigns them to parts.
- At the grill's close it proposes the cut (§The closing question of the define, step 2)
  without step 1's look: the cut was asked for. The requester can still amend the
  slices, or take the cut back (one task as today; then the topics noted `open:` are
  grilled before the task opens, as on any grill, and the PRD's `Cut:` line becomes
  `Cut: taken back.`). When no cut leaves each side
  independently mergeable (§The boundary), say so in the proposal and offer one task: a
  cut the requester asked for is still never forced.

A plain request that asks for a cut (no `/define`) is always routed open
(`.claude/agents/fit-assessment.md`): it goes to the grill, as `/define` would, because
the feature grill is what writes the feature PRD.

## The closing question of the define

After the PRD closes and **before opening the task** (between the grill and opening
the task):

1. **Look.** Weigh the cues above against the PRD's closed decisions — that is where
   the big seams show. No cue fires → continue the round-trip as today, silently.
   There is no question to ask when nothing looks separable. A cut the requester asked
   for skips this step.
2. **Propose, at a glance.** When a cut looks real, build the proposal so it can be
   approved without re-reading the PRD: the slices, what each merges independently
   of, what each cut buys, the **dependency shape** —
   - **siblings** — each part branches from the default branch, any order;
   - **chain** — part k+1 assumes part k merged;
   - **DAG** — a mix; name the edges —

   and, per part, its **decisions**: the PRD's `PD<n>` the part implements or consumes,
   and the `open:` topics left for its grill (`PD2, PD5 · open: empty state`). Assign
   each decision once, here: a decision that binds every part is a **cross-cutting**
   one, goes to the PRD's `## Cross-cutting decisions` section (below) and is named in
   no row.

   Present it as a compact table (the parent body's `## Plan` below is the shape),
   naming each part's decisions **in words** — what each one decides, as the gate before
   code names things — never by their `PD<n>`: the ids go into the parent's `Decisions`
   column once the cut is approved, where the agents read them. Then ask **one** question: _approve this cut, amend it, reject it (one task as today),
   or propose different cuts?_ This is the closing question of the define
   conversation — one more question inside an existing one, not a new gate.

3. **Act on the answer.** Reject → open the single task as today; when the cut was the requester's, first rewrite the PRD's `Cut:` line
   as `Cut: taken back.` and grill the topics left `open:`. Approve (or an amended cut the human has OK'd) → in this order, in this
   same session:
   1. create the **parent partition-plan issue** (below); when the grill ran on an issue
      that already exists (a task-flow bug or stub), close that issue right after, with a
      comment linking the parent, and remove its status label, so its pickup cannot open
      a single task beside the parts (the feature PRD links it, and only its decisions
      are scoped by a part's feature line, so Part 1's Planner still reads that
      issue's root cause);
   2. land the **feature PRD** on the default branch through its docs PR, and ask its
      merge question (§The feature PRD and its docs PR);
   3. **the close** (§The close of a feature define): start Part 1 now, or stop here.

   No feature-level gate before code and no walkthrough: they show what the agent
   decided in a plan before code, and the feature has neither.

## The parent partition-plan issue

One issue per partitioned feature: the feature's cover sheet and its at-a-glance
state. Create it with `gh issue create` — title `Partition plan — <feature>`, labels
`harness:managed` + **`harness:partition-plan`**, and **no** `harness:status:*`: it is
**not a task**. It never gets a branch, a `plan/tasks.md`, `progress.md`,
or an implementation; the label is the mechanical marker that keeps the router and
RESUME from ever treating it as implementable. Its body:

```markdown
# Partition plan — <feature>

PRD: `docs/prds/<topic>-<date>.md`

## Plan (approved <YYYY-MM-DD>)

| Part | Slice                  | Merges independently of | Depends on     | What the cut buys | Decisions                |
| ---- | ---------------------- | ----------------------- | -------------- | ----------------- | ------------------------ |
| 1    | <what this part ships> | Parts 2, 3              | —              | <the benefit>     | PD2, PD5 · open: <topic> |
| 2    | <what this part ships> | Part 3                  | Part 1 (chain) | <the benefit>     | PD3, PD4                 |

Dependency shape: <siblings | chain | DAG — the edges are the `Depends on` column>.
Cross-cutting decisions (every part): the PRD's `## Cross-cutting decisions`.

## Status

- [ ] Part 1 — <slice> (not started)
- [ ] Part 2 — <slice> (not started)
```

**Precondition**: the `harness:partition-plan` label must exist on the remote —
`install`/`update`/`repair` create it during label sync; an install that predates it
needs one `lemony repair` first (a raw `gh issue create --label` has no self-heal: `gh`
fails clean on "label not found", nothing half-created).

Each `## Status` row moves through
these states: `- [ ] Part <k> — <slice> (not started)` → `- [ ] Part <k> — <slice> → #<id>
<status at opening>` when the part is opened → `- [x] Part <k> — <slice> → #<id> merged`
at the part's closeout. A part the human drops (an amendment, or partial abandonment)
becomes `- [x] Part <k> — <slice> — dropped <YYYY-MM-DD> (<why>)` — **ticked, never
deleted**, so the close rule below still fires and the plan stays readable as history (a
drop is recorded in the row alone). Amendments — changes to the cut itself — append to
`## Plan` as `Amended <YYYY-MM-DD>: <what changed and why>`; never silently rewritten. **The rows are a cache, not the truth**: the middle state is the
status at opening and is refreshed only at closeout, so before a decision that depends
on a part's state (sequential vs stacked, which part is next) confirm it against GitHub —
the child's issue state and its PR (`gh pr view <pr> --json state,mergedAt`).

### Editing the plan and child bodies — mechanically

**Every edit goes through `lemony issue-body`, never through your Read/Write path.** A
plan body is mostly rows you do not own, and a body retyped to change one line can drop
or alter the rest without a trace. The verb reads the body on stdin and prints the new
one; it never calls GitHub. An edit is three steps:

1. `mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/issue-body.XXXXXX` — note
   the directory it prints (`<dir>` below; inside the repo and gitignored).
2. Only for an action that takes prose — a slice, a drop reason, an amendment: write it,
   one line, with your **Write** tool to the file its action names in the table below
   (`<dir>/slice.md`, `<dir>/why.md`, `<dir>/text.md`). Never on the command line: a
   backtick or a `$` in it is run or expanded by the shell before the verb sees it.
3. Fetch, transform and write as **one** Bash call, chained with `&&` so a refusal stops
   it before the write (never pipe the verb's output straight into `gh issue edit` — a
   failure mid-pipe writes an empty body):

```bash
p=<parent>; t=<dir> &&
gh issue view "$p" --json body --template '{{.body}}' > "$t/old.md" &&
.claude/hooks/lib/lemony.sh issue-body set-row --part=<k> --merged=<id> < "$t/old.md" > "$t/new.md" &&
gh issue edit "$p" --body-file "$t/new.md" &&
rm -rf "$t" && echo "issue-body: #$p written"
```

**Done means the last line printed `issue-body: #<parent> written`**; without it nothing
was written, whatever the exit code says.

| Edit                                      | `issue-body` action                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Open a part (the status at opening)       | `set-row --part=<k> --open=<id> --status=<status>`, plus `--stacked-on=<k-id>` on a stacked start                                             |
| A part merged (its closeout)              | `set-row --part=<k> --merged=<id>`                                                                                                            |
| A part dropped                            | `set-row --part=<k> --dropped=<YYYY-MM-DD> --why-file="$t/why.md"`                                                                            |
| An amendment                              | `amend --date=<YYYY-MM-DD> --text-file="$t/text.md"` (what changed and why); `add-row --part=<k> --slice-file="$t/slice.md"` per part it adds |
| A contract change (a decision superseded) | `supersede --from=<PD<n>> --to=<PD<m>>`, with `--part=<k>` for the amending part's own row (§A contract change from a part)                   |
| A child's trace lines (its own body)      | `add-trace --part=<k> --parent=<parent> --slice-file="$t/slice.md"`, plus `--depends-on=<sibling>` (and `--stacked`)                          |
| The sibling a child stacked on merged     | `set-depends --on=<sibling>` on the child's body                                                                                              |

Each action keeps every other byte of the body (CRLF included) and is idempotent — a
retried edit changes nothing. It refuses, with exit 1 and nothing
written, a body it cannot place the edit in — for example no `## Status` (or two), no
row or two rows for the part, a row that names another child, a merged part dropped or
reopened, a dropped part revived, a child that already names another part, or a trace
line it cannot place. A refusal is not yours to work around by hand: stop and ask the human. After
the write, re-read the parent (`gh issue view <parent> --json body`) and confirm your
row — if another row moved underneath you (two siblings closing out on two machines),
redo the edit **once** on the fresh body; still absent → stop and ask. **The one
exception** is an amendment that reshapes rows beyond these (a renamed slice,
renumbered parts): no action makes it, because it is the human's change, not a
mechanical one. Write the whole new plan body to `<dir>/new.md` with your Write tool
(after fetching `old.md` as in step 3), show the human `diff "$t/old.md" "$t/new.md"`,
and only on their OK write it with `gh issue edit "$p" --body-file "$t/new.md"` — then
re-read and check that every row you did not mean to change is still there.

## The feature PRD and its docs PR

The grill's PRD is the **feature PRD**: the goal, what is out of scope, the contracts
between parts, and the decisions, numbered `PD1…` as in any PRD. It links the parent for
the cut and never copies the cut (the parent's `## Plan` is the one copy, amended in one
place). Before it leaves the session, finish it with your Edit tool:

- under its title, the line `Parent: #<parent> — the cut, and each part's decisions.`;
- the decisions the approved cut calls cross-cutting move, with their numbers, under a
  `## Cross-cutting decisions` heading (after `## Technical Decisions`): they bind every
  part and no row names them. Every other `PD<n>` stays where it is.

Every part reads the same feature PRD, so it lands on the **default branch** before any
part starts — never on Part 1's branch alone, where a sibling's base would miss it until Part 1
merged (a cut at the gate before code puts it on both: §A cut at the gate before code). It lands through a **docs-only PR**, which is not a task: no issue of its own, no
state directory, no closeout, no Reviewer (every decision in it the requester made or accepted: in the grill, or at
the gate before code). Its branch is `harness/prd-<parent>`, from the default branch, and it
carries the feature PRD and any file the grill wrote (a `CONTEXT.md` edit, an ADR).

First `git fetch`, and note the branch you are on (`git branch --show-current`); note
`<default>` instead when it prints nothing (a detached HEAD) or prints
`harness/prd-<parent>` (an earlier try stopped there). The requester's checkout goes back to
the noted branch as soon as the PR is open. When `origin/harness/prd-<parent>` already holds
the PRD (`git cat-file -e origin/harness/prd-<parent>:<the PRD path>` succeeds), an earlier
try pushed it: skip to the PR below. When only a local `harness/prd-<parent>` exists: if it
holds the PRD (`git cat-file -e harness/prd-<parent>:<the PRD path>`), push it
(`git push -u origin harness/prd-<parent>`) and go on to the PR; if it holds no commit of its
own (`git rev-list --count origin/<default>..harness/prd-<parent>` prints `0`), delete it
(`git branch -D harness/prd-<parent>`, from another branch) and run the recipe; otherwise
stop and ask the requester — never overwrite it. Otherwise, as **one** Bash call, chained
so that a refusal stops it before anything is committed:

```bash
git fetch && git checkout -b harness/prd-<parent> origin/<default> &&
git add <the PRD> <the files the grill wrote, if any> &&
git commit -m "prd(#<parent>): <feature>" -- <the PRD> <the same files> &&
git reset -q -- <the PRD> <the same files> &&
git push -u origin harness/prd-<parent> && echo "prd branch: pushed"
```

Done means the last line printed `prd branch: pushed`. When the checkout refuses because
uncommitted changes are in the way, nothing was committed. If a file in the way is one
this recipe carries (the PRD, a file the grill wrote), the grill edited a version that
differs from the default branch's: say so and stop — the requester decides how to bring it
up to date (a stash or a commit would leave the edit out of the docs PR). Otherwise name the
files, ask the requester to commit or stash them, and run it again on their word. Whenever
this section stops with the checkout on `harness/prd-<parent>` (a step after the checkout
failed, or a resume finds it there), check out the noted branch — `<default>` when none is
known — before asking anything; after a failed commit, also
`git reset -q -- <the PRD> <the same files>`, or they stay staged on the requester's branch.

Write the PR body with your Write tool to `<dir>/pr.md` (a `<dir>` made as in §Editing
the plan and child bodies, step 1): one line, `Feature PRD of #<parent> — <feature>. Docs
only; Part 1 starts once it is merged.` It names the parent and **never closes it**: no
`Closes`, `Fixes` or `Resolves` before `#<parent>`, since the parent closes only at its
last part's closeout. Then
`gh pr create --base <default> --head harness/prd-<parent> --title "PRD: <feature>" --body-file <dir>/pr.md`,
`rm -rf <dir>`, and `git checkout <the branch you noted>`: from here nothing needs the docs
branch checked out, and a stop leaves the requester where they were.

Then ask **its merge question**, the merge gate's first two options (orchestrator
§"Merge gate"): _the feature PRD is in PR #<pr>: <url>. (1) merge it yourself, or (2) I'll
merge it once checks are green._ **An answer given before the question is the answer**: when the
requester already said how (for example "merge it once checks are green" while approving the
cut), do not ask again — say in one line what you do and why (_you said to merge it once
checks are green: merging PR #<pr>_). Unlike the gate before code, nothing is hidden by it: the
PR holds only the decisions they just took. On (2), merge it through the executor **without**
`--approve-issue` (there is no Reviewer's record to guard), as the closeout record PR
does:

```bash
.claude/hooks/lib/merge-pr.sh harness/prd-<parent> --squash --delete-branch
```

Its exit code, read as the orchestrator's §"Executing an authorized merge" reads a task
PR's, with what a docs PR changes:

- **0 — merged.** Delete the local branch if it is still there
  (`git branch -D harness/prd-<parent>`), then the close (below) — there is no closeout.
- **10 — checks red**, **30 — still pending**, **1 — no verdict**: as for a task PR —
  re-present the question with the real state, never merge on your own.
- **20 — no checks.** Ask _"I saw no checks on this PR — merge?"_; a yes merges this PR
  only (re-run with `--force`). A standing "this repo has no CI" answer is recorded at a
  task's merge gate, whose closeout carries the config line; a docs PR has none.

Exit 40 cannot occur: there is no `--approve-issue`.

A later change to a contract of the feature PRD never gets a docs PR of its own: it
travels on the branch of the part that makes it.

## The close of a feature define

The define ends with one question, once the docs PR is merged (confirm it:
`gh pr view harness/prd-<parent> --json state,mergedAt`):

1. **Start Part 1 now** — start it as any part (§Children: the re-validation, its issue,
   its short grill, then the task flow), in this session.
2. **Stop here** — the parent waits in the queue; a `/resume` starts its next part.

Nothing else is offered: Part 1 is the next part by the plan, and any other part waits for
its turn. While the docs PR is still open (the requester merges it themselves, or the
executor parked it), Part 1 cannot start: say so, and offer only to wait for the merge or to
stop here. A `/resume` of the parent picks it up from the docs PR (§RESUME and ORIENT).

## A cut at the gate before code — a task with a PRD

At a task's gate before code — not a part's: a part's rest is an amendment of its
parent (§The discovery safety net) — before any code, a requester who asks to cut it — or
approves the cut the gate offers for a plan holding independently mergeable units — gets
the define's flow from the cut on: the task goes on as **Part 1**, and its PRD becomes the
**feature PRD**. A task with `PRD: none` keeps the narrow and `/spinoff` (or `/define`) of
`.claude/agents/task-flow.md`'s gate: with no PRD there is nothing to share. The bar is
§The boundary's: each side mergeable and shippable without the other; when no cut meets
it, say so and keep the task whole.

1. **Propose** as §The closing question of the define, step 2: the slices, what each
   merges independently of, the dependency shape, and per part its decisions from the
   task's PRD (cross-cutting ones named in no row), one question — approve, amend, reject.
   Reject → show the gate again unchanged.
2. **On approval**, in this order, in this session:
   1. **The parent** (§The parent partition-plan issue), with the `Decisions` column, Part
      1's row opened on this task (`→ #<id> plan-ready`) and the later parts
      `(not started)`; then this task's trace lines with `issue-body add-trace`. The task
      is not closed: it is Part 1, on its issue and branch.
   2. **The feature PRD** — finish the task's PRD (§The feature PRD and its docs PR)
      (its `Parent:` line, its `## Cross-cutting decisions`); it keeps its path and every
      `PD<n>`, so nothing that cites one changes.
   3. **Part 1's part PRD** (§The short grill of a part, step 4), with its feature line
      from its row, and `Nothing left open for this part: the feature PRD decides.` — its
      grill was the task's; `progress.md`'s `PRD:` line names the part PRD and it carries
      the feature line, as a part's does (§Children). The **Planner**
      narrows the plan to Part 1's slice once: `tasks.md`'s `> PRD:` line names
      the part PRD and its `> Feature PRD:` line copies the part PRD's. Commit the PRDs and
      the plan together, by pathspec, as the gate's changes are committed.
   4. **The docs PR** — after step 3's commit, the feature PRD as committed on this
      branch, byte for byte, so both copies merge clean. The generic recipe (§The feature PRD and its docs PR) would lose it (the checkout of the default branch
      removes a file only this branch tracks), so run this one instead. Note this branch first (`git branch --show-current`); that section's re-entry checks apply as written (a `harness/prd-<parent>` an earlier try pushed or left behind), and after any failed step check the noted branch out again. As **one** Bash call, then write the PR as that section says and check the noted branch out again:

      ```bash
      f="<the feature PRD>"; b="$(git branch --show-current)" &&
      git fetch && git checkout -b harness/prd-<parent> origin/<default> &&
      mkdir -p "$(dirname "$f")" && git show "$b:$f" > "$f" &&
      git add -- "$f" && git commit -m "prd(#<parent>): <feature>" -- "$f" &&
      git push -u origin harness/prd-<parent> && echo "prd branch: pushed"
      ```

      It carries the PRD alone: a `CONTEXT.md` edit or an ADR the task's grill wrote rides on Part 1's branch. Its PR body reads `Feature PRD of #<parent> — <feature>. Docs only; Part 1 (#<id>)
already holds it, the later parts start once it is merged.` Then its merge question.
      **Part 1 does not wait** for it: it already holds the feature PRD. The later parts
      wait for it, as every part does.
3. **Show the gate again** with only what changed (the plan now covers Part 1's slice);
   from there Part 1 runs as any part, with one rule: **the docs PR merges first**. Before
   Part 1 amends the feature PRD (§A contract change from a part), or at its merge gate,
   a docs PR still open gets its merge question there; once it is merged, Part 1 brings
   in the default branch, and only then amends or merges — otherwise the two copies of
   the PRD conflict.

## Children: parts in the task flow, opened at their turn

A part is opened **when its turn comes**, not at approval — mirroring the lazy plan:
a row that is never opened is a cheap exit (dropping Part 3 after shipping 1–2
costs nothing unpaid). Every part runs in the **task flow**
(`.claude/agents/task-flow.md`), the one flow: its short grill, its plan, the gate
before code, the implementation, the review and the merge gate. Starting a part is, in
this order:

1. **Re-validate the cut** (§Starting the next part). On a parent with no `Decisions`
   column, first check the feature PRD is on the default branch
   (`git fetch && git cat-file -e origin/<default>:<the PRD path>`): absent, it still
   rides on Part 1's branch, so no later part opens yet — say so; it waits for Part 1's
   merge, or takes a stacked start on Part 1 once that is `in-review`
   (§Chain start modes).
2. **Open its issue** with the trace lines (below), labels `harness:managed` +
   `harness:status:pending`, and update the parent row to
   `→ #<id> pending` (`set-row --part=<k> --open=<id> --status=pending`, plus
   `--stacked-on=<k-id>` on a stacked start; §Editing the plan and child
   bodies). From here the part is a pending stub: run the task flow from its step 3, as a
   stub pickup does (no triage, no routing: the feature grill settled both), with steps
   3–5 as below. From step 6, the gate before code, nothing differs from any task.
3. **Its short grill** — task-flow step 3 for a part: §The short grill of a part, whose
   output is the part PRD and the feature line.
4. **Its branch** — task-flow step 4 without `gh issue create`: the branch
   `harness/<id>-<slug>` from the part's **effective base** (the default branch, or the
   predecessor's head on a stacked start: §Chain start modes — confirm on GitHub that the
   predecessor is still unmerged; merged by now, branch from the default branch and
   record it with `issue-body set-depends --on=<k-id>` and the row's `set-row` without
   `--stacked-on`); `progress.md` carries
   `PRD: <the part PRD>` and, on the next line, the feature line copied from the part
   PRD's header, then `Kind: feature` (after the feature line, which must stay right
   below `PRD:`; no `Router:` line: a part skips the router), then the
   `Spikes: <offered>/<run>/<changed>` line of this part's short grill, as task-flow step 4
   words it; the scaffold commit carries
   the part PRD.
5. **Its plan** — task-flow step 5: hand the Planner, by reference, the issue, the
   branch, the part PRD, the feature line (to copy into the plan's header under its
   `> PRD:` line, verbatim after the `> ` every header line opens with), the parent
   issue, the part's row (its slice) and the effective base. The plan covers **that slice only**: the feature PRD's decisions outside the row
   are constraints, not scope. No plan exists for a part before its turn, so an earlier
   part's landing can never invalidate one.

The trace lines go at the top of the issue body; the Planner's plan block
([`plan-to-issue`](.claude/skills/plan-to-issue/SKILL.md)) keeps the body as it is:

```markdown
Part <k> of #<parent> — <slice>
Depends on #<sibling> (merged | stacked — assumes it lands as-is)
```

(A root part — Part 1, or a sibling with no dependency — carries only the first line.)
Don't type them: `issue-body add-trace` writes them in the exact form every reader
matches. Make a `<dir>` and write the part's slice to `<dir>/slice.md` with your Write
tool (steps 1–2 of §Editing the plan and child bodies), then build the body and
create the issue from the file:

```bash
t=<dir> &&
printf 'A part of a cut feature: the parent issue holds the cut, the feature PRD and the PRD of this part hold its decisions.\n' |
.claude/hooks/lib/lemony.sh issue-body add-trace --part=<k> --parent=<parent> --slice-file="$t/slice.md" > "$t/body.md" &&
gh issue create --title "<title>" --label harness:managed --label harness:status:pending --body-file "$t/body.md" &&
rm -rf "$t"
```

Done means it printed the new issue's URL — its number is the child's `<id>`.
Add `--depends-on=<sibling>` for a part that depends on one, and `--stacked` on a
stacked start. From here the child's lifecycle — `harness:status:*` labels, the gate
before code, implementation, review, merge gate, closeout — is a task's.

**The feature line follows the row.** When an amendment the requester approved changes
an open part's row (§Editing the plan and child bodies), rewrite the feature line in its
part PRD's header and its `progress.md`, have its Planner rewrite the plan's, and
commit the three together: the review ledger's validator owes the Reviewer the decisions
the plan's line names and goes red when the part PRD's line differs, so a stale line
would leave a decision unreviewed. Do it on that part's branch at its next boundary,
never while its Implementer runs (under auto-commit OFF it rides the next checkpoint OK
commit). A decision the new line adds goes to the Planner as a plan change, shown at
the next checkpoint or the gate; a part already `in-review` goes back to review, since
its part PRD changed.

## The short grill of a part

The feature grill left each part's own topics for its turn, to be asked with what the
earlier parts taught. The short grill asks them, and only what the current base puts in
doubt, as [`grill-with-docs`](.claude/skills/grill-with-docs/SKILL.md) asks: one question
at a time, with a recommendation, never auto-decided. In this order:

1. **What the part owes.** Read the part's row in the parent's `## Plan`: its `Decisions`
   column names the feature `PD<n>` the part implements or consumes, and its `open:`
   topics. Copy the `PD<n>` — never from memory — into the **feature line**:
   ``Feature PRD: `<the feature PRD>` — PD2, PD5`` (comma-separated, without the `open:`
   topics), or `— none` when the row names no decision. The review ledger's validator
   owes the Reviewer exactly the decisions this line names, plus the feature PRD's
   `## Cross-cutting decisions`, so a decision left off it goes unreviewed. A parent
   with **no `Decisions` column** (cut before the column existed, or by a mid-implementation
   discovery on a 0.11.x spec task, which opened a parent; this version never does): judge which feature decisions bind this part, write those, and show the
   line to the requester before the first question, so they can correct it. The line
   lives in the part PRD's header (this section's step 4), written with the first answer,
   so a stop after it keeps the line the requester saw.
2. **The stale check.** `git fetch`, then list what landed on the default branch since
   the feature PRD did — every merge, not only the sibling parts (`--first-parent`
   counts a merged PR once, `--follow` finds the PRD's first landing across a rename):

   ```bash
   p="<the feature PRD>" &&
   b=$(git log --first-parent -m --follow --diff-filter=A --format=%H origin/<default> -- "$p" | tail -n 1) &&
   if test -n "$b"; then git log --first-parent --stat "$b..origin/<default>"; else echo "not on origin/<default>: $p"; fi
   ```

   `not on origin/<default>` means the feature PRD has not landed (a parent a mid-implementation
   discovery on a 0.11.x spec task cut: its PRD rides on Part 1's branch) or the path is wrong: never read it
   as nothing landed. Check the path against the parent; a PRD still on Part 1's branch
   means this part waits for Part 1's merge or stacks on it (§Chain start modes). On a
   stacked start, also list the predecessor's own commits:
   `git log --stat origin/<default>..origin/harness/<k-id>-<k-slug>`. Read each decision the feature line
   names, and each cross-cutting one, against it, and keep only those something there puts
   in doubt, each with its reason: the commit or file, and what it changes for the
   decision. Nothing in doubt → nothing to ask from this step. Also read the part PRD of
   each earlier part the listing shows merged that touched the files this part's slice
   touches — not to ask about its decisions (they are that part's, never owed here), but
   so an answer that contradicts one is caught (§A contract change from a part).

3. **The questions**: each decision the stale check put in doubt, with its reason; then
   each `open:` topic of the row; then, always last, **one open question**: _does anything
   you saw in the earlier parts change what was decided for this one?_ — what the
   requester learned is not in git. It is left out only for a part started in the session
   of its define, when nothing has happened since the grill. An answer that changes a
   decision this part does not own — a feature one, or an earlier part's — gets its route
   proposed inside the same question (§A contract change from a part).

   **Looks and spikes, as in the feature grill.** Before the first question, read two
   parts of `.claude/skills/grill-with-docs/SKILL.md` with your Read tool: from "Before a
   branch closes: look" to "Checkpoints", and "### 6. Closing" down to "Generate the
   PRD". This grill looks before a decision closes, notes its spikes and runs the ones
   the requester takes as those parts say. What differs for a part:

   - With no spike noted, this grill closes as it did before, with no closing question
     of its own: the question exists here only to offer spikes.
   - What a look read or ran, and a spike's answer, go under the decision they served in
     the part PRD, a provisional decision marked as in the feature PRD. A look or a
     spike's answer that bears on a feature decision this part keeps writes nothing when
     it confirms the decision; when it contradicts it, that is a contract change (§A
     contract change from a part).
   - While the part PRD is in progress, a noted spike is a line
     `Spike noted: <what is unknown> — waits: <the decision>` under its header, beside
     the `Kept:` lines, so a resume still offers it; the line goes when its spike ends,
     and a spike noted before the first answer is written with the file.
   - The closing question, when there is one, comes after the open question above, which
     stays the last of the grill's own questions.
   - Keep the three counts for the part's `Spikes:` line, written with its branch
     ("Children: parts in the task flow", step 4), as task-flow step 3 says.

4. **The part PRD** — `docs/prds/<feature>-part-<k>-<date>.md` (`<feature>` is the
   feature PRD's file name without its date), always written, even when nothing was asked:
   every reader and the gate then have one case. Write it with your Write tool when the
   first answer lands (`Status: in_progress`; `completed` when the short grill closes;
   while it is in progress, an answer that keeps a decision is noted as a line
   `Kept: PD3 — <the reason in a few words>` under the header, so a resume does not ask
   it again, and the `Kept:` lines are removed when it closes)
   and comment its path on the part's issue as task-flow step 3 does
   (`PRD in progress: <path>`), so a stop resumes this grill instead of starting another:

   ```markdown
   ---
   Status: completed
   Topic: <feature> — Part <k>: <slice>
   Date: <YYYY-MM-DD>
   ---

   # PRD — <feature>, Part <k>

   Feature PRD: `<the feature PRD>` — PD2, PD5

   The feature line above names the feature's decisions this part owes (step 1); this
   file holds Part <k>'s own.

   ## Decisions

   - **PD<k>01 — <decision area>**: <the decision> — decided by the requester at the
     grill of Part <k>; discarded: <the alternative>.
     - Looked: <the file and line read, or the command run and the output lines that
       show the answer>
     - Spike: <what was tried> → <what came out>

   ## Assumptions

   - <statement> — <the decision that rests on it, by its id> — unchecked: <why> — to
     check: <how>
   ```

   The `Looked:` and `Spike:` lines are written only for a decision a look or a spike
   served, and `## Assumptions` only when something stays unchecked at the close (a spike
   not taken or left unanswered, a system that does not exist yet).

   Its decisions number from `PD<k>01` (Part 2: `PD201`, `PD202`…, `PD210` after
   `PD209`; Part 12: `PD1201`), so a number names one decision across the whole
   feature; the validator goes red on a part PRD declaring a number its feature PRD has,
   or a number outside its own `PD<k>nn`. A sibling part's decision may be cited
   (`PD101`); it is that part's, never owed here. A decision the requester keeps is
   not copied: it stays the feature PRD's. A feature decision changed for this part only
   is a part decision naming the one it supersedes here (`supersedes PD3 for this part`);
   a change of the feature is an amendment of the feature PRD (§A contract change from a part).
   With no decision of its own, the file holds its header and, in place of
   `## Decisions`, the line `Nothing left open for this part: the feature PRD decides.`

The part PRD's header line is how every reader finds the feature PRD: a PRD that links
one is read with it, the feature PRD scoped by the plan's feature line plus its
`## Cross-cutting decisions`. A decision added later — at the gate before code, or by a
discovery — goes to the part PRD, as its next free `PD<k>nn` (`PD203` after `PD202`), never to the feature PRD — except a contract change, which goes there as a dated amendment (§A contract change from a part).

## A contract change from a part

A part's short grill, its gate before code, or a discovery can change a decision the
part does not own: a feature `PD<n>` (one its row names, or a cross-cutting one), or an
earlier part's `PD<j>nn`. When the requester's answer does, **propose the route inside the
same question**, with its reason, and let them confirm it or flip it — never a separate
question:

- **A change of the feature** when another part's row names the decision (merged or
  not), when it is cross-cutting (it binds every part), or when it changes what the
  feature PRD promises — and, for an earlier part's decision, when a third part's PRD
  cites it: _"this changes what Part 3 consumes (PD6 is on its row), so I'd
  make it a change of the feature: amended in the feature PRD, Part 1's merged code
  adapted here, #<id> told — or only for this part?"_
- **For this part only** otherwise: a part decision in this part's PRD naming what it
  supersedes — `supersedes PD3 for this part` for a feature decision,
  `supersedes PD201 (Part 2)` for an earlier part's. That earlier part's PRD gains, at the
  end of the superseded decision's line, `— superseded by PD302 (<YYYY-MM-DD>)`, and nothing
  else (its `Status` neither): it stays that part's record. This part adapts the earlier
  part's merged code, a plan change the gate shows. An earlier part not merged yet (a
  stacked start) gets the suffix all the same, on this part's branch, never on its own:
  it lands with this part's merge.

**A change of the feature**, once confirmed, on this part's branch:

1. **The amendment** — in the feature PRD, a plain decision bullet with its next free
   number (one above its highest `PD<n>`; a part's `PD<k>nn` are not the feature's), in
   the **same section** as the decision it supersedes, at that section's end — so an
   amended cross-cutting decision stays under `## Cross-cutting decisions` and keeps
   binding every part:

   ```markdown
   - **PD17 — <decision area>** (amended <YYYY-MM-DD>, grill of Part <k>, #<id>): <the decision> — supersedes PD6.
   ```

   The superseded line is never rewritten: it only gains `— superseded by PD17 (<YYYY-MM-DD>)`
   at its end (an earlier part's `PD<j>nn`, in its own part PRD). The amendment has no
   `discarded:` — the decision it supersedes is what it discards. Commit it with the part
   PRD. Two parts amending at once can take the same number: the validator's duplicate
   check or the merge conflict shows it, and the part that merges second renumbers its amendment (and its own row, `supersede --from=PD17 --to=PD18 --part=<k>`) before its merge, appending a new `Amended` line with the new number — the old line stays, and the closeout skips it because the default branch's feature PRD never declares that number superseding that decision. A Part 1 whose docs PR is still open (a cut at the gate before code) gets that PR merged first (§A cut at the gate before code).

2. **This part's row** — through §Editing the plan and child bodies. When this part's
   row names the superseded decision, run
   `supersede --from=PD6 --to=PD17 --part=<k>` on it. Then `amend`, with one of two
   lines — the closeout reads which:
   - some row names the decision (this part's or another's):
     `PD6 superseded by PD17 (Part <k>, #<id>): <what changed>; the other rows follow at Part <k>'s merge.`
   - no row names it (a cross-cutting decision, an earlier part's, or a parent with no
     `Decisions` column):
     `PD6 superseded by PD17 (Part <k>, #<id>): <what changed>; no row names it.`

   The requester's confirmation is the OK this change of the plan needs. Then the feature
   line follows the row (§Children).

3. **Merged code** that no longer meets the amended contract is adapted by this part, a
   plan change the gate shows; when that is large, it becomes a new part and the cut is
   amended (the human's change, as any amendment).
4. **The parts in flight** — each open part whose row names the superseded decision
   (every open part, for a cross-cutting one) — get a comment on their issue at once:
   _"PD6 becomes PD17 (<what changed>), with PR #<pr> of Part <k>. Your feature line follows
   the row once that PR merges."_ The comment is for the humans: an agent follows the
   parent's rows, which change at the merge (step 6), never the comment. A part not yet
   started reads the default branch when it is picked up.
5. **At this part's merge gate**, before the merge: bring in the default branch, re-read
   the parent, and look for a part merged since the confirmation whose row names the
   superseded decision (every part merged since, for a cross-cutting one) and whose code
   step 3 did not adapt. One found → adapt it as a plan change (back to the Implementer,
   then the review) before the merge.
6. **At this part's closeout** ([`task-closeout`](.claude/skills/task-closeout/SKILL.md),
   after its own row's tick), for each `Amended` line of step 2's first kind (some row names it) whose new decision the feature PRD on the default branch declares as superseding its old one (`PD17 — … supersedes PD6.`):
   `supersede --from=PD6 --to=PD17` without `--part`, so every row that still names the
   old decision names the new one. Each part then rewrites its feature line at its next
   boundary, after bringing in the default branch (§Children: the feature line follows
   the row). A merge whose closeout runs late only delays this; the parts' lines stay
   valid meanwhile.

A PR that closes without merging takes its amendment with it: put the part's own row back
(`supersede --from=PD17 --to=PD6 --part=<k>`, when step 2 ran it), `amend` with
`PD17 did not land (Part <k>, PR #<pr> closed): PD6 stands.`, and comment on the parts
that were told. A later closeout of this part finds no `PD17 — … supersedes PD6.` on the default branch's feature PRD and leaves the rows as they are.

## Starting the next part: re-validate the cut

At each part's start, **before** opening its issue, re-read the parent and check the cut **against the current base** (cheap): do the remaining
slices still merge independently? Did an earlier part absorb or obsolete a later
slice? Did a review move the seam? The cut holds → open the part. It doesn't →
present the amendment to the human — the plan is theirs, changing it needs their
OK — and only then edit the parent (`amend`, and `set-row`/`add-row` for the `## Status` rows). What
can be invalidated is the **plan**; the per-part plans don't exist yet.

## Chain start modes — part k+1 while part k is unmerged

When the next part's dependency k is at **`in-review`** (its PR open — e.g. waiting on
another human's merge), the human chooses how to start — ask, don't assume. An earlier k
(`pending`, `planning`, `plan-ready`, `in-progress`) has nothing to stack on: there is nothing to start;
offer to resume it (`/resume #<k-id>`) in this session. A k already merged
(closeout parked or not — confirm on GitHub) makes k+1 an ordinary sequential part.

- **Sequential post-merge** (the safe default): part k+1 starts when part k is in the
  default branch. Nothing special.
- **Stacked start** (an explicit human choice, with **the assumption named at choice
  time**: stacking bets that part k lands substantially as-is — if k's review forces
  big changes, k+1 is built on sand; the developer takes that bet informed):
  - branch from **k's head**:
    `git fetch && git checkout -b harness/<id>-<slug> origin/harness/<k-id>-<k-slug>`;
  - the part's short grill and plan are made against the effective base = k's head;
  - at the review step, while k is still unmerged, the PR targets **k's branch as base**
    — `gh pr create --base harness/<k-id>-<k-slug>` — and the Reviewer is handed **that
    base** for its stale-approve record (the record's base is the PR's base **at review
    time**; a later base change is not by itself a content change — the landing move
    below); if k
    has merged by then, do the landing move below first and open the PR against the
    default branch as usual (`gh pr create --base` on a deleted branch fails);
  - updates from k flow by **merging in, never rebasing** — a rebase needs a force-push on
    a task branch (human-gated by house rules); merge is uglier history but safe. While k
    is unmerged the source is `origin/harness/<k-id>-<k-slug>`. The merge-in is **your**
    move at a checkpoint boundary (or the Implementer's on re-invoke, named in the spawn
    prompt), never inside a staging save-point; under auto-commit OFF it goes right
    after a checkpoint OK commit;
  - record it in the child's trace line (`stacked — assumes it lands as-is`) and the
    parent row (`→ #<id> pending (stacked on #<k-id>)` — the status at opening,
    as every row).

  **The landing move — once k is merged (confirmed on GitHub, never inferred from the PR
  base), at the next boundary the merge-in rule above allows:** (1) if k+1's PR still
  targets `harness/<k-id>-…`, **retarget it
  yourself** — `gh pr edit <pr> --base <default>` (the platform's automatic retarget
  fires only when k's branch is deleted, whenever that happens — at k's closeout finalize,
  or at once if the human merged with auto-delete; do not depend on it either way); (2)
  `git fetch && git merge origin/<default>` into k+1 and push — the executor squashes, so
  k's commits are not ancestors of the default branch and without this merge-in k+1's
  merge-base is the old fork point and the stale-approve guard sees k's content as
  unreviewed; k's squashed changes reconcile as identical hunks; (3) update the child's
  trace line to `Depends on #<k-id> (merged)` (`issue-body set-depends --on=<k-id>`). Do this **before** the (re-)review whenever
  k has already merged, so review and gate share a base. The merge-in is an
  **update-branch**: a standing APPROVE stays valid unless the PR's own diff against the
  new base changed (a hand-resolved conflict touched k+1's hunks) — then route to
  re-review; otherwise run the executor and let its stale-approve guard arbitrate.

  **Merge-gate invariant: a part reaches its merge gate only when its PR base is the
  default branch.** Before surfacing the gate of a stacked child — live, or on a
  `/resume` of an `in-review` one — check `gh pr view <pr> --json baseRefName`. Base still
  `harness/<k-id>-…` and k unmerged → k+1 **waits at `in-review`**, and say so to the
  human: _"Part k+1 is approved but stacked on #<k-id>, still unmerged — it waits; don't
  merge it in the GitHub UI, its base is k's branch"_ (the rule binds your merge; the
  human's click needs the warning). Never merge a part into a sibling's branch: the code
  would never reach the default branch, `Closes #<id>` would not fire, and closeout would
  archive a task that never landed. k merged → the landing move above, then surface the
  gate. If the human merged k+1 into k's branch anyway, it lands only through k's PR:
  `/resume` closes it out once k's PR merges into the default branch, and until then
  says it waits (the orchestrator's RESUME, task-PR gate).

  If k's review does force big changes, surface it at once — the human decides:
  rework k+1 on the new k, wait, or drop it.

## The discovery safety net

The primary split happens at the PRD → task transition, where no artifacts exist yet
to restructure. The safety net is the existing discovery machinery: when an
**Implementer** (mid-flight) finds the scope hides **≥2 independently mergeable units
the PRD didn't reveal**, that is a legitimate discovery — raised with [`raise-discovery`](.claude/skills/raise-discovery/SKILL.md) as
**T2 UNSPECIFIED_DECISION** (the plan is silent on the cut; partition or keep-together is
the human's call; the Planner lists such units under `## Before code` instead, and
the task flow's gate before code offers the cut) and mediated with [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md)
as any other (the Orchestrator's §"Discovery mediation"). On **"keep together"**: record
the resolution and resume. On **"partition"**, the current task keeps its **first** unit
(and, on Keep, every unit later-unit work already builds).
**Ask the second half in the same mediation**: later-unit work already on the branch
(commits; under auto-commit OFF, staged save-points) — keep it or drop it? Name the
commits. Keep means the units that work builds stay in this task: the narrowing keeps
their tasks, and only the units no work has started leave it. Drop means every later
unit leaves. (A second fork that only exists because of the first answer: record it in the
same `**Resolution**` block, no second entry.) Then route the narrowing to the Planner, owner of `tasks.md` ([`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md) step 3,
with the decision); it re-runs [`plan-to-issue`](.claude/skills/plan-to-issue/SKILL.md)'s plan block on the task's own issue (not the parent's `## Plan`), which keeps the
issue's trace lines. In step-by-step mode the narrowed `tasks.md` is re-presented at the
next checkpoint — no new gate. The Implementer re-invoke carries the keep/drop answer —
it performs the `git revert`s by commit (never a force-push), or discards the staged
later-unit changes under auto-commit OFF — and resumes on the narrowed slice. What
becomes of the rest depends on the task:

On a **part of a cut feature**, "partition" means the part is bigger than its row: keep
it on the narrowed slice (the narrowing above, handed the parent row too) and present the rest as an amendment
of its parent, never as `/spinoff` stubs beside the cut. It reshapes rows, so it takes
the human-change path of §Editing the plan and child bodies (the whole new plan body,
a diff, the requester's OK): this part's row narrowed, and a `## Plan` row per new part
with its slice, its `Depends on` and its `Decisions` (the feature decisions that move
with it), plus its `## Status` line; then "the feature line follows the row" for this
part. A decision of this part's PRD that only the moved unit builds is marked
`moved to Part <j>` there and is restated in Part `<j>`'s PRD at its short grill, as its
own `PD<j>nn` naming the one it restates. The new rows open at their turn, as every part.

On any other task "partition" means the task was routed too small: keep it on the
narrowed slice (the narrowing above) and capture the rest as `/spinoff` stubs (or a `/define` when it is a real feature); **no parent is
opened**: a task already being implemented is never cut into parts, which only open from
a grill's close or from the gate before code of a task with a PRD (§A cut at the gate
before code). Never partition silently from
inside a task.

## RESUME and ORIENT on a partition parent

The queue listing `/resume` runs with no args includes
`gh issue list -l harness:partition-plan`. **First, the feature PRD**: no part starts
before it is on the default branch (§The feature PRD and its docs PR), and git, not the
parent's body, says whether it is. Read the path on the parent's `PRD:` line and look for
it on the default branch (`git fetch && git cat-file -e origin/<default>:<the PRD path>`).
**Present** → go on below (and delete a local `harness/prd-<parent>` left behind; when the
checkout is on it, check out `<default>` first). **Absent** → look for its docs PR
(`gh pr view harness/prd-<parent> --json state,url`):

- **open** → the parent surfaces as **"partition waiting — the feature PRD is in PR #<pr>,
  not merged yet"**, and resuming it asks the docs PR's merge question (§The feature PRD
  and its docs PR), then the close (§The close of a feature define) once it is merged —
  unless Part 1's row already names its issue (`→ #<id>`: a cut at the gate before code), when only the merge question is asked and, until it is merged, only Part 1 is resumed (`/resume #<id>`) — no later part starts;
- **merged** → the PRD was renamed or moved: say so, and ask the human for its path (then
  fix the parent's `PRD:` line through the human-change path of §Editing the plan and
  child bodies);
- **closed unmerged** → say so and ask the human (reopen it, or drop the feature);
- **no such PR** → read the parent's `## Plan`. Without a `Decisions` column it is a
  parent whose PRD rides on Part 1's branch (one from before the docs PR existed, or one
  cut by a mid-implementation discovery on a 0.11.x spec task): go on below, as before. With one, the define stopped
  before its docs PR was opened: the parent surfaces as **"partition waiting — the feature
  PRD has no PR yet"**, and resuming it opens the docs PR (§The feature PRD and its docs
  PR: it finds a branch already pushed, or a local one holding the PRD; otherwise the PRD
  file must be in this working tree — when it is not, say the feature PRD is missing and
  ask the human where it is). When Part 1's row already names its issue (a cut at the gate
  before code), open it with §A cut at the gate before code's recipe from Part 1's branch
  and ask only its merge question.

An open parent with unticked rows
surfaces as **"partition in progress: next part per the plan — Part <k>: <slice>"**, or
as **"partition in progress — waiting on #<id> (Part <j>)"** when the next row is blocked
by an in-flight child (add `, in-review — stacked start possible` when that child's PR is
open). The next part is the first row still **`(not started)`** whose
`Depends on` parts are merged — confirmed on GitHub, not from the row
(`gh issue view <id> --json state` and the child's PR, recovered from its branch
`harness/<id>-*`) — or at `in-review`, when the human takes a stacked start (above). A
row carrying `→ #<id>` is an **in-flight child, never re-opened**: it resumes **as today**
by its own id — offer to resume it (`/resume #<id>`) in this session; the parent is only
the map. If that child's issue is closed and its PR merged, the row missed its closeout
tick: if its
closeout never finished (any status label but `done` — even `in-progress`, when the
human merged during rework) run
[`task-closeout`](.claude/skills/task-closeout/SKILL.md) for it first — retry-safe, it picks up a half-done closeout where it
stopped, and ticks the row itself; otherwise tick it now (`set-row --merged`) (and close
the parent if that was the last row) and move on. **No eligible row → nothing to start
from the parent**: say so, name the blocking child,
offer to resume it. Resuming the parent itself means **starting the next part**
(§Children: the re-validation, its issue, its short grill, then the task flow).

## Closing the parent

- **Mechanical, at the last child's closeout.** [`task-closeout`](.claude/skills/task-closeout/SKILL.md)'s finalize step, on
  a task whose body carries `Part <k> of #<parent>`, ticks that row and — when every row
  is ticked, merged or dropped — closes the parent with a summary comment. No human
  prompt: each merge already passed the human gate. The skill owns the mechanics
  (`issue-body set-row`, idempotent on a retried finalize, closed-parent no-op).
- **Partial abandonment — a human close.** When the human drops the remaining
  parts, mark their rows dropped and close the parent yourself recording what shipped
  and what was dropped and why
  (`gh issue close <parent> --comment "Shipped: parts … · Dropped: parts … — <why>"`).
  Unopened rows cost nothing. An opened-but-unmerged child that is dropped is closed
  like any abandoned task: close its issue with a comment recording the drop, delete
  its branch, no closeout (there is nothing merged to record).

## Human touchpoints — zero new gate machinery

1. **Partition approval** — one more question at the define's close (cuts, dependency
   shape, each part's decisions); the same one question when the requester asked for the
   cut, with no look before it, or at a task's gate before code.
2. **The feature PRD's merge** — the docs PR's merge question, then the close (Part 1
   now, or stop here).
3. **The short grill and the gate before code per child** — at each child's turn
   (§The short grill of a part; the task flow's gate).
4. **Stacked-start choice** — with the assumption named.
5. **Plan amendments** — re-validation or discovery → presented, human approves.
6. **Abandonment / parent close** — human; the mechanical close rides the last
   merge gate.
7. **Merge gates per child** — unchanged.
