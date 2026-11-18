---
name: write-plan
description: 🍋 Turn a task's issue — and its PRD, when there is one — into the task's plan (tasks.md only). Use when the Planner writes the plan, mentions "write the plan" or "tasks.md".
origin: vendor
vendor_version: '0.12.0'
phase: pre-implementation
invoked-by: [planner]
---

# Write the plan

## Core Principle

A plan is a contract, not a diff. It says **what** each task must make true and **why**,
never **how** line by line. The PRD, when there is one, captured intent through grilling;
this skill turns the issue and that intent into a plan an Implementer can build against
and a Reviewer can check against — without re-interviewing the human.

The Planner runs with **fresh context**. That is the point: a call the source leaves
open is not guessed in silence — it is settled and written into the plan, where the human
sees it at the gate before code.

## Inputs and outputs

- **Input**: the task's issue — a feature's request as the requester wrote it, a bug's
  `## Problem` and `## Root cause` — plus the PRD at `docs/prds/<topic>-<date>.md` when the
  Orchestrator hands you one (owned by the Orchestrator via
  [`grill-with-docs`](.claude/skills/grill-with-docs/SKILL.md)). This skill **consumes** the PRD — it never edits or closes it.
- **Output**: one file, `.claude/state/tasks/<id>/plan/tasks.md` — atomic, ordered
  checkbox tasks, grouped under risk-sized step headers. The Orchestrator created the
  issue and the task branch before invoking the Planner, so `<id>` is real from the
  start — there is no `draft-<slug>` holder.

## Process

### 1. Read the source in full

Read the issue and the whole PRD, plus any `CONTEXT.md` glossary terms and `docs/adr/`
it references. Identify: the user stories, the decisions already closed, what's
explicitly out of scope, and the assumptions/risks flagged. The closed decisions are
constraints — the plan must honor them, not relitigate them.

Honor the project's conventions for structure, naming and the testing pyramid: the
rules that reached you as you read the code this plan touches, the rules for the files
it will create (`.claude/hooks/lib/lemony.sh rules match --path=<path>` names them), the
reference docs they cite, and any client skill whose description fits. If the plan
would contradict one, that's a discovery, not a silent deviation (T6).

### 2. Write `tasks.md`

Atomic, ordered checkboxes. Each task is a **vertical slice** (a behavior, not a
layer) so the Implementer can run TDD red→green per task. Name the `PD<n>` each task
implements (the "Plan" section, item 2).

Group the tasks under **risk-sized step headers**. In step-by-step mode the loop runs
one implement→review→human-checkpoint cycle **per group**, so the grouping decides how
often the human is interrupted. The gate before code lists neither the groups nor their
tags. Grouping criterion:

1. **Risk isolates — hard rule.** A task gets its own group iff it concentrates risk:
   a new seam, a hard-to-reverse decision, a data-loss or security surface.
2. **Runnable surface closes — soft rule.** Among trivial stretches, prefer group
   boundaries that leave something the human can run at the checkpoint. Never invent
   a group to fabricate a demo.
3. **Soft cap: 4 tasks per group**, exceedable only with explicit justification in
   the group's rationale (e.g. "5 identical mechanical renames").
4. **Every group header carries a one-line boundary rationale** so whoever reads the
   plan can audit the grouping.
