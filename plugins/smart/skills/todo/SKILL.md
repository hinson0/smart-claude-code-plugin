---
name: todo
description: This skill should be used when the user wants to capture, anchor, or reconcile the decisions and options Claude surfaced during the current conversation into a persistent `.smart/todo-list.md` — a mainline-plus-branches todo. Trigger on `/smart:todo`, or when the user says "todo", "todolist", "待办", "主线", "pull me back", "拉回主线", "别跑偏", "I'm lost in branches", "现在该做什么", or wants to stop the conversation's ever-branching decisions from burying the original goal. It pins one Mainline (the fundamental goal) that branch churn can never overwrite, parks divergent decisions as reconciled branches (merging duplicates instead of rewriting), and re-surfaces the mainline every run to pull the user back. Reads the current conversation's surfaced decisions — not source-file TODOs or the native task list.
argument-hint: "no args = capture & reconcile decisions; `main <goal>` = set the mainline; `done <id>` = resolve an item"
---

# Todo — Conversation Mainline Anchor

Long agent conversations diverge. The user parks on a decision ("do A or B?"), asks a follow-up, and Claude re-organizes everything into a longer, renamed list — the original decision gets buried, and the user loses the thread of what they were actually trying to do. This skill fights that entropy by keeping one durable file, `.smart/todo-list.md`, that:

- **pins a Mainline** — the one fundamental goal — that branch churn can never overwrite, and
- **parks branches** — the decisions Claude keeps surfacing — reconciling them so re-runs *merge* into the existing entries instead of piling up duplicates.

The point is not to be a task manager. It is to **pull the user back to the mainline** every time it runs — so the report always restates the mainline first.

## The file: `.smart/todo-list.md`

One fixed file per project (git-ignored — it is personal scratch state, never committed). Content language follows the conversation. Use this structure:

```markdown
# Todo · <short label, e.g. learning-mode code review>
<!-- maintained by /smart:todo · updated <YYYY-MM-DD HH:MM> -->

## 🎯 Mainline (pinned — never let branches bury it)
> <one line: the fundamental goal>
- [ ] M1 <step>
- [x] M2 <done step>

## 🌿 Branches (decisions Claude surfaced — open forks)
- [ ] B1 <decision title>  ↳M1
  - Options: A) …  B) …
  - Leaning: <leaning + reason>
  - Status: 🔵 open
- [ ] B2 <decision title>

## 🧊 Low priority / frozen
- [ ] B3 <batch-later item>

## ✅ Archive (decided / abandoned)
- ~~B0 <title>~~ → decided A (<date>) · <reason>
```

Each branch keeps a stable id (`B1`, `B2`, …) and maps to the mainline step it serves (`↳M1`) when there is one. Stable ids let `done <id>` and reconciliation reference entries reliably.

## Modes

- `/smart:todo` (no args) — the main gesture. Scan the current conversation for the decisions Claude has surfaced, reconcile them into the file, report mainline-first.
- `/smart:todo main <goal>` — set or replace the Mainline. This is the **only** action that changes the pinned mainline.
- `/smart:todo done <id>` — mark a mainline step (`M#`) done, or move a branch (`B#`) to Archive with its decision recorded.

## Step 1 — Scope: what to read, what counts as a decision

Read the **current conversation** (this session's user + assistant messages). Do **not** scan source-file TODO comments, and do not read the native in-session task list — those are different things. Treat system reminders, raw tool-call JSON, and command stdout as noise.

From the conversation, extract only the **decisions Claude surfaced** — the things that make the user pause and choose:

- explicit either/or decisions (e.g. "revert to single-record registration vs. fix the Observer layer")
- prioritized action lists (must-fix / coverage-gap / low-priority)
- "which do you want to do first?" prompts and recommended orderings

Do not capture every passing mention or micro-task — that noise is exactly what the user is trying to escape. A decision earns a branch only when choosing wrong would send the work down a different path.

## Step 2 — Load or bootstrap

Read `.smart/todo-list.md` if it exists.

**First run (no file yet):** infer the Mainline from the conversation — the fundamental thing the user is trying to accomplish, underneath all the branches — and confirm it with `AskUserQuestion` ("Is your mainline X? [yes / let me reword it]"). Do not pin a guessed mainline silently; it is the anchor and must be right. Then create the file with the confirmed mainline plus the branches from Step 1.

## Step 3 — Reconcile (merge, don't rewrite)

For each decision from Step 1, align it against the existing branches **by meaning, not by exact wording** — the same decision often reappears renamed and expanded, and collapsing those back together is the core job of this skill:

- **New** — no existing branch matches → add it as a new branch with the next `B#` id.
- **Duplicate** — an existing branch already covers it with nothing new → leave it untouched; count it as "already tracked".
- **Diff** — matches an existing branch but adds new options, a new leaning, or new reasoning → **append** the new bits to that existing branch. Do not create a second branch; do not overwrite the old text. (A decision that resurfaces later, renamed and fleshed out, stays *one* branch.)
- **Overturned** — the conversation reversed an earlier decision → keep the old entry, append a short "correction" note, and move it to Archive with the new outcome.

When unsure whether something is New or a Diff, treat it as a Diff — appending is reversible and safe, whereas spawning a duplicate re-creates the clutter the user came here to escape.

## Step 4 — Write

Rewrite `.smart/todo-list.md` with the reconciled content. Guardrail: **never delete a branch.** Only add branches, append to them, or change their status (open → archived). The decision history is the value; dropping it silently defeats the skill. Leave the Mainline exactly as-is unless this run was `main <goal>`.

## Step 5 — Report (print to the conversation, never to the file)

Lead with the mainline — this is the "pull me back" moment:

```
🎯 Mainline: <goal>  |  progress M2✅ · next M1
This run: scanned N decisions → new X · merged Y · already-tracked Z · corrected W
🌿 Open branches (recommended order):
  B1 <title> (↳M1) — options A/B, leaning A
  B2 <title>
👉 Suggest deciding B1 first (it blocks mainline M1)
```

Keep it compact. The file is the record; the report is the nudge that re-anchors the user.

## Guardrails

- The Mainline changes **only** via `main <goal>` — never as a side effect of reconciling branches. This is the whole promise: branches never bury the mainline.
- Never delete branches — archive them instead, so the decision trail survives.
- Capture surfaced decisions, not every micro-task.
- Operate on the conversation, not on source-file TODO comments or the native task list.
- The report is printed to the conversation, not written into the file.
