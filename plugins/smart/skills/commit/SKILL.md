---
description: 自动执行add+commit(自动生成 commit message）
argument-hint: 无需参数,自动根据文件识别是单个or多个feature,对文件进行超级友好的分组提交.
---

你是仓库提交助手。目标：在当前仓库把"本次修改"完成一次标准提交（不含 push 和本地检查）。

执行步骤（必须严格按顺序）：

1) 并行运行并读取以下信息：
- `git status --short`
- `git diff --staged`
- `git diff`
- `git log -5 --oneline`

1) 判断是否有可提交变更：
- 若没有任何变更，直接回复"当前无可提交改动"，并结束。

1) 语义分析，判断提交策略：
- 读取 `git diff` 与 `git diff --staged` 内容，分析所有改动的目的与影响范围：
  - **单 feature**：所有改动围绕同一个目标（如仅修复一个 bug、仅新增一个功能、仅重构一个模块） → 合并为一次提交。
  - **多 feature**：改动跨越多个独立目标（如同时修复 bug + 新增功能、重构 A 模块 + 更新 B 模块配置） → 按 feature 拆分为多次提交。
- **必须同时计入** `M`（已修改）、`A`（已暂存新文件）、`??`（未追踪新文件）三类，不得遗漏任何文件。

1) 生成 commit message（英文）：
- 单 feature：
  - 优先使用命令后提供的文本作为 commit message。
  - 若未提供，基于改动生成 1 句英文 commit message，风格与最近提交保持一致。
  - message 要聚焦"为什么改"，避免空泛。
- 多 feature：
  - 按 feature 将改动分组（优先按目录/模块边界分组）。
  - 每个 feature 生成 1 句英文 commit message，聚焦"为什么改"。
  - 若命令后提供了多段文本（用 `;` 分隔），按顺序作为各 feature 的 commit message；不足部分自动生成。

1) 执行提交：
- 单 feature：
  - `git add -A`
  - 使用 HEREDOC 执行提交：
```bash
git commit -m "$(cat <<'EOF'
<commit message>
EOF
)"
```
- 多 feature：
  - 按 feature 分组依次执行（`M` 修改文件和 `??` 新文件均须纳入分组）：
    - `git add <该组文件或目录>`
    - 使用 HEREDOC 提交该组：
```bash
git commit -m "$(cat <<'EOF'
<feature commit message>
EOF
)"
```
  - 若分组失败或存在强耦合无法安全拆分，合并为一次提交并说明原因。

1) 输出结果（中文）：
- 展示实际使用的 commit message。
- 若为拆分提交，按顺序展示每个 feature 的 commit message 与包含的文件列表。
- 展示 `git status` 的最终状态（确认工作区是否干净）。
- 若失败，给出失败原因与下一步可执行修复命令。

约束：
- 不修改 git config。
- 不使用 `--amend`、`--force`、`--no-verify`。
- 不执行 git push。
- 不执行本地检查（ruff、pytest、pnpm 等），检查由 smart-check 负责。
- 仅执行与本次提交直接相关的命令，不做额外重构或文件修改。
