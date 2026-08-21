---
name: close-issue
description: Verify one GitLab Issue's completed implementation assets; report readiness, or publish those assets and close the Issue after explicit authorization. Use after implementation work such as /implement has been committed and reviewed.
---

# Close One GitLab Issue

## Confirm authorization and input

1. Accept exactly one Issue IID or URL. Stop when the target is missing or ambiguous.
2. Classify the user's intent:
   - “Can this be closed?” and “check whether it is ready” authorize a read-only check. Return `ready` or `not_ready`, then stop.
   - “Close this Issue” authorizes one development asset note defined by this skill and, after that note succeeds, closing the Issue.
   - Treat ambiguous intent as read-only.
3. Accept an optional implementation commit. Resolve an omitted value from the request, Issue, repository rules, and current Git facts. Return `not_ready` unless the implementation commit is uniquely proved.
4. Closing authorization covers neither push, merge, merge request or pull request creation, checklist edits, nor label changes. Perform those actions only under separate explicit authorization.

## Read current facts

1. Read every applicable `AGENTS.md`, `CLAUDE.md`, and their Issue tracker and Git convention pointers. This version supports repositories that explicitly use GitLab Issues and `glab issue`; return `not_ready` for other forges.
2. Run `glab issue view <issue> --comments`. Check the Issue state, specification, acceptance criteria, and implementation or validation evidence in its comments.
3. Inspect the worktree, implementation commit, and current implementation branch:
   - The task worktree must contain no uncommitted changes; the script applies the stricter whole-worktree clean gate.
   - The implementation commit must exist as a committed object.
   - The current implementation branch must contain it.
4. Read the commit diff, repository task review evidence, and checks that actually ran. When `/implement` produced the work, use its final commit, test results, and code review as asset candidates, then verify them against Git and command results. Map evidence to every acceptance criterion. Run safe checks allowed by the repository or return `not_ready` when evidence is missing. Never report an unrun check as passing.
5. Read existing code review conclusions. Perform the repository's review workflow when no trustworthy review exists, or return `not_ready` if it cannot be performed. Summaries are not sources of truth; verify against the Issue, commit, files, and command results.

## Run the gate

Start with this read-only check:

```bash
node <this-skill-directory>/scripts/close-issue.mjs check \
  --issue <iid-or-url> \
  --commit <implementation-sha>
```

- `ready`: the worktree is clean, the Issue is open, and the current implementation branch contains the implementation commit.
- `not_ready`: list every blocker and current-branch containment evidence; do not write to the Issue.
- Script readiness is necessary but not sufficient. Acceptance evidence and a trustworthy review must also be complete before publishing assets or closing.

A check-only request ends here. It creates no note file and calls no GitLab write operation.

## Publish the development asset and close

1. Continue only with explicit close authorization, a `ready` script result, complete acceptance evidence, and a trustworthy review conclusion.
2. Create a temporary Markdown note outside the Git worktree. Keep it concise and independently auditable, with these exact headings:
   - `## Implementation assets`: Issue or specification, current implementation branch, implementation commit, modified scope, and any durable links that actually exist.
   - `## Acceptance evidence`: facts mapped to acceptance criteria, plus commands actually run and their results.
   - `## Review conclusion`: review source, conclusion, resolved findings, and residual risks.
   - `## Closeout boundaries`: current implementation branch and any unverified target-branch integration, plus push, merge, MR/PR, environment validation, or other actions not performed.
3. Cite the current Issue, commit, review, and check results. Summarize specifications and diffs instead of copying them wholesale. Exclude secrets, Authorization headers, complete environment variables, model traces, and unverified test claims.
4. Run the close command. It repeats every gate, then publishes the note before closing:

```bash
node <this-skill-directory>/scripts/close-issue.mjs close \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --note-file <note.md>
```

Add `--repo <group/project>` for a numeric IID used outside the current project; a full Issue URL needs no guessed project. Target-branch integration is a disclosed delivery boundary, not a close gate.

5. Handle the JSON result:
   - `closed`: return clickable note and Issue links and disclose remaining delivery boundaries.
   - `not_ready` with `failure: note_failed`: the note was not published and close did not run. Report the failure and stop.
   - `partially_completed` with `stage: noted`: the note was published but close failed. Preserve and return the note link, and state that the Issue remains open.
6. Delete the temporary note. Test this skill only with fixtures and fake `git` and `glab` executables, never a disposable real Issue.
