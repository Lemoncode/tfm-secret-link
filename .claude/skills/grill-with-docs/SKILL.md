---
name: grill-with-docs
description: 🍋 Relentlessly interview the user about a plan or design until shared understanding is reached, grounded in existing code and documentation. Drills decision by decision, presents alternatives with trade-offs, updates CONTEXT.md inline and offers ADRs sparingly. Produces a PRD (and resumes WIP grills across sessions). Use when the user wants to stress-test a plan, define product requirements, or formalize a design grounded in their project.
origin: vendor
vendor_version: '0.12.0'
invoked-by: [orchestrator]
attribution:
  - source: mattpocock/skills
    author: Matt Pocock
    url: https://github.com/mattpocock/skills
    license: MIT
    copyright: Copyright (c) 2026 Matt Pocock
    relationship: derived-from
    note: grill workflow and decision-by-decision interview structure
---

# Grill With Docs

## Core Principle

Push the user to think deeper. Drill every decision branch. Present concrete alternatives with trade-offs — don't just ask open questions. The goal is not validation; it's helping the user discover a better design through structured interrogation, grounded in the project's existing code and documentation.

## Hard rules (the meta-feedback from past sessions)

1. **NEVER auto-decide.** Every structural decision (architecture, naming, file structure, storage, tooling, agents, scope, etc.) goes through `AskUserQuestion`. "My recommendation: X" is fine as an OPTION in a question — never as a closed decision in the plan.
2. **One question at a time.** Always. Wait for the answer before continuing.
3. **Recommend, never impose.** When proposing alternatives, mark one with `(Recommended)` and explain why. The user chooses.
4. **Don't close the plan unilaterally.** Even if you think the grill is done, ASK the user before closing. A WIP plan is acceptable; a falsely-closed plan is not.
5. **Update artifacts inline as decisions land.** `CONTEXT.md` and `ADRs` get touched when the moment is right, not batched at the end.

## Mode Detection

Detect automatically from what the user provides:

- **Validation** — user brings a structured plan with decisions already taken → challenge and verify.
- **Co-creation** — user brings a vague idea or wish → build the design together through questions and proposals.

If ambiguous, ask whether the user wants the plan challenged or built together.

## Workflow

### 1. Setup

- Announce that by default you'll briefly explore the codebase and docs to ground your questions, and that the user can opt out.
- If allowed, do quick reconnaissance:
  - Project structure, stack, conventions
  - `CLAUDE.md`, `CONTEXT.md`, `CONTEXT-MAP.md` if present
  - `docs/architecture.md` if present — the maintained map of the system's shape; orient
    the grill against it so proposals don't contradict existing boundaries/seams. Trust it
    for the big picture; verify against code where a decision actually turns on it. It is
    **absent by default and that is fine** — grill as today, and never push the user to
    create it (it is **not** one of the files this skill creates lazily below).
  - `docs/adr/` if present
  - The project's conventions — the rules under `.claude/rules/` (each one's `paths:`
    says what it governs), the client skills under `.claude/skills/` (by their
    descriptions) and `docs/reference/` if present.
- Detect mode (validation vs co-creation).

### 2. Phase A — Big Picture

High-level questions first. Validate direction before diving into details. Cover both **technical** and **product/UX** perspectives.

Examples:

- "Does the overall approach make sense?"
- "Are there fundamental assumptions worth challenging?"
- "Who's the actual user / customer / audience here?"

### 3. Phase B — Branch by Branch

Identify the key decisions. Walk them one at a time.

For each branch:

- Ask the question (with concrete alternatives + trade-offs).
- Wait for the answer.
- Resolve and close the branch.
- If sub-branches emerge, note them and ask whether they're worth exploring now.

