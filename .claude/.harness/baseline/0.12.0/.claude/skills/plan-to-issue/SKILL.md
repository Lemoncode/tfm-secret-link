---
name: plan-to-issue
description: 🍋 Add the plan block (the PRD link and the task headlines from tasks.md) to the end of a managed issue's body. Use when the Planner publishes the plan into the GitHub issue the Orchestrator already created, mentions "fill the issue", "plan-to-issue", or "the plan block".
origin: vendor
vendor_version: '0.12.0'
phase: pre-implementation
invoked-by: [planner]
---

# Plan to Issue

## Core Principle

The issue body is a pointer, written before the plan existed: the request as the
requester wrote it (a feature), or the triage's `## Problem`, `## Root cause` and
`## Affected` (a bug). The plan lives in `tasks.md`, so a copy in the issue would drift on
every task a later change adds. This skill leaves the body as it is and puts one plan
block at its end: the PRD link and the task headlines, so the issue shows the plan on
GitHub without retyping it.

Run this **after** [`write-plan`](.claude/skills/write-plan/SKILL.md) has written `.claude/state/tasks/<id>/plan/tasks.md`.

## Preconditions

- The issue already exists (the Orchestrator created it) and `<id>` is known.
- The plan exists at `.claude/state/tasks/<id>/plan/tasks.md`.
- `gh` is authenticated and `task_storage.type` is `github` (see `harness.config.yml`).

You do **not** create the issue, rename any folder (the id is real from the start —
there is no `draft-<slug>`), or touch labels. Issue creation and the entire label
lifecycle belong to the Orchestrator.

## Plan

`lemony issue-body plan-block` reads the block from `tasks.md` by the same rules the
review ledger's validator reads it, so nothing is retyped, and it keeps the body's trace
lines (a part of a partitioned feature has `Part <k> of #<parent>`, and
`Depends on #<sibling> …`, at the top of its body — how the parent plan, `/resume`, and
closeout find the task's place in the partition). A second run replaces the block it
wrote before, so the step is safe to repeat. Run
`mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/issue-body.XXXXXX` first — note the
directory it prints (`<dir>` below); it is inside the repo and gitignored — then the
block, as one Bash call:

```bash
id=<id>; t=<dir>; plan=".claude/state/tasks/$id/plan/tasks.md" &&
gh issue view "$id" --json body --template '{{.body}}' > "$t/old.md" &&
.claude/hooks/lib/lemony.sh issue-body plan-block --tasks="$plan" < "$t/old.md" > "$t/body.md" &&
gh issue edit "$id" --body-file "$t/body.md" &&
gh issue view "$id" --json body --template '{{.body}}' > "$t/stored.md" &&
{ cmp -s "$t/body.md" "$t/stored.md" || { diff -a -u "$t/body.md" "$t/stored.md";
  echo "plan-to-issue: #$id stores a different body (- sent, + stored)"; false; }; } &&
rm -rf "$t" && echo "plan-to-issue: plan block written to #$id"
```

The verb refuses, and the body stays as it was, when `tasks.md` has no `> PRD:` line or
two, or no task it can read, and when the body carries a plan marker it cannot pair: its
message says what to fix before running the block again. Keep the `&&` chain: a step
that fails stops it before `gh issue edit`, so the body stays as it was. **Never pipe the
verb's output straight into `gh issue edit`** — a failure mid-pipe writes an empty body.
**Done means the last line printed `plan-to-issue: plan block written to #<id>`**;
without it, the step did not finish, whatever the exit code says: a failure before
`gh issue edit` leaves the body as it was, one after it leaves whatever body GitHub
stored, and the block is safe to run again. Then report the error to the Orchestrator;
don't compose the body by hand instead.

One failure is yours to fix. GitHub stores a body byte for byte except a C0 or C1
control character other than tab, line feed and carriage return: raw, or spelled as
a `\u` escape (`\u001b`, `\u009b`; either case, even after a second backslash), it
is stored in caret notation (`^[`, `\^[`), inside code spans and fences too. When the
chain prints `stores a different body`, the changed line is a task headline: rewrite it
in `tasks.md` so it carries no such character, and run the block again. In prose, name
the character ("ESC (U+001B)"); in code, spell it in a form GitHub keeps — `\x1b`, `\e`
or `\033`, whichever the code's language reads. Any other difference is not this case:
report it with the diff.

## Ownership boundary

- **Planner** (this skill): adds the plan block to the issue **body**.
- **Orchestrator**: created the issue, owns every label transition
  (`pending → planning → plan-ready → in-progress → in-review → done`), and
  closes it at closeout.

## Uncontemplated Scenarios

When a scenario doesn't clearly fit these rules:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This scenario isn't covered by the plan-to-issue skill. I applied
   [approach] because [reason]. Want to update the skill?"
3. Offer to add a new rule for the case.
