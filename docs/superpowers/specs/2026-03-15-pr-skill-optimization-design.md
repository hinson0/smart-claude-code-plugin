# PR Skill Optimization Design

## Context

The current PR skill hardcodes English for PR title and body across all 5 language versions, with no mechanism to respect project-level language overrides (e.g., CLAUDE.md). Additionally, the Test Plan section generates generic `[x]` items that lack specificity to the actual changes being made.

This design addresses three focused improvements:
1. Language override rule — respect CLAUDE.md language settings
2. Test Plan smart generation — type-aware test items
3. Summary quality micro-tuning

## Scope

**In scope:**
- Add CLAUDE.md language detection logic to PR title/body generation
- Replace static Test Plan template with commit-type-aware generation
- Change Test Plan checkbox from `[x]` to `[ ]` (pending, not done)
- Apply changes to all 5 language versions (EN, CN, TW, KO, JA)

**Out of scope:**
- Title generation strategy changes (current logic is fine)
- PR body structure changes (Summary + Commits + Test Plan stays)
- Multi-language file deduplication / architecture refactoring
- Draft PR support
- Custom PR templates

## Design

### 1. Language Override Rule

**Where:** Step 7 (gather basic information), add step 7.3

**Logic:**
1. In step 7 (parallel info gathering), add a third bullet point: read project root `CLAUDE.md` (if exists)
2. Use semantic understanding (not regex) to detect language directives — common patterns include `Always respond in ...`, `language:`, `ALWAYS use ... in`, etc., possibly with Markdown formatting like `**bold**`
3. If a forced language setting is detected → apply to PR output per the scope rules below
4. If not detected → default to English (current behavior)

**Search scope:** Only project-level `CLAUDE.md` (in the git repo root). Global `~/.claude/CLAUDE.md` and `~/.claude/rules/` are NOT checked — those are user-level settings that Claude Code already applies automatically. This step only detects project-specific overrides.

**Language override scope by PR section:**

| Section | Override behavior |
|---------|------------------|
| Title | Use detected language |
| Summary bullets | Use detected language |
| Section headers (`## Summary`, etc.) | Keep English (for GitHub readability) |
| Commits list | Keep original commit messages as-is (never translate) |
| Test Plan items | Use detected language |

**Conflict resolution:** If multiple contradictory language directives are found in CLAUDE.md, use the most specific one (e.g., "PR must be in Chinese" beats "Always respond in English"). If ambiguous, default to English.

**Example text to add in SKILL files (English version):**

> 7) Gather basic information (run in parallel):
> - `git branch --show-current` (current branch name, referred to as `HEAD_BRANCH`)
> - `git log -1 --oneline` (latest commit, used to determine single-commit scenario)
> - Read the project's `CLAUDE.md` file (if it exists) and check for explicit language directives (semantic detection, e.g., "Always respond in ...", "language:" settings). If a forced output language is found, use that language for the PR title, summary, and test plan in step 11 (but keep section headers in English and commit messages as-is). Otherwise, default to English.

**Example text to add in SKILL files (Chinese version):**

> 7) 收集基础信息（并行运行）：
> - `git branch --show-current`（当前分支名，记为 `HEAD_BRANCH`）
> - `git log -1 --oneline`（最新一条 commit，用于判断单 commit 场景）
> - 读取项目根目录的 `CLAUDE.md`（若存在），语义检测是否包含强制输出语言设置（如"Always respond in ..."、"language:" 等指令）。若检测到强制语言，则步骤 11 中的 PR 标题、Summary 和 Test Plan 使用该语言（但 section headers 保持英文，commit messages 保持原文）；否则默认英文。

### 2. Test Plan Smart Generation

**Where:** Step 11, Test Plan section

**Current behavior:**
```markdown
## Test Plan
- [x] <Key verification point 1 for this change>
- [x] <Key verification point 2 for this change>
```

**New behavior:**

Generate test items based on the conventional commit types found in the commit list (from step 10):

| Commit Type | Generated Test Items |
|-------------|---------------------|
| `feat` | Core behavior of the new feature works correctly; edge cases handled |
| `fix` | Original bug no longer reproduces; no regression in related functionality |
| `refactor` | Existing functionality unaffected; behavior consistency verified |
| `docs` | Documentation accuracy; links and references are valid |
| `test` | Tests pass; coverage requirements met |
| `perf` | Performance improvement is measurable/verifiable |
| `chore`/`ci` | Build/CI pipeline runs successfully |

**Format change:** Use `- [ ]` (unchecked) instead of `- [x]` (checked), since these are pending verification items.

**Specificity requirement:** Each test item must reference the actual changes in this PR. Generic items like "verify functionality works" are prohibited.

**Good example:**
```markdown
- [ ] Authentication endpoint returns 401 for expired tokens
- [ ] Cache invalidation triggers on user profile update
```

**Bad example:**
```markdown
- [ ] Verify the feature works correctly
- [ ] Check that nothing is broken
```

**Fallback for non-conventional commits:** If a commit message does not have a recognized type prefix (e.g., `"Update README"`, `"WIP"`), infer the intent from the commit message content and file changes, then generate appropriate test items. Do not skip these commits.

**Example text to add in SKILL files (English version):**

> ## Test Plan
> Generate test items based on the commit types present in the commit list:
> - `feat` commits → verify new feature's core behavior and edge cases
> - `fix` commits → verify the original bug no longer reproduces, check for regressions
> - `refactor` commits → verify existing behavior is unchanged
> - `docs` commits → verify documentation accuracy and link validity
> - `test` commits → verify tests pass and coverage is adequate
> - `perf` commits → verify performance improvement is measurable
> - `chore`/`ci` commits → verify build/CI pipeline runs correctly
> - Commits without a type prefix → infer intent from message/files and generate appropriate items
>
> Use `- [ ]` format (unchecked/pending), not `- [x]`. Each item must be specific to the actual changes in this PR — no generic "verify it works" items.

### 3. Summary Micro-tuning

No structural changes. Add a quality guideline to the existing Summary section.

**Where:** Step 11, Summary bullet point description

**Example text to add in SKILL files (English version):**

> Each bullet point in Summary should answer "what changed" AND "why" — not just list files or repeat commit messages. Focus on the intent and impact of the change.

**Example text to add in SKILL files (Chinese version):**

> Summary 中的每条要点必须回答"改了什么"和"为什么改"——不要只是列出文件名或重复 commit message。聚焦改动的意图和影响。

## Files to Modify

All 5 language versions of the PR skill:

1. `skills/pr/SKILL.md` (English)
2. `skills/pr/SKILL_CN.md` (Simplified Chinese)
3. `skills/pr/SKILL_TW.md` (Traditional Chinese)
4. `skills/pr/SKILL_KO.md` (Korean)
5. `skills/pr/SKILL_JA.md` (Japanese)

## Verification

1. Run `/smart:pr` on a branch with mixed commit types (feat + fix) and verify:
   - Test Plan items are type-specific, not generic
   - Test Plan uses `[ ]` not `[x]`
2. Create a test project with `CLAUDE.md` containing `Always respond in 中文`, run `/smart:pr`, and verify PR title/body are in Chinese
3. Run `/smart:pr` on a project without `CLAUDE.md` language settings and verify PR title/body remain in English
4. Verify all 5 language versions produce consistent behavior
