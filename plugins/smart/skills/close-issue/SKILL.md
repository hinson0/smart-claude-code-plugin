---
name: close-issue
description: Verify a single GitLab Issue's implementation, acceptance, review, and target-branch integration; report whether it is ready, or publish an auditable development asset note and close it after explicit authorization.
---

# Close One GitLab Issue

## Confirm authorization and input

1. Accept exactly one Issue IID or URL. Stop when the target is missing or ambiguous.
2. Classify the user's intent:
   - “Can this be closed?” and “check whether it is ready” authorize a read-only check. Return `ready` or `not_ready`, then stop.
   - “Close this Issue” authorizes one development asset note defined by this skill and, after that note succeeds, closing the Issue.
   - Treat ambiguous intent as read-only.
3. Accept an optional target branch, implementation commit, and explicit permission for a local-only integration exception. Resolve omitted values from the request, Issue, repository rules, and Git facts. Return `not_ready` unless the implementation commit, target branch, and remote are uniquely proved.
4. Closing authorization covers neither push, merge, merge request or pull request creation, checklist edits, nor label changes. Perform those actions only under separate explicit authorization.

## Read current facts

1. Read every applicable `AGENTS.md`, `CLAUDE.md`, and their Issue tracker and Git convention pointers. This version supports repositories that explicitly use GitLab Issues and `glab issue`; return `not_ready` for other forges.
2. Run `glab issue view <issue> --comments`. Check the Issue state, specification, acceptance criteria, and implementation or validation evidence in its comments.
3. Inspect the worktree, implementation commit, and target branch:
   - The task worktree must contain no uncommitted changes; the script applies the stricter whole-worktree clean gate.
   - The implementation commit must exist as a committed object.
   - The local target branch must contain it.
   - Refresh the remote target ref and check the local target and `<remote>/<target>` separately; they are distinct integration facts.
4. Read the commit diff, repository task review evidence, and checks that actually ran. Map evidence to every acceptance criterion. Run safe checks allowed by the repository or return `not_ready` when evidence is missing. Never report an unrun check as passing.
5. Read existing code review conclusions. Perform the repository's review workflow when no trustworthy review exists, or return `not_ready` if it cannot be performed. Summaries are not sources of truth; verify against the Issue, commit, files, and command results.

## Run the gate

Start with this read-only check:

```bash
node <this-skill-directory>/scripts/close-issue.mjs check \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote>
```

- `ready`: the worktree is clean, the Issue is open, and both local and remote target branches contain the implementation commit.
- `not_ready`: list every blocker and the branch-containment evidence; do not write to the Issue.
- A remote target branch that excludes the commit is `not_ready` by default. Add `--allow-local-only` to the close command only after the user has been told the risk and explicitly authorizes that exception. Ordinary close authorization does not imply it.
- Any blocker other than missing remote integration keeps the result `not_ready`, even with the exception.

A check-only request ends here. It creates no note file and calls no GitLab write operation.

## Publish the development asset and close

1. Continue only with explicit close authorization and a `ready` gate. Under the local-only exception, confirm that remote integration is the sole blocker.
2. Create a temporary Markdown note outside the Git worktree. Keep it concise and independently auditable, with these exact headings:
   - `## Implementation assets`: Issue or specification, implementation commit, modified scope, and durable links. State when the commit is not reachable from the remote target branch.
   - `## Acceptance evidence`: facts mapped to acceptance criteria, plus commands actually run and their results.
   - `## Review conclusion`: review source, conclusion, resolved findings, and residual risks.
   - `## Closeout boundaries`: local and remote containment, plus push, merge, MR/PR, environment validation, or other actions not performed.
3. Cite the current Issue, commit, review, and check results. Summarize specifications and diffs instead of copying them wholesale. Exclude secrets, Authorization headers, complete environment variables, model traces, and unverified test claims.
4. Run the close command. It repeats every gate, then publishes the note before closing:

```bash
node <this-skill-directory>/scripts/close-issue.mjs close \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote> \
  --note-file <note.md>
```

Add `--allow-local-only` only under the explicit exception authorization. Add `--repo <group/project>` for a numeric IID used outside the current project; a full Issue URL needs no guessed project.

5. Handle the JSON result:
   - `closed`: return clickable note and Issue links and disclose remaining integration boundaries.
   - `not_ready` with `failure: note_failed`: the note was not published and close did not run. Report the failure and stop.
   - `partially_completed` with `stage: noted`: the note was published but close failed. Preserve and return the note link, and state that the Issue remains open.
6. Delete the temporary note. Test this skill only with fixtures and fake `git` and `glab` executables, never a disposable real Issue.
