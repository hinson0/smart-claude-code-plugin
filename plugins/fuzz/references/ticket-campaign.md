# Shared Ticket Campaign Contract

`handle-all-tickets` writes a campaign and `verify-all-tickets` read-only
validates the same campaign. Both skills read this entire file instead of
maintaining separate state or development-asset definitions.

## Delivery graph

1. Read `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`,
   `CONTEXT.md`, and applicable ADRs. Stop and ask the user to run
   `/setup-matt-pocock-skills` when tracker or triage mappings are missing.
2. Read the parent Ticket body, comments, state, and relationships completely,
   then recursively read every child Ticket. Prefer native parent-child
   relationships and otherwise parse body relationships according to tracker
   documentation. Accept top-level `Parent: #<iid>` and the legacy
   `## Parent` exact reference to an already confirmed parent.
3. Read every child Ticket's body, comments, state, assignee, and native or
   body-defined `Blocked by` relationships. Exclude the parent itself, sibling
   parent Tickets, and items whose membership cannot be proved.
4. Require at least one child and build an acyclic dependency graph. Stop the
   affected branch for cycles, missing blockers, or unfinished out-of-set
   blockers whose results are absent from the campaign base.

## Campaign identity and recovery

- Campaign identity consists of parent Ticket, campaign base, campaign branch,
  and execution mode. Record `mode=serial|parallel` and the completed revision
  as `final campaign head`.
- Locate exactly one parent progress comment with
  `<!-- handle-all-tickets:progress parent=<parent Ticket> -->`. It records
  campaign base, branch, mode, final campaign head, current Ticket, and each
  Ticket's `pending`, `implementing`, `candidate`, `campaign-accepted`, or
  `blocked` state. Candidate Tickets also record `review=pending|passed`.
- On rerun, reread tracker and Git instead of trusting a session snapshot. Stop
  when the requested mode differs from the stored mode. Recover a legacy
  progress comment without `mode` as `parallel`.
- Record `ticket_base` at Ticket start and represent its contiguous
  implementation and repair commits as `ticket_base..ticket_tip`. A serial
  candidate tip must be reachable from the campaign branch; a parallel
  candidate must be reachable from its recorded child branch. A
  `campaign-accepted` tip must already be in the campaign branch.
- Recover a `candidate` with `review=passed`, reachable ticket tip, and clean
  worktree directly into primary-agent acceptance and asset gates without
  reimplementation. For `review=pending` or a legacy record without review,
  resume the original implementer when available; otherwise fork fresh context
  from committed candidate results for review, necessary repair, and appended
  commits only.
- For `implementing`, resume the original implementer when available. If lost,
  a clean worktree with a reachable new commit becomes `candidate` and
  `review=pending`; clean with no new commit returns to `pending`; dirty stops
  with unknown ownership and never forks a replacement implementer.
- Reread blockers for `blocked` Tickets each round. Unchanged blockers remain
  blocked and do not unlock dependents.
- Only a Ticket integrated into the campaign branch, with required checks,
  clean worktree, published assets, and labels reread and verified is
  `campaign-accepted`. A verbal summary, closed state, or bare commit hash is
  insufficient recovery evidence.

## Development assets

1. Locate the unique child asset comment with
   `<!-- handle-all-tickets:asset parent=<parent Ticket> ticket=<child Ticket> -->`.
   Create it if absent; otherwise update the same comment.
2. The comment includes at minimum:
   - campaign base, ticket base, ticket tip, and `ticket_base..ticket_tip`;
   - a durable remote commit or MR, or a downloadable patch that supports
     binary changes;
   - the patch SHA-256 checksum;
   - modified files and implementation scope;
   - evidence mapped to every Acceptance criterion;
   - commands actually run and their results; and
   - the single per-Ticket code review conclusion, residual risks, and external
     actions not performed.
3. Local paths, local branches, and bare commit hashes are not durable assets.
   Without permission to push or open an MR/PR, export the ticket-base-to-tip
   patch and upload it as a tracker attachment.
4. Reread the published comment and attachments. Verify one idempotency marker,
   accessible links, checksum, and commit interval against current candidate
   results.

## Triage and final state

- Resolve the five triage-role label values from
  `docs/agents/triage-labels.md`. This repository maps human attention to
  `ready-for-human`; do not remove non-triage labels such as wayfinder.
- After a child passes asset gates, remove other triage-role labels, add the
  human-attention label, and reread until exactly one correct triage-role label
  remains. Keep the Ticket open.
- After all children are `campaign-accepted` and parent-level checks pass,
  write `final campaign head` and `awaiting-human-acceptance` to the parent
  progress comment, transition the parent to human attention, and reread it.
- Without additional explicit user authorization, never push, create an MR/PR,
  or close a Ticket.
