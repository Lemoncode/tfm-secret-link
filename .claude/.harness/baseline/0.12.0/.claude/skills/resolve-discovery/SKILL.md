---
name: resolve-discovery
description: 🍋 Mediate a raised discovery with the human and resume the paused sub-agent. Use when the Orchestrator receives a "Discovery D00x raised" summary — it pauses the task, arbitrates the T1–T6 question with the human, routes the artifact update to its owner, records the resolution, and re-invokes the paused sub-agent with the decision.
origin: vendor
vendor_version: '0.12.0'
invoked-by: [orchestrator]
---

# Resolve Discovery

## Core Principle

This is the **resolving** half of the interrupt-on-discovery protocol; the sub-agent
side is [`raise-discovery`](.claude/skills/raise-discovery/SKILL.md). The Orchestrator is the only one who talks to the human and
the only one who moves labels, so it owns mediation end to end: pause the task,
arbitrate, route the fix to whoever owns the artifact, record the decision, and resume
the sub-agent that stopped. The discovery is not closed until the paused sub-agent has
been re-invoked with the decision.

You run this when a sub-agent returns a summary of the shape
`Discovery D001 (T2/UNSPECIFIED_DECISION) raised — see tasks/<id>/discoveries.md`.

## Process

### 1. Pause the task

The sub-agent already wrote the entry and stopped. Record where it stopped and flip
state:

