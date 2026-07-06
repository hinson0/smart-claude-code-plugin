---
name: notebook
description: Use when the user wants to capture, review, or close the open loops Claude surfaced during the current conversation — the insights, suggested next steps, and follow-up questions Claude raised while chasing something else, which get buried as the conversation branches. Persists them to `.smart/notebook.md` as a running list of unfollowed leads. Trigger on `/smart:notebook`, or when the user says "notebook", "记录本", "做题本", "open loops", "what did we not follow up on", "别丢", "被掩埋", "未跟进", "现在有哪些没跟进的". A companion `Stop` hook already auto-captures marked blocks (★ Insight, 建议下一步) after every reply; this skill adds the free-form leads the hook cannot parse and manages their open/closed status. This is NOT `todo` (either/or decisions under a pinned mainline) and NOT `distill` (reusable knowledge Q/A archive) — notebook tracks unclosed leads so a question chased into another question never gets lost.
argument-hint: "empty = mine the conversation & list open leads · done <id> = close one"
model: sonnet
---

# notebook — Claude's open-loop notebook (做题本)

## What this is — and how it differs from todo / distill

As you chase one question, Claude surfaces others — an `★ Insight`, a "建议的下一步", a follow-up question. The conversation branches, and those leads get **buried**. The notebook is a running list of **open loops**: leads Claude raised but that have not been followed up on yet.

It is deliberately a third thing, orthogonal to its siblings:

- **todo** tracks *either/or decisions* under one pinned mainline.
- **distill** archives *reusable knowledge Q/A* into a topic knowledge base.
- **notebook** (this) tracks *unclosed leads* — open loops — so nothing gets lost as the conversation wanders.

Content language follows the conversation.

## The two-layer design (why a hook AND a skill)

Capturing open loops must not depend on Claude *remembering* to record them — the moment the conversation branches is exactly when Claude is most likely to forget. So capture is split across two layers:

- **A `Stop` hook (`hooks/notebook-capture.py`) already runs after every reply**, deterministically — it cannot be skipped and does not rely on Claude's self-discipline. It scrapes the two block shapes Claude emits in a fixed format — the `★ Insight … ─────` border block and a "建议的下一步 / Suggested next steps" heading section — and appends them to `.smart/notebook.md`.
- **This skill is the intelligent half.** The hook is a dumb scraper: it catches only the marked blocks and cannot judge a free-form suggestion or a mid-sentence follow-up question. When invoked, this skill re-reads the conversation, adds the leads the hook missed, and manages their open/closed status.

Together: the hook guarantees nothing marked is ever lost; the skill guarantees completeness and lets you close loops.

## State file: `.smart/notebook.md`

One fixed file per project, git-ignored (personal scratch, never committed). The hook creates it if absent. Shape:

```markdown
# 做题本 · Notebook
<!-- 自动由 Stop hook 捕获 · /smart:notebook 管理 · updated <YYYY-MM-DD HH:MM> -->

## 🔵 Open（CC 抛出、尚未跟进的线索）
- [ ] N1 <lead title>  · 🕒 <ts> · 来源:insight <!-- h:xxxxxxxxxx -->
  > <excerpt / gist>
- [ ] N2 <follow-up question>  · 🕒 <ts> · 来源:notebook

## ✅ Closed（已跟进 / 已回答 / 已采纳）
- [x] N0 <title> → 已跟进 (<date>) · <one-line outcome>
```

Each Open entry carries a stable `N#` id and a hidden `<!-- h:hash -->` fingerprint the hook uses for dedup. Leads this skill adds itself use `来源:notebook` (no hash needed — the skill dedups by meaning).

## Argument

| `$0` | Action |
|---|---|
| _(empty)_ | **Sync + list** — mine the current conversation for open loops, reconcile into `.smart/notebook.md`, print the Open list. |
| `done <id>` | **Close** — move one lead (e.g. `done N2`) from Open to Closed with a one-line outcome. |

## Empty: sync + list

1. **Resolve the file.** Project root via `git rev-parse --show-toplevel` (fallback: cwd); the notebook is `<root>/.smart/notebook.md`. Read it if present — the hook may already have populated it.
2. **Mine the current conversation** — the user + assistant messages of THIS session. Collect open loops: insights, suggested next steps, and follow-up questions Claude raised but that were never actually pursued or answered. Deliberately include the **free-form** ones the hook cannot parse — a suggestion phrased in prose, a question asked mid-paragraph. Do **not** re-mine source-file TODO comments or the native task list — those are different things.
   - A lead is "open" only if it was **not** followed up. If Claude raised it *and* the conversation already resolved it, it belongs in Closed, not Open.
3. **Reconcile** each lead against existing entries — by meaning, not wording (this discipline is borrowed from `todo`):
   - **New** — nothing matches → add under Open with the next `N#` id and `来源:notebook`.
   - **Duplicate** — an existing entry (including a hook-captured one) already covers it → leave it untouched; count it as already tracked. Match against the hook's entries too, so you never re-add what it already caught.
   - **Diff** — matches an existing entry but adds detail → append the new bit to that entry; do not spawn a second one.
4. **Write back**, then refresh the `updated` stamp.
5. **Print** the Open list to the conversation, most-worth-following-up first — a compact view so the user can see what is still dangling. Never write the report itself into any file other than the notebook.

## `done <id>`: close a loop

Move the entry with that id from Open to Closed: flip `[ ]`→`[x]`, append `→ 已跟进 (<date>) · <one-line outcome>`. **Never delete it** — closing is a state change, so a later-reopened question keeps its history.

## Guardrails

- **Never delete a lead.** Only append, or flip open→closed. When unsure whether a lead is closed, keep it Open — a dangling entry is cheap; a lost lead is the whole thing the user is trying to avoid.
- **Share the file with the hook safely.** Both the hook and this skill write `.smart/notebook.md` — always read-modify-write, and preserve entries you did not touch, **including the hook's `<!-- h:... -->` markers** (strip one and the hook will re-add that lead as a duplicate).
- **Do not overwrite the hook's work.** Treat hook-captured entries as first-class; dedup against them rather than rewriting them.
- The report is printed to the conversation only; the file holds the leads.
- This skill owns exactly one file (`.smart/notebook.md`) and no `.smart/settings.json` keys.
