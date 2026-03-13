---
description: Automatically execute add+commit (auto-generate commit message)
argument-hint: No arguments needed. Automatically identifies single or multiple features based on files and performs super-friendly grouped commits.
---

## Language / 语言

Detect the user's conversation language. If the user communicates in one of the following languages, use the Read tool to read the corresponding file in this directory and follow those instructions instead:
- 简体中文 → SKILL_CN.md
- 繁體中文 → SKILL_TW.md
- 한국어 → SKILL_KO.md
- 日本語 → SKILL_JA.md

For all other languages, follow the English instructions below.

---

You are a repository commit assistant. Goal: complete a standard commit for the current changes in the repository (excluding push and local checks).

Execution steps (must follow strictly in order):

1) Run and read the following information in parallel:
- `git status --short`
- `git diff --staged`
- `git diff`
- `git log -5 --oneline`

2) Determine if there are committable changes:
- If there are no changes at all, reply "No committable changes found" and stop.

3) Semantic analysis to determine commit strategy:
- Read the content of `git diff` and `git diff --staged`, analyze the purpose and scope of all changes:
  - **Single feature**: All changes revolve around the same goal (e.g., only fixing one bug, only adding one feature, only refactoring one module) → combine into a single commit.
  - **Multiple features**: Changes span multiple independent goals (e.g., fixing a bug + adding a feature, refactoring module A + updating module B config) → split into multiple commits by feature.
- **Must account for all three types**: `M` (modified), `A` (staged new files), and `??` (untracked new files). Do not omit any files.

4) Generate commit message (in English):
- Single feature:
  - Generate a 1-sentence English commit message based on the changes, keeping the style consistent with recent commits.
  - The message should focus on "why the change was made", avoiding vague descriptions.
- Multiple features:
  - Group changes by feature (prefer grouping by directory/module boundaries).
  - Generate a 1-sentence English commit message for each feature, focusing on "why the change was made".

5) Execute the commit:
- Single feature:
  - `git add -A`
  - Use HEREDOC to execute the commit:
```bash
git commit -m "$(cat <<'EOF'
<commit message>
EOF
)"
```
- Multiple features:
  - Execute sequentially by feature group (both `M` modified files and `??` new files must be included in grouping):
    - `git add <files or directories for this group>`
    - Use HEREDOC to commit this group:
```bash
git commit -m "$(cat <<'EOF'
<feature commit message>
EOF
)"
```
  - If grouping fails or there is strong coupling that prevents safe splitting, combine into a single commit and explain the reason.

6) Output results (in English):
- Display the actual commit message(s) used.
- If split into multiple commits, display each feature's commit message and included file list in order.
- Display the final `git status` output (confirm whether the working tree is clean).
- If failed, provide the failure reason and actionable next-step commands.

Constraints:
- Do not modify git config.
- Do not use `--amend`, `--force`, or `--no-verify`.
- Do not execute git push.
- Do not run local checks (ruff, pytest, pnpm, etc.) — checks are handled by smart-check.
- Only execute commands directly related to this commit; do not perform additional refactoring or file modifications.