5. **A group whose code can do serious damage when wrong carries it as a machine-readable
   tag.** The header ends with `[risk: <class>]` — the **last element of the line**, after
   the rationale; multiple classes are comma-separated (`[risk: data-loss, secrets]`).
   The vocabulary names the kinds of damage that earn a tag, and `other` takes damage of
   the same weight that no other class names:

   <!-- risk-vocabulary:start -->

   | Class              | Surface                                                                                                                                                                                      |
   | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `auth`             | authentication, authorization, session or token handling                                                                                                                                     |
   | `payments`         | money movement, billing, pricing                                                                                                                                                             |
   | `shell-process`    | shell invocation, subprocess spawning, argument construction                                                                                                                                 |
   | `data-loss`        | writes, deletes, migrations, anything that can destroy user data                                                                                                                             |
   | `secrets`          | credentials, keys, tokens — at rest or in transit                                                                                                                                            |
   | `executable-mode`  | file permissions, exec bits, anything the project itself makes runnable outside CI                                                                                                           |
   | `output-injection` | untrusted text echoed to terminals, logs or non-HTML markup another program renders                                                                                                          |
   | `input-validation` | untrusted input entering the server or the process — request bodies, params, headers, files, env, third-party responses                                                                      |
   | `injection`        | untrusted values reaching a query, a file path, or HTML, an email or a PDF the app generates                                                                                                 |
   | `transport`        | the connection and what the server tells clients to trust — TLS and certificate checks, security headers, CORS, cookie flags, CSRF, what error bodies and source maps reveal                 |
   | `supply-chain`     | third-party code the project installs, builds with or runs, and the CI workflows that run it — dependencies, lockfiles, CI actions and images, workflow triggers and tokens, install scripts |
   | `llm`              | an LLM in the loop — prompts built from untrusted content, model output that drives an action, the model's tool access                                                                       |
   | `outbound-request` | requests the system sends, or redirects it issues, to a destination a user can influence — URLs, hosts, path segments, redirects                                                             |
   | `resource-limits`  | what one caller can consume or trigger — rate limits, quotas, page and upload sizes, query complexity, regex backtracking, fan-out                                                           |
   | `other`            | damage of the same weight that no class above names — named in the rationale                                                                                                                 |

   <!-- risk-vocabulary:end -->

   The tag keys on **damage, not on which rule made the group**. A group that isolates
   a new seam or a hard-to-reverse decision is a risk isolate under rule 1 and still
   carries **no tag** when that is all it is: a shape that is hard to undo is a decision,
   not damage its code does when wrong, so it is not `other` either; nor is a group that
   changes only prose. Absence is itself the declaration ("nothing here does damage of
   that weight"), never an omission.

   `other` is for damage of the weight the classes carry: harm that would ship unnoticed,
   or that reaches the people or the code depending on this one — keyboard focus trapped
   in a dialog, a checker that passes what it should reject, a shipped behaviour changing
   under the code that relies on it. It is not for the bug any code can have: a group
   whose worst failure is a wrong result that whoever runs it would see is not `other`.
   Nor is security damage a checklist section covers: each section of
   [`security-review`](.claude/skills/security-review/SKILL.md) names one class above, so
   a new dependency, unvalidated input or a request to an untrusted URL takes that
   class; only security damage no section covers is `other`, and its rationale says it
   is security, so the Reviewer runs
   [`security-review`](.claude/skills/security-review/SKILL.md) on it per step as well. When a group's code can do damage of that weight and no class names it,
   **tag it `[risk: other]` and name that damage in the group's rationale** — rule 4 already
   requires a rationale, and it is what the review presses on: `other` beside a rationale
   that names no damage declares nothing. Do **not** pick the nearest class (the
   self-check below rejects it), do not invent a one-off class, and do not edit the table
   here: it is Lemony's — generated into this skill from the list
   `lemony review-ledger validate` checks every tag against — and a class added to this
   copy is outside that list: the validator flags it as `unknown-risk-class`.

   **Nothing shows the tag to a human before code**: the gate before code lists no tag,
   so the self-check below is the only check that a tag names the group's damage. A
   wrong tag stays a plan defect, not a review defect: the Reviewer hands it on as
   written and never fixes it.
   Its force starts at review: the
   tags are handed to [`security-review`](.claude/skills/security-review/SKILL.md), which deepens the section named for each class
   instead of inferring the surface from the diff (`other` names no section; its brief is
   the rationale). And a script reads them: the review
   evidence ledger's validator (`lemony review-ledger validate`) checks every tag on the
   group under review against the vocabulary and reports one outside it as
   `unknown-risk-class` — a plan defect that reaches the human, never a silent drop — and
   owes every declared class a deeper review than an untagged group gets.

The checkbox itself is the **Implementer's done-marker**: it flips `- [ ]` → `- [x]`
when the task reaches green, with the task's commit. Write every task `- [ ]`; the same
validator reports a task still `[ ]` in a group the loop has passed
(`unticked-completed-task`), so the file tracks the progress its shape promises.

**Line shapes — read by the same script.** A task line is `- [ ]` or `- [x]` and a bare
`T<n>` id, at the task list's own indentation; a group header is exactly `## Group <n>`,
numbered from 1, with `Group` in English even when the plan is written in another
language. A line that looks like one but is not — an in-progress `[-]`, a suffixed
`T12b` or `T1.1`, a numbered `1. [ ]` item, a `- T6` with no box, a task inside a `>`
quote, a `T<n>` sub-item indented under another task, `### Group 3`, `## Group 0`, a
digit-less `## Group P`, a translated `## Grupo 2 — … _(…)_` — is reported
(`malformed-task-line`, `malformed-group-header`), never skipped; a note bullet about a
task opens with
something other than its `T<n>`. Every `T<n>` is used once in the file
(`duplicate-task-id` otherwise). Detail prose may run to several paragraphs: a blank
line inside a task is fine while the next line stays indented at least to the task's
text (two spaces under `- [ ]`); less, and it is no longer the task's. Code fences and
`>` quotes are never read as tasks, but a task or header shape inside one is reported
too — a quoted sample looks exactly like a task under a fence left open — so quote
samples without a `T<n>` id or a group header.

Rules: order so the first task is a tracer bullet; never "write all tests" then
"write all code"; keep each task small enough to verify on its own. Grouping never
changes task granularity — checkboxes stay atomic and TDD runs per task; only review
and checkpoint frequency follow the groups (all-at-once mode ignores the headers).
Tasks added mid-implementation (from a discovery) take the **next free `T<n>`** (never
a suffixed `T12b`) and default to **their own group** — they are risk by definition,
and grouping rule 5 applies to them unchanged. Like every tag, theirs reaches a human
only when the review's validator rejects it: no gate, before code or after, presents a
group header that parses. Tag them for the record; do not rely on anyone catching a
wrong one.

## Plan

The plan is the only artifact you write: `.claude/state/tasks/<id>/plan/tasks.md` (a UI
task's `plan/ui-handoff.md` is the design's, read-only to you). The file is §2's `tasks.md` — groups, rationales, `[risk: …]` tags,
checkboxes, the same line shapes the validator reads — with four parts of its own:

1. **The PRD link.** Right under the title, exactly one quoted line:
   `` > PRD: `docs/prds/<file>.md` `` for the PRD you were handed, or `> PRD: none` when
   there is none. The validator goes red on a plan with no link or with two (the
   full pass owes one criterion per `PD<n>` of the linked PRD, so a link it cannot read
   would let decisions go unreviewed). A **part of a cut feature** adds, on the next line,
   the feature line the Orchestrator hands you (the part PRD's header holds it), copied
   verbatim after the `> `: ``> Feature PRD: `<path>` — PD2, PD5`` (or `— none`); never
   rebuilt from the feature PRD, and the validator goes red when it differs from the part
   PRD's. The full pass then also owes the feature decisions it names and the feature
   PRD's `## Cross-cutting decisions`; a line retyped or trimmed owes the Reviewer less
   than the cut assigned.
2. **Each task is its own review criterion.** Name the `PD<n>` a task implements in its
   text (`implements PD3`). Every `PD<n>` of the PRD (for a part: of its part PRD, and
   the feature decisions its feature line names plus the cross-cutting ones)
   is either implemented by a task or a constraint the tasks respect; the Reviewer owes
   each one evidence.
3. **`## Agent-decided`**, after `## Before code` and before the first group: every call you
   made that the source does not make, settled with the conservative option (the gap rule in
   the "When the source leaves a call open" section of `.claude/agents/planner.md`), except those under
   `## Before code` (item 4). Two sub-headings, `### User-visible`
   (what the requester would see: output, messages, behaviour on a given input) and
   `### Internal`, one bullet per call:
   `- **<the call, in one line>.** <the option taken>. Discarded: <the alternative>.`
   `Discarded:` names an option the source left open, never one it ruled out, and a call the
   source settles is not listed: a call whose only other option the source ruled out is the source's, not listed (the handoff's `## Tightened after the critique` lines are the agent's calls: list them under
   `### User-visible`). No line in the section, sub-bullets included, opens with a `T<n>` id or a group-header
   shape: the validator reports those as malformed tasks. With no such call, the heading carries the single
   line `None — the plan follows its source as written.`
4. **`## Before code`**, right under the link: the part of the plan written for the
   requester to check first, so they can answer "yes" or "change it" to each line. At most
   five bullets, in plain words, each a call you settled under the gap rule (you raise no
   T2 for one) that the requester would most want to check before code, the most
   costly to get wrong first. A call that changes the plan's shape (which groups or tasks
   exist), or a plan that holds independently mergeable units, leads the section, its
   bullet ending `Picking the other: <what changes in the plan>.`; then:
   - **Scope you left out or narrowed**: something the issue or the PRD names or implies
     that no task builds, or builds smaller (a screen, a form, a package, a framework, a
     file to change). An omission cannot be seen in the tasks, so it is written here.
     Scope cuts come next, after a shape call; any that do not fit in five go under `## Agent-decided` →
     `### User-visible`.
   - **Structure that is costly to change after code**: the public API or package shape,
     one unit or several, where a thing lives, a new dependency.
   - **A side you took where the source is open, or where the code says otherwise.**
   - **A finding about the repository the requester likely does not know and would want
     to** (a stale or missing file, a name a sweep will miss), written
     `- **<the finding>.** <what the plan does about it>.`, with no `Discarded:`.

   Harness bookkeeping (decision ids, task numbering, how the Reviewer or the validator
   count) never goes here: settle it yourself and record it under `## Agent-decided` →
   `### Internal`. Naming the `PD<n>` a task implements in its text (item 2) is unaffected.

   Every other bullet has `## Agent-decided`'s shape. The section has no sub-headings, and
   no line in it, sub-bullets included, opens with a `T<n>` id or a group-header shape. A
   call listed here is not repeated under `## Agent-decided`. With none, the single line
   `None — nothing here would make the requester redo the work.`

