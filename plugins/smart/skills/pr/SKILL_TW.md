---
description: 自動完成 add/commit/push 並在 GitHub 上建立 Pull Request（自動生成 PR 標題和內文）
argument-hint: 無需參數。自動 [check+add+commit+push+pr]
---

你是倉庫提交與 PR 助手。目標：先完成標準提交推送，再在 GitHub 上建立 Pull Request。

執行步驟（必須嚴格按順序，不可跳過）：

---

## 階段一：Push

@../push/SKILL_TW.md

- 若工作區乾淨（無任何變更），跳過階段一，直接進入階段二。

---

## 階段二：建立 Pull Request

7) 收集基礎資訊（並行執行）：
- `git branch --show-current`（當前分支名，記為 `HEAD_BRANCH`）
- `git log -1 --oneline`（最新一條 commit，用於判斷單 commit 場景）

8) 確定目標分支（base branch）：
- 如果使用者透過 $0 明確指定了目標分支，則使用該分支名稱作為 base branch。
- 否則**一定要**使用 `AskUserQuestion` 工具詢問使用者：
  > 請問 PR 的目標分支是？（預設 `main`，直接按 Enter 即可）
- 將使用者回答記為 `BASE_BRANCH`；若使用者直接按 Enter 或留空，則 `BASE_BRANCH=main`。

9) 檢查 PR 是否已存在：
- 執行：`gh pr list --head <HEAD_BRANCH> --json number,url,state`
- 若已存在同 head 分支的 **open** PR，直接展示現有 PR 的 URL，提示使用者 PR 已存在，並結束。

10) 收集完整 commit 列表：
- 執行：`git log <BASE_BRANCH>..HEAD --oneline`
- 記錄所有 commit（hash + message），用於產生 PR 正文。

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

12) 執行 PR 建立：
```bash
gh pr create \
  --title "<PR 標題>" \
  --base <BASE_BRANCH> \
  --body "$(cat <<'EOF'
<PR 正文>
EOF
)"
```
- 若 `gh` 命令不存在，提示使用者安裝：`brew install gh && gh auth login`，並結束。

---

## 輸出結果

成功時展示：
1. 階段一使用的所有 commit message（若有變動）。
2. **PR URL**（醒目格式）：`PR: <url>`
3. PR 標題與目標分支（`HEAD_BRANCH` -> `BASE_BRANCH`）。
4. 最終 `git status`（確認工作區乾淨）。

失敗時展示：
- 失敗發生在哪個步驟。
- 具體錯誤訊息。
- 下一步可執行的修復命令。

---

## 約束

- 不修改 git config。
- 不使用 `--amend`、`--force`、`--no-verify`。
- 僅執行與本次提交和 PR 直接相關的命令，不做額外重構或檔案修改。
- PR 不自動 merge，也不自動 assign reviewer，建立後由使用者決定後續操作。
