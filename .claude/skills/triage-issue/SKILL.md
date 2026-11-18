---
name: triage-issue
description: 🍋 Triage a bug or issue by exploring the codebase to find the root cause, then create a GitHub issue that states the problem and its cause (or, given an existing issue number, update that issue instead); the fix plan is written afterwards, as the task's tasks.md. Use when user reports a bug, wants to file an issue, mentions "triage", or wants to investigate the cause of a problem.
origin: vendor
vendor_version: '0.12.0'
invoked-by: [orchestrator]
---

# Triage Issue

## Core Principle

Investigate first, ask later. Find the root cause through codebase exploration
before asking the user anything. Minimize questions, maximize diagnosis.

## Input

An **existing issue number** is optional. Pass it when the defect is already tracked —
a captured stub, or any issue the triage should fill in rather than duplicate. With it,
the skill runs in **reuse mode**: step 1 reads the problem from that issue, steps 2–3
are the same, and steps 4–5 update that issue instead of creating one. Reuse mode never
opens a second issue. Without a number, the skill creates the issue.

Reuse mode is for an **open** issue that is not a 0.11.x spec task: if the issue is closed or
carries `harness:sdd` (the label of a 0.11.x spec task, which its owner finishes on the
version it started with), stop and say so instead of rewriting it.

## Process

### 1. Capture the problem

Get a brief description from the user. If they haven't provided one, ask ONE
question: "What's the problem you're seeing?" In reuse mode the issue already states
it: read it (`gh issue view <number> --json title,body`) and ask only if it is too thin
to start from. The title is the symptom; the body may add where it was seen.

Do NOT ask follow-up questions. Start investigating immediately.

### 2. Explore and diagnose

Deeply investigate the codebase to find:

- **Where** the bug manifests (entry points, UI, API responses)
- **What** code path is involved (trace the flow)
- **Why** it fails (the root cause, not just the symptom)
- **What** related code exists (similar patterns, tests, adjacent modules)

Look at:

- Related source files and their dependencies
- Existing tests (what's tested, what's missing)
- Recent changes to affected files (`git log`)
- Error handling in the code path
- Similar patterns elsewhere that work correctly

### 3. Identify the fix approach

Determine:

- The minimal change needed to fix the root cause
- Which modules/interfaces are affected, and **which files the fix will change**
- What behaviors need to be verified via tests
- Whether this is a regression, missing feature, or design flaw

The fix plan itself is not yours: once the issue exists, the router judges whether the
right behaviour is obvious or needs a decision, and the Planner writes the plan, its
tests and its risk tags into the task's `tasks.md`, from what this issue states. So state
the cause and the change it calls for precisely enough to plan from, and leave the
red-green list to the plan; a second copy in the issue would drift from it.

### 4. Confirm with the user

Present the issue draft: problem summary, root cause analysis and the change it calls
for.
Ask: "Does this look right? Should I create the issue?" In reuse mode ask instead:
"Does this look right? Should I update issue #<number>?"

### 5. Create (or, in reuse mode, update) the GitHub issue

After confirmation, create with `gh issue create` and the `harness:managed` label.

In reuse mode, update the existing issue instead — never `gh issue create`. The new
body replaces the old one, and the old body's **trace lines** must survive it
byte-identical — a trace line is a one-line link to another issue, such as
`Discovered during #<parent>`, which ties a captured stub to the task it came from.
Don't retype them: you write the triage sections, and
`lemony issue-body keep-trace` carries the trace lines to the top. Read the current body
first (`gh issue view <number> --json body`) and fold the rest of it (where it was seen,
a code pointer) into `## Problem`. If the old body is already a triage of this shape (an
earlier pickup stopped before the branch step), replace its sections rather than
folding them in. Then:

1. `mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/issue-body.XXXXXX` — note
   the directory it prints (`<dir>` below). It is inside the repo and gitignored, so
   the Write tool can use it without a permission prompt.
2. Write the triage body (`## Problem` … `## Affected`, the structure below) to
   `<dir>/new.md` with your **Write** tool — never through the shell (no heredoc, no
   `echo`): a line of prose the shell reads as syntax can cut the body short or run as
   a command.
3. Write it to the issue as **one** Bash call:

```bash
n=<number>; t=<dir> &&
gh issue view "$n" --json body --template '{{.body}}' > "$t/old.md" &&
.claude/hooks/lib/lemony.sh issue-body keep-trace --old="$t/old.md" < "$t/new.md" > "$t/body.md" &&
gh issue edit "$n" --add-label harness:managed &&
gh issue edit "$n" --body-file "$t/body.md" &&
rm -rf "$t" && echo "triage-issue: body written to #$n"
```

Keep the `&&` chain — a failed step stops before the write — and never pipe the
verb's output straight into `gh issue edit`, which writes an empty body when the step
before it fails. Done means the last line printed `triage-issue: body written to #<n>`;
without it nothing was written — report the error, don't rewrite the body by hand.
`harness:managed` is usually there already; adding it again is harmless.
Leave every other label alone: the status labels
belong to whoever called this skill.

Use a structure like:

```
<in reuse mode, keep-trace puts the old body's trace lines here>

## Problem
<one-paragraph summary of the observed behavior>

## Root cause
<the actual cause, traced to file:line, and the change it calls for>

## Affected
<modules / interfaces touched>
```

Print the issue URL and a one-line summary of the root cause.

## Uncontemplated Scenarios

When a scenario doesn't clearly fit these rules:

1. Apply the closest matching approach with reasoning
2. **Flag it**: "This scenario isn't covered by the triage-issue skill. I applied
   [approach] because [reason]. Want to update the skill?"
3. Offer to add a new rule for the case
