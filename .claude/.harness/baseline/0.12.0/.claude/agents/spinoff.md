# Mid-task capture (`/spinoff` offer) — Orchestrator companion

> Vendor companion to `.claude/agents/orchestrator.md` (the hat). **Read on
> demand, never at boot**: when the human mentions what may be an independent,
> non-blocking defect mid-task, or when a sub-agent's return summary carries a
> `## Side-findings` block.

While you (the hat) are driving the conversation — between sub-agent dispatches, at
gates, in ordinary back-and-forth — the human will sometimes mention an **independent,
non-blocking** defect: one the current task does **not** need to touch, and that doesn't
have to be fixed now ("oh, the export button is also broken on Safari"). Don't let it
evaporate and don't context-switch to it: **offer to fix it here as a task of its own,
or to spin it off**. The discriminator is
_independence_ — is this something the current task touches anyway?

This is distinct from three neighbours:

- **Just fix it** — if the defect is **in scope for the current task** (something this
  change already touches), fix it in the current PR. No offer, no stub — spinning off
  in-scope trivia only pollutes the backlog.
- **T3 SCOPE_DRIFT** (discovery) — when completing **the current task** _forces_ you to
  touch out-of-scope work (the task can't finish without it). That pauses via
  [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md). `/spinoff` is the opposite: the current task doesn't need the
  defect touched, so it never pauses and keeps going.
- **`/define`** — a feature _idea_, not a defect. Route those to DEFINE, not `/spinoff`.

Calibration — **lean toward offering** so nothing slips, but keep it
frictionless and noise-free:

- Offer only when you'd bet it's a **genuine, independent defect worth a tracked issue**
  — not for every stray observation, and not for in-scope trivia (_Just fix it_,
  above). When in
  doubt _whether to track a real independent defect_, lean toward offering; when in doubt
  _whether it's even a real, independent bug_, stay quiet.
- The offer is a **single line**, in the human's language, with three choices and your
  recommendation first: **fix it here**, **`/spinoff` it**, or **leave it**. Recommend by
  size: small and in an area the diff already touches → _here_; larger, or independent
  of what the diff touches → _spinoff_ — e.g. _"This looks like an independent bug, small
  and next to what we're changing: fix it here (recommended), `/spinoff` it, or leave
  it?"_ The human decides; one tap to dismiss, and on _leave it_ drop it and continue
  without comment. A task with no `plan/tasks.md` (an architecture-drift stub, a task
  triaged on 0.11.x, before tasks had a `plan/tasks.md`) has nowhere to add a task: offer `/spinoff` or
  leave it only.
- **Never re-offer the same finding twice in a session.** "Same finding" = the same
  underlying defect even if re-described; when unsure, treat a clearly new symptom as new.
  This rule is the **only** human-side dedup (the capture verb is non-idempotent by
  design — each run opens a fresh stub), so honor it.
- The offer **never pauses** the current task and never blocks on a reply — if the human
  ignores it and keeps working, so do you.

On **fix it here**, the finding becomes a visible task of the current one, never a
silent extra in the diff, so the PR's scope stays readable at the merge gate. Invoke
the **Planner** (owner of `tasks.md`; fresh context, spawn by reference) to append it
as the next free `T<n>`, in a group of its own at the end of the plan, named
`## Group <n> — Side-finding: <what it fixes>` (put that name in its prompt: closeout counts
these names for telemetry), whose rationale says it is a side-finding fixed here. Before any code (the task flow's plan, before its gate before code), that is all:
commit `plan/tasks.md` by pathspec (`plan(<id>): side-finding`, as `.claude/agents/task-flow.md` step 6
commits a gate change), and the task is built with the rest of the plan; the gate shows it.
Otherwise the Implementer implements it like any other
group (in step-by-step it is one more step of the loop; in all-at-once, the Implementer
is re-invoked scoped to it), and the Reviewer and the ledger cover it as any other task.
When the offer lands after the Reviewer's APPROVE (at the merge gate), the PR goes back
to implementation and a fresh review follows: the APPROVE did not see that task. Then
**return to the current task**.

On **`/spinoff`**, capture it exactly as the `/spinoff` command does — the `spinoff` CLI
verb via the launcher, with the **current task's id** as the parent (recover it the same
way `/spinoff` does — the `Active task:` line of
`.claude/hooks/lib/lemony.sh status --local`; omit `--parent` when it reads `(none)` or
the command fails):

```bash
.claude/hooks/lib/lemony.sh spinoff \
  --title="<one-line symptom>" \
  --body="<where it was seen; a code pointer if you have one>" \
  --parent=<current task id> \
  --severity=<low|medium|high|critical>
```

Stub creation is **fail-loud** (a non-zero exit means it did not open — surface it, don't
pretend it was captured); the telemetry emit is **best-effort** (a `Warning:` means only
the event failed, the stub stands). Relay the verb's own `Captured #<id>…` line (it
carries the parent link) and **return to the current task**. The stub waits in the backlog as `harness:status:pending`
for a later pickup. The human can also trigger this directly with the `/spinoff` command;
the offer is the safety net for when they don't remember it mid-flow.

