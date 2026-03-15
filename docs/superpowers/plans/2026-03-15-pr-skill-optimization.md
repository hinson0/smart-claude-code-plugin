# PR Skill Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize the PR skill with CLAUDE.md language override detection, smart Test Plan generation, and Summary quality guidelines across all 5 language versions.

**Architecture:** Incremental modification of 5 existing SKILL markdown files. Each file receives 3 changes: (1) language detection in step 7, (2) smart Test Plan in step 11, (3) Summary guideline in step 11. No new files created.

**Tech Stack:** Markdown (Claude Code plugin skill files)

**Spec:** `docs/superpowers/specs/2026-03-15-pr-skill-optimization-design.md`

---

## Chunk 1: Implementation

### Task 1: Modify SKILL.md (English — reference implementation)

**Files:**
- Modify: `plugins/smart/skills/pr/SKILL.md:22-56`

This is the reference implementation. All other language versions mirror this structure.

- [ ] **Step 1: Add CLAUDE.md language detection to step 7**

In `SKILL.md`, replace step 7 (lines 22-24):

```
7) Gather basic information (run in parallel):
- `git branch --show-current` (current branch name, referred to as `HEAD_BRANCH`)
- `git log -1 --oneline` (latest commit, used to determine single-commit scenario)
```

With:

```
7) Gather basic information (run in parallel):
- `git branch --show-current` (current branch name, referred to as `HEAD_BRANCH`)
- `git log -1 --oneline` (latest commit, used to determine single-commit scenario)
- Read the project's `CLAUDE.md` file (if it exists) and check for explicit language directives (semantic detection, e.g., "Always respond in ...", "language:" settings). If a forced output language is found, use that language for the PR title, summary, and test plan in step 11 (but keep section headers in English and commit messages as-is). Otherwise, default to English.
```

- [ ] **Step 2: Update step 11 — Summary guideline + language conditional + smart Test Plan**

In `SKILL.md`, replace step 11 (lines 40-56):

```
11) Generate PR title and body:
- **Title**:
  - If this branch has only 1 commit, use that commit message directly as the title.
  - If there are multiple commits, generate a one-sentence summary title in English (under 50 characters) based on the branch name and commit list, matching the style of recent commits.
  - If the user appended descriptive text after the command, prioritize incorporating it into the title.
- **Body** (English, Markdown format):
  ```markdown
  ## Summary
  <3-10 bullet points explaining what this PR does and why>

  ## Commits
  <List all commits from git log BASE_BRANCH..HEAD, format: `- <hash>: <message>`>

  ## Test Plan
  - [x] <Key verification point 1 for this change>
  - [x] <Key verification point 2 for this change>
  ```
```

With:

```
11) Generate PR title and body:
- **Language**: Use the language detected in step 7. If no forced language was found, default to English. Section headers (## Summary, ## Commits, ## Test Plan) always stay in English.
- **Title**:
  - If this branch has only 1 commit, use that commit message directly as the title.
  - If there are multiple commits, generate a one-sentence summary title (under 50 characters) based on the branch name and commit list, matching the style of recent commits.
  - If the user appended descriptive text after the command, prioritize incorporating it into the title.
- **Body** (Markdown format):
  ```markdown
  ## Summary
  <3-10 bullet points explaining what this PR does and why.
   Each bullet must answer "what changed" AND "why" — not just list files or repeat commit messages. Focus on the intent and impact of the change.>

  ## Commits
  <List all commits from git log BASE_BRANCH..HEAD, format: `- <hash>: <message>` — keep original commit messages as-is, never translate>

  ## Test Plan
  <Generate test items based on the commit types present in the commit list:
   - `feat` commits → verify new feature's core behavior and edge cases
   - `fix` commits → verify the original bug no longer reproduces, check for regressions
   - `refactor` commits → verify existing behavior is unchanged
   - `docs` commits → verify documentation accuracy and link validity
   - `test` commits → verify tests pass and coverage is adequate
   - `perf` commits → verify performance improvement is measurable
   - `chore`/`ci` commits → verify build/CI pipeline runs correctly
   - Commits without a type prefix → infer intent from message/files and generate appropriate items

   Use `- [ ]` format (unchecked/pending), not `- [x]`. Each item must be specific to the actual changes in this PR — no generic "verify it works" items.>
  ```
```

