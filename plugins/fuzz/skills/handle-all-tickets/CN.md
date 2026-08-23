---
name: handle-all-tickets
description: 编排并交付一个父 Ticket 下的全部子 Ticket，按依赖实现、验收并逐票发布可供人工复核的开发资产。用于用户要求从一个父 Ticket 全程交付其全部子 Ticket，并让每张完成票据保留实现与验收证据时。
disable-model-invocation: true
---

# 父票据全程交付

## 调用边界

- 仅在用户显式调用 `$handle-all-tickets <父 Ticket> [并行]` 或
  `/fuzz:handle-all-tickets <父 Ticket> [并行]` 时启动。
- 参数必须包含恰好一个父 Ticket 标识或 URL。`并行` 是唯一可选参数；省略 `并行` 时默认串行。
  缺失父 Ticket、传入子 Ticket、重复参数或其他额外参数时停止，不猜测目标。
- 完整读取 [campaign 共享合同](../../references/ticket-campaign.md) 并按其解析交付图、
  恢复进度、发布资产和流转 triage 标签。
- 确认宿主提供 `implement` Skill、fork 子代理能力和 tracker 写权限。任一缺失时在开发前
  停止，不复制或弱化 `$implement` 的实现规则。
- 显式调用授权主代理写入本 Skill 规定的父子 Ticket 评论、附件和 triage 标签；不授权
  push、创建 MR/PR 或关闭 Ticket。未经额外授权，整个 campaign 不得 push、创建 MR/PR
  或关闭 Ticket。

## 建立 Goal 与启动门禁

1. 先调用 `get_goal`：
   - 没有活动目标时调用 `create_goal`，目标包含父 Ticket、全部子 Ticket、依赖图、执行
     mode、逐票完成条件和最终父目标级检查；仅在用户明确给出 token budget 时设置预算。
   - 活动目标属于同一父 Ticket 时恢复它，并重新读取 tracker、共享合同和 Git 状态。
   - 活动目标属于不同父 Ticket 时停止，不覆盖现有目标。
2. 检查当前 campaign worktree clean，记录 campaign base、branch 和 HEAD。处于 detached
   HEAD 或受保护分支时，按仓库 Git 规则创建可写 campaign branch；已有修改时停止，不清理、
   暂存或吸收。
3. 从父进度评论恢复 mode；旧评论没有 mode 时按 `parallel` 恢复。请求 mode 与已有 mode
   不一致时停止。新 campaign 省略参数时写入 `mode=serial`，传入 `并行` 时写入
   `mode=parallel`。
4. 按共享合同恢复 `campaign-accepted`，再计算 blocker 均已完成的 frontier。

## 默认串行

1. 每轮重新读取 tracker 和 Git，从 frontier 中按稳定 Ticket IID 选择一票；同一时刻只运行
   一个实现子代理，也不预建后续 Ticket 的子代理。
2. 以当前 campaign branch 的 HEAD 记录 `ticket_base`，在当前 campaign worktree fork 一个
   fresh context 实现子代理。主代理在它结束前保持实现文件和 Git index 只读。
3. 向子代理传递父 Ticket 摘要、当前 Ticket 全文与评论、适用仓库规则、工作目录、branch、
   ticket_base 和以下合同：
   - 显式执行 `$implement`，只实现当前 Ticket，按已明确 seam 做 TDD，定期运行定向测试和
     typecheck，并在实现结束时运行完整检查；
   - 完整检查通过后先创建候选 commit，再以 `ticket_base` 为 fixed point、当前 Ticket 作为
     Spec source 执行唯一一次两轴 `code-review`，使 `git diff <ticket_base>...HEAD` 包含
     候选成果；
   - 有 findings 时修复、运行受影响检查并追加 commit；发生修改后重新 review，直到没有
     未解决的可执行问题；
   - 保持 tracker 只读，不 push、不创建 MR/PR、不关闭 Ticket；完成时保持工作树 clean，
     报告 `ticket_base..ticket_tip`、文件、测试和 review 结论。
4. 子代理阻塞或扩大范围时停止当前票并报告。验收失败时，把逐条可复现问题发送回同一个
   实现子代理；当前票通过全部门禁前不计算下一票。

## 显式并行

1. 评估 frontier 各票预计修改的实现、测试、migration、生成物、共享配置和 lockfile。
   只有依赖互不阻塞且写入范围可证明兼容的 Ticket 才进入同一波次。
2. 每个波次从当前已验收 campaign HEAD 创建各票独立 branch 和独立 worktree，把该 HEAD
   记录为各票 `ticket_base`，再 fork fresh 实现子代理；单票仍遵守默认串行的候选 commit、
   唯一 review、返修和报告合同，但分成实现与 review 两个调度阶段。
3. 纯实现阶段可以占满可用实现槽位；每个子代理完成检查和候选 commit 后先 yield，不进入
   `code-review`，主代理记录 `candidate` 与 `review=pending`。出现候选成果后暂停新 Ticket
   调度，等待运行中的实现子代理 yield；进入 review 前为同一个实现子代理保留两个 reviewer
   槽位，再逐票恢复它完成唯一 review 和返修。通过后记录 `review=passed`，避免 nested
   reviewers 被实现波次饿死。
4. 同一波次分别验收后，按稳定 Ticket 顺序把已验证 commit 集成到 campaign branch 并复跑
   波次检查。冲突时中止本次集成，确认 campaign branch 回到集成前的 clean 提交，再把
   rebase 或修复交回对应子代理；主代理不手工解决代码冲突。

## 主代理验收

1. 主代理不修改实现文件，不 stage 或创建实现 commit。主代理不再运行 `code-review`。串行模式
   直接验证 campaign branch 上的子代理 commit；并行模式在集成前验证子 branch。
2. 独立核对 ticket_base..ticket_tip 的实际 diff、文件范围、工作树 clean、每条
   Acceptance criteria、测试结果和子代理提供的 review 结论；不把子代理摘要当作事实。
3. 发现可复现问题时交回同一个实现子代理，收到新增 commit 后重新执行本节门禁。未通过的
   Ticket 保持未验收，也不解锁 dependents。
4. 串行候选或并行集成通过相应仓库检查后，按共享合同立即发布开发资产、更新父进度评论、
   流转 `ready-for-human` 并回读验证。全部成功后才记为 `campaign-accepted`。
5. 开发资产或标签流转失败时保留 commit、分支与可用 worktree，记录阻塞并重试；不开始
   下一票，也不把该 Ticket 描述为完成。

## 最终完成

1. 全部子 Ticket `campaign-accepted` 后，在 campaign branch 运行仓库规定的完整检查和
   父目标级集成检查；本阶段不重复单票两轴 review。
2. 核对 final campaign head、全部开发资产、逐条 Acceptance criteria、triage 标签、clean
   状态、无无关改动以及父 Ticket 整体目标。
3. 按共享合同更新父进度评论并将父 Ticket 流转为 `ready-for-human`。全部回读验证后调用
   `update_goal({ status: complete })`，并说明 campaign 已进入
   `awaiting-human-acceptance`，建议在 fresh task 中调用 `$verify-all-tickets`。
4. 存在 failed、blocked 或未处理 Ticket 时明确分类，不描述为全部完成。