## From a sub-agent (the side-finding channel)

The same offer applies when the source is **not the human but a sub-agent's return
summary**. A sub-agent runs in fresh context and cannot interrupt you, so when it spots a
defect that is **independent of its task** (the task finished fine without touching it) it
**notes it instead of pausing** — that is the [`note-side-finding`](.claude/skills/note-side-finding/SKILL.md) skill, the non-pausing
sibling of [`raise-discovery`](.claude/skills/raise-discovery/SKILL.md). It appends a `## Side-findings` block to its summary, one
bullet per finding (`symptom` / `location` / optional `severity`), and keeps working. (A
**blocking** defect is the opposite case — the sub-agent raises a T1–T6 discovery and
stops; you handle that with [`resolve-discovery`](.claude/skills/resolve-discovery/SKILL.md), per the orchestrator's §"Discovery
mediation".)

When you **read back a sub-agent's summary**, scan for a `## Side-findings` block. For each
bullet, make the **same single-line offer** as for a human-mentioned defect, its
recommendation judged the same way — a `/spinoff` pre-filled from the bullet (`--title` ← symptom, `--body` ← location, `--severity` ← the
read if given), the active task as `--parent`. Same calibration applies verbatim: lean
toward offering, one-tap dismissal, **never re-offer the same finding twice** (a
sub-agent's finding and a later human mention of the same defect are the _same_ finding),
and it **never pauses** the task. A side-finding is a candidate for the offer, not an
auto-capture — you still make the call and the human still decides.

A bullet tagged **`kind: drift`** is `docs/architecture.md` map staleness,
not a code defect: add **`--kind=architecture-drift`** to the `/spinoff` so the stub carries
the `harness:architecture-drift` routing label and a later pickup resolves it via the
Architect's [`update-architecture`](.claude/skills/update-architecture/SKILL.md) (a targeted map-fix), not a code change. **Fallback:** if
[`update-architecture`](.claude/skills/update-architecture/SKILL.md) is not installed (the project keeps no `architecture.md`), drop the
`--kind` and capture it as a generic stub — never let the offer fail because the routing
target is absent.

Two things you own because the sub-agent can't: **(1) cross-round dedup.** A sub-agent
re-invoked with fresh context (e.g. a Reviewer you rejected and re-ran) has **no memory of
what it side-noted before** and will re-emit the same `## Side-findings` block every round.
You hold the continuous context, so dedup is yours: an identical or re-described bullet
from a later round is the _same_ finding — don't re-offer it. **(2) gate ordering.** When
the read-back lands at a gate (a Reviewer returns right before the merge gate), make the
side-finding offer **after** the gate prompt, never before — the gate decision is primary;
the offer trails it as a secondary, dismissable line so it never splits attention at the
high-stakes moment.
