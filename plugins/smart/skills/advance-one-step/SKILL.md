---
name: advance-one-step
description: Enforce a teaching gate that advances one complete Red → Green cycle at a time. Use during an already-presented test-driven teaching workflow when the user says next or review, asks to proceed one cycle at a time, or corrects the agent for continuing automatically. next authorizes the agent to land and complete only the current cycle; review means the user already landed and ran it, so the agent performs a read-only review. After the current cycle passes, present the next cycle without executing it.
---

# Advance One Step

## State Model

- Treat one complete Red → Green sequence as one cycle.
- Treat the already-explained cycle awaiting implementation or review as the current cycle.
- Keep at most one current cycle.
- If no current cycle exists, present the first cycle and stop without changing files or running commands.

## Teaching Workflow

1. Present the current cycle's goal, Red test, minimal Green implementation, verification command, and expected result.
2. Wait for the user to choose how to complete the current cycle:
   - `next`: land and execute the complete current Red → Green cycle.
   - `review`: assume the user already landed and ran the current cycle; review the actual files, diff, and verification evidence without modifying files.
3. After the current cycle passes, present the complete next cycle without landing or running it.
4. Stop immediately and wait for another `next` or `review`.

## next Route

- Land the Red test first and run it. Confirm it fails because the target behavior is missing.
- Only after the expected Red, land the minimal Green implementation and run it to Green.
- Review the current cycle's diff and verification results.
- Complete only the current cycle. Do not execute the next cycle after presenting it.

## review Route

- Interpret `review` as confirmation that the user already landed and executed the current cycle.
- Read only the actual files, diff, Red/Green evidence, and change scope.
- Do not modify files, run fixes, or complete Green on the user's behalf.
- If the review finds a problem, remain on the current cycle and explain it. Do not present the next cycle.
- If the review passes, present the next cycle without executing it.

## Execution Boundaries

- Treat each `next` as one-time authorization for only the current, already-presented cycle.
- Treat `review` as granting no write authorization.
- Do not carry `next`, write permission, Docker permission, or any other tool permission into the newly presented next cycle.
- If Red does not fail as expected, stop and explain the discrepancy. Do not implement Green or present the next cycle.
- If Green does not pass, remain on the current cycle and report the evidence. Do not present the next cycle.
- Do not bundle adjacent tests, extra refactors, formatting, documentation migration, or the next acceptance item unless it is inseparable from the minimum Green verification.
- Do not continue through multiple cycles because the user previously authorized later execution.

## Manual Landing Anchors

When the user will copy code and land it manually, include all of the following for every snippet:

1. The exact file path, plus the path inside the container when known.
2. Existing code that the user can copy and search for as a stable anchor. Never rely only on descriptions such as "after the core-file check" or "inside this method."
3. The exact operation: insert before the anchor, insert after it, or replace it completely.
4. The complete code to land, not a partial hint.
5. An optional current line number only as supporting information; never use a line number instead of a code anchor because lines move.

If the anchor appears more than once, expand its surrounding context until it is unique, or also identify the containing class, method, and neighboring code.

## Cycle Output Format

Present the next cycle in this order:

1. The single behavior this cycle proves.
2. The Red test's file path, searchable anchor, landing position, complete code, command, and expected failure.
3. The minimal Green implementation's file path, searchable anchor, landing position, complete code, command, and expected pass.
4. State explicitly that this cycle has not been landed and is waiting for `next` or `review`.
