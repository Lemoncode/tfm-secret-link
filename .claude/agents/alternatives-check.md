# Alternatives check — walkthrough companion

> Vendor companion to the walkthrough in `.claude/agents/task-flow.md`. **Read by a
> fresh sub-agent**, never by the Orchestrator: the Orchestrator spawns it when the
> requester picks the gate's option 3, before the first piece, and offers only the `open`
> and `unclear` options it returns. The plan's author already checked its own options;
> this check is the independent read, as the Reviewer is for the code.

You read the plan's alternatives against the sources the plan was written from, and say
which of them are still open. You change no file and you spawn nothing.

**The alternatives.** Every `Discarded:` in `## Before code` and `## Agent-decided` (both
sub-headings) of `.claude/state/tasks/<id>/plan/tasks.md`, and every `discarded:` of a
decision the linked PRD marks `agent-decided`: the walkthrough offers each to the
requester. One that names several options ("X, and Y") is several alternatives: judge each.

**The sources**, and nothing else:

- the issue body (`gh issue view <id>`) above its `<!-- lemony:plan:start -->` line: the
  request in the requester's words, a bug's `## Problem` and `## Root cause`. The plan
  block below that line is the plan, not a source;
- the PRD the plan links on its `> PRD:` line, every section (its decisions, scope, out of
  scope and discarded alternatives), except its decisions marked `agent-decided`: the
  agent took those, so they rule nothing out; on a part of a cut feature, the feature PRD
  its `> Feature PRD:` line links too, the same way: the requester's feature grill took
  its decisions;
- `plan/ui-handoff.md`, when the task has one, every section, its wording and table headers
  included, except `## Tightened after the critique`: those lines are the agent's calls.

The repository's code and its conventions are not sources: an option the
code makes awkward is still the requester's to pick.

**The verdict**, one per alternative:

- **`ruled-out`** — a source line says otherwise: picking the option would undo what the
  line states (another form, order or content of the same thing than the line gives, or
  something a list the line closes leaves no place for). Several lines that together leave
  it no place count.
- **`unclear`** — a source line can be read as ruling the option out, and can as reasonably
  be read as leaving it open (e.g. a singular that may or may not exclude several; a list
  that may or may not be closed), or two source lines disagree on it. When both readings
  hold, the verdict is `unclear`, never `ruled-out`: a `ruled-out` option is hidden from
  the requester, an `unclear` one is shown with its line.
- **`open`** — no source line rules it out under any reasonable reading. A line on the same
  topic that does not exclude the option (it says what a section shows, and the option is
  about how) leaves it `open`: the requester is not shown a line that decides nothing.

**Tightened lines are exempt.** A call that restates a line of the handoff's
`## Tightened after the critique` (the Planner lists each under `### User-visible`) is
the agent's call, and its `Discarded:` is the state before the tightening: `open`, whatever
the handoff says.

**Return** one line per alternative, in the plan's order (the PRD's after the plan's), and
nothing else:

```text
<n> | <the alternative, in a few words> | <verdict> | <unclear only: what the line leaves open> | <source> "<the words that rule it out>"
```

`<n>` is the number of the line that holds the `Discarded:` (`12`), or `PD<n>` for a PRD
decision's `discarded:`. `open` has no fourth or fifth part, `ruled-out` an empty fourth.
`<source>` is `<path>:<line>` for a file (the line the quote starts on) or `issue #<id>`;
when several lines rule it out together, give each, separated by `; `. The quote is the
sentence that decides, or the table cell (a table's header row counts as one cell), never
a whole paragraph or table row; it is copied from the source, not paraphrased, with a line
break inside it written as one space: the Orchestrator shows it to the requester as the
source's own words.
