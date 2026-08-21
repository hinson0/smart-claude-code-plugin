---
name: close-issue
description: 核对单个 GitLab Issue 已完成的实现资产；报告是否可关闭，或在明确授权后发布这些资产并关闭 Issue。用于 /implement 等实现工作已经提交并 Review 后。
---

# 收口单个 GitLab Issue

## 确认授权与输入

1. 只接受一个明确的 Issue IID 或 URL。目标缺失或存在歧义时停止。
2. 区分用户意图：
   - “可以关闭吗”“检查是否可收口”仅授权只读核对；返回 `ready` 或 `not_ready` 后结束。
   - “关闭这个 Issue”授权发布本 Skill 规定的一条开发资产记录，并在发布成功后关闭 Issue。
   - 意图不明确时按只读核对处理。
3. 接受可选的实现 commit。从用户输入、Issue、仓库规则和当前 Git 事实补齐省略项；无法唯一证明实现 commit 时返回 `not_ready`。
4. 关闭授权不包含 push、merge、创建 MR/PR、修改 checklist 或标签。只有另行明确授权时才执行这些动作。

## 读取当前事实

1. 完整读取当前 checkout 适用的 `AGENTS.md`、`CLAUDE.md`，以及其中指向的 Issue Tracker 和 Git 约定。当前版本只支持明确使用 GitLab Issues 与 `glab issue` 的仓库；其他平台返回 `not_ready`。
2. 运行 `glab issue view <issue> --comments`，核对 Issue 状态、规格、验收条件，以及评论中的实现或验收记录。
3. 检查工作区、实现 commit 和当前实现分支：
   - 任务工作区不能存在未提交改动；脚本采用更保守的全工作区 clean 门禁。
   - 实现 commit 必须是已提交对象。
   - 当前实现分支必须包含实现 commit。
4. 读取 commit diff、仓库内任务 Review 记录和实际运行过的检查。若工作由 `/implement` 产出，以它的最终 commit、测试结果和 code review 作为候选资产，再用 Git 与命令结果核实。逐条为验收条件找到证据；缺失证据时运行仓库允许的安全检查或返回 `not_ready`。没有运行的检查不得写成通过。
5. 读取已有 code review 结论；没有可信 Review 时按仓库约定执行 Review，无法执行则返回 `not_ready`。摘要不是事实源，必须回到 Issue、commit、文件和命令结果核对。

## 执行门禁

先运行只读检查：

```bash
node <本 Skill 目录>/scripts/close-issue.mjs check \
  --issue <iid-or-url> \
  --commit <implementation-sha>
```

- `ready`：工作区 clean、Issue 为 open，且当前实现分支包含实现 commit。
- `not_ready`：列出所有 blocker 和当前分支包含证据，不写 Issue。
- 脚本返回 `ready` 只是必要条件；验收证据与可信 Review 也必须完整，才能发布资产或关闭 Issue。

只读检查请求到此结束，不创建 note 文件，也不调用 GitLab 写接口。

## 发布开发资产并关闭

1. 只在已有明确关闭授权、脚本返回 `ready`、验收证据完整且 Review 结论可信时继续。
2. 在 Git 工作区外创建临时 Markdown note，内容精炼且可独立审计，使用以下固定英文标题：
   - `## Implementation assets`：Issue 或规格、当前实现分支、实现 commit、修改范围，以及实际存在的可持续访问链接。
   - `## Acceptance evidence`：验收条件对应的事实，以及实际运行的命令和结果。
   - `## Review conclusion`：Review 来源、结论、已处理问题和残余风险。
   - `## Closeout boundaries`：当前实现分支、尚未核实的目标分支集成，以及未执行的 push、merge、MR/PR、环境验收等动作。
3. 引用当前 Issue、commit、Review 和检查结果；概括规格与 diff，不整段复制。排除 secrets、Authorization headers、完整环境变量、模型 trace 和未经核实的测试结果。
4. 运行关闭命令；脚本会重新执行全部门禁，再严格按 note 成功后 close 的顺序写入：

```bash
node <本 Skill 目录>/scripts/close-issue.mjs close \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --note-file <note.md>
```

跨项目使用数字 IID 时添加 `--repo <group/project>`；完整 Issue URL 不需要猜测项目。目标分支集成属于需要披露的交付边界，不是关闭门禁。

5. 根据脚本 JSON 输出收口：
   - `closed`：返回 note 与 Issue 的可点击链接，并说明仍存在的交付边界。
   - `not_ready` 且 `failure: note_failed`：note 未发布，close 未执行；报告失败后停止。
   - `partially_completed` 且 `stage: noted`：note 已发布但 close 失败；保留并返回 note 链接，明确 Issue 仍为 open。
6. 删除临时 note 文件。只能使用 fixture 与假的 `git`、`glab` 可执行文件测试本 Skill，不得使用真实 Issue 充当一次性测试数据。
