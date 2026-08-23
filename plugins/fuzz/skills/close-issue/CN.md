---
name: close-issue
description: 核对单个 Issue 的实现、验收与目标分支集成事实，并在明确授权后发布可审计的开发资产记录和关闭 Issue。用于用户要判断 Issue 是否可关闭，或要求提交开发资产并收口单个 GitLab Issue 时。
---

# 单 Issue 收口

## 确认授权与输入

1. 只接受一个明确的 Issue IID 或 URL。目标缺失或存在多个候选时停止，不猜测。
2. 区分用户意图：
   - “可以收口吗”“检查是否能关闭”仅授权只读核对；返回 `ready` 或 `not_ready` 后结束。
   - “关闭”“收口 Issue”授权发布本 Skill 规定的一条开发资产记录，并在发布成功后关闭该 Issue。
   - 意图不明确时按只读核对处理。
3. 接受可选的目标分支、实现 commit，以及用户是否明确允许“仅本地目标分支已集成”的例外。
   从用户输入、Issue、仓库规则和 Git 事实中补齐省略项；无法唯一证明实现 commit、目标分支或 remote 时返回 `not_ready`。
4. 关闭授权不包含 push、merge、创建 MR/PR、修改 checklist 或标签。只有用户另行明确要求时才执行这些动作。

## 读取当前事实

1. 完整读取当前 checkout 适用的 `AGENTS.md`、`CLAUDE.md`，以及其中指向的 Issue Tracker 和 Git 约定。首版只支持明确使用 GitLab Issues 与 `glab issue` 的仓库；其他平台返回 `not_ready`。
2. 运行 `glab issue view <issue> --comments`，核对 Issue 状态、规格、验收条件、评论中的实现与验收记录。
3. 检查工作区、实现 commit 和目标分支：
   - 工作区没有任务内未提交改动；脚本采用更保守的全工作区 clean 门禁。
   - 实现 commit 存在且是已提交对象。
   - 本地目标分支包含实现 commit。
   - 刷新目标远端引用后，分别核对本地目标分支与 `<remote>/<target>`；两者不是同一个集成事实。
4. 读取 commit diff、仓库内任务 Review 记录和实际运行过的检查。逐条为验收条件找到证据；缺失证据时运行仓库允许的安全检查或返回 `not_ready`。没有运行的检查不得写成通过。
5. 读取已有 code review 结论；没有可信 Review 时按仓库约定执行 Review，无法执行则返回 `not_ready`。摘要不是事实源，必须回到 Issue、commit、文件或命令结果核对。

## 执行门禁

先运行只读检查：

```bash
node <本 Skill 目录>/scripts/close-issue.mjs check \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote>
```

- `ready`：工作区 clean、Issue 为 open、本地和远端目标分支都包含实现 commit。
- `not_ready`：列出每个 blocker 和当前分支包含证据，不写 Issue。
- 远端目标分支不包含实现 commit 时默认 `not_ready`。只有用户在获知该风险后明确要求仍然关闭，才可在关闭命令添加 `--allow-local-only`；普通“关闭 Issue”授权不等于该例外授权。
- 除“远端尚未集成”外仍有任一 blocker 时，即使允许本地例外也保持 `not_ready`。

仅检查请求到此结束，不创建 note 文件，不调用写接口。

## 发布开发资产并关闭

1. 只在已有明确关闭授权且门禁为 `ready` 时继续。允许本地例外时，确认唯一例外是远端目标分支尚未包含实现 commit。
2. 在 Git 工作区外创建临时 Markdown note，内容精炼且可独立审计，固定包含：
   - `## 实现资产`：Issue/Spec、实现 commit、修改范围及可持续访问的链接；仅本地集成时同时标明 commit 尚不可从远端目标分支到达。
   - `## 验收证据`：验收条件对应的事实、实际运行的命令和结果。
   - `## Review 结论`：Review 来源、结论、已处理问题与残余风险。
   - `## 收口边界`：本地与远端分支包含关系，以及未执行的 push、merge、MR/PR、环境验收等动作。
3. 引用当前 Issue、commit、Review 和检查结果；概括规格与 diff，不整段复制。排除 secrets、Authorization headers、完整环境变量、模型 trace 和未经核实的测试结果。
4. 运行关闭命令；脚本会重新执行全部门禁，再严格按 note 成功后 close 的顺序写入：

```bash
node <本 Skill 目录>/scripts/close-issue.mjs close \
  --issue <iid-or-url> \
  --commit <implementation-sha> \
  --target-branch <branch> \
  --remote <remote> \
  --note-file <note.md>
```

若用户已明确允许仅本地集成，在末尾添加 `--allow-local-only`。跨项目使用数字 IID 时添加 `--repo <group/project>`；完整 Issue URL 不需要猜测项目。

5. 根据脚本 JSON 输出收口：
   - `closed`：返回 note 与 Issue 的可点击链接，以及仍存在的集成边界。
   - `not_ready` 且 `failure: note_failed`：note 未发布，close 未执行；报告失败后停止。
   - `partially_completed` 且 `stage: noted`：note 已发布但 close 失败；保留 note，返回其链接并明确 Issue 仍为 open。
6. 删除临时 note 文件。不得用新的真实 Issue 测试本 Skill；验证时使用 fixture 或 PATH 中的假 `git`、`glab`。
