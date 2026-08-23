---
name: i-am-the-king
description: Enable or disable imperial mode at user-wide or current-project scope. Use when the user explicitly wants to change imperial forms of address, Chinese-title subagent conventions, or the active scope.
disable-model-invocation: true
---

# Fuzz I Am The King

Accept only explicit invocation:

- Codex: `$fuzz:i-am-the-king`
- Claude Code: `/fuzz:i-am-the-king`

## Invocation boundary

- Do not infer invocation from natural-language requests about forms of address.
- Other skills must not enter this skill automatically.

## Execution

Resolve and run the deterministic script relative to this `SKILL.md`, then return
its output unchanged:

```text
node <this-skill-directory>/scripts/toggle-i-am-the-king.mjs
```

The script asks for scope and target state, then performs atomic state updates,
idempotence checks, `.gitignore` registration, and official-title agent syncing.
Do not write these files yourself or guess either answer.

## State semantics

State files contain one line, `on` or `off`:

- user scope: `$CODEX_HOME/fuzz/i-am-the-king`, defaulting to
  `~/.codex/fuzz/i-am-the-king`
- project scope: `<Git root>/.fuzz/i-am-the-king.local`

A project state overrides the user state. When neither exists, imperial mode is on.
Legacy `fuzz/imperial-mode` and `.fuzz/imperial-mode.local` paths are neither read
nor migrated.

## Scope differences

Files matching `~/.codex/agents/fuzz-*.toml` are shared machine-wide and managed
only by user scope:

- user off: remove managed official-title agents immediately;
- user on: install managed official-title agents immediately;
- project off: suppress conventions for that repository without touching agents.

If project scope enables imperial mode while user scope disables it, the next
session still injects conventions but the custom agents may be unavailable. Do not
fall back to English titles; ask the user to enable user scope and start a new session.

State files and agent files update immediately. Prompt injection and the session's
available agent list change at the next start, resume, or context rebuild.

## Execution boundary

- Never modify user-created agent files without the `fuzz-` prefix.
- Modify no files except the two state locations and the project `.gitignore`.
- Do not write or delete anything before receiving explicit scope and state answers.
