---
name: close-issue
description: Verify one Issue's implementation, acceptance, and target-branch integration facts, then publish an auditable development-asset record and close it only after explicit authorization. Use when the user asks whether one GitLab Issue is ready to close or asks to record its development assets and close it.
---

# Close One Issue

## Confirm authorization and input

1. Accept exactly one explicit Issue IID or URL. Stop rather than guess when the
   target is missing or multiple candidates exist.
2. Distinguish the user's intent:
   - “Can this close?” or “check whether it is ready to close” authorizes only a
     read-only check. Return `ready` or `not_ready`, then stop.
   - “Close this Issue” authorizes this skill to publish exactly one development-
     asset record and, only after that succeeds, close the Issue.
   - Treat unclear intent as a read-only check.
3. Accept an optional target branch, implementation commit, and an explicit
   exception allowing integration only in the local target branch. Derive omitted
   values from user input, the Issue, repository rules, and Git facts. Return
   `not_ready` when the implementation commit, target branch, or remote cannot be
   proven uniquely.
4. Authorization to close does not include push, merge, MR/PR creation, checklist
   edits, or label changes. Perform those only when the user separately and
   explicitly requests them.

## Read current facts

1. Read all applicable `AGENTS.md` and `CLAUDE.md` files, including referenced
   Issue Tracker and Git rules. This version supports repositories that explicitly
   use GitLab Issues and `glab issue`; return `not_ready` for other platforms.
2. Run `glab issue view <issue> --comments` and verify Issue state,
   specification, acceptance criteria, and implementation or validation records.
3. Inspect the worktree, implementation commit, and target branch:
   - There must be no uncommitted task changes; the script conservatively requires
     the entire worktree to be clean.
   - The implementation commit must exist as a committed object.
   - The local target branch must contain the implementation commit.
   - Refresh the target remote ref and verify the local target branch and
     `<remote>/<target>` separately; these are different integration facts.
4. Read the commit diff, repository task-review records, and checks that were
   actually run. Find evidence for each acceptance criterion. Run only repository-
   allowed safe checks or return `not_ready`; never report an unrun check as passed.
5. Read an existing code-review conclusion. Perform the repository's review when
   no trustworthy review exists, or return `not_ready` when that cannot be done.
   Summaries are not sources of truth; verify facts against the Issue, commit,
   files, and command results.

## Apply the gate

Run the read-only check first:

```bash
node <this skill directory>/scripts/close-issue.mjs check \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote>
```

- `ready` means the worktree is clean, the Issue is open, and both local and
  remote target branches contain the implementation commit.
- `not_ready` lists every blocker and current branch-containment evidence without
  writing to the Issue.
- A remote target branch that lacks the implementation commit is `not_ready` by
  default. Add `--allow-local-only` to the close command only after the user has
  been informed of that risk and explicitly asks to continue. An ordinary “close
  the Issue” authorization does not authorize this exception.
- Any blocker other than missing remote integration keeps the result `not_ready`,
  even when the local-only exception is authorized.

Stop after this step for check-only requests. Do not create a note file or call a
write API.

## Publish development assets and close

1. Continue only when explicit close authorization exists and the gate is `ready`.
   When using the local-only exception, confirm that missing remote integration is
   the sole blocker.
2. Create a temporary Markdown note outside the Git worktree. It must be concise,
   independently auditable, and contain these exact compatibility headings:
   - `## 实现资产`: Issue/specification, implementation commit, change scope, and
     durable links; state when the commit is not reachable from the remote target.
   - `## 验收证据`: evidence for acceptance criteria and commands actually run.
   - `## Review 结论`: review source, conclusion, resolved findings, and residual
     risks.
   - `## 收口边界`: local and remote containment plus push, merge, MR/PR, or
     environment validation that was not performed.
3. Cite the current Issue, commit, review, and check results. Summarize the
   specification and diff rather than copying them wholesale. Exclude secrets,
   authorization headers, complete environment variables, model traces, and
   unverified test claims.
4. Run the close command. The script reruns every gate and writes strictly in
   note-success-then-close order:

```bash
node <this skill directory>/scripts/close-issue.mjs close \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote> \
  --note-file <note.md>
```

Append `--allow-local-only` only when the user explicitly authorized the local-
only exception. Add `--repo <group/project>` for a numeric IID in another project;
do not guess a project for a full Issue URL.

5. Finish according to the script's JSON result:
   - `closed`: return clickable note and Issue links and disclose remaining
     integration boundaries.
   - `not_ready` with `failure: note_failed`: the note was not published and close
     was not attempted; report the failure and stop.
   - `partially_completed` with `stage: noted`: the note was published but close
     failed; preserve and return the note link, and state that the Issue is open.
6. Delete the temporary note. Never test this skill against a new real Issue; use
   fixtures or fake `git` and `glab` programs on `PATH`.
