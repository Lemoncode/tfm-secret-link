---
description: 🍋 Escape hatch, typed only by the human — check what others consume, record one bypass event, then do the work with no issue, no task state, no review.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash(.claude/hooks/lib/lemony.sh emit l3_bypass *), Bash(git status *), Bash(git diff *), Bash(git grep *), Bash(gh issue view *), Bash(gh issue close *), Bash(gh issue edit *), Bash(gh issue comment *), Bash(git switch *), Bash(git branch -d *)
---

# /bypass

The **escape hatch**: force a task out of the harness when it has nothing to
specify, verify, or review (typo, internal rename, lockfile bump, comment fix). The
bypass is **deliberate and recorded** — one telemetry event so a misclassification is
observable later — but otherwise ceremony-free.

**Only the human runs `/bypass`.** An agent that thinks a task fits asks the human once —
`/bypass` or the harness, recommending neither — and waits (any other reply is the harness); it never runs this command, and never follows its
steps by hand.

`$ARGUMENTS` is the change to make. Derive a short `<topic>` slug and a one-line
`<reason>` from it (why this skips the task flow). If you can't tell what the change is,
ask one question first.

**A task the harness already took past its pending state** (its issue carries a
`harness:status:*` label other than `pending`: its branch is pushed, maybe a PR is open) is
not bypassed: say so in one line and go on with the task where it was. A bypass would leave
the pushed branch and its PR behind; the human closes the task themselves if they want it
gone.

## Mechanic (do exactly this)

1. **Check what others consume — before any edit, before the event.** Read the change
   against the repository (`git grep` the names it changes; the README and docs say who
   relies on what). Does it change, **incompatibly**, a surface other tools, scripts, repos
   or people's setups consume — something renamed or removed, a name kept with a new
   meaning, input it accepted now refused? Such surfaces are: machine-readable output
   (stdout meant for scripts, JSON, exit codes), a CLI flag or command, an API or package
   export, a config key or environment variable, a file format or data schema (and names
   other tools match on, such as labels), a setting users set up around. It counts whether
   or not you find a consumer: consumers outside the repo are invisible to you. Not such a
   change: anything purely additive (a new command, flag, field, optional key or accepted
   value); a change that only relaxes a surface (accepts more, flags less, keeps more), so
   whatever worked before still works; text written for people to read (usage and help
   text, error messages, log lines, docs, comments) unless the project documents it as
   machine-readable; internal changes; a fix of clearly wrong behaviour nobody could rely
   on.
   - **No** → go on to step 2.
   - **Yes** → ask the human **one** question, before anything else: name the effect and
     who relies on it (what the repository says), and offer the ways on — keep the bypass,
     changing it outright or keeping the old form working; or take it to the task flow,
     where the Reviewer checks the effect (say which of the two forms, if they know). Then
     do what the human says:
     - **the bypass** → step 2, with the answer in `<reason>`;
     - **the task flow** → the bypass ends here, with no event: leave this command and
       take the request in the task flow (`.claude/agents/task-flow.md`) from its step 2
       — step 1 for a bug not triaged yet — with the human's answer about the old form
       added to the request in their words (on an issue that already exists, as a comment
       on it: `gh issue comment <n>`, so a fresh context reads it). The router does not
       offer `/bypass` again.

2. **Emit exactly one `l3_bypass` event** — no more, no less:

   ```bash
   .claude/hooks/lib/lemony.sh emit l3_bypass --topic="<topic>" --reason="<reason>"
   ```

   `--topic` ≤ 200 chars, `--reason` ≤ 500 chars. The CLI stamps the envelope
   (`ts`, `user`, `project`, `harness_version`) and appends one line to
   `.claude/state/events.jsonl`. This event is the **entire** record of the bypass.

3. **Close the pending issue the harness already opened for this change**, if any (a bug
   past triage, a picked-up stub — `harness:status:pending`): drop its status label and
   close it as not planned —
   `gh issue edit <n> --remove-label harness:status:pending` then
   `gh issue close <n> --reason "not planned" --comment "Bypassed by the human: <reason>"`.
   A local task branch with no commits of its own goes too: `git switch <default>`, then
   `git branch -d <branch>`; one that holds work stays, and you say so.

4. **Do the work directly.** Make the change. That's it.

## What `/bypass` does NOT do

- **No issue** — no `gh issue create`, no `harness:*` labels.
- **No task state** — no `.claude/state/tasks/<id>/`, no branch ceremony.
- **No review** — no Reviewer, no [`senior-review`](.claude/skills/senior-review/SKILL.md), no PR gate.

If, while doing the work, the change turns out to be larger than a bypass deserves
(it touches logic, or anything a reviewer should see), **stop and
escalate**: describe the work so the router takes it in the task flow —
`/triage` for a bug, `/define` to start with the grill. The single `l3_bypass`
already emitted stands — it's the signal that the human chose the bypass. A surface others
consume that step 1 missed, found while doing the work: stop and ask step 1's question
before going on; the event already emitted stands, and the edits stay in the tree for the
task flow's branch (its step 4) to carry.