- [ ] **Step 3: Verify SKILL.md is well-formed**

Read the modified file end-to-end to verify markdown structure is intact.

- [ ] **Step 4: Commit**

```bash
git add plugins/smart/skills/pr/SKILL.md
git commit -m "feat(pr): add language override and smart test plan to English skill"
```

---

### Task 2: Modify SKILL_CN.md (Simplified Chinese)

**Files:**
- Modify: `plugins/smart/skills/pr/SKILL_CN.md:22-56`

- [ ] **Step 1: Add CLAUDE.md language detection to step 7**

In `SKILL_CN.md`, replace step 7 (lines 22-24):

```
7) 收集基础信息（并行运行）：
- `git branch --show-current`（当前分支名，记为 `HEAD_BRANCH`）
- `git log -1 --oneline`（最新一条 commit，用于判断单 commit 场景）
```

With:

```
7) 收集基础信息（并行运行）：
- `git branch --show-current`（当前分支名，记为 `HEAD_BRANCH`）
- `git log -1 --oneline`（最新一条 commit，用于判断单 commit 场景）
- 读取项目根目录的 `CLAUDE.md`（若存在），语义检测是否包含强制输出语言设置（如"Always respond in ..."、"language:" 等指令）。若检测到强制语言，则步骤 11 中的 PR 标题、Summary 和 Test Plan 使用该语言（但 section headers 保持英文，commit messages 保持原文）；否则默认英文。
```

- [ ] **Step 2: Update step 11 — Summary guideline + language conditional + smart Test Plan**

In `SKILL_CN.md`, replace step 11 (lines 40-56):

```
11) 生成 PR 标题和正文：
- **标题**：
  - 若本分支只有 1 个 commit，直接使用该 commit message 作为标题。
  - 若有多个 commit，基于分支名和 commit 列表生成 1 句概括性英文标题（50 字以内），风格与最近提交一致。
  - 若用户在命令后附加了描述文字，优先将其融入标题。
- **正文**（英文，Markdown 格式）：
  ```markdown
  ## Summary
  <3-10 条要点，说明本次 PR 做了什么、为什么这样做>

  ## Commits
  <列出 git log BASE_BRANCH..HEAD 的所有 commit，格式：`- <hash>: <message>`>

  ## Test Plan
  - [x] <本次改动需要验证的关键点1>
  - [x] <本次改动需要验证的关键点2>
  ```
```

With:

```
11) 生成 PR 标题和正文：
- **语言**：使用步骤 7 中检测到的语言。若未检测到强制语言，默认英文。Section headers（## Summary, ## Commits, ## Test Plan）始终保持英文。
- **标题**：
  - 若本分支只有 1 个 commit，直接使用该 commit message 作为标题。
  - 若有多个 commit，基于分支名和 commit 列表生成 1 句概括性标题（50 字以内），风格与最近提交一致。
  - 若用户在命令后附加了描述文字，优先将其融入标题。
- **正文**（Markdown 格式）：
  ```markdown
  ## Summary
  <3-10 条要点，说明本次 PR 做了什么、为什么这样做。
   每条要点必须回答"改了什么"和"为什么改"——不要只是列出文件名或重复 commit message。聚焦改动的意图和影响。>

  ## Commits
  <列出 git log BASE_BRANCH..HEAD 的所有 commit，格式：`- <hash>: <message>` — 保持原始 commit message，不翻译>

  ## Test Plan
  <根据 commit 列表中的 commit 类型生成测试项：
   - `feat` commits → 验证新功能的核心行为和边界情况
   - `fix` commits → 验证原始 bug 不再复现，检查回归问题
   - `refactor` commits → 验证现有行为未受影响
   - `docs` commits → 验证文档准确性和链接有效性
   - `test` commits → 验证测试通过且覆盖率达标
   - `perf` commits → 验证性能改善可度量
   - `chore`/`ci` commits → 验证构建/CI 流程正常运行
   - 无类型前缀的 commit → 从 message 和文件变更推断意图，生成对应测试项

   使用 `- [ ]` 格式（未勾选/待验证），不要用 `- [x]`。每条必须针对本 PR 的实际改动，禁止使用泛泛的"验证功能正常"。>
  ```
```

