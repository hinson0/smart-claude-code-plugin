---
name: learning
description: Toggle a persistent co-coding mode where the user hand-writes code and the agent reviews it.
disable-model-invocation: true
argument-hint: "[0|1] — 1=enable, 0=disable, empty=status"
---

Learning mode lets the user write the code by hand. The point is not to slow things down — it is that the user learns most by writing and reviewing the code themselves. So instead of writing it for them, you print the code to the console for them to type in, then review what they land.

This skill is a plain on/off switch. There is no config and no ratios: enabling injects a fixed rules block into `.claude/CLAUDE.local.md`, which Claude Code auto-loads into context at the start of every session; disabling removes it. **The block itself is the entire state** — block present means learning is on, block absent means it is off. Nothing is stored anywhere else, so the state can never drift out of sync.

## Argument

| `$0`      | Action                                                              |
| --------- | ------------------------------------------------------------------- |
| `1`       | **Enable** — inject the participation block into `CLAUDE.local.md`.  |
| `0`       | **Disable** — remove the injected block.                            |
| _(empty)_ | **Status** — report whether the block is present (on) or absent (off). |

If `$0` is anything else, report the usage above and stop.

## The state lives in one place: the `CLAUDE.local.md` block

This skill manages only the region between its markers in `.claude/CLAUDE.local.md`; everything else in that file is the user's and must never be touched:

```
<!-- SMART:LEARNING:BEGIN -->
...managed block...
<!-- SMART:LEARNING:END -->
```

`CLAUDE.local.md` is the personal, git-ignored per-project memory Claude Code loads every session, which is why it is the right home for a rule that must persist without re-invoking this skill. There is deliberately **no** `.smart/settings.json` involvement — learning owns no keys there, so there is no second store to keep in sync and no drift to reconcile.

## Steps

### 1) Resolve project root and parse the argument

- Project root: `git rev-parse --show-toplevel`; if not in a git repo, fall back to the current working directory.
- Read `$0` and branch to Enable / Disable / Status below.

### 2) Enable (`$0 == 1`)

1. **Ensure `.claude/CLAUDE.local.md` exists and is git-ignored.** If the file is absent, bootstrap it (and its `.gitignore` entry) by following `@../local/SKILL.md`. If it already exists, leave its content alone.
2. **Inject the participation block** (see "The participation block" below). Do it idempotently:
   - If the `<!-- SMART:LEARNING:BEGIN -->` … `<!-- SMART:LEARNING:END -->` markers already exist, replace everything between them (markers inclusive) — this refreshes a stale block after a version update.
   - Otherwise append the block to the end of the file, separated by one blank line.
3. **Apply immediately.** The rules are now active. Acknowledge that for the remainder of *this* session you will also follow them, not just future sessions.
4. **Report**: learning is on, and whether the block was added or updated.

### 3) Disable (`$0 == 0`)

1. **Remove the injected block.** If `<root>/.claude/CLAUDE.local.md` exists and contains the markers, delete the region from `<!-- SMART:LEARNING:BEGIN -->` through `<!-- SMART:LEARNING:END -->` inclusive, plus one adjacent blank line so no gap is left. Leave every other line untouched. **Never delete the `CLAUDE.local.md` file itself**, and never touch the `.gitignore`.
   - If the file or the markers are absent, there is nothing to remove — say so.
2. **Stop applying.** Note that the participation rules no longer apply for the rest of this session.
3. **Report**: learning is off, and whether the block was removed or was not present.

### 4) Status (no argument)

1. Check whether `<root>/.claude/CLAUDE.local.md` contains the managed markers.
2. Report **on** if the block is present, **off** if not. That is the whole state — there is nothing else to reconcile.

## The participation block

Inject exactly this content between the markers. **Localize the prose to the user's working language** — the language of their `CLAUDE.local.md` and conversation. The English below is the canonical version to translate; do not change its meaning, only its language.

````markdown
<!-- SMART:LEARNING:BEGIN -->
## Learning mode (ON)

The user hand-writes the code themselves to learn. Whenever you would normally write code to disk, **don't** — instead print it to the console as a reference for the user to type in, then review what they land. One task at a time; never dump several stubs at once.

**Per-task loop:**

