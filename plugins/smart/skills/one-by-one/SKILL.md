---
name: one-by-one
description: Run one minimal Red-to-Green cycle at a time, with the agent landing and validating Red before giving the user complete Green instructions. Use when the user explicitly wants cycle-by-cycle implementation, review, or an authorized fix for the current cycle.
disable-model-invocation: true
---

# Smart One by One

## Invocation boundary

- Start only when the user explicitly invokes `$smart:one-by-one` in Codex or
  `/smart:one-by-one` in Claude Code.
- Process exactly one minimal cycle at a time and keep only one current cycle.
- Do not create a full cycle map, HTML artifact, or persistent log for later cycles.

## Core flow

1. If no cycle is current, read repository rules, relevant code, and test entry
   points, then select the smallest unfinished behavior.
2. Re-read affected files and confirm that no uncoordinated parallel changes exist.
3. Land only the minimal Red test and run its focused validation. Do not modify
   implementation code.
4. Red must fail because the target behavior is missing. Stop if it fails for a
   different reason.
5. When Red is valid, do not reveal the Red code, editing steps, or full logs.
6. In the same response, provide complete manual Green editing instructions, the
   validation command, and the expected result.
7. After the user lands Green and returns complete results, evaluate only this cycle.
8. Keep the current cycle open on failure. Wait for explicit acceptance after success.
9. Only an explicit acceptance statement closes the cycle; "continue" does not.

Use the delegated-fix path only when the user explicitly asks the agent to fix the
cycle. Use the review path only when the user asks to review the current Green.

## Green output

Explain the single behavior first, then provide affected files, exact manual edits,
search checks, the focused validation command, and expected passing output in the
same response.

### Manual editing format

- Show repository-relative paths only. Never show absolute paths, worktree paths,
  or `file://` links.
- Provide exact searchable source text and the expected number of matches.
- Say "delete all and replace with" and provide complete replacement content.
- For new files, provide complete file content.
- State which strings must match or disappear after editing and their expected counts.
- Do not use relative anchors such as start/end, first, previous, above, or below.

### Code presentation

- Explain intent before code. Do not comment imports.
- Put necessary logic comments above the relevant code and explain intent or constraints.
- Keep new or replacement code within 80 columns by default.
- Keep JSON and other comment-free formats valid; put explanations outside code blocks.

### Validation

- Validate only the current cycle, not the whole repository or later acceptance work.
- Name the expected test, count, or required output precisely.
- Distinguish user-run evidence from commands actually run by the agent.

## Review path

1. Review only the declared files, diff, and required context for the current cycle.
2. Focus on correctness, the cycle specification, and obvious regressions.
3. Do not run tests, modify implementation, or complete Green.
4. Put findings first with relative paths, exact lines, evidence, and impact.
5. Keep the cycle open when an actionable issue exists; otherwise disclose that no
   tests were run.

## Delegated-fix path

1. Re-read current files before editing and preserve newer user changes.
2. Modify only the explicitly authorized current-cycle scope.
3. Report what changed, what did not, and whether focused validation ran.
4. Stop and re-read when the patch does not match expected content.

## Acceptance gate

- Do not mark the cycle complete or show the next cycle before explicit acceptance.
- If the user only says "continue," ask for explicit acceptance.
- Do not output a numbered `1`/`2` choice menu or extend earlier authorization to a
  later cycle.
