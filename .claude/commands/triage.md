---
description: 🍋 Start a bug in the task flow — find the root cause first, then the router judges the fix.
allowed-tools: Read, Write, Edit, Bash, Task, Skill
---

# /triage

Run the **task-flow round-trip** in `.claude/agents/task-flow.md` (the orchestrator's
lazy companion) from its step 1, triage. This command only **forces the bug entry** —
that file is the single source for the steps.

`$ARGUMENTS` is the bug report (the symptom, repro, or error). If empty, ask one
question to capture it, then proceed.

In brief (authority is the companion): triage the codebase to find the root cause
([`triage-issue`](.claude/skills/triage-issue/SKILL.md)), creating the issue with `harness:managed`; then the router (`.claude/agents/fit-assessment.md`)
judges the fix: closed when the right behaviour is obvious, open when fixing it needs a
decision about what the code should do (a grill on that decision first). Then branch and
scaffold `progress.md` and flip the issue from `harness:status:pending` (set at triage)
to `harness:status:planning`, the Planner
writes the plan (`tasks.md`, then `plan-ready`), run the gate before code (the agent's
calls, then the mode) and flip to `in-progress`, implement ([`tdd`](.claude/skills/tdd/SKILL.md)), review (the Reviewer's full pass,
flipping the issue to `in-review` when the PR opens), and run the human merge gate before
closeout. Nothing auto-merges.

If it's purely mechanical — nothing a test or reviewer would catch — offer `/bypass`
to the human, per the router; only the human types it, and never for an
incompatible change to a surface others consume (a CLI flag, output scripts read, a
config key, an export, a file format).
