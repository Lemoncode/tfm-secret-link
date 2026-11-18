# Task flow round-trip — Orchestrator companion

> Vendor companion to `.claude/agents/orchestrator.md` (the hat). **Read on
> demand, never at boot**: when a request takes the task flow (the default for every
> request: `.claude/agents/fit-assessment.md`), on `/triage` and `/define`, and on a
> pending stub's pickup (including an `architecture-drift` stub
> routed through this machinery). The orchestrator's hard rules — human gates, label
> lifecycle, fresh sub-agent context, spawn prompts by reference — apply here
> unchanged. Caller-side overrides ride in from dispatch: on a **pending-stub pickup**
> the issue already exists — a defect not triaged yet (no `## Root cause` in its body) goes
> through step 1 in [`triage-issue`](.claude/skills/triage-issue/SKILL.md)'s reuse mode (pass the stub's number: it rewrites the
> stub's body and keeps the number, never opening a second issue); anything else skips
> step 1, and every pickup skips step 4's `gh issue create`.
> An **architecture-drift stub** is a pending stub too: its issue is reused, but it is no
> defect, so it skips steps 1, 2, 3 and 5; step 4 runs (its branch and its label flip; a
> map fix has no decisions and no plan), then step 6 with no gate, and the **Architect** (running [`update-architecture`](.claude/skills/update-architecture/SKILL.md)) replaces the Implementer in step 6.
> A **part of a cut feature** (its body opens `Part <k> of #<parent>`) is a pending stub
> too, and every part runs here: it skips steps 1 and 2, and steps 3 to 5 run as
> `.claude/agents/partition.md` says in its section "Children: parts in the task flow" (its short grill and part PRD, its branch
> from its effective base, its plan with the feature line); from step 6 on, nothing differs
> but a **stacked** part's base: while its predecessor is unmerged, the base check, the
> merge-ins, the PR's base and the Reviewer's base are the predecessor's branch; once it
> has merged, the landing move comes before the PR or the (re-)review, and the merge gate
> checks the PR's base first — all as that file's section "Chain start modes" says.

The grill when the request is open, the issue, the branch, the plan in `tasks.md`, the
gate before code, the review and the merge gate: nothing auto-merges.

1. **Triage (a bug only)** — invoke the [`triage-issue`](.claude/skills/triage-issue/SKILL.md) skill: investigate the codebase, find
   the root cause and the change it calls for, and create the issue with
   `harness:managed`, or,
   on a stub pickup, update the stub in reuse mode (a pending issue whose body is already
   a triage, with its `## Root cause`, skips this step: the cause is found). Minimize
   questions. Record the number `<id>`. A new bug's issue then gets
   `harness:status:pending`, as a captured stub has: until step 4 the task has no branch,
   and the label keeps it in `/resume`'s queue if the session stops in steps 2–3 (its
   pickup reuses the issue, as for any stub). A feature or change has no cause to find: go
   to step 2.
2. **Route** — read `.claude/agents/fit-assessment.md` and run the router: on the request,
   or for a bug on its fix, now that the cause is known (a bug's openness depends on its
   cause, unknown at entry). It lists the decisions the work would otherwise guess and
   proposes the path. `/define` skips the verdict: it starts with the grill (step 3)
   whatever the list says. A bypass the human takes (only the human types `/bypass`) ends
   this flow with `/bypass`, which asks first on a surface others consume and closes an
   issue that already exists (a bug past step 1, a stub: its step 3).
