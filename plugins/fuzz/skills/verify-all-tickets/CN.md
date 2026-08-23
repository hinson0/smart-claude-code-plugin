---
name: verify-all-tickets
description: 独立验收一个父 Ticket campaign 的整体交付，核对提交、开发资产、父目标以及自动和人工场景。用于用户要在开发完成后复核全部子 Ticket 与父 Ticket 整体效果时。
disable-model-invocation: true
---

# 父票据整体验收

## 调用边界

- 仅在用户于 fresh task 中显式调用 `$verify-all-tickets <父 Ticket>` 或
  `/fuzz:verify-all-tickets <父 Ticket>` 时启动。
- 参数必须是恰好一个父 Ticket 标识或 URL；缺失、多个参数或传入子 Ticket 时停止。
- 完整读取 [campaign 共享合同](../../references/ticket-campaign.md)，只验证其定义的交付图、
  commit 区间、开发资产和最终状态。
- 整个流程只读。不得修改代码、Git、评论、标签或 Ticket 状态，也不得把修复建议直接落盘。

## 身份门禁

1. 完整读取父 Ticket、全部子 Ticket、评论、附件、关系和 triage 标签，重建交付图。
2. 检查当前工作树 clean，并从父进度评论取得 campaign base、final campaign head 和 mode。
   HEAD 必须等于记录的 final campaign head；缺失、不可解析或不相等时停止，避免验收错误
   worktree 或后续未登记修改。
3. 确认父进度为 `awaiting-human-acceptance`、每票为 `campaign-accepted`，且父子 Ticket
   均保持 open 并流转为“需要人工处理”。未达到交接状态时报告缺口，不补写状态。

## 追溯验收

1. 对每个 Ticket 独立核对 ticket_base..ticket_tip、实际 diff、文件范围、开发资产链接与
   SHA-256、Acceptance criteria 证据、测试结果和单票 review 结论。
2. 确认每个 commit 恰好归属一个 Ticket，全部 Ticket commit 均可从 final campaign head
   到达，campaign base 到 HEAD 的实际 diff 等于全部已登记范围且没有无关改动。
3. 不把资产评论当作事实；实际读取 Git、文件、测试入口和可持续访问的附件进行交叉验证。

## 自动与代码验收

1. 以 campaign base 为 fixed point 执行一次 campaign 级两轴 `code-review`，分别报告仓库
   Standards 和父 Ticket Spec 发现；这次整体验收不重复任何单票 review。
2. 按仓库规则运行全量测试、构建、类型检查和其他完整检查，记录实际命令、退出状态和关键
   输出。缺少依赖或外部权限时列为未执行，不推断通过。
3. 从父目标和跨 Ticket Acceptance criteria 推导用户可观察场景；能自动执行的场景实际
   运行，并记录输入、操作和结果。

## 交互式人工验收

1. 对必须人工操作、观察真实设备或使用外部账号的场景，给出精确步骤和预期结果，并说明
   每一步需要返回的证据。等待用户返回完整结果，不在同一回复中预判最终通过。
2. 收到结果后区分 Agent 实际执行与用户执行的证据。用户报告缺项、结果不符或无法判断时，
   将对应场景标为失败或等待人工验收，并给出可复现缺口。

## 结论

1. 输出验收矩阵，列为：父目标、Ticket、commit、Acceptance criteria、自动检查、人工场景、
   证据来源和结论。
2. 只有所有 commit 与资产可追溯、完整检查通过、两轴 review 没有未解决问题，且全部必需
   人工场景已有明确通过证据时，才给出整体通过结论。
3. 缺少必需证据、存在失败或仍为等待人工验收时，不得给出通过结论；按 Ticket 汇总阻塞、
   影响和下一步，但保持工作区与 tracker 不变。