- [ ] **Step 3: Verify SKILL_CN.md is well-formed**

Read the modified file end-to-end to verify markdown structure is intact.

- [ ] **Step 4: Commit**

```bash
git add plugins/smart/skills/pr/SKILL_CN.md
git commit -m "feat(pr): add language override and smart test plan to Chinese skill"
```

---

### Task 3: Modify SKILL_TW.md (Traditional Chinese)

**Files:**
- Modify: `plugins/smart/skills/pr/SKILL_TW.md:22-56`

- [ ] **Step 1: Add CLAUDE.md language detection to step 7**

In `SKILL_TW.md`, replace step 7 (lines 22-24):

```
7) 收集基礎資訊（並行執行）：
- `git branch --show-current`（當前分支名，記為 `HEAD_BRANCH`）
- `git log -1 --oneline`（最新一條 commit，用於判斷單 commit 場景）
```

With:

```
7) 收集基礎資訊（並行執行）：
- `git branch --show-current`（當前分支名，記為 `HEAD_BRANCH`）
- `git log -1 --oneline`（最新一條 commit，用於判斷單 commit 場景）
- 讀取專案根目錄的 `CLAUDE.md`（若存在），語義檢測是否包含強制輸出語言設定（如"Always respond in ..."、"language:" 等指令）。若檢測到強制語言，則步驟 11 中的 PR 標題、Summary 和 Test Plan 使用該語言（但 section headers 保持英文，commit messages 保持原文）；否則預設英文。
```

- [ ] **Step 2: Update step 11 — Summary guideline + language conditional + smart Test Plan**

In `SKILL_TW.md`, replace step 11 (lines 40-56):

```
11) 產生 PR 標題和正文：
- **標題**：
  - 若本分支只有 1 個 commit，直接使用該 commit message 作為標題。
  - 若有多個 commit，基於分支名和 commit 列表產生 1 句概括性英文標題（50 字以內），風格與最近提交一致。
  - 若使用者在命令後附加了描述文字，優先將其融入標題。
- **正文**（英文，Markdown 格式）：
  ```markdown
  ## Summary
  <3-10 條要點，說明本次 PR 做了什麼、為什麼這樣做>

  ## Commits
  <列出 git log BASE_BRANCH..HEAD 的所有 commit，格式：`- <hash>: <message>`>

  ## Test Plan
  - [x] <本次改動需要驗證的關鍵點1>
  - [x] <本次改動需要驗證的關鍵點2>
  ```
```

With:

```
11) 產生 PR 標題和正文：
- **語言**：使用步驟 7 中檢測到的語言。若未檢測到強制語言，預設英文。Section headers（## Summary, ## Commits, ## Test Plan）始終保持英文。
- **標題**：
  - 若本分支只有 1 個 commit，直接使用該 commit message 作為標題。
  - 若有多個 commit，基於分支名和 commit 列表產生 1 句概括性標題（50 字以內），風格與最近提交一致。
  - 若使用者在命令後附加了描述文字，優先將其融入標題。
- **正文**（Markdown 格式）：
  ```markdown
  ## Summary
  <3-10 條要點，說明本次 PR 做了什麼、為什麼這樣做。
   每條要點必須回答「改了什麼」和「為什麼改」——不要只是列出檔案名稱或重複 commit message。聚焦改動的意圖和影響。>

  ## Commits
  <列出 git log BASE_BRANCH..HEAD 的所有 commit，格式：`- <hash>: <message>` — 保持原始 commit message，不翻譯>

  ## Test Plan
  <根據 commit 列表中的 commit 類型產生測試項：
   - `feat` commits → 驗證新功能的核心行為和邊界情況
   - `fix` commits → 驗證原始 bug 不再重現，檢查回歸問題
   - `refactor` commits → 驗證現有行為未受影響
   - `docs` commits → 驗證文件準確性和連結有效性
   - `test` commits → 驗證測試通過且覆蓋率達標
   - `perf` commits → 驗證效能改善可度量
   - `chore`/`ci` commits → 驗證建置/CI 流程正常運行
   - 無類型前綴的 commit → 從 message 和檔案變更推斷意圖，產生對應測試項

   使用 `- [ ]` 格式（未勾選/待驗證），不要用 `- [x]`。每條必須針對本 PR 的實際改動，禁止使用空泛的「驗證功能正常」。>
  ```
```