3. **Settle the decisions** — by the router's verdict and the human's answer to the
   proposal:
   - **Closed** (nothing listed) → nothing to settle; no PRD. The issue rules.
   - **`/define`** → the open branch below, whatever the list holds: the grill starts from
     what was listed, or from the request itself when nothing was.
   - **Open** → run the [`grill-with-docs`](.claude/skills/grill-with-docs/SKILL.md) skill, its `SKILL.md` read whole with your
     Read tool first (a shell read can give you part of it), starting from the listed decisions. One
     question at a time, never auto-decide. A listed presentation of an output (the router's
     one entry for it) is one question too: the presentation you propose, accepted or changed
     in one answer, not a question per part of it; ask again only about a part the answer
     leaves unclear. Output: a PRD at `docs/prds/<topic>-<date>.md`,
     its decisions numbered `PD<n>`; its `Status:` flips to `completed` when the grill
     closes. On an existing issue (a bug, a stub), the PRD carries the issue's root cause
     and links it, so the plan and any part read it; and once the PRD file exists, comment
     its path on the issue (`gh issue comment <id> --body-file <file>`, the body
     `PRD in progress: <path>`), so a pickup after a stop finds the grill to resume instead
     of starting a second one. Post it once: a pickup that resumes the grill posts none, and
     only a pending issue's pickup reads it, so it needs no update once step 4 runs. When
     the requester asks to cut the feature into parts, before the grill or in it, the cut
     is decided and the grill goes high level from there (`.claude/agents/partition.md`,
     its section "A cut on the requester's word"). The grill looks before it closes a
     branch (it reads or runs what exists; it asks first when the check would reach outside
     this machine, change data the project keeps or turn on the requester's choice; a
     credential a check needs is asked for by the name of the variable that holds it and
     never searched for; and on a service the project does not own a check sends only what
     the requester agreed to, one request at a time until the service has accepted one,
     and takes a refusal that does not say what to change back to them) and
     notes as a spike what only
     something not built yet can show; its closing question carries the noted spikes, and
     each one the requester takes runs in the **Spike Runner** sub-agent (agent type
     `spike-runner`) before the PRD closes, as the skill's "Running a spike" says. Keep
     three counts as the grill goes, for step 4: spikes offered, spikes run, and spikes
     whose answer changed a decision. At
     the grill's close, when the closed PRD looks like it bundles separable,
     independently mergeable wants, ask the partition question (`.claude/agents/partition.md`,
     its sections "When to look" and "The closing question of the define"; no cue → go on
     silently): an approved cut creates
     the parent, lands the feature PRD through its docs PR and offers Part 1 or a stop
     (`.claude/agents/partition.md`), and this flow ends. An issue that already exists (a bug,
     a stub) is closed right after the parent is created, with a comment linking the parent, and its status label
     removed, so the queue shows the parts instead.
   - **Taken down** ("just do it" on an open request) → you pick each listed decision's
     conservative option and write them into a short PRD, so the record survives the
     shortcut: the Reviewer checks each one like any other decision. Write it with your
     Write tool at `docs/prds/<topic>-<date>.md`:

     ```markdown
     ---
     Status: completed
     Topic: <the request, in one line>
     Date: <YYYY-MM-DD>
     ---

     # PRD — <topic>

     No grill: the requester asked the agent to decide. Every decision below is
     agent-decided.

     ## Decisions

     - **PD1 — <decision area>**: <the option taken> — agent-decided; discarded:
       <the alternative>.
     ```

     Step 4 commits it. On an existing issue (a bug, a stub), comment its path as the open
     branch does (`PRD in progress: <path>`; a pickup reads its `Status: completed` as
     closed), so a stop before step 4 does not lose it.