1. In the discovery's section in `.claude/state/tasks/<id>/discoveries.md`, add a
   `paused_from:` line capturing the status the task is leaving (`planning`,
   `plan-ready` (a change at the task flow's gate before code), `in-progress`, or `in-review`) — this is the state you'll resume to. You write this,
   not the sub-agent.
2. Reflect the pause onto the GitHub issue with the `discovery` CLI verb. In one
   fail-loud call it flips the status label (mutually exclusive)
   `harness:status:<current> → harness:status:paused-for-clarification`, adds the
   discovery flag `harness:discovery:T<n>` (presence-based, multiple allowed), and posts
   a comment with the entry so the pause is visible on GitHub, not just in local state:

   ```bash
   .claude/hooks/lib/lemony.sh discovery pause \
     --task-id=<id> --tier=T<n> --status=<current> \
     --agent="<the agent + subtask from the entry's Subtask context>" \
     --note="<one-line gist of the question>"
   ```

   The comment records `--status` as the status to resume to and `--agent` (one line,
   like `--note`) as who stopped: when the entry did not reach another machine (item 3's
   push failed, or was skipped), the comment is all a resume there has.

   Keep `--note` to a single line — the full `Plan says / Reality / Question` entry
   lives in `discoveries.md`; the comment only needs a pointer-gist (omit `--note`
   entirely and it links to the file). The label flip is **load-bearing**: a non-zero
   exit means it did not land — surface it and retry, do **not** proceed as if the task
   were paused. The comment is best-effort; if only it fails you'll see a `Warning:` but
   the pause still stands. The Orchestrator creates the issue at the start of
   `planning`, before any sub-agent runs, so the issue always exists by the time
   a discovery is raised — even one raised while the plan is written ([`write-plan`](.claude/skills/write-plan/SKILL.md)).

3. Let the entry travel with the branch: commit **only** `discoveries.md` and push,
   best-effort — a failure warns, never blocks (the pause already stands):

   ```bash
   git add .claude/state/tasks/<id>/discoveries.md
   git commit -m "discovery(<id>): pause on D<nnn>" -- .claude/state/tasks/<id>/discoveries.md \
     && git reset -q -- .claude/state/tasks/<id>/discoveries.md
   git push -u origin HEAD   # best-effort
   ```

   The pathspec keeps any other staged or unstaged work out of the commit; the reset
   re-syncs the index, which a pre-commit hook that rewrites files leaves stale after a
   pathspec commit (`git status` would show the file as `MM`). Skip this
   step when `progress.md` records `Auto-commit: off`: that mode promises the human zero
   commits until their OK, so the entry stays local and the comment carries the facts.

### 2. Mediate with the human

Read the entry. Present it faithfully — the `Plan says` / `Reality` / `Proposed` /
`Question` — and ask the human the single question it poses. Add your own read if it
helps, but **do not decide for them**: a discovery exists precisely because the choice
has consequences worth a human's call. If the human's answer raises a _new_ fork, that
is a second discovery — append it, don't fold it in.

### 3. Route the artifact update to its owner

The agent that **created** an artifact is the one that updates it. Map the decision to
the artifact it changes, then invoke that owner (fresh context, Task tool) with the
decision **stated in full** — at this moment it exists nowhere on disk; the entry's
`**Resolution**` block is only written at step 4 — plus the `discoveries.md` entry
**by path** for the surrounding context (it reads the entry itself):

| Artifact changed by the decision                                                                                        | Owner to invoke                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan/tasks.md`                                                                                                         | **Planner** — except a task's checkbox: `- [ ]` → `- [x]` is the Implementer's done-mark at green (the Orchestrator's on a checkpoint `ok`), never a plan edit                                                                                                                                    |
| Implementation code, `progress.md`, `notes.md`                                                                          | **Implementer** (often just the resumed sub-agent)                                                                                                                                                                                                                                                |
| The task's PRD (a decision appended as `PD<n>`, or the short PRD a closed request gains)                                | **Orchestrator** (you) — at §4, after the Resolution block (the plan's `> PRD:` line stays the Planner's)                                                                                                                                                                                         |
| A child issue's trace lines, the parent partition-plan issue                                                            | **Orchestrator** (you) — trace lines and plan rows through `lemony issue-body`, never retyped: the "Editing the plan and child bodies" section of `.claude/agents/partition.md` (an oversize discovery answered "partition")                                                                      |
| `docs/adr/NNNN-<slug>.md`, `docs/architecture.md`, a convention (`.claude/rules/`, a client skill or `docs/reference/`) | **Architect** (on-demand) — [`write-adr`](.claude/skills/write-adr/SKILL.md) to record the decision, [`update-architecture`](.claude/skills/update-architecture/SKILL.md) to keep the map true, [`convention-iterate`](.claude/skills/convention-iterate/SKILL.md) for a `T6 CONVENTION_CONFLICT` |

Not every resolution needs an artifact update first. If the decision is simply "do X"
with no change to the contract, skip straight to recording it and resuming. If it
changes the contract (the plan, a PRD decision, an ADR), the owner updates the artifact
**before** the paused sub-agent resumes, so it resumes against the corrected source.
An Architect that reports nothing written because the human decides first has corrected
nothing, so the paused sub-agent stays paused. That is so for a **clash** with a live ADR
or convention and for [`convention-iterate`](.claude/skills/convention-iterate/SKILL.md)'s other stops (new text the decision did not
cover, a vendor skill, an ADR to supersede that is not marked yet): run the loop in
`.claude/agents/orchestrator.md` §"Architect (on-demand)" for that report before you
resume.

### 4. Record the resolution

Append a `**Resolution**` block under the discovery's existing header (append-only —
do not edit the raise fields). When the entry is not on this machine (the pause's push
failed or was skipped, and the resume took its facts from the issue comment), create the
entry first so the decision still reaches `_archive/`, with exactly what the comment
gives — never invent the category or the raise date:

```markdown
## D<nnn> — T<n> (rebuilt) · raised <the comment's date>

<the comment's one-line gist>

Full entry not on this machine — rebuilt from the issue comment.
```

`D<nnn>` is the next free id in this file, `T<n>` the tier the comment names
(`Discovery T<n> raised`). Then append the block below under the entry — the original
one, or the one you just rebuilt:

```markdown
**Resolution** (Orchestrator)

- **Decision:** <the human's call, stated plainly>
- **Artifact updated:** <file + owner who changed it, or "none — decision only">
- **Resumed at:** <YYYY-MM-DD> — <agent> re-invoked from `paused_from: <state>`
```

**The decision is also a PRD decision.** A task whose `progress.md` has a `PRD:` line
keeps its decisions in the PRD that line names, so the Reviewer and the ledger see a
decision only there. Tell it by that line, never by `plan/tasks.md`: a discovery the Planner
raised while writing the plan comes before that file exists. After the block above, append the decision to that PRD
as its next free `PD<n>` (a part of a cut feature appends to its own part PRD, as its next
free `PD<k>nn` — Part 2's next after `PD202` is `PD203`, after `PD209` it is `PD210` — never to the feature PRD, except a contract change, which goes there as a dated amendment: `.claude/agents/partition.md`, its section "A contract change from a part", whose route is proposed with the decision), under a `## Decisions from implementation` heading at the end of
the file (add the heading once), with your Write or Edit tool:

```markdown
- **PD<n> — <decision area>**: <the decision> — decided by <the human | the agent, the
  human delegated it> at discovery D<nnn> of task #<id>; discarded: <the alternative>.
```

Name the discovery by id and task, never by path: closeout moves `discoveries.md` to the
archive, and the entry stays the log of how the decision came about. When `progress.md`
says `PRD: none` (a closed request), create the short PRD first, with the template in
`.claude/agents/task-flow.md` step 3 ("taken down"), its line under `# PRD` reading
`Decisions taken while implementing a closed request.`, and this decision as `PD1`; then
point `progress.md`'s `PRD:` line at it. The plan's `> PRD:` line is the Planner's:

- **Raised at plan time** (no `plan/tasks.md` yet): there is no line to change. Name the
  new path in §5's re-invocation of the Planner, which writes the plan with it.
- **Raised later** (`plan/tasks.md` exists): invoke the **Planner** (owner of
  `tasks.md`) now to change the plan's `> PRD:` line to the new path and refresh the
  issue's plan block, and add `.claude/state/tasks/<id>/plan/tasks.md` to all three path
  lists below, so its edit lands with the PRD.

Then commit the PRD and the entry on their own before §5, as the pause does (a pathspec
commit, then the index re-sync), and push best-effort. Name `plan/tasks.md` only when the
Planner just edited it: a pathspec naming a file that does not exist stops the commit.

```bash
git add docs/prds/<file>.md .claude/state/tasks/<id>/discoveries.md .claude/state/tasks/<id>/progress.md
git commit -m "discovery(<id>): PD<n> from D<nnn>" -- docs/prds/<file>.md .claude/state/tasks/<id>/discoveries.md .claude/state/tasks/<id>/progress.md \
  && git reset -q -- docs/prds/<file>.md .claude/state/tasks/<id>/discoveries.md .claude/state/tasks/<id>/progress.md
git push origin harness/<id>-<slug>
```

Under `Auto-commit: off` only stage the PRD (`git add docs/prds/<file>.md`, plus
`plan/tasks.md` when the Planner edited it): that mode promises zero commits until the
human's OK, and the next checkpoint's OK lands it. A discovery raised before `progress.md`
has an `Auto-commit:` line always commits. Write the PRD in the `Artifact updated:` line. A
decision that changes no behaviour the PRD speaks to (a typo in a test name) is still
recorded: the ledger owes evidence for every `PD<n>`, and that is what makes the record
checkable.

When `/resume` found the task PR already merged ("merged while paused"), nothing is
re-invoked and nothing is dispatched in §3: write
`Artifact updated: none — PR merged while paused; follow-up #<n>` (or `none` when the
decision needs no change) and `Resumed at: <YYYY-MM-DD> — none, PR merged while paused`
(authority: the Orchestrator's RESUME).

If the original entry reaches this file after you rebuilt it (the pausing machine
pushes it late), it arrives as a merge conflict in `discoveries.md` — both entries
append at the end. Resolve it with
`.claude/hooks/lib/lemony.sh discovery merge-rebuilt --task-id=<id>`, never by hand: it
keeps the original, moves the Resolution under it byte for byte — the human's decision
must reach `_archive/` exactly as recorded — and drops the rebuilt one; then `git add`
the file and continue the merge or rebase. If it refuses (a conflict of any other
shape), don't hand-merge the entries: stop and ask the human.

### 5. Resume and clear the flag

1. Reflect the resume onto the issue with the same `discovery` CLI verb — it removes
   the `harness:discovery:T<n>` flag and flips the status back to `paused_from`
   (`planning`, `plan-ready`, `in-progress`, or `in-review`):

   ```bash
   .claude/hooks/lib/lemony.sh discovery resume \
     --task-id=<id> --tier=T<n> --status=<paused_from>
   ```

   Same fail-loud contract: a non-zero exit means the flag/status did not flip back.

2. Re-invoke the paused sub-agent (fresh context) with: the issue, the task-state
   paths, a one-line gist of the decision (the full `**Resolution**` block now
   lives in the `discoveries.md` entry — reference it), and the updated artifact's
   **path**. It reads the files itself and picks up from where it stopped.

## Closeout invariant

At [`task-closeout`](.claude/skills/task-closeout/SKILL.md), **no `discoveries.md` entry may lack a `Resolution` block** with
`Decision` / `Resumed at` filled, and **no `harness:discovery:*` label may remain** on
the issue. An unresolved discovery means a sub-agent is still paused — the task is not
done. If you find one at closeout, resolve it first.

## Uncontemplated Scenarios

When a scenario doesn't clearly fit these rules:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This scenario isn't covered by the resolve-discovery skill. I applied
   [approach] because [reason]. Want to update the skill?"
3. Offer to add a new rule for the case.
