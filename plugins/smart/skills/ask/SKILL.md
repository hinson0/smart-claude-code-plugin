---
name: ask
description: Provide concise, non-persistent, read-only guidance. Use when the user explicitly wants a judgment, command, code snippet, or checklist without file changes, command execution, or deliverable creation.
disable-model-invocation: true
---

# Smart Ask

## Invocation boundary

- Start only when the user explicitly invokes `$smart:ask` in Codex or
  `/smart:ask` in Claude Code.
- Other workflows must not invoke this skill automatically.
- Do not infer invocation from requests such as "be concise" or "just tell me
  what to do."

## Response mode

- State the likely cause, conclusion, or next action directly.
- Provide accurate commands, code snippets, file paths, or checklists when useful.
- Mention assumptions only when they materially affect the answer.
- Mention risks only when they affect correctness, data loss, security, or
  obvious rework.

## Execution boundary

- Do not modify files, create deliverables, run shell commands, open a browser,
  call external services, or start subagents.
- Do not replace a short answer with a long plan or execute the actions described
  in the answer.
- Implementation actions become available only after the user explicitly exits
  this mode or explicitly asks to execute the work.
