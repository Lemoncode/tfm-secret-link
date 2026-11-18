---
name: task-closeout
description: 🍋 Close out a finished task — record it in history.md, archive the task plan + discoveries, activate the Architect for durable capture (ADRs, the architecture map, conventions), and finalize via a dedicated closeout PR. Use when the Orchestrator finalizes an approved+merged task, mentions "closeout", "close the task", or "wrap up the issue".
origin: vendor
vendor_version: '0.12.0'
invoked-by: [orchestrator]
---

# Task Closeout

## Core Principle

Closeout is **archive-on-done through a dedicated PR**. The durable memory of
a finished task — its plan and its resolved discoveries — is **archived live**, not
deleted, so a future agent reads the decisions instead of doing git archaeology. The
genuinely architectural decisions rise further, to ADRs. And the closeout record reaches
the base branch **only through a PR**, never a direct push — the same branch isolation
every other change obeys.

Three moves, in this order:

1. **Activate the Architect** — closeout is its reliable end-of-task checkpoint.
   In cold blood, no resume pressure, it drives durable capture: [`write-adr`](.claude/skills/write-adr/SKILL.md) (HITL offer
   per resolved discovery), [`update-architecture`](.claude/skills/update-architecture/SKILL.md) (automatic, when the map exists), and
   the convention capture (prepared by the Architect, approved by the human). The canon
   outlives any task folder.
2. **Archive, don't delete** — `git mv` the plan + `discoveries.md` (+ `external-effects.md`) into
   `_archive/<id>/`; drop `progress.md` and the review ledgers (scratch: the review's verdict is on the issue). The high-value memory stays
   live and grep-able.
3. **Land via a PR** — the `history.md` append, the archival move, and any new ADR or convention change ride a
   dedicated `harness/closeout-<id>` PR that self-merges **only on green checks**
   (through `.claude/hooks/lib/merge-pr.sh`). No direct push to the base.

Run this only when the **Reviewer has approved** and the task PR is merged. The merge is a
human decision (the merge gate) — closeout never merges the task; it **confirms** the
merge, then records it.

## Preconditions

- **The task is not a 0.11.x spec task.** A task dir that holds `spec/`
  (`test -d .claude/state/tasks/<id>/spec`) is one, and this version does not close it out.
  Stop here, before step 1, and write nothing (no branch, no `history.md` line, no label):
  tell the human it is finished on the version it started with, closeout included
  (`lemony doctor` prints how to go back to it).
- The Reviewer posted an explicit approval (the task passed `in-review`) — or the human
  merged before it did (a `/resume` that finds the task PR merged): the human's merge,
  confirmed below, stands in for it.
- **The task PR is merged — confirmed against GitHub, not the conversation.**
  `gh pr view <pr> --json state,mergedAt,baseRefName` must report `"state": "MERGED"`
  **into the default branch** — or into a stacked partition sibling's branch whose own PR
  then merged into the default branch (it landed through it); merged into a sibling's
  branch that has not landed → stop and say so (`.claude/agents/partition.md`) — regardless of
  how it was merged (GitHub UI, CLI, or the Orchestrator running `gh pr merge` after the
  human authorized it). If it is not `MERGED`, stop — the task stays at `in-review`
  until the human merges.
- **The task's PRD is `Status: completed`** — [`grill-with-docs`](.claude/skills/grill-with-docs/SKILL.md)
  normally sets this when the grill closed (a short PRD is written `completed`); if it's
  still `in_progress`, flip it now and `git add` it, so it rides the closeout commit
  (step 5 commits only what is staged). (This is the latest point the PRD can be marked
  done.) The task's PRD is the one its plan links — the `` > PRD: `<path>` `` line
  of `plan/tasks.md`, read before step 4 archives it, or `progress.md`'s `PRD:` line —
  and `> PRD: none` has none to mark. A part of a cut feature marks its part PRD, never
  the feature PRD its `> Feature PRD:` line links: that one stays as the feature grill
  closed it, and the feature ends when the parent closes. An architecture-drift task, or a task
  triaged on 0.11.x, before tasks had a `plan/tasks.md`, has no PRD and skips this; every task
  that has a `plan/tasks.md` still has it archived below.
- **No discovery is left open.** If `discoveries.md` exists, every entry must carry a
  resolved `**Resolution**` block (`Decision` / `Resumed at` filled) and no
  `harness:discovery:*` label may remain on the issue. An unresolved discovery means a
  sub-agent is still paused — run [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md) before closing out.
- **The `harness:status:closeout-pending` label exists on the remote.** `install` /
  `update` / `repair` create it during label sync; an install that predates this label
  needs one `lemony repair` first, or the park step's label flip will fail.

## Why post-merge (don't archive early)

Archival is **destructive** and must wait until the task PR is merged. Until that merge,
the task can re-enter iteration — a Reviewer rejection, or human review comments at the
gate — and that re-work needs the plan **live** in `tasks/<id>/plan/`. Archiving
pre-merge would pull the plan out from under an in-flight fix. So every step below runs
**after** the merge is confirmed.

## Process

Closeout runs **on the default branch, after the merge** — the task PR brought the
branch (plan + code) onto it. Land there first so the closeout branch forks from the
merged base: `git checkout <default> && git pull`.

**A closeout is retry-safe: re-running this skill from the top is how a half-done one
resumes.** A session can end at any step, and `/resume` only says "run `task-closeout`".
So before step 1, find how far an earlier run got, and every step below skips the
effect it finds already done:

1. **The record PR** — `gh pr view harness/closeout-<id> --json state` (a branch name
   resolves the PR even once the branch is deleted). `MERGED` → go to step 6. `OPEN` →
   check out the branch and go to step 5's executor line. `CLOSED` (closed unmerged —
   someone rejected the record) → stop and ask the human: redo the record (on their
   yes, delete the old branch with `git push origin --delete harness/closeout-<id>` and
   `git branch -D harness/closeout-<id>`, then continue at item 2 — not the top: the
   closed PR still answers to the branch name until a new one exists) or
   finish it by hand; never reopen or recreate it on your own. No PR (the error says
   `no pull requests found`) → continue. Any other error (auth, network) → stop and
   say so: guessing "no PR" would open a second record.
