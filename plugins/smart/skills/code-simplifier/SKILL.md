---
name: code-simplifier
description: Simplify a defined recent code change in one fresh worker while preserving observable behavior.
disable-model-invocation: true
argument-hint: "[paths-or-diff] (empty=working-tree code changes)"
license: Apache-2.0
---

<!-- Adapted and modified from Anthropic's code-simplifier agent, licensed under Apache-2.0. See LICENSE. -->

# Code Simplifier Router

Delegate the entire simplification run to one fresh-context worker. The worker
is the only agent that reads the target code, edits files, or runs checks.
Always dispatch: missing, ambiguous, or empty scope is worker input, not a
primary-agent preflight condition. The worker alone may return `blocked`.

## Host routing

- **Claude Code:** invoke the plugin subagent `smart:code-simplifier-worker`
  exactly once in the foreground. Pass the user's complete request and explicit
  scope without summarizing away paths, symbols, constraints, or exclusions.
  Pass an empty scope unchanged when none was supplied. Wait for it and relay
  its result.
- **Codex:** spawn exactly one subagent with no conversation history by setting
  `fork_turns` to `none`. Do not override its model or reasoning effort. Tell it:
  “You are the code-simplifier worker. Read
  `<this-skill-directory>/references/worker.md` completely, execute that
  workflow in the current checkout, use the following request as your scope,
  and do not delegate: `<complete user request and arguments>`.” Wait for it and
  relay its result.
- Run the worker serially. The primary agent remains read-only toward the target
  code and Git index before and while the worker is active. It performs no
  repository inspection, scope validation, or other preflight work.
- If the requested worker cannot be started or does not complete, report that
  failure and stop. The primary agent never takes over, repeats the analysis,
  edits files, or reruns the worker's checks.

Completion is the worker's final result relayed without a second implementation
pass in the primary context.