**Before a branch closes: look.** A decision often rests on a statement of how something behaves: what the project's code does with an input, what a library or a tool supports, what a command prints. Whoever made the statement (the user, a document, or you, inside an option you offered), when it can be checked from this session and nothing in this grill has checked it, look before the branch closes: read what exists (the project's code, the documentation or source of what it uses or would use), or run what exists on a real case, then tell the user in your message what you read or ran, what it showed and what it means for the decision: the PRD keeps the record for whoever reads it later, and the user answers from the message. A look that only reads, or runs code whose effects end with the run, needs no permission and is not a question. It adds no file of its own to the repository: a file it needs (an input, a small script) goes in a temporary directory outside it, removed after the look. When a check would reach outside this machine (call a service, send or change anything there, even through the project's own code and with access the shell already has), would change data the project keeps (a local database, a file the project reads), or turns on a choice that is the user's (it can be run in ways that would answer differently), say what it would do and ask before running it. When you cannot tell what running something changes, ask too. On a no, the statement stays unchecked, under `## Assumptions`.

**On a service the project does not own, a check sends what was agreed and no more.** Wherever that service runs, on this machine too, a check that would send it data or change anything there asks leave first and says what it would send. What the user agreed to is all it sends: a request beyond it (another path, a value other than the one they gave) is asked for first. Until the service has accepted one, each request goes alone, and a refusal that does not say what to change goes back to them before any further request. They may know what is missing, and each guess is one more request on someone else's service.

**A look that needs a credential asks for its name.** When what a look runs has to be handed a credential (a token, a key), or a first attempt is refused for want of one, the user says which one: ask for the name of the environment variable or profile that already holds it, and when the check is one you ask leave for, ask in that same question. A variable set after this session started is not visible to it. Search for none, in the environment, the home folder or the project's files, and hand over none the user did not name: what this session can reach was put there for other work, and a name does not say which service a credential opens or whether that one is a test or a live one. A file that holds secrets is not read, not loaded by a command of yours and not offered as a way on: it holds more than the one value. Before any command that uses the credential, check in a command of its own that the named variable is set. When the variable is empty, send nothing and tell the user. When the user has no variable this session can see, the check cannot be made in this session and its statement stays unchecked. The command takes the credential from its variable: its value goes in no command and in nothing printed, not even through a verbose mode that shows a request's headers. Access that what you run holds on its own (the project's code reading its own configuration, a tool's logged-in profile) is not a credential you hand over: when that check asks leave, its question says which access it would use. A value the project's tracked files give in the open for its own local setup (a development database's password, a seeded login) is configuration, not a credential.

When what you find contradicts the answer the branch was about to close on (the statement it rests on is false or holds only under a condition nobody stated, or what exists does not do what the user said they want from it), or removes one of its options, say so and ask that question again: the branch closes on the answer given after the look. A finding that does neither (a cost of the answer, a case it handles badly) is not a question: tell the user, say that the answer stands unless they say otherwise, and record it under the decision.

Reading settles what a file says. Running settles what the code does. A statement that covers every case ("sorts every locale the same way", "never returns an empty page", "works the same on each platform") is settled by running the case that could break it, since the line that suggests it holds is the reason it was believed: a slug helper that "keeps accented letters" is settled by calling it on `café`, not by finding the line that mentions accents.

Record the look in the PRD, under the decision it served: the file and line read, or the command run and the lines of its output that show the answer. The PRD is committed and pushed, so rows of data and anything that reads as a credential are described, not copied; the same holds for a spike's answer. When the PRD file does not exist yet, create it now, with `Status: in_progress`. A statement recorded as verified without what was read or run counts as unchecked, and is looked at like any other. A look that could not be done (the command was refused, what it needs is not installed, the user opted out of exploration at setup) leaves its statement under `## Assumptions`, with what stopped it.

**What a look cannot settle: note a spike.** Some statements are about something the project does not have yet: a library not installed, an integration not written, two pieces never run together, a service nobody here has called. There is nothing to read or run, so the way to know is to build the least that shows it: a spike. A statement that needs access this session lacks (an account, a credential, a paid service) is a spike too. When one comes up, tell the user in one line (what is unknown, and which decision waits on it), write it under `## Spikes noted` in the PRD file, and ask the branch's question as usual: the user answers on what they believe, and the decision is recorded as provisional, waiting on that spike. A later statement that the same experiment would settle joins that spike while it is still noted: one line to the user, a line of its own inside that spike's entry under `## Spikes noted` with the decision that waits on it, and that decision provisional too. Then go on to the next branch: a calendar library "handles a weekly event across a clock change" is a spike when the project has never installed it. Noted spikes are offered together when the grill closes (§6); when the user asks for one to run now, run it now as "Running a spike" in §6 says, then go on with the grill.

A preference, a choice of scope and what people will do have nothing to look at. A statement nothing can test yet (a system another team has not built) goes under `## Assumptions` with how it will be checked once it can be.

**Checkpoints**: after closing important branches, offer pending points to the user explicitly:

> "We've closed branches A, B, C. There are 5 open points left: [list]. Want to keep grilling all, prioritize some, or pause here?"