- [ ] **Step 3: Verify and commit**

```bash
git add plugins/smart/skills/pr/SKILL_TW.md
git commit -m "feat(pr): add language override and smart test plan to Traditional Chinese skill"
```

---

### Task 4: Modify SKILL_KO.md (Korean)

**Files:**
- Modify: `plugins/smart/skills/pr/SKILL_KO.md:22-56`

- [ ] **Step 1: Add CLAUDE.md language detection to step 7**

In `SKILL_KO.md`, replace step 7 (lines 22-24):

```
7) 기본 정보 수집 (병렬 실행):
- `git branch --show-current` (현재 브랜치 이름, `HEAD_BRANCH`로 기록)
- `git log -1 --oneline` (최신 커밋 1건, 단일 커밋 시나리오 판단용)
```

With:

```
7) 기본 정보 수집 (병렬 실행):
- `git branch --show-current` (현재 브랜치 이름, `HEAD_BRANCH`로 기록)
- `git log -1 --oneline` (최신 커밋 1건, 단일 커밋 시나리오 판단용)
- 프로젝트 루트의 `CLAUDE.md` 파일(존재하는 경우)을 읽고 강제 출력 언어 설정이 있는지 의미적으로 감지합니다 (예: "Always respond in ...", "language:" 등의 지시). 강제 언어가 감지되면, 11단계에서 PR 제목, Summary, Test Plan에 해당 언어를 사용합니다 (단, section headers는 영어로 유지하고 commit messages는 원문 그대로 유지). 감지되지 않으면 기본값으로 영어를 사용합니다.
```

- [ ] **Step 2: Update step 11 — Summary guideline + language conditional + smart Test Plan**

In `SKILL_KO.md`, replace step 11 (lines 40-56):

```
11) PR 제목 및 본문 생성:
- **제목**:
  - 이 브랜치에 커밋이 1개뿐이면, 해당 커밋 메시지를 그대로 제목으로 사용합니다.
  - 커밋이 여러 개이면, 브랜치 이름과 커밋 목록을 기반으로 영문 요약 제목 1문장(50자 이내)을 생성하며, 최근 커밋 스타일과 일치시킵니다.
  - 사용자가 명령어 뒤에 설명 텍스트를 추가한 경우, 이를 우선적으로 제목에 반영합니다.
- **본문** (영문, Markdown 형식):
  ```markdown
  ## Summary
  <3-10개 요점, 이 PR이 무엇을 하며 왜 이렇게 했는지 설명>

  ## Commits
  <git log BASE_BRANCH..HEAD의 모든 커밋 나열, 형식: `- <hash>: <message>`>

  ## Test Plan
  - [x] <이번 변경에서 검증해야 할 핵심 사항 1>
  - [x] <이번 변경에서 검증해야 할 핵심 사항 2>
  ```
```

With:

```
11) PR 제목 및 본문 생성:
- **언어**: 7단계에서 감지된 언어를 사용합니다. 강제 언어가 감지되지 않으면 기본값으로 영어를 사용합니다. Section headers (## Summary, ## Commits, ## Test Plan)는 항상 영어로 유지합니다.
- **제목**:
  - 이 브랜치에 커밋이 1개뿐이면, 해당 커밋 메시지를 그대로 제목으로 사용합니다.
  - 커밋이 여러 개이면, 브랜치 이름과 커밋 목록을 기반으로 요약 제목 1문장(50자 이내)을 생성하며, 최근 커밋 스타일과 일치시킵니다.
  - 사용자가 명령어 뒤에 설명 텍스트를 추가한 경우, 이를 우선적으로 제목에 반영합니다.
- **본문** (Markdown 형식):
  ```markdown
  ## Summary
  <3-10개 요점, 이 PR이 무엇을 하며 왜 이렇게 했는지 설명.
   각 요점은 "무엇이 변경되었는지"와 "왜 변경했는지" 모두 답해야 합니다 — 파일 이름만 나열하거나 커밋 메시지를 반복하지 마세요. 변경의 의도와 영향에 집중하세요.>

  ## Commits
  <git log BASE_BRANCH..HEAD의 모든 커밋 나열, 형식: `- <hash>: <message>` — 원본 커밋 메시지를 그대로 유지, 번역하지 않음>

  ## Test Plan
  <커밋 목록의 커밋 유형에 따라 테스트 항목 생성:
   - `feat` 커밋 → 새 기능의 핵심 동작 및 엣지 케이스 검증
   - `fix` 커밋 → 원래 버그가 더 이상 재현되지 않는지 확인, 회귀 문제 점검
   - `refactor` 커밋 → 기존 동작이 영향받지 않았는지 확인
   - `docs` 커밋 → 문서 정확성 및 링크 유효성 확인
   - `test` 커밋 → 테스트 통과 및 커버리지 충족 확인
   - `perf` 커밋 → 성능 개선이 측정 가능한지 확인
   - `chore`/`ci` 커밋 → 빌드/CI 파이프라인 정상 실행 확인
   - 유형 접두사가 없는 커밋 → 메시지와 파일 변경에서 의도를 추론하여 적절한 테스트 항목 생성

   `- [ ]` 형식(미체크/검증 대기)을 사용하고 `- [x]`는 사용하지 마세요. 각 항목은 이 PR의 실제 변경 사항에 구체적이어야 합니다 — 일반적인 "기능이 작동하는지 확인"은 금지합니다.>
  ```
```

- [ ] **Step 3: Verify and commit**

```bash
git add plugins/smart/skills/pr/SKILL_KO.md
git commit -m "feat(pr): add language override and smart test plan to Korean skill"
```

---

### Task 5: Modify SKILL_JA.md (Japanese)

**Files:**
- Modify: `plugins/smart/skills/pr/SKILL_JA.md:22-56`

- [ ] **Step 1: Add CLAUDE.md language detection to step 7**

In `SKILL_JA.md`, replace step 7 (lines 22-24):

```
7) 基本情報の収集（並列実行）：
- `git branch --show-current`（現在のブランチ名、`HEAD_BRANCH` として記録）
- `git log -1 --oneline`（最新のコミット 1 件、単一コミットシナリオの判定用）
```

With:

```
7) 基本情報の収集（並列実行）：
- `git branch --show-current`（現在のブランチ名、`HEAD_BRANCH` として記録）
- `git log -1 --oneline`（最新のコミット 1 件、単一コミットシナリオの判定用）
- プロジェクトルートの `CLAUDE.md` ファイル（存在する場合）を読み取り、強制出力言語の設定があるかセマンティックに検出します（例：「Always respond in ...」、「language:」などのディレクティブ）。強制言語が検出された場合、ステップ 11 の PR タイトル、Summary、Test Plan にその言語を使用します（ただし section headers は英語のまま、commit messages は原文のまま維持）。検出されない場合はデフォルトで英語を使用します。
```

- [ ] **Step 2: Update step 11 — Summary guideline + language conditional + smart Test Plan**

In `SKILL_JA.md`, replace step 11 (lines 40-56):

