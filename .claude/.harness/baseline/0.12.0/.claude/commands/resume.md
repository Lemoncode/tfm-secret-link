---
description: 🍋 Pick up an existing harness task from its branch and state.
allowed-tools: Read, Write, Edit, Bash, Task, Skill
---

# /resume

Enter **RESUME** mode and pick up an existing task exactly as specified in
`.claude/agents/orchestrator.md` (§"Dispatch" → RESUME). This command only **forces the mode** — the orchestrator file
is the single source for the procedure.

`$ARGUMENTS` is the task `#id` or name to resume. If empty, list the open queue
(`gh issue list -l harness:status:plan-ready` — a plan waiting for its gate before code —
`-l harness:status:planning` for plans parked mid-authoring — including a UI task
parked at `awaiting design definition` (+ `harness:needs-design`), and
`-l harness:status:pending` for stubs captured by `/spinoff` and new tasks not branched yet,
`-l harness:status:in-progress --state all`, `-l harness:status:in-review --state all`
for tasks past review, and `-l harness:status:paused-for-clarification --state all` for
tasks stopped on a discovery the human has not answered yet — these three with
`--state all` and `--json number,title,state,stateReason,labels`, because a merged task PR's
`Closes #<id>` closes the issue while the label stays; of their closed issues keep only
those closed as completed (`stateReason` `COMPLETED`): one closed as not planned was
abandoned on purpose), plus parked closeouts
(`-l harness:status:closeout-pending --state all` — their issue is already **closed** by
the task PR's `Closes #<id>`, so an open-only listing would miss them), and **partition
parents** (`-l harness:partition-plan` — not tasks; one with unticked parts surfaces as
"partition in progress: next part per the plan" — or "waiting on #<id> (Part <j>)" when
the next row is blocked by an in-flight child, or "partition waiting — the feature PRD is
in PR #<pr>, not merged yet" when git does not have the feature PRD on the default branch
yet ("partition waiting — the feature PRD has no PR yet" when it has none; a parent whose
`## Plan` has no `Decisions` column is exempt, its PRD riding on Part 1's branch) — and resuming
it starts the next eligible part, names the blocker, asks the docs PR's merge question, or
opens the docs PR, per `.claude/agents/partition.md`), and ask which to pick up.
Annotate every `in-progress`, `in-review` and `paused-for-clarification` row with its
task PR's state, found by branch pattern
(`gh pr list --state all --search "head:harness/<id>-" --json number,state,headRefName,baseRefName,mergedAt`;
the orchestrator's RESUME says how to read several matches): "PR #N open — merge gate"
(`in-review`), "PR #N merged — closeout not run" (`in-progress`, `in-review`), "PR #N
merged while paused" (paused), "PR #N merged into <base> — not landed" (a stacked
partition child), "PR #N closed unmerged — decide", "closed, no PR — decide" (a closed
issue), or, for an open `in-review` one, "no PR found" (an open `in-progress` or paused
row without a PR needs no note). A closed issue whose row has no merged task PR is not
dropped: its annotation is what tells the human it is stuck. A row whose issue carries
`harness:sdd` is annotated "0.11.x spec task — finish on 0.11.x" instead of its PR
state, whatever that state is.

In brief (authority is the orchestrator): an issue carrying `harness:sdd` is a 0.11.x
spec task, which this version no longer runs — touch nothing, whatever its status (no checkout, no step, no
label, no comment, no closeout): say it is finished on the version it started with
(0.11.x), closeout included (`lemony doctor` prints how to go back to it), or, when
abandoned, closed as not planned and redone with `/define`, and stop. Otherwise, an `in-progress`, `in-review` or
`paused-for-clarification` task passes the **task-PR gate first, before any checkout**
(the lookup in the queue above): merged → no task branch to check out, run
[`task-closeout`](.claude/skills/task-closeout/SKILL.md) from its top (a paused one first resolves its discovery on the default
branch, dispatching no change — one it needs becomes a `/spinoff` follow-up); closed
unmerged → offer resume / abandon / leave it; no PR → `in-review`: ask the human for the
PR number, others continue below; open → continue below. Then: once a task has left
`pending`, its state (at most the plan, `plan/tasks.md`) lives **only on the branch**
until merge — `git fetch` and check out `harness/<id>-<slug>` before reading any state,
whatever its status (recover the branch from just `<id>` with
`git branch -r --list "origin/harness/<id>-*"`), then reload
`.claude/state/tasks/<id>/` and continue from `progress.md`. If origin lacks the branch,
look for a local one; with none, never re-create it on your own — say the
task may live on another machine and ask whether to wait for it or redo the branch step
(authority: the orchestrator's RESUME). A `plan-ready` issue resumes at
`.claude/agents/task-flow.md` step 6 (its gate before code — the base check and the
recap first, as a resume — then implement). A `planning` one: an architecture-drift stub skips step 5
and goes on to step 6; any other re-enters that file's step 5 from its top, skipping
what is done, read from the files (the design and the plan are committed only with the
plan). The UI design first: a parked one (below); else, when `plan/ui-handoff.md`
exists, a [`grill-ui`](.claude/skills/grill-ui/SKILL.md) stopped mid-way while its `Status:` is `in_progress`, resumed from what the
handoff holds, or a closed design when it says `completed` (the critique, then the
label off, if `harness:needs-design` is still on); else, with that label on, the
design-stop offer the human never answered; else, while no `plan/tasks.md` exists, the
UI activation gate, which a stop before it never evaluated. Then the plan when no
`plan/tasks.md` exists, and the commit and `plan-ready` flip when it does (a plan the
Planner wrote but nobody committed is committed first). An `in-progress` one resumes at
`.claude/agents/task-flow.md` step 5 (plan) when the branch holds no `plan/tasks.md`
yet, otherwise step 6 (implement), continuing from what the branch holds — except an
architecture-drift stub and a task triaged on 0.11.x, before tasks had a `plan/tasks.md` (no `PRD:` line
in `progress.md`, a `## Fix plan (TDD)` in its issue), which have no plan by design and
resume at step 6 (authority: the orchestrator's RESUME).
A `paused-for-clarification` task is waiting on the human: check out its branch, then
re-enter [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md) at its step 2 (mediate) with the open
entry in `discoveries.md` — its `paused_from:` line is the status the task returns to,
its `Subtask context:` the agent to re-invoke. The pause commits and pushes that entry
best-effort; when it is missing here anyway (the push failed, the pause predates that,
or the task runs `Auto-commit: off`, whose pause makes no commit), take the status from the issue's
discovery comment (`Resumes to:`) and the agent from its `Paused agent:` line, and work
from its one-line gist, saying the full entry is not here. Read each line on its own: a
line the comment lacks (an older version posted it) leaves that one fact unknown — ask
the human for it, and never guess `--status`.
A `planning` task whose
`progress.md` records `awaiting design definition` is a **UI design parked at "stop for
handoff"** (authority: `.claude/agents/ui-design.md`): re-enter by **resuming the [`grill-ui`](.claude/skills/grill-ui/SKILL.md)
interview yourself** to finish `ui-handoff.md` (the UI Designer then critiques it), then
drop `harness:needs-design` and continue toward plan-ready through its plan (task flow
step 5). When `progress.md` records
`Mode: step-by-step` (or all-at-once under auto-commit OFF), the `## Step log` carries
the step sub-state — resume
exactly there: `awaiting human checkpoint (step N/M)` re-presents that pending
checkpoint (inspect / run / OK / changes / OK+downgrade; in all-at-once under
auto-commit OFF the line carries no `(step N/M)` counter — same
re-entry). Every answer — `changes` too — resolves in the turn that records it,
after the human-delta check (orchestrator §"Checkpoint contract", item 4), through one
call, `.claude/hooks/lib/lemony.sh checkpoint <answer> …` (orchestrator
§"Checkpoint contract", item 5): it makes the commits and, step-by-step, the
`step_completed` emit together (the all-at-once gate omits `--step` and emits
nothing) — never make them by hand or copy them from `git log`. A
`fix-loop iteration K`
line re-enters the per-step implement→review loop at that iteration; an
`awaiting ledger retry (step N/M, retry 1/1)` line — or its full-pass twin
`awaiting ledger retry (full pass, retry 1/1)` — re-runs
`lemony review-ledger validate` on the sidecar on disk (`--anchor` per the
orchestrator: per-step, the `(anchor <oid>)` on the step-log line; full pass, the
fingerprint merge-base — auto-commit OFF's pre-gate twin too when its group is the
whole plan (`Mode: all-at-once`); a downgraded remainder's anchors at its recorded
group anchor, = the branch head: auto-commit OFF defers every commit) —
green re-presents the gate
the pass feeds, red goes to that gate with the verb's lines, the single retry being spent;
either way the awaiting line stays until the human answers that gate, then is replaced
by its outcome (authority: the orchestrator §"Step-by-step implementation"). If the
Mode line carries a `(downgraded to all-at-once at step N)` suffix, the remaining tasks
run all-at-once — resume at the active subtask as usual, not via the step loop (the Step
log is then history, not sub-state).

**Cross-machine pickup of an `in-progress` task**: the branch on origin
carries the last **successful** best-effort WIP push — the Implementer pushes on
signaling done, and step-by-step pushes at each checkpoint-wait. Exception: a task
running **auto-commit OFF** defers every commit and push until a checkpoint OK
— in-flight work and its `progress.md` updates exist only in the implementing
machine's worktree, so from another machine the branch reads as of the last OK'd
group; before the first OK it is **indistinguishable from idle** (the knob record
itself is deferred — the documented price of the mode, orchestrator §"Auto-commit
OFF"). When the branch's `progress.md` carries the `Auto-commit: off` line (the gate
before code commits it before any code, so it is the only signal read — a task with no
line commits as it goes), surface the mode instead of concluding the task is idle. A discovery
pause still surfaces cross-machine via its labels and issue comment, though in this
mode the pause makes no commit, so its full `discoveries.md` entry stays machine-local.
If a **local** copy
of the branch is ahead of origin, prefer it (it is the newer state — this is what
makes same-machine resume lossless). From a **different** machine, anything committed
after the last successful push is unreachable and undetectable (origin is
self-consistent, just older): resume from the pushed state and tell the human which
state that is (`progress.md`'s last entry), so a re-run of an already-done review or
checkpoint is a conscious replay, not a silent assumption. Same machine, auto-commit
OFF, mid-implementation (`progress.md` not at `awaiting human checkpoint`): work found
**unstaged** in the worktree is **unverified by construction** — never stage or present
it on sight; the fresh Implementer confirms or redoes it. At an `awaiting` checkpoint,
unstaged work is the human's own delta instead (authority: the orchestrator §"Auto-commit
OFF"). An `in-review` one whose task PR is open resumes at the
**merge gate**: surface the open PR's review comments and run the merge-gate procedure
(route change-requests back to the Implementer, then offer to post threaded replies —
authority is the orchestrator). One check comes before that gate when the task's
`progress.md` reads `Auto-commit: off` and `Mode: all-at-once` (not
`Mode: step-by-step (downgraded …)`) and holds no `awaiting ledger retry` line, which
resumes as said above. The task flow flips the label to `in-review` before
its step 7 asks whether the pre-gate review holds for the PR, so a session that ended
between the two left that unasked, and at a merge the executor compares the content with
that review, not the plan. Ask it now, with step 7's chain, which commits and merges nothing
and can be run again; run it whole, with nothing after it that would replace its status:

```bash
git fetch -q origin <base> && \
  .claude/hooks/lib/lemony.sh review-ledger validate --task-id=<id> --anchor="$(git merge-base FETCH_HEAD HEAD)" --full-pass && \
  .claude/hooks/lib/merge-pr.sh <pr> --approve-issue <id> --check-approve
```

With the executor's `approve-current:` line, printed last, that review stands for the PR.
Without it no complete review covers what the PR carries: run the full pass of the task
flow's step 7 (`.claude/agents/task-flow.md`) before the gate, with its UI Designer lens
when the task touched UI.

A task that touched UI (its `plan/ui-handoff.md` exists) has a second check before the
gate, in any mode. The UI Designer's lens leaves nothing a resume can read, so a session
that ended before it ran would reach the gate with the design unreviewed. Invoke the UI
Designer as that lens (REVIEW in `.claude/agents/ui-design.md`), unless a full pass with
it ran in this resume. A reject routes back to the Implementer, and its fix is content no
review covers: step 7's full pass reviews it before the gate.

When `progress.md`'s last merge-gate line is
`merge gate: changes (external effects) → fix loop`, the human said No to an external effect there, or dropped a note in the diff: re-enter that fix loop (orchestrator §"External effects", item 4) instead of
asking it again — unless the issue already holds an APPROVE comment newer than that line's
commit, which means the fix was re-approved: then write the `merge gate: re-APPROVE` line
and run the merge gate. A `closeout-pending` task has **no task branch to check out** —
its task PR already merged and its state is archived under `_archive/<id>/`: run
[`task-closeout`](.claude/skills/task-closeout/SKILL.md) from its top, which is retry-safe and finds the record PR — if it is
still unmerged, it **re-runs the self-merge executor on it** (`.claude/hooks/lib/merge-pr.sh harness/closeout-<id> --squash --delete-branch` —
the skill's step-5 line verbatim, flags included: a bare invocation is rejected by
`gh pr merge` non-interactively and would re-park forever. The park may have been a
transient pending/red that has since settled; a repeat not-green re-parks), then goes
on to its **finalize** step (step 6) once that PR is merged — the skill owns the
finalize operations
(delete the task branch, close the issue, emit `task_done`, then flip to `done`). A
`pending` stub has **no branch
yet** — nothing to check out: read the captured context (the title is the symptom; the
body may be thin), then run the task flow (`.claude/agents/task-flow.md`), whose router
chooses what comes before the plan. A part of a cut feature (its body opens
`Part <k> of #<parent>`) is never routed: it resumes its short grill, as the
Orchestrator's RESUME says for a pending part. The stub is **reused, not re-created** — a defect
passes the stub's number to [`triage-issue`](.claude/skills/triage-issue/SKILL.md), which updates the stub instead — and the
`pending` label is dropped only on commit: the branch step, where the stub becomes
`planning` (authority: the orchestrator).