4. **Open the task** — for a feature or change, create the issue with a pointer body: a
   title line, then the request as the requester wrote it, quoted, and no plan (the plan
   lives in `tasks.md`; step 5 adds its pointer). The request goes in verbatim because
   on a closed request it is the plan's whole source: a closed request is closed because
   its own words settle every decision, and a summary would drop some. Run
   `mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/issue-body.XXXXXX`, write the body to
   `<dir>/body.md` with your Write tool (never through the shell: prose the shell reads
   as syntax can cut it short), then
   `gh issue create --title "<title>" --body-file <dir>/body.md --label harness:managed --label harness:status:pending`
   (pending until the branch exists, so a stop inside this step leaves
   it in the queue rather than nowhere). When step 3 wrote a PRD, comment its path on the
   new issue at once, as step 3 does on an existing one, so that stop does not lose it. A
   bug's issue exists since step 1. Record `<id>`. Then create the
   task branch off the default branch
   (`git fetch && git checkout -b harness/<id>-<slug> origin/<default>`; if it already
   exists — an earlier pickup stopped inside this step — check it out instead), scaffold
   `.claude/state/tasks/<id>/progress.md` on it with a line `PRD: <path>` naming the PRD
   step 3 wrote, or `PRD: none` (a resume reads the PRD's path there); a line `Kind: bug`
   (a defect: what step 1 triaged, or a stub whose body already holds its `## Root cause`),
   `Kind: chore` (no behaviour changes: docs, dependencies, a refactor, an
   architecture-drift stub) or `Kind: feature` (anything else); and a line
   `Router: open` or `Router: closed`, the verdict step 2 gave, ending in ` (overridden)`
   when the human took another route than it proposed (a closed request grilled anyway, an
   open one taken down) — no `Router:` line when step 2 gave none (`/define`, a part, an
   architecture-drift stub) or this session did not see it (a redo of this step on another
   machine); and, when a grill ran in this session (the open branch, `/define`, a part's
   short grill), a line `Spikes: <offered>/<run>/<changed>`, the totals over that grill: how many spikes
   were put to the requester (in a closing question, or run earlier because they asked),
   how many ran, and how many of those changed a decision, its branch reopened and closed
   on another answer: a spike counts once in each number, however many statements it
   carried or decisions its answer reopened, so no number is above the one before it
   (`Spikes: 0/0/0` when it noted
   none; no line when no grill ran or this session did not see its close). Closeout reads these lines for telemetry. Commit it with
   that PRD and any other file the grill wrote (a `CONTEXT.md` edit, an ADR), and push
   the branch **best-effort** (a failed push is a warning, never a stop — say so):

   ```bash
   git add .claude/state/tasks/<id>/ <the PRD and the files the grill wrote, if any>
   git commit -m "task(<id>): scaffold" -- .claude/state/tasks/<id>/ <the same files> \
     && git reset -q -- .claude/state/tasks/<id>/ <the same files>
   git push -u origin harness/<id>-<slug>
   ```

   The pathspec keeps the human's own staged work out; the reset re-syncs the index a
   rewriting pre-commit hook leaves stale (every commit below does the same).

   Nothing touches the default branch until the merge gate. Then flip
   `harness:status:pending → harness:status:planning`: the plan (and the UI
   design, when there is one) is being written. This is the **commit point**, for a new task and a stub pickup alike: a
   pickup abandoned before it leaves the issue in the pending queue, and the pushed
   branch is what lets another machine pick it up.

5. **Plan** — first **design the UI when the task touches it**: evaluate the
   **activation gate** (your own judgment, no keyword scorer), two parts both true: (1)
   the repo has a frontend — UI to design, not a pure library / CLI / backend — and (2)
   this task adds or alters something a user sees or interacts with. Bias to include on a
   borderline call. Only when it fires, read `.claude/agents/ui-design.md` and run its
   DEFINE flow (design-stop offer → [`grill-ui`](.claude/skills/grill-ui/SKILL.md) → UI Designer critique) before the plan; a task
   that doesn't touch UI goes straight to the plan without reading the companion. There, a finding you resolve by tightening the handoff without asking the human is a call the agent made:
   it goes under the handoff's `## Tightened after the critique` (`.claude/agents/ui-design.md`),
   and the Planner lists each with its own calls, so the gate shows it. Its **stop for handoff** parks the task at `planning` with
   `awaiting design definition`, and whoever picks it up from `/resume` designs it, then
   the plan follows. Before the plan, ask the human each question the handoff's `## Open questions` still holds,
   one per message, in plain words, without its id (`Q1`), and write each answer into the handoff in its place: an open question
   leaves the design incomplete (`.claude/agents/ui-design.md`), and the Planner does not
   settle it. One the human cannot settle yet keeps the design open: stop for handoff, as above.
   Then invoke the **Planner** sub-agent (agent type `planner`; fresh context; spawn by
   reference: the prompt carries the issue link, the paths and the skill to run, plus a short
   delta of only what exists nowhere on disk, such as a human instruction from this conversation, and never a quotation of a file it can
   read; two deltas are never trimmed: a REJECT's findings go verbatim, and a decision not
   yet recorded goes stated in full), with the issue `<id>`, the
   branch, the PRD path from `progress.md`'s `PRD:` line (`none` when it says so) and
   `plan/ui-handoff.md` when the design wrote one. It
   reads the issue, that PRD and the design, and writes only
   `.claude/state/tasks/<id>/plan/tasks.md` and the issue's plan block, and returns a
   summary. It settles every call the source leaves open (the gate shows
   them before code); any other discovery it raises is mediated like any discovery
   (orchestrator §"Discovery mediation"), and the Planner is re-invoked with the
   decision. On its return,
   commit and push the plan best-effort, adding to the add, commit and reset path lists any repo file the design wrote on
   the human's yes (`docs/personas.md`, `docs/design-tokens.json`): it travels with the plan.

   ```bash
   git add .claude/state/tasks/<id>/
   git commit -m "plan(<id>): <slug>" -- .claude/state/tasks/<id>/ \
     && git reset -q -- .claude/state/tasks/<id>/
   git push origin harness/<id>-<slug>
   ```

   Then flip `harness:status:planning → harness:status:plan-ready` (with UI,
   only once `ui-handoff.md` is complete and `harness:needs-design` is removed, the
   precondition `.claude/agents/ui-design.md` sets: a `plan-ready` task never carries the
   label); an `in-progress` task planned here keeps its label
   (a task started before plans were written in `tasks.md`, resumed with no plan). The plan is ready:
   go on to step 6 in this session without asking (the gate's option 4 is the stop), or stop here when the human asks — the task waits
   in the `plan-ready` queue, and a `/resume` picks it up at step 6. Tell the human only that the plan is written, and anything
   that blocks it: do not list its calls or groups before the gate. The gate shows the calls in its own words, and no gate lists the groups.

6. **Implement** — first **the gate before code**: one interaction, before any code (an
   architecture-drift stub skips it: its Architect commits as it goes, as below). It runs
   from `plan-ready`; an `in-progress` task resumes at implementation, its committed
   `Mode:` line the sign the gate ran, and an `in-progress` task with `plan/tasks.md` and no `Mode:` line
   (started before this gate existed) runs the gate, without the label flip. A start you
   know only from a **compaction summary** is not one: when the post-compact ground-truth
   block reports the gate before code not recorded (`plan/tasks.md` and no `Mode:` line),
   show the gate again and write no implementation code until the human answers.

   Two things come before the gate, only on the way to it (never on a resume into implementation),
   each in its own message (when nothing landed, the base's one line may open the recaps' message):

   - **The base, on a resume** (any session but the one that opened the task (step 4): the same
     person days later, someone else, or whoever designed it after a stop for handoff). Run
     `git fetch` and read what landed on `origin/<default>` since the branch was cut
     (`git log --stat "$(git merge-base HEAD origin/<default>)..origin/<default>"`; a
     stacked part whose predecessor is unmerged reads, and later merges in, that
     predecessor's `origin/harness/<k-id>-<k-slug>` in place of `origin/<default>`).
     When nothing landed, say so in one line and ask nothing. Otherwise say what it implies:
     one line when nothing in it touches what the plan changes; when something does, what
     changed and which call it touches (at the gate, it opens the gate's list). Then ask
     before bringing it in (the human may have a reason to wait). Ask the merge alone, in its own message, and wait for its answer; the gate comes after.
     On a yes, merge `origin/<default>` into the branch, never rebase (the branch is
     pushed), and push it best-effort. When the merge refuses to start (uncommitted work in
     the way) or stops on a conflict (then `git merge --abort`), say what is in the way and go on to the gate on the unmerged branch:
     bringing it in waits for the human. A base change that breaks a call is not re-planned here:
     the requester picks it at the gate, like any change (below).
   - **The recaps, in any session that did not see them taken** (a resume, or a pickup whose
     grill ran in another session). Offer, together in one message, a recap of what this
     session did not see decided, one line each: the grill's, when `progress.md` names a PRD written in
     another session; the design's decisions, when `plan/ui-handoff.md` was written in another session. On a yes,
     those decisions in plain words, on one screen, with no question.

   The gate shows, in plain words (the plan's labels — task and group numbers, decision and
   question ids — mean nothing to the reader, so name things by what they are, here and in every message before it):

   - **What will be built**: one short paragraph, in the requester's words, not the plan's.
   - **What the agent decided** that neither the grill nor the design did, in one numbered
     list. First a base change that touches a call (above); then the decisions a "Taken down" PRD holds under its `## Decisions` heading (step 3; its line reads
     `No grill: the requester asked the agent to decide.`): the agent took them when the
     requester said "just do it", and this is where they first see them. Then
     `## Before code`: a call that changes the plan's shape leads it, only when the plan has one (its bullet
     ends `Picking the other:`), with what picking the other would change; call no other a
     shape call, at the gate or in the walkthrough. Then `## Agent-decided` →
     `### User-visible`, one line each (a call with parts too: the parts are for the
     walkthrough); `### Internal` as a bare number, with no topics ("and 7 internal calls"), listed on request. Nothing to list (no
     such PRD, and both sections `None`) → this part and option 3 below are left out.
   - **How do we go on?** — exactly these options, in this order; instead of picking one,
     the human may change a call ("change 2"):
     1. **Start all-at-once**
     2. **Start step-by-step**
     3. **Explain them one by one** — the walkthrough (§The walkthrough); then this gate again,
        with the plan as it now stands.
     4. **Stop here** — the task waits at `plan-ready`; whoever resumes it gets this gate.

     The numbers are fixed: an option left out keeps the others' numbers, and option 3
     stays on offer each time the gate shows again.
     Options 1 and 2 carry, in a line each, what the orchestrator §"Implementation mode"
     descriptions say of the two modes. Only after option 1 or 2, and only when `implementation.auto_commit` does
     not pin it, ask the orchestrator §"Implementation mode" **Auto-commit** question, its
     two options verbatim; a pinned `on` / `off` is recorded without asking.

   **An early go-ahead does not skip the gate.** A requester who said to start, or named a mode, before
   the gate (for example "implement now, all-at-once" while answering the grill) has picked option 1 or 2,
   not waived the list: it is the only place the calls are seen before code. Show the gate short: what
   will be built and the numbered list, then one line instead of the options, naming the mode they
   picked and asking them to confirm it, change a call, or have the calls explained (option 3). Nothing to
   list → nothing to show: record their mode and start.

   **A change** — one the requester asked for or picked, from the list, the walkthrough's
   closing list, or a base change — is a PRD decision: append it to the PRD as its next
   free `PD<n>` (a part's own PRD, as its next free `PD<k>nn`, `PD203` after `PD202`; never the feature PRD, except a contract change, which goes there as a dated amendment: `.claude/agents/partition.md`, its section "A contract change from a part", whose route is proposed with the change), under a `## Decisions from the gate` heading at the end of the file (add
   the heading once), naming any `PD<n>` it supersedes:

   ```markdown
   - **PD<n> — <decision area>**: <the decision> — decided by the requester at the gate of
     task #<id>; discarded: <the plan's call>.
   ```

   With `PRD: none`, create the short PRD first, with step 3's "Taken down" template, its
   line under `# PRD` reading `Decisions taken at the gate before code.` and its heading
   `## Decisions from the gate`, and point `progress.md`'s `PRD:` line at it. Then the
   **Planner** updates `tasks.md` once so a task implements each (with a new PRD, its
   `> PRD:` line too). When the plan update does not land, take the `PD<n>` you appended back out of the PRD
   (and delete a PRD you created for them, setting `progress.md`'s `PRD:` line back to `none`), put `plan/tasks.md` back as committed
   (`git restore -- .claude/state/tasks/<id>/plan/tasks.md`), say so, and show the gate again unchanged:
   the PRD and the plan hold a change together or not at all. Otherwise commit by pathspec
   what changed (the PRD, `plan/tasks.md`, `progress.md`):

   ```bash
   git add <the PRD> .claude/state/tasks/<id>/
   git commit -m "plan(<id>): gate changes" -- <the PRD> .claude/state/tasks/<id>/ \
     && git reset -q -- <the PRD> .claude/state/tasks/<id>/
   git push origin harness/<id>-<slug>
   ```

   Then show the gate again, with only what changed (say what changed in words, never by its `PD<n>`). A plan that turns out to hold **independently mergeable units** (a `## Before code` bullet says so) can be cut here, before any code: keep the task on its
   first unit (the change goes to the Planner as above) and capture the rest as
   `/spinoff` stubs, or a `/define` when it is a real feature (`.claude/agents/partition.md`'s
   rule for a task that is not a part: no parent is opened). A task **with a PRD** (not a part) is cut instead: it goes on
   as Part 1 and its PRD becomes the feature PRD (`.claude/agents/partition.md`, its section "A cut at the
   gate before code"). A part of a cut feature is the other exception: its
   rest becomes an amendment of its parent, new rows, never stubs (the same rule).

   On a start, record `Mode: all-at-once` or `Mode: step-by-step`, `Auto-commit: on` or
   `off`, `Agent-decided: shown (gate)` (when the gate showed calls), and
   `Agent-decided calls: <n> shown, <m> changed` (`<n>` the calls the gate showed, the
   internal ones it counted included, each call once however often the gate was shown
   again, `0` when none; `<m>` how many of those the requester changed, each now a `PD<n>` —
   a change that was no shown call does not count) in `progress.md`, and commit and push
   them best-effort before any code:

   ```bash
   git add .claude/state/tasks/<id>/progress.md
   git commit -m "plan(<id>): mode" -- .claude/state/tasks/<id>/progress.md \
     && git reset -q -- .claude/state/tasks/<id>/progress.md
   git push origin harness/<id>-<slug>
   ```

   The lines are on the branch for a resume on another machine, and auto-commit OFF's
   zero commits cover the implementation, not the plan. A task with `plan/tasks.md` and no
   `Mode:` line has not passed the gate yet: a resume runs it first. Then flip
   `harness:status:plan-ready → harness:status:in-progress` (an architecture-drift stub,
   which skips step 5 and this gate, flips from `planning`): from here until
   review the task is in flight.

   Then implement in that mode. **All-at-once** invokes the **Implementer** sub-agent
   once with the [`tdd`](.claude/skills/tdd/SKILL.md) skill (spawn by
   reference, as the Planner in step 5; on an architecture-drift stub the
   **Architect** with [`update-architecture`](.claude/skills/update-architecture/SKILL.md) replaces it, per the preamble), naming the PRD
   path from `progress.md`'s `PRD:` line when it is not `none`: the Implementer reads its
   decisions as it reads the plan. **Step-by-step** runs the orchestrator's
   §"Step-by-step implementation" over `tasks.md`'s groups (each group's Implementer and
   per-step Reviewer named the PRD path the same way), and rejoins this flow at step 7
   after the last group. With **auto-commit OFF**, either mode runs the orchestrator's
   §"Auto-commit OFF" (the invocation points the Implementer at its staging protocol);
   in all-at-once its single gate runs when the Implementer signals done, before step 7.
   All work lives on the branch.

   **Calls added after the gate** (a plan rewritten by a discovery) are shown at the next
   checkpoint that exists: a group's checkpoint in step-by-step; auto-commit OFF's single
   gate in all-at-once; otherwise the merge gate (step 8). A call added after the gate is
   one the plan did not hold at its `plan(<id>): mode` commit
   (`git diff <that commit> -- .claude/state/tasks/<id>/plan/tasks.md` shows it). Present
   only those, beside that checkpoint's own content; the human answers them with it, and a
   change is an ordinary `changes`. Then record that checkpoint, once, on both
   `Agent-decided` lines in `progress.md`: what it showed on the `Agent-decided: shown` line
   (`shown (gate; group 2: <the calls, in a few words>)`), so each is shown once and a later
   stop shows only the ones not on it yet; and the number it showed, and of those the human
   changed, summed into the numbers of the `Agent-decided calls: <n> shown, <m> changed`
   line, which stays one line in that shape (`6 shown, 1 changed` and a stop showing 2 →
   `8 shown, 1 changed`; a task that passed its gate before this line existed has none:
   write it from `0 shown, 0 changed`).
   The merge gate only lists the calls no checkpoint showed: they are not counted.

7. **Review** — push the branch (`git push -u origin harness/<id>-<slug>`: not best-effort
   here, the PR needs it), **open the PR** (`gh pr create`, its body the "What it is about" block below, ending in `Closes #<id>` so the
   provider auto-links and closes the issue on merge; a task PR an earlier try opened is reused with its body as it is, never rewritten; a stacked part whose predecessor is unmerged opens it with
   `--base harness/<k-id>-<k-slug>` and hands the Reviewer that base; one whose predecessor
   merged since does the landing move first and opens it against the default branch, as
   `.claude/agents/partition.md`'s section "Chain start modes" says), and only then flip `harness:status:in-progress → harness:status:in-review`:
   a failed push or PR is said, and the task stays `in-progress`, so a resume runs this
   step again. The block, written once and not changed after: the request in two or three lines, in the issue's words; links to
   the issue, the PRD (`progress.md`'s `PRD:` line) and the plan
   (`.claude/state/tasks/<id>/plan/tasks.md`), each left out when the task has none, as
   permalinks at the commit you pushed — `https://github.com/<owner>/<repo>/blob/<oid>/<path>`,
   with `<oid>` from `git rev-parse HEAD` and `<owner>/<repo>` from
   `gh repo view --json nameWithOwner --jq .nameWithOwner` (closeout's archive move and the
   deleted branch break a branch link). Write it with your Write tool to `<dir>/pr.md`, in a
   fresh `<dir>` (`mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/pr-body.XXXXXX`, inside the
   repo and gitignored), then `gh pr create … --body-file <dir>/pr.md` and `rm -rf <dir>`:

   ```markdown
   ## What it is about

   <the request, two or three lines>

   Issue #<id> · PRD: [<file>](permalink) · Plan: [tasks.md](permalink)

   Closes #<id>
   ```

   **A pre-gate pass may already be this PR's review.** When `progress.md` reads
   `Auto-commit: off` and `Mode: all-at-once` (not `Mode: step-by-step (downgraded …)`),
   the pre-gate Reviewer reviewed everything the PR carries and, when its review was
   complete, posted its APPROVE with the record of the staged work. Two checks, both run
   by a script, say whether that review holds for the PR: its ledger is green against
   the PR's merge-base, and the merge executor finds in the PR the content and the plan
   that review read — it compares and merges nothing:

   ```bash
   git fetch -q origin <base> && \
     .claude/hooks/lib/lemony.sh review-ledger validate --task-id=<id> --anchor="$(git merge-base FETCH_HEAD HEAD)" --full-pass && \
     .claude/hooks/lib/merge-pr.sh <pr> --approve-issue <id> --check-approve
   ```

   Run the chain whole, with nothing after it that would replace its status: the
   executor's `approve-current:` line, printed last, is the yes. Then the PR is what
   that pass approved, and that pass is the PR's full pass. Invoke no Reviewer, and skip
   the ledger validation and commit that close this step: the chain ran that validation,
   and the ledger is already on the branch (the OK's `checkpoint` committed it). Its
   external effects were answered at the gate. Run the UI Designer lens below when the
   task touched UI, then go to the merge gate. Without that line (the verb's 1: the
   ledger is red; the executor's 40: the content differs, as when the human edited at
   the gate, or the plan changed after that review; its 1: no record to compare, as when
   that review posted none): no complete review covers what the PR carries, so run the
   full pass that follows, as for any PR. A fix that lands on the PR after this point (a
   UI Designer reject, a change at the merge gate) is content the record does not cover:
   the review that follows it is the full pass.

   Then invoke the **Reviewer** sub-agent (fresh
   context: it is what prevents the Implementer's confirmation bias) for the full pass,
   naming `tasks.md` and the PRD path (as in step 6), the
   intent it validates against — it runs the passes its own table owes, so the prompt
   names no review skill (orchestrator §"Sub-agent invocation"). The Reviewer posts its
   own verdict, APPROVE record included (`.claude/agents/reviewer.md` step 4): **never
   post that record yourself** — relayed, recomputed or quoted — and never tell a
   Reviewer not to post it; a Reviewer that approved without posting is invoked again,
   fresh, unless its return says its recipe printed no record: the base branch could not
   be fetched or compared in that clone, and a fresh review would end the same way, so
   tell the human what it returned and wait. `.claude/hooks/require-reviewer-record.sh` blocks any other poster, because the
   merge executor trusts the record as proof a Reviewer saw that exact content. **If the
   task touched UI** (its `plan/ui-handoff.md` exists), also invoke the **UI Designer** as
   a distinct design + a11y lens (REVIEW in `.claude/agents/ui-design.md`). Either lens
   rejecting routes back to the Implementer (rejection is transient — no dedicated
   label). The criteria the review owes are `tasks.md`'s tasks and,
   when the plan links a PRD, each of its `PD<n>`; for a part, also the feature decisions
   its plan's `> Feature PRD:` line names and the feature PRD's `## Cross-cutting
decisions`, and none of a sibling's. On approval (both lenses), **validate the Reviewer's ledger**
   (the full pass's; a pre-gate pass that stood as the PR's review had its own validated above, and this
   is skipped) (`lemony review-ledger validate --task-id=<id> --anchor=<merge-base> --full-pass`,
   where `<merge-base>` is the merge-base of the freshly fetched base branch and the PR
   head — `git fetch -q origin <base>` then `git merge-base FETCH_HEAD HEAD`, the same
   OID the stale-approve Diff-fingerprint digests from — routed as the orchestrator's
   §"Step-by-step implementation" says for a full pass:
   one fresh Reviewer retry on a red, then the human; never an APPROVE relayed on a red). Once it is green, commit the ledger file alone, naming it (a wider pathspec would carry a human's unstaged plan edit past the discovery it owes), and push it (the APPROVE stays valid: its diff fingerprint leaves
   `.claude/state` out):

   ```bash
   F=.claude/state/tasks/<id>/review-ledger/full-pass.json
   git add "$F" && git commit -m "review(<id>): full-pass ledger" -- "$F"
   git push origin harness/<id>-<slug>
   ```

   Chained into that commit, the verb comes first with nothing between it and the `&&`:
   `lemony review-ledger validate … && F=… && git add …`; a `; echo $?` or a `| tail`
   between them hands the `&&` another command's status, and a red ledger is committed.

   A task with no `plan/tasks.md` (an architecture-drift stub, a task triaged on 0.11.x, before tasks had
   a `plan/tasks.md`) skips the verb and this commit: it has no plan to check the review
   against. Then go to the merge gate.

8. **Merge gate** — human-explicit: never auto-merge.
   A stacked part first checks its PR's base, as the orchestrator's §"Merge gate" says for a
   stacked partition child. Part 1 of a cut at the gate before code first asks an open docs PR's merge question (`.claude/agents/partition.md`, its section "A cut at the gate before code"). A part that amended its feature PRD first looks for a part merged
   since its confirmation that still builds the superseded decision
   (`.claude/agents/partition.md`, its section "A contract change from a part", step 5). Surface the PR and wait, with the calls added after the gate that no checkpoint showed
   (step 6) and the full pass's pending external effects (orchestrator §"External effects"), each as its own question quoting its consumer note (`Your users will read this note (<where>): "<text>"`, or that it owes none and why), with the answers OK, ship it with this note (just OK when none is owed), OK, but no note (on every owed note), No, change it (with its why: the change itself or the note's text), or Nothing breaks — an OK, but no note or a Nothing breaks whose note is in the diff counts as a change that drops the note's text — in an `AskUserQuestion` form, or, when that tool is absent (a headless session), as numbered lines, `<n>` the effect's number, answered `<n> ok`, `<n> ok without a note`, `<n> no: <why>`, `<n> not an effect`; then, with no question, each answered effect whose note's text changed since its answer, with what it now reads; never one yes or no for all of them; record each answer as it lands in `.claude/state/tasks/<id>/external-effects.md` (orchestrator §"External effects", item 3), a No included, whatever route its fix takes, asked in a message with no merge option, writing the PR's "Needs your answer" block before and after them (orchestrator §"PR body"; an effect answered OK, ship it with this note whose note's place is the PR ends `— breaking for consumers`); a change sends the work back to the Implementer (one that contradicts a call of the plan or a `PD<n>` goes through a discovery first, as a checkpoint's
   `changes` does: orchestrator §"Step-by-step implementation"; an effect's answer that only
   touches its consumer note never does: orchestrator §"External effects", item 4), and the
   merge waits for the review that follows. An authorized merge executes through the checks
   precondition: `.claude/hooks/lib/merge-pr.sh <pr> --approve-issue <id> --squash`, never
   bare `gh pr merge` (`--approve-issue` makes it refuse content changed since the APPROVE;
   act on its exit code as orchestrator §"Executing an authorized merge — the checks precondition" lists).
9. **Closeout** — run the [`task-closeout`](.claude/skills/task-closeout/SKILL.md) skill (merge confirmed via `gh`), as in the
   orchestrator's §"Closeout".

## The walkthrough

The gate's option 3: the requester sees, piece by piece, the calls the gate listed, and
says what they would change. Nothing is implemented and no file of the project changes;
the grill's decisions are not walked again, nor the design's (`plan/ui-handoff.md`): the
recap covers them, and a replica draws from the design. The handoff's `## Tightened after the critique`
lines are not the design's: they are the agent's calls, walked like any other.

Walk the calls in the gate's order and numbering: a base change that touches a call, a "Taken down" PRD's decisions, `## Before code`, then
`### User-visible`, then `### Internal` only when asked. Name things by what they are, as
the gate does: no task numbers or decision ids here either, not even in words
("decision 11", "open question 2", "task 6"): say what it decides. Each piece
opens with one or two sentences on what this part is about and why it matters to the
requester, then gives the call, the reason behind it (what in the request, the PRD or the
repo drove it), the alternatives, and what changing it after code would cost. The alternatives are the call's `Discarded:` options, and only those (a "Taken down" PRD's decision: its `discarded:`):
the Planner checked them against the PRD and the design, and an option you think of here was not checked.
Before the first piece, have them checked again by a fresh general-purpose sub-agent (it reads whole files; its prompt goes by reference, as in the orchestrator's §"Sub-agent invocation": it
reads `.claude/agents/alternatives-check.md` for task `<id>`) and wait for its list: once per session for the committed `plan/tasks.md`, again when that
changes. A `ruled-out` option is left out, unmentioned: an option the requester
would have to be told "but the design decided otherwise" is no alternative. An `unclear` one is offered with the source line the
check quotes and what that line leaves open, so the requester knows they settle a gap in the source, not overrule it.
Match each row to its alternative by its line number, or by its words when the number does not fit.
The list is whole when every line of `plan/tasks.md` that holds a `Discarded:` under `## Before code` or `## Agent-decided` has a row, and so has every `discarded:` of a decision the PRD the plan links marks `agent-decided`.
When it arrives, find them yourself (the plan's: `grep -n 'Discarded:' .claude/state/tasks/<id>/plan/tasks.md`; the PRD's: its decisions marked `agent-decided`) and set its rows against them before the first piece:
the check returns rows and no count of them, so a row it left out shows only against the plan and the PRD.
When the list misses an alternative, gives a verdict outside the three, or does not come back, run the check once more; failing again, keep the rows the last list gives,
since a gap in it does not undo its other verdicts (a `ruled-out` option stays left out), and offer each alternative it leaves without a row, or with a verdict outside the three, as it stands, saying that one is unchecked;
when no list came back, say the
alternatives are unchecked and offer them as they stand. A quote you cannot find at its source is offered as the check's reading, not as the source's words.
A call with none left says only that the source leaves it no other, without naming an option it ruled out (the requester may still ask for one: that is a change). A piece
carries one concept, ends in one question (keep the plan's call, or change it?), and fits
on one screen; when a call holds several, split it. A neutral answer ("ok", "fine") keeps the plan's call; when you
recommend one of the alternatives, say so: it is taken only when the requester picks it. The requester does not have the code in mind: define every codebase
term the first time it appears, in plain words and with what it means for them.
A drawing (a sketch, a table, a replica) goes under the alternatives, never under the call: one labelled
block per option, the plan's first, each saying what in it is made up, and never the plan's option drawn alone.
Draw only when seeing decides (below): a call settled by its words (a label, a name) gets no drawing.

**A replica, when seeing it decides.** When a call is one the requester would judge by
seeing it (sizes, widths, spacing, layout, and on a new screen, what it holds and how it is arranged) and its effect can be drawn cheaply, build one
standalone HTML file in a scratch directory (`mkdir -p .lemony/tmp && mktemp -d .lemony/tmp/replica.XXXXXX`:
inside the repo and gitignored). Build it with whatever the call needs to be judged, and
nothing more: the simplest scene that shows it, never the real component. For what a new
screen holds and how it is arranged, an ASCII sketch or a table is enough; sizes, widths and
spacing need the page, since a cut label or a scrollbar only shows when drawn. Say where each
part of it comes from (the task's design in `plan/ui-handoff.md`, the repo, or made up for
the replica), so an approximation is never taken for what the requester will see. Show
the plan's option and its alternatives side by side, as any drawing does (above), and mark what goes wrong in each (a
cut label, a scrollbar).
Check it against a number the repo already measured where one exists (an earlier task's
archive, under `.claude/state/tasks/_archive/`, counts). When the numbers it would draw from cannot be trusted
(stale, or a layout that flexes, so only a browser measurement settles it), draw no replica from them: say so, and offer the measurement as a task of the plan;
taken, it is a change, as a check after code is. Open it with the system's command (`open`, `xdg-open` or `start`) and always give
its path; the piece also says in words what each option shows. When it cannot be opened,
say so, and offer a browser tool when one is available (a Playwright MCP, for example).
Build one on your own judgment; the requester may also ask for one on any call, or stop
them ("no replicas"). When a value cannot be drawn (a threshold, a limit), show its effect
on the real repo when that is cheap to compute; otherwise give the reason for the value
and what the requester would see go wrong without it, and offer checking it after code as
a real option, not a way past the question. A check after code the requester takes is a
change: it goes on the closing list, so the plan gains the task that runs it.

When the requester asks a question, answer it from the plan, the PRD or the repo before
moving on. When they change something, note it and do not edit the plan. At the end, list
the changes as you understood them, numbered, each stated as what will be done
differently, and ask whether this is what they want; correct the list until they say yes.
When there are none, say so ("no changes"), delete the directory and show the gate.
Then delete the directory when the requester confirms the closing list, unless they ask to
keep it (then give its path); a stopped session's directory is left alone. The confirmed
changes go through step 6's change route, then the gate shows again.