```
11) PR タイトルと本文の生成：
- **タイトル**：
  - このブランチにコミットが 1 つだけの場合、そのコミットメッセージをそのままタイトルとして使用します。
  - コミットが複数ある場合、ブランチ名とコミットリストに基づいて英語の要約タイトルを 1 文（50 文字以内）で生成し、最近のコミットスタイルに合わせます。
  - ユーザーがコマンドの後に説明テキストを追加した場合、それを優先的にタイトルに反映します。
- **本文**（英語、Markdown 形式）：
  ```markdown
  ## Summary
  <3-10 個の要点、この PR が何をするか、なぜそうするかを説明>

  ## Commits
  <git log BASE_BRANCH..HEAD のすべてのコミットを一覧、形式：`- <hash>: <message>`>

  ## Test Plan
  - [x] <今回の変更で検証すべき重要ポイント 1>
  - [x] <今回の変更で検証すべき重要ポイント 2>
  ```
```

With:

```
11) PR タイトルと本文の生成：
- **言語**：ステップ 7 で検出された言語を使用します。強制言語が検出されない場合、デフォルトで英語を使用します。Section headers（## Summary, ## Commits, ## Test Plan）は常に英語のままにします。
- **タイトル**：
  - このブランチにコミットが 1 つだけの場合、そのコミットメッセージをそのままタイトルとして使用します。
  - コミットが複数ある場合、ブランチ名とコミットリストに基づいて要約タイトルを 1 文（50 文字以内）で生成し、最近のコミットスタイルに合わせます。
  - ユーザーがコマンドの後に説明テキストを追加した場合、それを優先的にタイトルに反映します。
- **本文**（Markdown 形式）：
  ```markdown
  ## Summary
  <3-10 個の要点、この PR が何をするか、なぜそうするかを説明。
   各要点は「何が変更されたか」と「なぜ変更したか」の両方に答える必要があります — ファイル名の羅列やコミットメッセージの繰り返しではなく、変更の意図と影響に焦点を当ててください。>

  ## Commits
  <git log BASE_BRANCH..HEAD のすべてのコミットを一覧、形式：`- <hash>: <message>` — 元のコミットメッセージをそのまま維持、翻訳しない>

  ## Test Plan
  <コミットリストのコミットタイプに基づいてテスト項目を生成：
   - `feat` コミット → 新機能のコア動作とエッジケースの検証
   - `fix` コミット → 元のバグが再現しないことの確認、リグレッションの確認
   - `refactor` コミット → 既存の動作が影響を受けていないことの確認
   - `docs` コミット → ドキュメントの正確性とリンクの有効性の確認
   - `test` コミット → テスト合格とカバレッジ要件の充足確認
   - `perf` コミット → パフォーマンス改善が測定可能であることの確認
   - `chore`/`ci` コミット → ビルド/CI パイプラインの正常動作確認
   - タイプ接頭辞のないコミット → メッセージとファイル変更から意図を推測し、適切なテスト項目を生成

   `- [ ]` 形式（未チェック/検証待ち）を使用し、`- [x]` は使用しないでください。各項目はこの PR の実際の変更に固有でなければなりません — 一般的な「機能が動作するか確認」は禁止です。>
  ```
```

- [ ] **Step 3: Verify and commit**

```bash
git add plugins/smart/skills/pr/SKILL_JA.md
git commit -m "feat(pr): add language override and smart test plan to Japanese skill"
```

---

### Task 6: Final verification

- [ ] **Step 1: Diff review**

Run `git log --oneline pr-refactor ^main` to see all commits on this branch.
Run `git diff main..pr-refactor -- plugins/smart/skills/pr/` to review all changes.

- [ ] **Step 2: Cross-language consistency check**

Verify that all 5 SKILL files have the same structural changes:
- Step 7 has 3 bullet points (not 2)
- Step 11 starts with a "Language" bullet
- Step 11 Summary includes the quality guideline
- Step 11 Test Plan uses `- [ ]` and has the type-based generation rules
- Step 11 Commits section specifies "keep original, never translate"

- [ ] **Step 3: Commit plan document**

```bash
git add docs/superpowers/plans/2026-03-15-pr-skill-optimization.md
git commit -m "docs: add PR skill optimization implementation plan"
```