**A cut asked for.** When the user says the feature is to be cut into parts ("it is big, cut it"), before the grill or in the middle of it, the cut is decided: read `.claude/agents/partition.md` (its section "A cut on the requester's word") and grill only what crosses parts from there. Keep every decision already closed; a topic only one part touches is noted `open: <topic>` for that part, not walked now. Both go into the PRD at once (a `Cut: asked by the requester.` line under its title, the topics under `## Open Points`), so a paused grill resumes as a feature grill: keep them in the resume prompt too.

### 4. Co-creation Approach — Socratic + proposals

When the user doesn't have a formed opinion, NEVER leave it open-ended. Present alternatives:

> "You have these options: A (pros/cons), B (pros/cons), C (pros/cons). My recommendation: B because X. But you decide."

This helps the user learn through forced trade-off comparison, not just decide blindly.

### 5. Documentation Grounding (the "with-docs" part)

While grilling, weave in documentation updates as decisions crystallize.

#### File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   ├── adr/
│   │   ├── 0001-event-sourced-orders.md
│   │   └── 0002-postgres-for-write-model.md
│   └── prds/
│       └── checkout-flow-2026-05-22.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   ├── adr/                          ← system-wide decisions
│   └── prds/                         ← system-wide PRDs
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files and directories lazily — only when there's something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed. Same for `docs/prds/` when the first PRD lands. **`docs/architecture.md` is the exception — never create it here.** It is client-owned; only the Architect's [`update-architecture`](.claude/skills/update-architecture/SKILL.md) skill ever edits it (and only when the file already exists).

#### Challenge against the glossary

When the user uses a term that conflicts with `CONTEXT.md`, call it out immediately:

> "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

#### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose precise canonical names:

> "You're saying 'account' — do you mean the Customer or the User? Those are different things."

#### Discuss concrete scenarios

When domain relationships are being discussed, stress-test with specific scenarios. Invent edge cases that force the user to be precise about boundaries.

#### Cross-reference with code

When the user states how something works, verify against code. If contradicted, surface it:

> "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

#### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch — capture it as it happens. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` is a glossary, NOT a spec or scratch pad. Never put implementation details there.

#### Offer ADRs sparingly

Only offer an ADR when ALL THREE are true:

1. **Hard to reverse** — meaningful cost of changing later.
2. **Surprising without context** — future reader will ask "why this way?".
3. **Result of a real trade-off** — genuine alternatives existed and one was picked for specific reasons.

Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md). If any of the three is missing, skip.
Before writing one, check it against the live ADRs and conventions exactly as
[`write-adr`](.claude/skills/write-adr/SKILL.md) step 2 does, and put any clash to the human in the grill itself.

### 6. Closing

When branches are exhausted or the user says they've had enough, ask before closing. The question depends on whether spikes are still noted:

- **No spike noted** → confirm with the user that the grill is done.
- **Spikes noted** → one question lists them and offers its answers by name (run all, run these, close without them). It recommends none of them, and a reply that picks none (a bare "ok") is asked once more; in a session with no question tool the answers are numbered. Each line says what the spike would find out and each decision that waits on it. For anything it would do beyond its own folder, the line says what: the action (read, create, send), where (which service or local store, and whether a test one or a live one), who or what it reaches and what it may cost. It also says what the spike needs from the user (an account, a credential), when it does.

**A credential travels by name.** Whenever a spike needs one, at the offer or later, ask for the name of the environment variable or profile that already holds it: a variable set after this session started is not visible to it. When the user has none the session can see, that spike cannot run in this session and its statement stays unchecked. When the user pastes the value itself, pass nothing on, tell them it is now in this conversation's record and that they may want to replace it, and ask for the name.

**Running a spike.** Run the spikes the user took one at a time, waiting for each to return before the next and before anything else. For each:

1. Create its folder outside the repository, so nothing it installs or builds reaches the project: a new directory under your scratchpad directory when this session names one, otherwise `mktemp -d` (Claude Code may then ask the user to allow the sub-agent's writes there: say so in the question). Keep its path. When no folder can be made, the spike does not run and its statement stays unchecked.
2. In a git checkout, take the project's fingerprint (outside one, skip this step and step 4):

   ```bash
   ( cd "$(git rev-parse --show-toplevel)" && { git rev-parse HEAD; git branch --show-current; git status --porcelain; git diff HEAD | git hash-object --stdin; git ls-files -z -o --exclude-standard | while IFS= read -r -d '' p; do git hash-object -- "$p" 2>&1; done | git hash-object --stdin; } 2>/dev/null | git hash-object --stdin )
   ```

3. Invoke the **Spike Runner** sub-agent (agent type `spike-runner`). It reads no task state, so its brief is written out in full: the question, what counts as an answer, the decision that waits on it, the existing files it concerns, the folder's path, what the user agreed it may do beyond that folder, and the name of any variable or profile they gave. One spike per invocation; two doubts that one experiment answers are one spike, and its brief gives each doubt what counts as its answer and the decision that waits on it.
4. When it comes back, take the fingerprint again. A different one means the project changed while the spike ran: show the user what `git status` and `git diff` print and ask whether the change is theirs, before anything else. When it is not theirs, it is theirs to undo: restore nothing yourself, since a restore would also take edits of their own.

What it returned decides the rest:

- **An answer** → tell the user what was run, what came out and anything the spike left beyond its folder, and set the result against what the brief said would count as an answer, one statement at a time when the spike carried several: each has its own decision. A plain yes that confirms a provisional decision makes that decision final. Anything else (a no, an "only when…", a yes that holds only with a change nobody decided, an answer to a narrower question than the one asked) reopens that branch as a normal question, however plain the way to keep the decision looks: the user took it on what they believed. Write the result into the PRD under the decision it settles: what was tried, what came out, any fragment worth keeping, the repository path of each existing file it concerns (never a path inside the spike's folder, which is deleted), and anything it left beyond its folder.
- **A need, a doubt or `not answered`** (an access it lacks, something it would have to do beyond its folder that the user did not agree to, a question that reads two ways, something in its way) → put it to the user. With their reply, continue the same sub-agent; without one, the spike ends unanswered.
- **Cut short** (the result comes marked partial, or without an answer: its turn limit, or an error) → read `notes.md` in its folder, tell the user how far it got and ask whether it goes on. On a yes, continue the same sub-agent; on a no, the spike ends unanswered.
- **A further question it raised** → tell the user; taking it is another spike.

To continue a sub-agent, send it a message (`SendMessage` to that agent) and wait for it: it keeps what it built. When that is refused, or it comes back without what it had built, invoke a fresh Spike Runner with the same brief and tell it to start from `notes.md` in the folder.

A spike that ends unanswered may have left things beyond its folder: its `notes.md` has a `Created outside:` line for each and a `Removed:` line for each it took away. Tell the user what is still there and write it into the PRD, since the folder is about to go. When a spike ends, however it ends, its entry leaves `## Spikes noted` and each decision that waited on it loses the provisional mark: answered, a decision is as the answer left it; not taken or unanswered, it stands as the user took it, and its statement goes under `## Assumptions` with what the spike would have tried. Nothing a spike wrote is copied into the project: a fragment in the PRD is material for the plan, and the code is written under it. When every taken spike has ended, delete the spikes' folders. The grill then closes without a second question, unless a branch reopened: that branch is walked, and the closing question is asked again, listing only the spikes noted since. A grill is not paused while a spike runs: it returns first.

Then:

- Generate the PRD at `./docs/prds/<topic>-<date>.md` relative to the **project working directory**, creating `docs/prds/` lazily. This does NOT require a git repo or a pre-existing `docs/` — an ordinary project folder is enough.
- The file uses a `Status:` frontmatter field: `in_progress` while the grill is WIP, `completed` when closed. SAME FILE, just different status.
- **Location fallback (narrow)**: use `~/.claude/plans/<slug>-<date>.md` ONLY when there is genuinely no project workspace — e.g. the CWD is the home directory, or the grill is abstract and tied to no repo. The mere absence of git or of a `docs/` folder is NOT a reason to fall back. **If unsure whether the CWD is the right home for the PRD, ASK the user where to put it — never silently use the plans fallback.** A PRD that lands in `~/.claude/plans/` is invisible from the user's working directory and causes confusion later.
- See [reference.md](./reference.md) for the PRD template (and the WIP-specific sections used while `Status: in_progress`).
- **Before writing**: the closing question above has been answered by the user; the grill never closes on its own.

## Tone

**Adaptive**. Start curious-collaborative. If the user gives shallow answers ("because", "I don't know"), escalate intensity. Always constructive, never hostile.

Three levels (full detail in [reference.md](./reference.md)):

1. **Curious-collaborative** (default).
2. **Challenging** (when user gives surface answers).
3. **Provocative-constructive** (when shallow thinking persists).

**Never go beyond level 3.** Use proposals, not insults.

## Pause & Resume

First-class workflow. Same file as the final PRD — just a different `Status:`.

### Pausing mid-grill

When the user signals they want to stop for now ("let's continue tomorrow", "leave it here", or similar):

1. **DO NOT close the plan unilaterally.** Ask the user how to proceed.
2. Save state to the PRD path chosen per the Closing location rule (`./docs/prds/<topic>-<date>.md` in the project workspace; the `~/.claude/plans/` fallback only when there is no project — ask if unsure). Set `Status: in_progress`.
3. Add the WIP-specific sections to the same file (see reference.md): "Decisions closed" (its "Why" cell carries what a look read or ran, when one served the decision, and "provisional" when it waits on a spike), "Open decisions" (priority order), "Spikes noted" (each with the decision that waits on it, so the resumed grill still offers them at its close), "Side tasks pending", "Resume prompt".
4. The Resume prompt must be the exact text the user can re-invoke later, e.g.:
   ```
   grill-with-docs — resume <topic>. Read <path-to-PRD>. Start at decision #N. Keep grilling mode — one question at a time, do NOT auto-decide.
   ```
5. Only after confirming with the user → end the turn.

### Resuming

When the user re-invokes the skill to pick a grill back up:

1. Locate the in_progress PRD file (the user usually provides the path).
2. Read it fully — especially "Decisions closed", "Open decisions" and "Spikes noted": a noted spike is still offered when the resumed grill closes.
3. Confirm with the user where to resume: which decisions are closed, which open one comes next, and whether to keep that order.
4. Continue branch-by-branch.

### Completing

When the grill closes:

- Flip `Status: in_progress` → `Status: completed`.
- Distribute the content of the WIP sections into the structured PRD sections (User Stories, Decisions, etc.) and remove the WIP-only sections.
- Same file. No moves between paths.

## Codebase Exploration

- **At start**: brief project reconnaissance (single bash listing + read of `CLAUDE.md`, `CONTEXT.md`, project root). NEVER deep-dive unprompted.
- **During**: on-demand when a question can be answered by code or by reading a rule/doc.
- **User opt-out**: respected if requested at setup.
- **Watch for existing partial work**: if the user has been iterating on adjacent ideas, surface what already exists (don't reinvent).

## Scope

Covers BOTH technical and product/UX. Don't assume product decisions are resolved unless the user explicitly says so. Many technical users benefit from being pushed on UX, business model, pricing, anti-copy, onboarding cost, etc.

## "Beyond the basics" — proactive risk surfacing

If the user explicitly asks for it ("go beyond the basics", "what am I not seeing"), or if you detect they're treating a strategic question as a technical one, surface 4-6 strategic risks/blind-spots they haven't named. Examples:

- Cost / unit economics at scale (token spend, licensing).
- Data residency / compliance for selling to regulated industries.
- Anti-copy / IP protection if productizing.
- Onboarding cost per customer (affects pricing).
- Documented failure modes ("this is NOT for X").
- Continuous-improvement mechanisms.

Prioritize the ones most likely to kill the project if ignored.

## Uncontemplated scenarios

When a question or situation doesn't clearly fit these rules:

1. Apply the closest matching approach with explicit reasoning.
2. **Flag it**: "This scenario isn't covered by the skill. I applied X because Y. Want me to add a rule?".
3. Offer to update the skill.

## Cross-references with other skills

In the harness, the grill output (PRD) feeds the Planner:

```
grill-with-docs → PRD → task issue + branch → write-plan → plan (tasks.md) → plan-to-issue → the issue's plan block
```

| Scenario                                    | Next skill                                                         |
| ------------------------------------------- | ------------------------------------------------------------------ |
| PRD completed → needs the plan (`tasks.md`) | [`write-plan`](.claude/skills/write-plan/SKILL.md) (Planner)       |
| Plan written → needs the issue's plan block | [`plan-to-issue`](.claude/skills/plan-to-issue/SKILL.md) (Planner) |
| Bug spotted during exploration              | [`triage-issue`](.claude/skills/triage-issue/SKILL.md)             |

Mention the relevant option in the "Next Steps" section of the PRD output.

---

See also:

- [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) — format for the project glossary.
- [ADR-FORMAT.md](./ADR-FORMAT.md) — format for Architecture Decision Records.
- [reference.md](./reference.md) — PRD template, question categories, tone calibration details.
