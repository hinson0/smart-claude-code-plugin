---
name: handle-all-tickets
description: Orchestrate and deliver every child Ticket under one parent by implementing dependencies, validating results, and publishing auditable development assets for each Ticket. Use when the user asks for end-to-end delivery of every child under a parent Ticket with implementation and acceptance evidence retained per Ticket.
disable-model-invocation: true
---

# Deliver All Tickets Under a Parent

## Invocation boundary

- Start only when explicitly invoked as
  `$handle-all-tickets <parent Ticket> [并行]` or
  `/fuzz:handle-all-tickets <parent Ticket> [并行]`.
- Require exactly one parent Ticket identifier or URL. `并行` is the only
  optional argument; omitting `并行` selects serial mode. Stop for a missing
  parent, a child Ticket, duplicate arguments, or any other extra argument.
- Read the entire
  [shared campaign contract](../../references/ticket-campaign.md) and use it to
  parse the delivery graph, recover progress, publish assets, and transition
  triage labels.
- Confirm that the host provides the `implement` skill, subagent forking, and
  tracker write permission. Stop before development when any are missing;
  never copy or weaken `$implement` rules.
- Explicit invocation authorizes only the parent/child comments, attachments,
  and triage labels defined here. It does not authorize push, MR/PR creation,
  or Ticket closure. The entire campaign must avoid them without separate
  authorization.

## Establish the goal and start gates

1. Call `get_goal` first:
   - With no active goal, call `create_goal` with the parent, all children,
     dependency graph, mode, per-Ticket completion conditions, and final
     parent-level checks. Set a token budget only when the user explicitly gave
     one.
   - Resume an active goal for the same parent after rereading tracker, shared
     contract, and Git state.
   - Stop rather than overwrite a goal for a different parent Ticket.
2. Require a clean current campaign worktree and record campaign base, branch,
   and HEAD. On detached HEAD or a protected branch, create a writable campaign
   branch under repository rules. Stop on existing changes; do not clean,
   stage, or absorb them.
3. Recover mode from the parent progress comment. A legacy comment without mode
   recovers as `parallel`. Stop on a requested/stored mismatch. A new campaign
   records `mode=serial` unless `并行` was provided, then `mode=parallel`.
4. Recover `campaign-accepted` under the shared contract, then calculate the
   frontier whose blockers are complete.

## Default serial mode

1. Reread tracker and Git each round. Select the stable lowest Ticket IID from
   the frontier. Run only one implementation subagent at a time and do not
   precreate later Ticket agents.
2. Record current campaign branch HEAD as `ticket_base`, then fork a fresh
   context implementer in the current campaign worktree. The primary agent
   keeps implementation files and the Git index read-only until it returns.
3. Give the implementer the parent summary, current Ticket body and comments,
   repository rules, work directory, branch, ticket base, and this contract:
   - explicitly execute `$implement`, implement only the current Ticket, use
     TDD at established seams, periodically run targeted tests and typecheck,
     and run complete checks at the end;
   - after complete checks pass, create a candidate commit, then use
     `ticket_base` as fixed point and the current Ticket as Spec source for the
     single two-axis `code-review`, with
     `git diff <ticket_base>...HEAD` containing candidate results;
   - repair findings, rerun affected checks, append a commit, and review again
     after every modification until no actionable finding remains;
   - keep tracker read-only, do not push/open MR/PR/close, finish with a clean
     worktree, and report `ticket_base..ticket_tip`, files, tests, and review.
4. Stop the current Ticket when the implementer blocks or expands scope. Send
   reproducible acceptance failures back to the same implementer and do not
   calculate the next Ticket until all current gates pass.

## Explicit parallel mode

1. Evaluate each frontier Ticket's likely implementation, tests, migrations,
   generated output, shared configuration, and lockfiles. Put Tickets in the
   same wave only when dependencies do not block and write scopes are provably
   compatible.
2. From the current accepted campaign HEAD, create one independent branch and
   worktree per Ticket and record that HEAD as each `ticket_base`. Fork fresh
   implementers. Each Ticket follows the serial candidate-commit, single-
   review, repair, and reporting contract, split into implementation and review
   scheduling phases.
3. The implementation phase may fill all implementation slots. After checks
   and candidate commit, each agent yields before `code-review`; record
   `candidate` plus `review=pending`. When any candidate appears, pause new
   Ticket dispatch and wait for running implementers to yield. Reserve two
   reviewer slots before resuming the same implementer for its single review
   and repairs. Record `review=passed` so nested reviewers are not starved.
4. After independent acceptance, integrate verified commits into the campaign
   branch in stable Ticket order and rerun wave checks. On conflict, abort the
   integration, prove the campaign branch returned to its clean pre-integration
   commit, and send rebase or repair to the owning subagent. The primary agent
   never resolves code conflicts manually.

## Primary-agent acceptance

1. The primary agent does not modify implementation, stage, create an
   implementation commit, or run another `code-review`. Serial mode validates
   implementer commits on the campaign branch; parallel mode validates each
   child branch before integration.
2. Independently verify actual `ticket_base..ticket_tip` diff, file scope,
   clean worktree, every Acceptance criterion, test results, and the subagent's
   review conclusion. Never treat a subagent summary as fact.
3. Send reproducible problems back to the same implementer and rerun these
   gates after appended commits. An unaccepted Ticket never unlocks dependents.
4. After a serial candidate or parallel integration passes repository checks,
   immediately publish development assets, update parent progress, transition
   `ready-for-human`, and reread. Only then record `campaign-accepted`.
5. On asset or label failure, preserve commits, branches, and usable worktrees,
   record the blocker, and retry. Do not start the next Ticket or describe the
   current Ticket as complete.

## Final completion

1. After all children are `campaign-accepted`, run repository complete checks
   and parent-level integration checks on the campaign branch. Do not repeat
   per-Ticket two-axis reviews.
2. Verify final campaign head, every development asset and Acceptance
   criterion, triage labels, clean state, absence of unrelated changes, and the
   complete parent goal.
3. Under the shared contract, update parent progress and transition the parent
   to `ready-for-human`. After reread verification, call
   `update_goal({ status: complete })`, state that the campaign is
   `awaiting-human-acceptance`, and suggest `$verify-all-tickets` in a fresh
   task.
4. Classify failed, blocked, or untreated Tickets and never describe partial
   delivery as complete.
