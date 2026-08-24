---
name: matt-implement-all-tickets
description: 串行实现并关闭当前 /to-tickets 输出中的有序 Tickets。
disable-model-invocation: true
---

# Matt 串行实现全部 Tickets

## 调用门禁

1. 要求用户在同一请求中显式调用 Matt 的 `implement` skill，其指令必须已在当前
   上下文中。否则在读取或写入任何内容前停止，并提示用户同时调用
   `$smart:matt-implement-all-tickets` 与当前宿主中的 Matt `implement` skill。
2. 仅使用本次对话中最近一次 `/to-tickets` 发布的有序 Ticket 集合。集合缺失、
   有歧义或无法继续唯一定位每张 Ticket 时停止。不得发现或加入其他工作。
3. 读取仓库规则和 `docs/agents/issue-tracker.md`。缺少 tracker 文件时，提示用户
   运行 `/setup-matt-pocock-skills`。仅支持 GitHub Issues、GitLab Issues 或
   `.scratch/` 下的本地 Markdown Tickets；其他 tracker 一律报告为不支持。
4. 开发前验证 tracker 工具和认证。要求工作树干净且当前分支可写。遇到无关改动、
   detached HEAD 或受保护分支时停止，并保持其原样。

显式调用仅授权为本次运行中的每张 Ticket 写入一份完成记录并执行一次关闭状态转换。
它不授权 push、merge、创建 MR/PR、修改负责人、标签、checklist、父 Ticket，或处理
已发布 Ticket 集合以外的工作。

## 串行边界

- 当前 session 只负责编排。为当前 Ticket fork 一个全新的实现上下文，等待其完成并
  关闭该 Ticket 后，才 fork 下一个。
- 严格遵循 `/to-tickets` 的发布顺序。不得重新计算顺序、填充并行槽位或预先创建后续
  worker。
- 编排 agent 对实现文件和 Git index 保持只读。worker 独占其单张 Ticket 的实现、
  测试、Review 和 commits。
- 本次运行不维护 campaign marker，也不提供跨 session 自动恢复。编排被中断时，只
  报告当前 Ticket，不在其他位置写入推测进度。

## 交付一张 Ticket

依次对每张 Ticket 执行：

1. 重新读取当前正文、评论或本地文件、状态、验收条件和 blockers。要求 Ticket 仍为
   open，且每个 blocker 均已 closed 或 `done`。状态漂移时停止，不得跳过或重排。
2. 将当前分支和 HEAD 记录为 `ticket_base`。在当前 worktree 中 fork 一个全新 worker，
   向其提供 Ticket、仓库规则、`ticket_base` 和已加载的 Matt `implement` 合同。要求
   只实现当前 Ticket，并返回 commit 区间、文件、检查和 Review 结果。
3. 等待该 worker。worker 阻塞、扩大范围、缺少 commit、工作树不干净、检查失败或
   Review 仍有可执行问题时，整批运行停在当前 Ticket。
4. 独立核验已提交的 `ticket_base..ticket_tip` diff、当前分支包含关系、干净工作树、
   修改范围、每条验收条件、实际执行的检查和最终 Review 结论。worker 报告只是证据
   指针，不能当作证据本身。
5. 生成包含以下标题的简洁完成记录：
   - `## Implementation assets`：实现 commit、区间、修改范围和文件；
   - `## Acceptance evidence`：映射到每条验收条件的证据，以及实际执行的验证命令
     和结果；
   - `## Review conclusion`：最终 Review 来源和结论；
   - `## Closeout boundaries`：遗留风险和未执行的交付动作。
6. 通过已配置 tracker 发布并关闭：
   - **GitHub：** 将记录发布为一条 Issue comment，验证 comment，关闭 Issue，再重新
     读取并要求状态为 `CLOSED`。
   - **GitLab：** 使用同级 `close-issue` 脚本，传入 Ticket、`ticket_tip` 和临时完成
     记录文件。要求脚本返回 `closed`，再重新读取 Issue 并验证 note 与关闭状态。
   - **本地 Markdown：** 在 `## Completion` 下追加记录，将 Ticket 的精确 `Status:`
     值替换为 `done`，再重新读取验证。Ticket 文件被 Git 跟踪时，仅提交该 tracker
     更新并遵循仓库 commit 规则；恢复干净工作树后才能继续。
7. 删除临时记录文件。只有经过验证的关闭才算当前 Ticket 完成并解锁下一张。记录已发布
   但关闭失败属于部分完成：报告后停止，不得重复发布记录。

## 完成

每张 Ticket 均验证为 closed 或 `done` 后，按顺序返回汇总，列出 Ticket、实现 commit、
检查、Review 结论、完成记录位置和最终状态。只有所有 Ticket 通过全部门禁，才能声明
本次运行完成。