For a bug the issue's `## Root cause` is part of the source, a PRD or not: the first task is the red test that
reproduces the reported behaviour, and the risk tags declare what the fix can damage
(§2's rule 5), since the issue no longer carries a risk section.

```markdown
# Tasks — <topic>

> PRD: `docs/prds/<topic>-<date>.md`

## Before code

- **<the call>.** <the option taken>. Discarded: <the alternative>.

## Agent-decided

### User-visible

- **<the call>.** <the option taken>. Discarded: <the alternative>.

### Internal

None — the plan follows its source as written.

## Group 1 — <name> _(<one-line boundary rationale>)_

- [ ] T1 — <smallest behavior that proves the path end-to-end; implements PD1>
- [ ] T2 — <next behavior>

## Group 2 — <name> _(<one-line boundary rationale>)_ [risk: data-loss]

- [ ] T3 — <error path>
- [ ] **T4 — <a task that needs detail>.**
      <detail prose, as many indented lines as it needs>
```

Self-check before handing off: the link line is there once; every `PD<n>` maps to a task
or is respected as a constraint, and no closed decision is contradicted; every group has a rationale and, where its code can do
damage of the weight the vocabulary names, a `[risk: …]` tag (`other` only beside a rationale that names that damage), and no group carries a class whose damage it cannot do; `## Before code` holds at most five bullets, a shape call then scope cuts first (any
past five under `### User-visible`); `## Agent-decided` lists every other call the source did
not make, or says `None`. Then fill the issue's plan block (the "Plan" section of [`plan-to-issue`](.claude/skills/plan-to-issue/SKILL.md)).

## Uncontemplated Scenarios

When a scenario doesn't clearly fit these rules:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This scenario isn't covered by the write-plan skill. I applied
   [approach] because [reason]. Want to update the skill?"
3. Offer to add a new rule for the case.