2. **The record branch** — if `harness/closeout-<id>` exists locally
   (`git branch --list harness/closeout-<id>`) or on origin
   (`git ls-remote --heads origin harness/closeout-<id>`), check it out now, before
   step 1 (`git fetch origin harness/closeout-<id>` first; when both exist, bring the
   local one up to origin's with `git pull --ff-only`, and stop and ask if they
   diverged), so the re-run sees what the earlier run already wrote — when the checkout
   refuses because of local changes (a Resolution recorded on the base), `git stash`,
   check out, `git stash pop` (a conflicting pop: stop and ask — the stash is kept).
   Otherwise stay on the base.

### 1. Activate the Architect for durable capture

Closeout is the Architect's **reliable activation point**: in cold blood, after
the merge, with no paused sub-agent pulling toward "just unblock me", it drives the three
durable-capture skills the on-demand triggers otherwise lose. Each one **no-ops cleanly
when its skill isn't installed**, so this step is safe everywhere.

The three differ in **who decides** — and the asymmetry is deliberate:

- **[`write-adr`](.claude/skills/write-adr/SKILL.md) — HITL offer, per resolved discovery.** Walk the **resolved** entries in
  `discoveries.md` and **offer** the ones that settled a real decision (not a trivial
  clarification) as candidate ADRs, then dispatch the **Architect** ([`write-adr`](.claude/skills/write-adr/SKILL.md), fresh
  context) on the ones the human accepts. A yes accepts an offer when it names it, or
  when the message asked about nothing else: a yes that names no item, given to a message
  that also shows prepared conventions, approves those and not the ADR. Offer liberally
  — closeout does **not** apply the ADR criterion itself; the Architect owns the three tests (hard to reverse /
  surprising without context / a real trade-off) and **declines** the ones that fail, so
  a generous offer costs only a "no". If there are no resolved discoveries, or none
  qualify, skip — never pad the canon with reversible or obvious decisions. An ADR is
  **net-new canon**: the human curates what enters, so it stays an offer. An Architect
  that reports a **clash** with a live ADR or convention wrote nothing: run the clash loop
  in `.claude/agents/orchestrator.md` §"Architect (on-demand)" — everything it lands
  rides this same closeout PR.

