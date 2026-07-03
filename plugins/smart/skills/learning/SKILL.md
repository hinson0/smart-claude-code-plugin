---
name: learning
description: 'Toggle "learning mode" — a co-coding mode where the user hand-writes the code themselves instead of you writing it. Trigger on /smart:learning, or whenever the user wants to enable or disable hands-on participation in coding: phrases like "learning mode", "let me write the code", "I want to participate in coding", "co-code with me", "参与编码", "hands-on mode", "turn learning mode off". This is a plain on/off switch — no ratios, no config. When on, every piece of code you would write goes to the console instead, labeled New file / New code / Modify / Delete for the user to type in, and you review what they land, one task at a time. Enabling injects the rules into `.claude/CLAUDE.local.md` (which Claude Code auto-loads every session) so they persist; the presence of that block is the entire state — nothing is stored in `.smart/settings.json`. Use this skill for any request about turning the user''s own involvement in writing code on or off.'
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

```markdown
<!-- SMART:LEARNING:BEGIN -->
## Learning mode (ON)

The user hand-writes the code themselves to learn. Whenever you would normally write code to disk, **don't** — instead print it to the console as a reference for the user to type in, then review what they land. One task at a time; never dump several stubs at once.

**Per-task loop:**

1. **Print, don't write.** Print each piece as one compact block — a header line then the code, nothing else (no "type this in" trailer, no separate purpose line):

   `[tag] path@anchor — one-line note`

   Pick the tag by the effect on disk: **[New file]** (file didn't exist) · **[New code]** (added lines that replace nothing — an import, an appended function) · **[Modify]** (existing lines rewritten — render as a `-`/`+` diff) · **[Delete]** (name what to remove at the anchor, no code block). The anchor is a function name or line range so the user knows where it lands.
2. **The user lands it.** The user types the code into the file themselves — that typing is the learning act. Do not write their code to disk for them.
3. **Review what landed.** Read the actual file on disk and review what the user wrote — correctness, style, and whether it fits the surrounding code. Acknowledge what is right first, then list issues by severity (must-fix vs. nice-to-have). Iterate if needed.
4. **Advance only after it passes review.** Move to the next task only when the landed code is solid.

**Working agreement:**

- **Never fabricate.** Do not narrate fake tool calls or invent tool output, test results, or "it's green / it's done." Every such claim must come from a real executed tool — verify the artifact (`test -f` / `wc` / `grep` / actual test output) before claiming it exists or passes.
- **Verify the artifact at its referenced path before diagnosing.** When something looks broken, confirm the file is actually where it is referenced from before blaming the framework or mechanism.
- **Treat fresh IDE/LSP diagnostics skeptically.** A "cannot find module" or unresolved-symbol error right after creating a file is usually indexing lag — confirm with the authoritative compiler or test runner before acting on it.
- **Don't invent domain values.** Codes, keys, identifiers, and enum values must be checked against the real system, not guessed.
- **Review with calibration.** Categorize feedback by severity; praise what is correct so the rest of the feedback is trusted.
<!-- SMART:LEARNING:END -->
```

## Format examples (illustrative — not injected)

These show what the rule in step 1 of the participation block produces. They are documentation only: the block carries the *rule*, and these examples are **not** injected into `CLAUDE.local.md` — they load when this skill is invoked, not during every session. The rule is the generator; these are sample output.

**[New file]** — the whole file is new:

```
[New file] src/utils/retry.ts — exponential-backoff retry wrapper
export async function retry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn() }
    catch (e) { if (i >= max) throw e; await sleep(2 ** i * 100) }
  }
}
```

**[Modify]** — existing lines rewritten, shown as a `-`/`+` diff:

```
[Modify] src/api/client.ts@fetchUser — wrap fetch in retry
- const res = await fetch(url)
+ const res = await retry(() => fetch(url))
```

**[New code]** — added lines that replace nothing:

```
[New code] src/api/client.ts@top-imports
import { retry } from '../utils/retry'
```

**[Delete]** — no code block, just name the target at the anchor:

```
[Delete] src/api/client.ts@8-10 — old local sleep(), superseded by utils/retry
```

## Constraints

- Only ever touch the marked region of `CLAUDE.local.md`; never clobber the user's other notes.
- All edits are idempotent — re-running the same command leaves the same end state, never a duplicate block.
- This skill does **not** use `.smart/settings.json` and owns no keys there; the `CLAUDE.local.md` block is the only state.
- Output in the same language as the user's conversation.
