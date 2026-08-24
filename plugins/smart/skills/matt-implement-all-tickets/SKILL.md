---
name: matt-implement-all-tickets
description: Serially implement and close the ordered Tickets from the current /to-tickets output.
disable-model-invocation: true
---

# Matt Implement All Tickets

## Invocation gate

1. Require the Matt `implement` skill to have been explicitly invoked in the
   same user request. Its instructions must already be present in the current
   context. Otherwise stop before reading or writing anything and tell the user
   to invoke `$smart:matt-implement-all-tickets` together with the host's Matt `implement`
   skill.
2. Use exactly the ordered Ticket set published by the most recent
   `/to-tickets` run in this conversation. Stop when that set is absent,
   ambiguous, or no longer identifies every Ticket. Do not discover or add
   other work.
3. Read repository rules and `docs/agents/issue-tracker.md`. Tell the user to
   run `/setup-matt-pocock-skills` when the tracker file is missing. Continue
   only for GitHub Issues, GitLab Issues, or local Markdown Tickets under
   `.scratch/`; report every other tracker as unsupported.
4. Verify the configured tracker tools and authentication before development.
   Require a clean worktree and a writable current branch. Stop on unrelated
   changes, detached HEAD, or a protected branch; preserve them unchanged.

Explicit invocation authorizes one completion record and one close transition
for every Ticket in this run. It does not authorize push, merge, MR/PR creation,
assignee changes, labels, checklist edits, parent-Ticket edits, or work outside
the published Ticket set.

## Serial boundary

- Keep the current session as the orchestrator. Fork one fresh implementation
  context for the current Ticket, wait for it to finish, close that Ticket, and
  only then fork the next one.
- Follow the `/to-tickets` publication order exactly. Do not recalculate the
  order, fill parallel slots, or pre-create later workers.
- Keep the orchestrator read-only for implementation files and the Git index.
  The worker owns implementation, tests, review, and commits for its one Ticket.
- This run has no campaign marker or automatic cross-session recovery. If the
  orchestrator is interrupted, report the current Ticket without writing
  inferred progress elsewhere.

## Deliver one Ticket

For each Ticket in order:

1. Reread its current body, comments or local file, state, acceptance criteria,
   and blockers. Require it to be open and every blocker to be closed or
   `done`. Stop on drift instead of skipping or reordering it.
2. Record the current branch and HEAD as `ticket_base`. Fork one fresh worker in
   the current worktree with the Ticket, repository rules, `ticket_base`, and
   the already loaded Matt `implement` contract. Instruct it to implement only
   this Ticket and return its commit interval, files, checks, and review result.
3. Wait for that worker. A blocked worker, expanded scope, missing commit, dirty
   worktree, failed check, or actionable review finding stops the run on the
   current Ticket.
4. Independently verify the committed `ticket_base..ticket_tip` diff, current-
   branch containment, clean worktree, modified scope, every acceptance
   criterion, checks actually run, and the final review conclusion. Treat the
   worker report as a pointer to evidence, not as evidence itself.
5. Build a concise completion record with these headings:
   - `## Implementation assets`: implementation commit, interval, modified
     scope, and files;
   - `## Acceptance evidence`: evidence mapped to every acceptance criterion
     plus validation commands actually run and their results;
   - `## Review conclusion`: final review source and conclusion;
   - `## Closeout boundaries`: residual risks and delivery actions not
     performed.
6. Publish and close through the configured tracker:
   - **GitHub:** publish the record as one Issue comment, verify the comment,
     close the Issue, then reread it and require `CLOSED`.
   - **GitLab:** use the sibling `close-issue` script with the Ticket,
     `ticket_tip`, and a temporary completion-record file. Require its `closed`
     result, then reread the Issue and require the note and closed state.
   - **Local Markdown:** append the record under `## Completion`, replace the
     Ticket's exact `Status:` value with `done`, and reread both. If the Ticket
     file is tracked, commit only that tracker update under repository commit
     rules and restore a clean worktree before continuing.
7. Delete temporary record files. Only verified closure completes this Ticket
   and unlocks the next one. A published record followed by a failed close is a
   partial result: report it and stop without publishing a duplicate.

## Finish

After every Ticket is verified closed or `done`, return an ordered summary with
each Ticket, implementation commit, checks, review conclusion, completion-
record location, and final state. Describe the run as complete only when every
listed Ticket passed every gate.
