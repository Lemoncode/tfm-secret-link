---
name: convention-iterate
description: 🍋 Change a project convention — a rule under .claude/rules/, a client skill, the reference doc a rule cites — the way the human decided, after checking the change against the live decisions. Use when the Orchestrator routes a T6 CONVENTION_CONFLICT resolution that changes a convention to the Architect, when the human asks to change a convention ("change our convention for X"), or when closeout prepares what a finished task taught for their approval. The human chooses the direction; this skill renders it.
origin: vendor
vendor_version: '0.12.0'
invoked-by: [architect]
trigger-condition: a T6 CONVENTION_CONFLICT resolution changes a project convention, the human asks to adjust one, or closeout prepares what a finished task taught
---

# Convention Iterate

**Run by the Architect.** The Orchestrator dispatches the Architect (Task tool, fresh
context) with this skill; a main session that finds it in its own skill listing
dispatches the Architect instead of running it.

## Core Principle

A project's conventions are its own: the human decides what they say, and this skill
writes the decision into them. It never picks the direction — by the time it runs, the
human chose to change the convention rather than the plan ([`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md)) or
asked for the change. At closeout the order is the other way round, and the rule is the
same: you prepare the change, and it lands only once the human approved it (below).

## Where conventions live

- **Rule** — `.claude/rules/<topic>.md`, with `paths:` globs naming the files it
  governs; Claude Code injects it whenever any agent reads or edits one of them. Held
  to 8,000 characters, frontmatter included.
- **Reference doc** — `docs/reference/<topic>.md`, the detail a rule cites on its
  `Detail:` line.
- **Client skill** — `.claude/skills/<name>/SKILL.md` with `origin: client`: how to do
  a task. A skill with `origin: vendor` is Lemony's own, not a project convention:
  Lemony's flow runs it, and every `lemony update` merges its new version into the
  copy here — report the conflict instead of editing, so the human decides knowing
  that.

When the spawn prompt says **the human chose to change one of Lemony's own skills
knowing what an update does with the edit**, that conflict is settled; a request that
names the skill without saying so is the case above, to report. Make the change in the
live file, `.claude/skills/<name>/SKILL.md`, and leave its `origin: vendor` as it is:
the edited copy is still Lemony's skill, and that line is how `rules apply` and the
next run of this skill tell. It is one edit in place, which Claude Code asks the human
to allow, and not a staged copy: `rules apply` refuses a staged skill that takes the
name of one of Lemony's own. Process steps 1, 2 and 4 hold for it as for any change;
step 3's staging is what this edit replaces.

When the discovery does not name the file, find it: for a file the task changes,
`.claude/hooks/lib/lemony.sh rules match --path=<path>` names the rules that cover
it; a client skill is the one whose description fits the task.

## Before any write — check the live decisions

Search the ADRs still in force — every `docs/adr/NNNN-*.md` not wholly `superseded` or
`deprecated`; a _partially_ superseded ADR is live for the points it does not name as
superseded — the other rules, client skills and reference docs, and the
project-memory file (`CLAUDE.md`, or `AGENTS.md` when there is no
`CLAUDE.md`) for what the change contradicts. If anything clashes, **stop before
writing** and report each clash — the document, the point, how they disagree. The human
decides: supersede it, keep it as a deliberate exception, or change this convention
change instead.

- **Supersede an ADR** → that is [`write-adr`](.claude/skills/write-adr/SKILL.md)'s outcome, never yours: a convention says
  _how_, it cannot be what an ADR is superseded _by_. Report it; the Orchestrator runs
  [`write-adr`](.claude/skills/write-adr/SKILL.md) first.
- **Another rule, client skill or reference doc** → propose its edit in the same
  change.
- **The project-memory file** → name the passage; the human edits that file, never
  this skill.

When you are dispatched **with the human's decision** on a clash (it arrives in the
spawn prompt), that clash is settled: apply it instead of reporting it again. A
decision to supersede an ADR is settled only once that ADR's `Status` says
`superseded by` — if it does not yet, write nothing and report that the superseding ADR
comes first. Any other clash still stops you.

## Process

1. **Read both sides.** The convention's text in conflict and the plan's requirement
   that collides with it — or, when the human asked for the change, what they asked
   to change. State the contradiction precisely.
2. **Draft the smallest change** that says what the human decided. An exception the
   decision names stays an exception, written next to the rule it qualifies, not a
   rewrite of it. Add nothing the decision does not say — no further constraint,
   example or rewording of what it leaves alone: the change reaches every agent as the
   human's own words. If saying it takes words the human did not decide, stop and
   report the new text, writing nothing, so the human sees it first. Keep the
   frontmatter as it is — `paths:`, and `source:` /
   `imported:` on an imported file — unless the decision changes which files the rule
   governs. If the decision holds only for this task, it is not a convention: say so,
   write nothing, and name where it belongs (the plan, or an ADR when the reason
   should outlive the task).
3. **Write it.** A file under `.claude/` goes through a staging directory, since
   Claude Code asks the human before every Write there, and `rules apply` asks once:
   1. `mkdir -p .lemony/import/<YYYYMMDD-HHMMSS>` — the staging directory (`<dir>`).
   2. Copy each live file you change into it under the path it has below
      `.claude/rules/` or `docs/reference/`, creating its directory first: a rule to
      `<dir>/rules/<path>`, the reference doc it cites to `<dir>/reference/<path>`. A
      skill is copied whole, since applying replaces its directory whole:
      `mkdir -p <dir>/skills && cp -RL .claude/skills/<name> <dir>/skills/<name>`.
      Edit the copies. When the project has a formatter (its `package.json` names
      prettier, biome or dprint, the formatter's config file sits at its root, or its
      CI workflow runs one),
      `Read` `.claude/skills/import-knowledge/formatting.md` and format the copies as
      it says: `rules apply` lands them byte for byte.
   3. `.claude/hooks/lib/lemony.sh rules measure --staged=<dir>`. A refusal naming a
      path in the staging directory is a copy that broke the layout above: fix it
      there and measure again. It also exits non-zero while a staged rule is above
      the cap, or a staged skill takes the name of one of Lemony's own: whatever its
      message suggests, fitting the cap takes words the human did not decide (moving
      detail to the reference doc), and a vendor skill does not go through staging —
      stop and report, writing nothing, so the human sees it first. On exit 0, check that its
      output lists every file you changed: one it leaves out sits outside `rules/`,
      `skills/` and `reference/`, and would not land — move it there and measure
      again. Its comparison of the staged text with each file's `source:` is for an
      import's plan: a convention change departs from that source by design.
   4. `.claude/hooks/lib/lemony.sh rules apply --staged=<dir>` — it copies the
      staged files into place and removes `<dir>`. If it exits non-zero, report its
      message and stop.

   Whenever you stop before applying, or `rules apply` says nothing applied, remove
   `<dir>` (`rm -rf <dir>`): left under
   `.lemony/import/`, the next `/import` would take it for an unfinished import.

   A reference doc changed alone is edited in place.

4. **Return** the paths changed and a one-line summary to the Orchestrator — for a T6,
   confirmation that the change resolves it, so it can record the resolution and
   resume the paused sub-agent against the corrected convention.

## Prepare a change for the human's approval

At closeout the Orchestrator hands you a finished task's id and what the task taught: a
_how_ the human corrected, in their words, or a way of building they agreed to record,
in the Orchestrator's, each with the file that shows it. The human has seen no text
yet, so here this skill's order is turned round: you stage the change and stop, they
approve a summary of it, and the Orchestrator lands it. Nothing in this section runs
`rules apply`, and the staging directory stays when you stop.

Handed the directory an earlier run of that closeout left in place of items, its
`plan.md` holds them and its staged copies are out of date: prepare its items again as
below, in a new directory, and remove the old one when you are done, whatever was
staged.

1. **Place each item.** `.claude/hooks/lib/lemony.sh rules match --path=<the file>`
   names the rules that cover the file. A rule on the item's topic takes it as lines
   added or changed, next to what they qualify. With none, the item is a new rule,
   `.claude/rules/<topic>.md`, whose `paths:` globs name the files it governs and no
   others. The steps of a recurring task are a client skill. Then look for what the
   item contradicts, as "Before any write — check the live decisions" lists it. A
   clash with another rule, client skill or reference doc is settled in the same
   change: its edit is staged too, with its own line under What. Three kinds of item
   are reported and not staged: one a live rule or client skill already states (name
   it), one that holds only for this task, and one this section cannot settle, because
   it contradicts a live ADR or the project-memory file, or touches one of Lemony's own
   skills (name which: that is a decision of its own, taken outside the closeout).
2. **Write what was decided, and only that.** A correction is written in the form the
   human corrected it to; when the code that applied it, as it was merged, does it
   another way than their words say, that way is the form, and a What line says where
   it departs from their words. A pattern states what the files do, in the imperative,
   with no reason the repository does not record. The words a rule needs beyond that,
   its topic and its globs, are yours to choose: the summary is where the human sees
   them before anything lands.
3. **Count the files that still do it the other way**: among the files the rule
   governs, the ones that depart from the item. Read them: a file you did not open is
   not counted. Keep the number and two of their paths.
4. **Stage it** in one directory for the whole task,
   `.lemony/import/<YYYYMMDD-HHMMSS>` (`<dir>`): a live rule you change is copied to
   `<dir>/rules/<path>` and edited there, a new rule is written there, a reference doc
   goes under `<dir>/reference/`, and a client skill under `<dir>/skills/<name>/` (a
   live one copied whole first, `cp -RL`). Claude Code refuses a Write to a `.md` whose
   name starts with `summary`, `report`, `findings` or `analysis`: write that file
   under a leading `_` and rename it with `mv`. When the project has a formatter,
   `Read` `.claude/skills/import-knowledge/formatting.md` and format the staged files
   as it says: they land byte for byte.
5. **Measure it**: `.claude/hooks/lib/lemony.sh rules measure --staged=<dir>`. When a
   rule comes out above the cap, none of the items for that rule is staged: report
   them as not fitting, since what moves to its reference doc is the human's decision.
6. **Write `<dir>/plan.md`**, which is your report and what a later session reads when
   this closeout was cut:

   ```markdown
   # Convention capture — task #<id>

   ## <n>. <Correction | Pattern>: <the item, in a sentence>

   - What: <one line per instruction the staged text gains, changes (was … → now …) or drops>
   - Where: <a new rule `<topic>` for <its globs> | <k> lines in the rule `<topic>` (<its globs>) | the skill `<name>`>
   - Seen in: `<path>`
   - Other way: <k> files (`<path>`, `<path>`), or none
   ```

   Each instruction the staged text gains, changes or drops has its line under What,
   and the staged text says nothing those lines do not: the summary is what the human
   approves. With no item staged, remove `<dir>` and report only the reasons.

Report "Prepared": `<dir>`, the items as `plan.md` holds them, and each item you did
not stage with its reason.

Dispatched again with `<dir>` and the human's answer or one more item: work on the
staged copies as they are (a live file already staged is not copied again). Add the
item, make the change, or take a discarded item out (a staged file left equal to its
live copy is removed from `<dir>`). A change or an item that would put its rule above
the cap is not staged: report it and leave what was staged as it was. Then format and
measure again, rewrite `plan.md` with every item still staged, each under the number
it had, and report as before; with none left, remove `<dir>` and say so.

## Report

Return to the Orchestrator one of these:

- **Prepared** — closeout's capture, as that section says: staged, measured, not
  applied.
- **Written** — the paths written, a one-line summary, and — for a T6 — confirmation
  it resolves the cited discovery.
- **Nothing written, the human decides first** — the Orchestrator puts this report to
  the human as it stands, often with nothing else in front of it, so it carries what
  they have to decide and ends with what the next dispatch must hold: their answer in
  full, and any text they settled on word for word. For each thing that stopped you:
  - a clash with a live decision — each one: the document, the point, how they disagree;
  - an ADR to supersede that is not marked yet — nothing for the human to decide, and
    the report says so in place of a question: [`write-adr`](.claude/skills/write-adr/SKILL.md) runs first with the supersede, then
    this skill again with the same decision;
  - new text the decision did not cover (a wording, or what fitting the cap takes) —
    the text, quoted, and that the human did not decide it: your words, or words the
    spawn prompt adds to theirs;
  - a vendor skill in conflict — which skill; what editing it means (every
    `lemony update` merges the new version into the edited copy, and leaves conflict
    markers where both changed the same lines); the three places the change can go
    (that skill, a rule or client skill of the project's own, nowhere); and that for
    the skill itself the next dispatch says the human chose it knowing this.
- **Not a convention** — where the decision belongs instead; no edit.
- **Applied, staging left** — `rules apply` said every file is in place but the
  staging directory could not be removed: report it as written, and give the
  directory's path for the human to remove.
- **Apply failed** — `rules apply`'s message. After "nothing applied", nothing
  changed. After "partially applied", the staging directory is kept and a skill it
  replaces may already be gone: give its path, and say the paused sub-agent stays
  paused until the cause is fixed and
  `.claude/hooks/lib/lemony.sh rules apply --staged=<dir>` finishes the change.

## Uncontemplated Scenarios

When a case doesn't clearly fit:

1. Apply the closest matching approach with reasoning.
2. **Flag it**: "This isn't covered by the convention-iterate skill. I did [approach]
   because [reason]. Want to refine the skill?"
3. Offer to add a rule for the case.
