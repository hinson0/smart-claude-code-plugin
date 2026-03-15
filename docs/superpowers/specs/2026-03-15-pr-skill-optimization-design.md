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
1. In step 7 (parallel info gathering), add: read project root `CLAUDE.md` (if exists)
2. Scan for language directives: patterns like `Always respond in ...`, `language:`, `ALWAYS use ... in`, etc.
3. If a forced language setting is detected → PR title and body use that language
4. If not detected → default to English (current behavior)

**Affected steps:**
- Step 7: Add 7.3 (read CLAUDE.md)
- Step 11: Title and body language conditional on detected language

**Example text to add in SKILL files (English version):**

> 7.3) Read the project's `CLAUDE.md` file (if it exists) and check for explicit language directives (e.g., "Always respond in ...", "language:" settings). If a forced output language is found, use that language for the PR title and body in step 11. Otherwise, default to English.

**Example text to add in SKILL files (Chinese version):**

> 7.3) 读取项目根目录的 `CLAUDE.md`（若存在），检查是否包含强制输出语言设置（如"Always respond in ..."、"language:" 等指令）。若检测到强制语言，则步骤 11 中的 PR 标题和正文使用该语言；否则默认英文。

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
>
> Use `- [ ]` format (unchecked/pending), not `- [x]`. Each item must be specific to the actual changes in this PR — no generic "verify it works" items.

### 3. Summary Micro-tuning

No structural changes. Add a quality guideline to the existing Summary section:

> Each bullet point in Summary should answer "what changed" AND "why" — not just list files or repeat commit messages. Focus on the intent and impact of the change.

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
