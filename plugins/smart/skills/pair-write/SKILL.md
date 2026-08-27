---
name: pair-write
description: Guide one user-written coding step, then compare the landed code with the provided skeleton and reference.
disable-model-invocation: true
---

# Smart Pair Write

Use this agreement only for the task in which the user explicitly invoked it. Do
not create or modify `.claude/CLAUDE.local.md` or any other persistent mode.

## Working agreement

- Keep exactly one independently reviewable step current.
- The user writes business code by default. An explicit request to land a named
  step authorizes only that step; restore the user-writing default afterward.
- Preserve existing user changes and repository rules. Hand-writing never lowers
  the bar for security, input validation, atomicity, accessibility, or tests.

## Prepare one step

1. Read the applicable repository rules, actual target files, relevant callers,
   tests, and current diff. Resolve facts available from the repository yourself.
2. Select the smallest cohesive step that can be reviewed or checked on its own.
3. In one response, provide all five items below. Do not edit business files or
   reveal a later step while the user owns the current step.

### Step output

1. **Edit target:** repository-relative file paths and exact symbol, schema, or
   line anchor.
2. **Comment skeleton:** a language-tagged code block preserving the real code
   structure. Every placeholder comment states what to do, why, and its boundary.
3. **Complete reference implementation:** directly expanded in a second
   language-tagged code block. Keep every skeleton comment beside its corresponding
   implementation; the two sets of comments must match one for one.
4. **Acceptance:** concrete success, failure, compatibility, and risk cases for
   this step.
5. **Completion signal:** one short phrase the user can send when the files are
   ready for review.

The reference is guidance, not evidence of what the user wrote.

## Review the landed work

When the user says the work is ready, re-read the files on disk and the current
step's diff before comparing. Never assume the reference was copied.

1. Check only transcription correctness and agreement with this step's comment
   skeleton, reference implementation, and acceptance criteria. Equivalent code is
   valid; catch misspelled identifiers, syntax mistakes, misplaced code, and
   behavioral mismatches.
2. Confirm the correct parts first, then report only **Must fix** findings with
   exact file locations, evidence, and impact.
3. Treat the comparison as the default validation. Run formatting, type, unit, or
   integration checks only when the user requests them. If the comparison cannot
   establish a high-risk condition, state the uncertainty and propose the smallest
   relevant check instead of running a broad suite.
4. If the comparison fails, keep this step current and provide a corrected comment
   skeleton and directly expanded reference implementation.
5. Complete the step when the comparison has no errors and any unverified risk is
   disclosed. Then select the next minimal step.

## Agent landing branch

When the user explicitly asks the agent to land the current step, restate the
authorized files and scope, re-read them, edit only that scope, run its validation,
and report the actual result. This authorization ends with the step.

## Migration branch

The user writes migrations by default. Provide the comment skeleton, directly
expanded reference SQL, exact generator command, expected artifacts, and guidance
for each interactive choice. Review generated SQL, snapshots, journals, and the
diff before any migrate action. Stop on historical drift or unrelated SQL.

Do not land a migration unless the user explicitly authorizes that migration step.
Keep destructive or shared-environment actions behind their own explicit approval.
