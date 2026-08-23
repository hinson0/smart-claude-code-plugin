---
name: verify-all-tickets
description: Independently validate a completed parent Ticket campaign by checking commits, development assets, the parent objective, and automated and manual scenarios. Use when the user wants a final acceptance review of every child Ticket and the complete parent outcome after development.
disable-model-invocation: true
---

# Verify a Parent Ticket Campaign

## Invocation boundary

- Start only when explicitly invoked in a fresh task as
  `$verify-all-tickets <parent Ticket>` or
  `/fuzz:verify-all-tickets <parent Ticket>`.
- Require exactly one parent Ticket identifier or URL. Stop for a missing or
  multiple argument or a child Ticket.
- Read the entire
  [shared campaign contract](../../references/ticket-campaign.md). Validate only
  its delivery graph, commit intervals, development assets, and final state.
- The entire workflow is read-only. Never modify code, Git, comments, labels,
  or Ticket state, and never land a proposed fix.

## Identity gates

1. Read the parent and all child Tickets, comments, attachments,
   relationships, and triage labels completely and rebuild the delivery graph.
2. Require a clean worktree. Read campaign base, final campaign head, and mode
   from the parent progress comment. HEAD must equal the recorded final
   campaign head. Stop for missing, unparseable, or unequal values to avoid
   validating the wrong worktree or later unrecorded changes.
3. Confirm parent progress is `awaiting-human-acceptance`, every child is
   `campaign-accepted`, and parent and child Tickets remain open and transitioned
   to human attention. Report missing handoff state without writing it.

## Traceability acceptance

1. For each Ticket, independently verify `ticket_base..ticket_tip`, actual
   diff, file scope, development-asset link and SHA-256, Acceptance-criteria
   evidence, test results, and per-Ticket review conclusion.
2. Confirm every commit belongs to exactly one Ticket, every Ticket commit is
   reachable from final campaign head, and the actual campaign-base-to-HEAD
   diff equals all registered scopes with no unrelated changes.
3. Never treat an asset comment as fact. Cross-check Git, files, test entry
   points, and durably accessible attachments.

## Automated and code acceptance

1. With campaign base as fixed point, run one campaign-level two-axis
   `code-review` for repository Standards and parent Ticket Spec findings. Do
   not repeat any per-Ticket review.
2. Run the repository's full tests, build, type checks, and other complete
   checks. Record actual commands, exit status, and key output. Missing
   dependencies or external permissions are unexecuted, never inferred passes.
3. Derive user-observable scenarios from the parent objective and cross-Ticket
   Acceptance criteria. Execute every automatable scenario and record input,
   action, and result.

## Interactive manual acceptance

1. For scenarios requiring manual operation, a real device, or an external
   account, provide exact steps, expected outcomes, and required evidence. Wait
   for the user's complete results; do not predict a final pass in that reply.
2. Distinguish agent-executed from user-executed evidence. Mark incomplete,
   mismatched, or indeterminate reports as failed or awaiting manual acceptance
   and give the reproducible gap.

## Conclusion

1. Output an acceptance matrix with parent objective, Ticket, commit,
   Acceptance criterion, automated check, manual scenario, evidence source,
   and conclusion.
2. Report an overall pass only when all commits and assets are traceable,
   complete checks pass, the two-axis review has no unresolved finding, and
   every required manual scenario has explicit passing evidence.
3. Missing required evidence, failures, or scenarios still awaiting manual
   acceptance prohibit a passing conclusion. Summarize blockers, impact, and
   next steps by Ticket while leaving worktree and tracker unchanged.
