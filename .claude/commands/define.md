---
description: 🍋 Start new work with the grill — then the task flow.
allowed-tools: Read, Write, Edit, Bash, Task, Skill
---

# /define

`/define` means **start with the grill**. Run the task-flow round-trip in
`.claude/agents/task-flow.md`: its router (step 2) still lists the decisions the request
leaves open, but the grill (step 3) runs whatever the list says, even where the router
would call the request closed. This command only **forces the grill** — it does not redefine the flow; the companion file is the
single source for the steps.

`$ARGUMENTS` is the idea or feature to define. If empty, ask one
question to capture the idea, then proceed. A leading `--full` (a flag of
pre-release builds) no longer exists: say so in one line, drop it, and run the grill.

The task-flow round-trip, in brief (authority is the companion): grill the idea into a PRD
([`grill-with-docs`](.claude/skills/grill-with-docs/SKILL.md)) → open the task issue + branch → the Planner writes the plan
(`tasks.md`) → the gate before code → implement ([`tdd`](.claude/skills/tdd/SKILL.md)) → review (the Reviewer's full pass) → human merge
gate → closeout. Honor every human gate, never answer one yourself, and move the
`harness:status:*` labels per the lifecycle.

If the task turns out to be too small for any ceremony — nothing to specify, verify, or
review — offer `/bypass` to the human per the router (`.claude/agents/fit-assessment.md`);
only the human types it.
When in doubt, keep it in the harness.

The ceiling is the **partition question**: if the closed PRD bundles separable,
independently mergeable wants, the orchestrator asks — at the grill's close, before
opening the task — whether to cut the feature into several issues, each its own
branch, PR and merge gate (authority: `.claude/agents/partition.md`, read on trigger).
The requester can also ask for the cut at any point ("it is big, cut it"): the grill
then stays at what crosses parts. An approved cut opens a parent partition-plan issue
(`harness:partition-plan`, never a task), lands the feature PRD on the default branch
through a docs-only PR, then offers Part 1 or a stop; every part runs in the task flow,
opened at its turn with a short grill of its own.