1. **Print, don't write.** Print each piece as a header line *followed by* the code in a **language-tagged fenced code block**, so the terminal syntax-highlights it. Never wrap the header inside the fence, and never leave the fence untagged — a bare (untagged) fence renders monochrome and is hard to read:

   `**[tag]** path@anchor — one-line note`

   Then the fenced block(s), tagged so tokens are coloured. For **[New file]** / **[New code]** print **one** fence tagged with the file's language (`ts`, `tsx`, `py`, `go`, …), holding the clean, prefix-free new code. For **[Modify]** print **two** fences: first a `diff`-tagged fence holding **only the removed lines** (each a `- ` line) so deletions render red and stay obvious — the user reads these, never copies them; then a fence tagged with the file's language holding **only the final new code** (no `+`/`-` markers) so the user selects and pastes it whole. The split is deliberate: `-` lines you *read* (red is a feature), `+` lines you *copy* (a prefix is a nuisance) — so never put `+` lines in a copyable block; additions are always prefix-free.

   Pick the tag by the effect on disk: **[New file]** (file didn't exist) · **[New code]** (added lines that replace nothing — an import, an appended function) · **[Modify]** (existing lines rewritten) · **[Delete]** (name what to remove at the anchor, no code block). The anchor is a function name or line range so the user knows where it lands.
2. **The user lands it.** The user types the code into the file themselves — that typing is the learning act. Do not write their code to disk for them.
3. **Review what landed.** Read the actual file on disk and review what the user wrote — correctness, style, and whether it fits the surrounding code. Acknowledge what is right first, then list issues by severity (must-fix vs. nice-to-have). Iterate if needed.
4. **Advance only after it passes review.** Move to the next task only when the landed code is solid.

**Format examples — match these shapes exactly:**

New file → one fence in the file's language, clean code:
**[New file]** src/db/pool.ts — postgres connection pool
```ts
export const pool = new Pool({ max: 10 })
```

New code (adds lines, replaces nothing) → one fence:
**[New code]** src/db/pool.ts@imports
```ts
import { Pool } from 'pg'
```

Modify → **two** fences: a `diff` holding only the removed `-` lines (red — you only read them), then a clean fence with the final code (no `+`, you copy it whole):
**[Modify]** src/db/pool.ts@query — add a 5s statement timeout
```diff
- return pool.query(sql, params)
```
```ts
return pool.query({ text: sql, values: params, query_timeout: 5000 })
```

Delete → no fence; name the target at the anchor:
**[Delete]** src/db/pool.ts@40-44 — legacy sleepRetry(), superseded by the pool timeout

**Working agreement:**

- **Never fabricate.** Do not narrate fake tool calls or invent tool output, test results, or "it's green / it's done." Every such claim must come from a real executed tool — verify the artifact (`test -f` / `wc` / `grep` / actual test output) before claiming it exists or passes.
- **Verify the artifact at its referenced path before diagnosing.** When something looks broken, confirm the file is actually where it is referenced from before blaming the framework or mechanism.
- **Treat fresh IDE/LSP diagnostics skeptically.** A "cannot find module" or unresolved-symbol error right after creating a file is usually indexing lag — confirm with the authoritative compiler or test runner before acting on it.
- **Don't invent domain values.** Codes, keys, identifiers, and enum values must be checked against the real system, not guessed.
- **Review with calibration.** Categorize feedback by severity; praise what is correct so the rest of the feedback is trusted.
<!-- SMART:LEARNING:END -->
````

## Format examples (illustrative — not injected)

The participation block above now carries condensed few-shot examples of all four tags, so they are injected every session and the format holds without re-invoking this skill. The fuller examples below are documentation only — they load when this skill is invoked, and exist so a maintainer can inspect each shape in isolation.

Note the shape in every example: the **header line sits outside the fence**, and every **fence is tagged** — a language (`ts`, `py`, …) for code to copy, or `diff` for the removed-lines block of a **[Modify]**. That is what makes the terminal syntax-highlight the code; a bare fence — or a header line stuffed inside the fence — falls back to unreadable monochrome.

**[New file]** — the whole file is new; tag the fence with the file's language so every token is coloured:

````
**[New file]** src/utils/retry.ts — exponential-backoff retry wrapper
```ts
export async function retry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn() }
    catch (e) { if (i >= max) throw e; await sleep(2 ** i * 100) }
  }
}
```
````

**[Modify]** — existing lines rewritten. Print **two** fences: a `diff` fence with **only the removed lines** (`-`, renders red — the user reads these, never copies them), then a **language** fence with **only the final code** (no `+`, selects-and-pastes clean). Deletions stay obvious in red; additions stay prefix-free for copying:

````
**[Modify]** src/api/client.ts@fetchUser — swap the bare fetch for a retry wrapper
```diff
- const res = await fetch(url)
```
```ts
const res = await retry(() => fetch(url))
```
````

**[New code]** — added lines that replace nothing; tag with the file's language:

````
**[New code]** src/api/client.ts@top-imports
```ts
import { retry } from '../utils/retry'
```
````

**[Delete]** — no code block, just name the target at the anchor:

```
**[Delete]** src/api/client.ts@8-10 — old local sleep(), superseded by utils/retry
```

## Constraints

- Only ever touch the marked region of `CLAUDE.local.md`; never clobber the user's other notes.
- All edits are idempotent — re-running the same command leaves the same end state, never a duplicate block.
- This skill does **not** use `.smart/settings.json` and owns no keys there; the `CLAUDE.local.md` block is the only state.
- Output in the same language as the user's conversation.