- **[`update-architecture`](.claude/skills/update-architecture/SKILL.md) — automatic dispatch, no pre-offer.** Only when
  `docs/architecture.md` exists (the skill installs solely then). Dispatch the
  **Architect** ([`update-architecture`](.claude/skills/update-architecture/SKILL.md), fresh context) with the task's **PR number**
  (it runs `gh pr diff <pr>` itself). The Architect reads the change, makes
  the smallest true edit if the system's **shape** moved (referencing any ADR just
  written — `see ADR-NNNN`), or reports **no-op** when nothing architectural changed.
  There is **no human prompt here**: the map must _track reality_, not be curated, and the
  edit is reviewed in the closeout PR diff like any other change. Run this **after**
  [`write-adr`](.claude/skills/write-adr/SKILL.md) so the map can cite the new ADR numbers.

- **Capture what the task taught — the Architect prepares it, the human approves it
  here.** Closeout is the one moment the conversation still holds what this task
  taught: afterwards nobody knows what was corrected. A convention is curated canon,
  so nothing lands without the human's yes. Six moves, in this order:
  - **What an earlier run left.** A capture cut before it landed is each directory this
    names:
    `grep -rl --include=plan.md '^# Convention capture — task #<id>$' .lemony/import 2>/dev/null`
    Its staged files were prepared against the rules as they stood then, so they are
    not what lands: the Prepare move hands that directory to the Architect, which
    prepares its items again and removes it.
  - **What there is to capture.** Two sources, and a session that did not run the task
    knows neither: it has only what an earlier run left. What a
    `T6 CONVENTION_CONFLICT` already routed mid-task is not captured again.
    - A _how_ the human corrected in this task: a review comment, a `changes` at a
      checkpoint or an answer at a gate that changed the way something is built, not
      what is built. It is prepared without asking: they already decided it.
    - A way of building you saw and would recommend recording: one this task's code
      follows that the next task in the same area would have to follow, and that no
      rule or client skill states. It is asked first, in one line of the message below,
      and prepared on their yes. One you would not recommend is not mentioned.

    With nothing from either and nothing left by an earlier run, the capture ends here.

  - **Prepare.** With a correction, or a directory an earlier run left, dispatch the
    **Architect** (fresh context) with [`convention-iterate`](.claude/skills/convention-iterate/SKILL.md), its
    section "Prepare a change for the human's approval", handing it the task's id and
    each item (the human's words, and the file that shows it), or the directory an
    earlier run left in their place. It stages the change (a
    new rule, lines added to or changed in a live one, a client skill) in one directory
    under `.lemony/import/` (`<dir>`), writes nothing to the project, and returns
    `<dir>` with each item as its `plan.md` holds it, or no directory when it staged
    nothing.
  - **Show it** in the human's language, written for a person, who stops reading a long
    message: the agents read the staged text, the human reads this. One block per staged
    item, from its `plan.md` lines:

    ```markdown
    <n>. <From your correction | The pattern you asked for> (prepared)

    - What: <its What lines>
    - Where: <its Where line>
    - Seen in: `<path>`

    Approve it, change something, or discard it?
    ```

    When its "Other way" line counts files, the block has one more line before the
    question:

    ```markdown
    - Note: <k> files still do it the other way (for example `<path>`). Open a task to bring them in line?
    ```

    A pattern you saw goes after the blocks, one line each:
    `Seen by me: <the way of building, and what recording it would save>. Prepare it?`
    An item the Architect did not stage is one line too, with its reason (a live rule
    already says it, it holds only for this task, its rule has no room left, it takes a
    decision of its own outside the closeout), and nothing to approve. Then wait.

  - **Take the answer**, item by item. Every further dispatch of the Architect is under
    the same section, with the task's id and with `<dir>` once there is one, so nothing
    lands from it:
    - **Approve** → the item stays staged.
    - **Change something** → dispatch the Architect with the change in the human's
      words, and show the item's new block; a change its rule has no room for is not
      made, so say so and ask about the item as it was.
    - **Discard** → dispatch the Architect to take the item out.
    - **Yes to a pattern** → dispatch the Architect with your sentence and the file
      that shows it, and show its block: one more stop, for that item.

    A yes that names no item approves every prepared one, and only those: an ADR offered
    in the same message is accepted only by name. What the answer does not
    settle is not done: an item with no answer is taken out as a discard and named in
    step 7's report, and a task or a pattern with no yes is not opened or prepared.
    When the Architect reports nothing left staged, there is nothing to land.

  - **Land it** once every item still staged is approved, and stage what it wrote in
    the same call:

    ```bash
    .claude/hooks/lib/lemony.sh rules apply --staged=<dir> && for d in .claude/rules .claude/skills docs/reference; do [ ! -e "$d" ] || git add -A -- "$d"; done
    ```

    It removes `<dir>`. On a non-zero exit, show its message and stop the closeout
    here, before step 2, leaving `<dir>` and whatever it wrote as they are: that state
    is the human's to look at. Then open each task the human asked for, one per item
    with a Note, naming the rule's path, how many files and the two examples; write the title and the body in single quotes, with no single
    quote inside them (in double quotes the shell would run a backticked word):
    `.claude/hooks/lib/lemony.sh spinoff --title='<what to bring in line>' --body='<the rule, the files>' --parent=<id>`

Any artifact written — an ADR, the architecture edit, a convention — lands in the
working tree and rides the closeout PR below: `git add` each path the Architect reports
as soon as it reports it, so a closeout cut short and run again still commits it in
step 5. A convention's paths are staged by the call that lands them.

On a re-run (the record branch checked out above), the earlier run's artifacts are
already there: don't re-offer an ADR for a discovery that already has one on the
branch, the map edit re-runs as a no-op, and the convention capture starts from its
first move, which finds what an earlier run left prepared; what it already landed is
live, and the Architect reports it as stated.

### 2. Branch for the record

```bash
git checkout -b harness/closeout-<id>
```

Skip this when the record branch is already checked out (a re-run). All of closeout's
writes go on this branch — nothing touches the base directly.

### 3. Append one line to `history.md`

`.claude/state/history.md` is the append-only, committed changelog — one entry per
finished task. Add the task with whatever metrics you actually have:

```markdown
## #<id> — <topic> (<start-date> → <end-date>)

Cycle: <h> | Iter: <review rounds> | Bugs 14d: <n/a until measured>
```

Record only metrics you can back up. Rich telemetry (tokens, post-merge bugs) is
populated once the telemetry/event machinery is authored in a later phase; until
then, leave those as `n/a` rather than inventing numbers.

Skip the append when `history.md` already has a `## #<id> —` heading: an earlier run
of this closeout wrote it. Either way, then stage it (`git add .claude/state/history.md`):
step 5 commits only what is staged, and an unstaged entry would leave the record out.

### 4. Archive the plan + discoveries; drop the scratch

Move the durable memory into the archive and remove only the ephemeral scratch. The
existence guards keep this **idempotent** — a retried closeout (e.g. crash mid-run) that
already archived skips the move rather than erroring on an existing destination:

```bash
# A task dir that holds spec/ is a 0.11.x spec task, finished on the version it started
# with (Preconditions). Stop before the removal below drops its spec unarchived.
if [ -d .claude/state/tasks/<id>/spec ]; then
  echo "tasks/<id>/ holds a 0.11.x spec/: finish this task on the version it started with (lemony doctor says how)" >&2
  exit 1
fi
mkdir -p .claude/state/tasks/_archive/<id>
# Move the durables only if not already archived (retry-safe):
if [ -d .claude/state/tasks/<id>/plan ]; then
  git mv .claude/state/tasks/<id>/plan .claude/state/tasks/_archive/<id>/plan
fi
# discoveries.md only exists if the task raised one — move it conditionally:
if [ -f .claude/state/tasks/<id>/discoveries.md ]; then
  # Stage first: a Resolution recorded after the merge must ride the move.
  git add .claude/state/tasks/<id>/discoveries.md
  git mv .claude/state/tasks/<id>/discoveries.md .claude/state/tasks/_archive/<id>/discoveries.md
fi
# external-effects.md only exists if a review found one (the human's answers to them):
if [ -f .claude/state/tasks/<id>/external-effects.md ]; then
  git add .claude/state/tasks/<id>/external-effects.md
  git mv .claude/state/tasks/<id>/external-effects.md .claude/state/tasks/_archive/<id>/external-effects.md
fi
# Drop everything that remains under tasks/<id>/ — progress.md plus any straggler an
# Implementer left. --ignore-unmatch: a re-run finds nothing tracked left there.
git rm -r -q --ignore-unmatch .claude/state/tasks/<id>/
```

The first check backs up the Preconditions' stop: on a task dir that holds `spec/` the recipe
exits before touching anything. When it fires, stop the closeout there, commit and push
nothing, and tell the human what it printed, that the local branch `harness/closeout-<id>`
must be deleted before the task is closed out on its own version, and what the Preconditions
and steps 1 and 3 left staged (a PRD's status flip, the `history.md` line, any Architect
artifact): theirs to keep for that closeout or to drop.

An architecture-drift task has no `plan/`: the `plan/` guard skips the move, and only
`discoveries.md` (if the task raised one) is archived. Any other task's `plan/` holds its
plan, `tasks.md` (and `ui-handoff.md` when it touched UI), and is archived whole. When an earlier run already
removed `tasks/<id>/`, `--ignore-unmatch` makes the `git rm` a no-op.

`plan/`, `discoveries.md` and `external-effects.md` (the human's answers to the external
effects the reviews found: the orchestrator's §"External effects") survive **live** under
`_archive/<id>/` (grep-able), plus in git history and the GitHub issue. `progress.md` (the pause-point bitácora) and any other
working scratch are gone. A UI task's **`ui-handoff.md`** is a sibling **inside**
`plan/`, so the single `git mv` of `plan/` archives it with the rest — no special
handling.

### 5. Open the closeout PR and self-merge on green

Commit the record, push the branch, open a PR, and self-merge it **through the
checks-precondition executor** — never a bare `gh pr merge`. There is no standing human
authorization on this path, so the precondition stands alone: **the executor merges
only on green; every other outcome takes one of the exits below** (some end in a
human's informed decision — what never happens is an autonomous merge on not-green).
The executor verifies the check status the platform reports for
the PR, waiting — bounded (`merge.checks_timeout_secs`, default ~10 min) — for pending
checks:

```bash
git commit -m "closeout(<id>): archive task state, record in history.md"
git push -u origin harness/closeout-<id>
gh pr create --base <default> --head harness/closeout-<id> \
  --title "closeout(<id>): <topic>" --body "Closeout record for #<id>."
.claude/hooks/lib/merge-pr.sh harness/closeout-<id> --squash --delete-branch
```

On a re-run, skip what is already done: no commit when an earlier run already committed
the record and this one wrote nothing new, and no `gh pr create` when the PR exists — the
preamble's `OPEN` jumps straight to the `merge-pr.sh` line. `git push` is safe to repeat.

(If the human recorded a standing merge answer at this task's merge gate — a
`merge.allow_no_checks: true` line sitting uncommitted in `harness.config.yml` —
stage it into the record commit above: the answer rides the closeout PR to the base.)

The closeout PR **must not** carry `Closes #<id>` — the task PR already auto-closed the
issue on merge; closeout only flips the label and finalizes.

Act on the executor's exit code:

- **0 — merged.** Continue to step 6 (finalize).
- **10 — checks red.** Red does **not** automatically mean the base is broken — look at
  what failed (`gh run view` / the check's output), then take one of three exits:
  1. **Failure in the closeout's own files** (format/lint on the moved docs): fixable
     by you alone — run the formatter, commit, push, re-run the executor; green ⇒
     self-merge normally. No human interruption; fixing format on your own docs-only PR
     is harmless and autonomous.
  2. **Failure in the base** (main was already broken): **park** and surface with the
     diagnosis — the human's informed merge-on-red decision is legitimate precisely
     here, since the red isn't this PR's (on their explicit yes, re-run with
     `--force`). Free side effect: every closeout is a broken-main detector.
  3. **Can't tell:** **park** and surface what you saw — in doubt, the human.

  The uniform rule stands: **never merge on red alone** — no "it's only docs"
  exception (automatic exceptions are how the bug comes back).

- **20 — no checks reported (after the grace window).** Never merge alone, whatever the
  cause — don't auto-classify (no CI, CI dead, path filters all look identical). The
  once-per-repo memory is the **standing answer only**: if `merge.allow_no_checks: true`
  is recorded (or sits uncommitted on this branch, staged per step 5), the executor
  applies it itself — you won't see exit 20. A **one-shot** yes given at an earlier
  merge (including this task's merge gate) authorized **that merge only** and does
  **not** carry over — never re-apply it here on your own. Seeing exit 20 means no
  standing answer exists, so ask: "I saw no checks on the closeout PR — merge?". A
  standing answer ("this repo has no CI — merge without checks") is recorded as
  `merge.allow_no_checks: true` in `harness.config.yml` — add the line on this very
  closeout branch, push, and re-run the executor (it reads the working tree, and the
  answer lands on the base with the record). A one-shot yes ⇒ re-run with `--force`.
  No human available ⇒ **park**.
- **30 — checks still pending past the bound.** **No merge**: **park**. The closeout is
  docs-only archival — leaving it pending blocks nothing already merged.
- **1 (or any other non-zero) — no verdict.** Read the executor's stderr: either the
  check status could not be read (`gh`/auth/network — the precondition is
  unverifiable), or the merge attempt itself was rejected (branch protection requires
  human approval, a conflict). Both ⇒ **park**, surfacing that stderr — a
  protection-parked record PR is merged by the human by hand.

**Park:** flip the issue to `harness:status:closeout-pending` —
`gh issue edit <id> --remove-label harness:status:in-review --remove-label harness:status:in-progress --add-label harness:status:closeout-pending`
— tell the human the closeout PR is open, why it did not merge (the executor's output — failing checks, no checks,
pending past the bound, or protection), and stop. The task issue is **already closed** (the
task PR's `Closes #<id>` fired on its merge), so `/resume` finds the parked closeout only
by listing closed issues too (`--state all`) — a default open-only queue would miss it. A
later `/resume` runs this skill again from the top: its preamble re-runs the executor on the
still-open PR, or goes to step 6 once it is merged. (Authority for the RESUME entry: the
Orchestrator.)

### 6. Finalize (once the closeout PR is merged)

Reached from step 5, or from the preamble on a re-run. When the preamble found the record
PR **still open**, it re-ran the executor on it first (step 5's `merge-pr.sh` line,
verbatim): a park on pending or red checks is transient
and may have settled green — a repeat not-green outcome just re-parks. Then confirm the
closeout PR merged (`gh pr view <pr> --json state,mergedAt` → `MERGED`; on a
`/resume`, pass the deterministic branch `harness/closeout-<id>` as `<pr>` — the
merge-confirm accepts a branch name in place of a PR number), land the merged base
(`git checkout <default> && git pull`), then:

```bash
git push origin --delete harness/<id>-<slug>   # delete the task branch (skip if already gone)
gh issue close <id>                            # belt-and-suspenders if the merge didn't auto-close it
```

Then **emit `task_done`, and only after it flip the issue to `harness:status:done`** —
both happen here, in finalize, exactly once (the parked → `/resume` path also lands here,
so it is the single emit point for either path). The order is what makes a re-run safe: a
session cut between the two leaves the issue at its old status, so `/resume` lists it and
re-runs this skill — the other order would leave it `done`, listed nowhere, its
`task_done` lost. So first check this checkout's log, and skip the emit when it already
holds one for this task (an earlier run emitted, then stopped before the flip):

```bash
grep '"task_id":"<id>"' .claude/state/events.jsonl | grep -q '"type":"task_done"'
```

Exit 0 → already emitted: skip the emit. Otherwise emit — you compute the envelope as the Orchestrator running this skill.
Compute `cycle_time_h` from the issue's `createdAt` (UTC ISO) to
the task merge time (`mergedAt` from `gh pr view`). `review_rejections` is the number of
`review_rejected` events recorded for this `task_id` in `events.jsonl` (0 on a
first-pass approval). `--level` is always `L2` (the task flow; `L1`, the retired spec flow of 0.11.x
and earlier, is never written). Pass `--mode` — the **gate choice**: the first mode named on `progress.md`'s `Mode:` line, written
with underscores (`step-by-step` → `step_by_step`); a `(downgraded …)` suffix
doesn't change it, so a downgraded task still emits `--mode=step_by_step`. If
`progress.md` is already gone (the closeout PR drops it), read the `Mode:` line
from its last committed version:

```bash
P=.claude/state/tasks/<id>/progress.md
git show "$(git log -1 --diff-filter=D --format=%H -- ":/$P")^:$P" | grep -m1 '^Mode:'
```

Only when that prints no `Mode:` line (git has no such version, or it predates
the line), fall back to `events.jsonl`: ≥ 1
`step_completed` event for this `task_id` means `step_by_step` — but none on this
machine does **not** prove all-at-once (the file is local; the steps may have run
elsewhere), so with neither source omit `--mode` rather than guess.
When the gate choice was step-by-step, also pass `--steps` and `--checkpoints`,
both read from the `step_completed` events whose `task_id` is exactly `<id>`:
`--steps` is the number of **distinct** `step` values (a step the human sent back
emits again with the same `step` — count it once), `--checkpoints` the number of
events. A task whose steps 1–4 each needed one `changes` round has 4 steps and 8
checkpoints. On an all-at-once task pass `--mode` only; a task with no `Mode:` line and
no `step_completed` event (an architecture-drift stub, which skips the gate) omits all
three.
`events.jsonl` is local to the machine: when this one holds no `step_completed`
event for a step-by-step task (its steps ran elsewhere), pass
`--mode=step_by_step` without counts — a guessed count is worse than none.

End the emit with `--with-task-facts` (after the closeout PR merged and the
default branch is pulled): the CLI reads the task flow's facts itself — `progress.md`'s
`Kind:`, `Router:`, `Spikes:` and `Agent-decided calls:` lines, the task's archive, this machine's logs
and a part's issues — and leaves out what it cannot read. Never pass one of those facts
yourself: a count made by hand is a guess. When the emit refuses the flag itself
(`Unrecognized key: "with_task_facts"`: an installed CLI older than this catalog), run it
again without `--with-task-facts` — the line goes without the facts, never lost.

```bash
.claude/hooks/lib/lemony.sh emit task_done \
  --task-id="<id>" \
  --level=L2 \
  --cycle-time-h=<hours> \
  --review-rejections=<count> \
  --mode=<all_at_once|step_by_step> \
  --steps=<count> \
  --checkpoints=<count> \
  --with-task-facts
```

`events.jsonl` is
local-only/gitignored, so the emit never dirties the base. A `Warning: … does not know
--<flag>` with exit 0 is not a failure: the event was written without that field, so
do not correct or re-emit. An emit that still fails after one correction (an invalid
value, a missing field or `user.email`): warn with its error and go on — a lost event
must not leave the issue un-flipped. For a partition part, tick the
parent row (next) before the flip too, so a cut there still re-lists the task.

**If the task is a part of a partitioned feature** — its issue body (read it with
`gh issue view <id> --json body`; the issue is closed by now) carries a
`Part <k> of #<parent>` trace line — update the parent **partition-plan** issue here, in
the same finalize and before the `done` flip below. Tick your row with
`lemony issue-body set-row`, never by retyping the parent body — every other row is a
sibling's, and a retyped body can drop one. One Bash call, chained with `&&`:

```bash
p=<parent>; t=$(mktemp -d) &&
gh issue view "$p" --json body --template '{{.body}}' > "$t/old.md" &&
.claude/hooks/lib/lemony.sh issue-body set-row --part=<k> --merged=<id> < "$t/old.md" > "$t/new.md" &&
gh issue edit "$p" --body-file "$t/new.md" &&
rm -rf "$t" && echo "issue-body: #$p written"
```

It sets your row to `- [x] Part <k> — <slice> → #<id> merged` and leaves every other line
as it was (CRLF too); without the closing `issue-body: #<parent> written` line, nothing
was written. Then re-read the parent (`gh issue view <parent> --json body`) to
confirm the tick is present — if another row moved underneath you (a sibling closing
out elsewhere), redo it **once** on the fresh body; still absent, or the verb refuses
(no row for your part, a row naming another child) → leave the tick to the human and
say so. Idempotent on a retried finalize: an already-ticked row comes back as it was,
and the all-ticked check still runs. **A part that amended its feature PRD** — its parent's `## Plan` has an
`Amended <date>: PD<n> superseded by PD<m> (Part <k>, …` line naming this part and ending
`the other rows follow at Part <k>'s merge.` — then names the new decision on every row:
first check that the feature PRD on the default branch declares it superseding that decision (`git fetch && git show origin/<default>:<the feature PRD> | grep -q -- '- \*\*PD<m> —.*supersedes PD<n>\.'`; absent → the amendment did not land, or its number was retaken: leave the rows and say so). Each such line is checked on its own, then the same chained call
with `issue-body supersede --from=PD<n> --to=PD<m>` in place of `set-row`. A line ending
`no row names it.` is skipped (cross-cutting, an earlier part's, or no `Decisions`
column). A refusal is handled as the tick's: leave it to the human and say so —
`.claude/agents/partition.md`, its section "A contract change from a part", step 6. The edit mechanics are
the "Editing the plan and child bodies" section of `.claude/agents/partition.md`. When the tick
leaves **every** row ticked (merged or dropped), close the parent with a summary comment
(`gh issue close <parent> --comment "<what shipped, part by part>"`) — mechanical, no
human prompt: each part's merge already passed the human gate; a parent the human already
closed takes the tick and the close is a no-op. A parent with unticked rows stays open;
`/resume` surfaces its next part. The contract is the Orchestrator's companion
`.claude/agents/partition.md`.

Then flip:
`gh issue edit <id> --remove-label harness:status:in-review --remove-label harness:status:in-progress --remove-label harness:status:closeout-pending --add-label harness:status:done`
(`in-progress` too: a human may merge during rework; removing a label the issue lacks is a
no-op; if the command errors, re-read the labels and redo the flip — gh applies the add
and the removes separately).

### 7. Report

Return a one-line summary: the task id, the `history.md` entry, the archive path
(`_archive/<id>/`), any ADR raised, each convention written (its path), discarded or
left unprepared and any task opened to bring older files in line, confirmation that the
issue is closed (or that
closeout is parked at `closeout-pending` awaiting the record PR's merge), and — for a
partition part — that the parent row was ticked (and the parent closed, on the last
part).

## Scope note

In this build, closeout records to `history.md`, archives the plan + discoveries, raises
ADRs, captures conventions, finalizes via the closeout PR, and emits `task_done` at finalize. Session/metrics
accounting beyond `task_done` is not wired — closeout is the place it will attach.

## Uncontemplated Scenarios

When a scenario doesn't clearly fit these rules:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This scenario isn't covered by the task-closeout skill. I applied
   [approach] because [reason]. Want to update the skill?"
3. Offer to add a new rule for the case.
