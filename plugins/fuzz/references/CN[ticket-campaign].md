# Ticket campaign 共享合同

`handle-all-tickets` 写入 campaign，`verify-all-tickets` 只读验证同一份
campaign。两个 Skill 都完整读取本文件，不各自维护状态或开发资产定义。

## 交付图

1. 先读取仓库的 `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、
   `CONTEXT.md` 和适用 ADR。tracker 或 triage 映射缺失时停止，并要求用户先运行
   `/setup-matt-pocock-skills`。
2. 完整读取父 Ticket 的正文、评论、状态和关系，再递归读取全部子 Ticket。优先使用
   tracker 原生父子关系；正文关系按 tracker 文档解析。本仓库接纳顶部
   `Parent: #<iid>`，并兼容旧 `## Parent` 对已确认父节点的精确引用。
3. 完整读取每个子 Ticket 的正文、评论、状态、负责人以及原生或正文 `Blocked by`
   关系。排除父 Ticket 本身、兄弟父票据和无法证明归属的项。
4. 至少发现一个子 Ticket，并构建无环依赖图。循环、缺失 blocker，或集合外未完成
   blocker 的成果不在 campaign base 时，停止受影响分支。

## Campaign 身份与恢复

- Campaign 身份由父 Ticket、campaign base、campaign branch 和执行模式组成。模式写为
  `mode=serial|parallel`，当前完成提交写为 `final campaign head`。
- 使用 `<!-- handle-all-tickets:progress parent=<父 Ticket> -->` 查找唯一父进度评论。
  评论记录 campaign base、branch、mode、final campaign head、当前 Ticket，以及每票的
  `pending`、`implementing`、`candidate`、`campaign-accepted` 或 `blocked` 状态；候选票另记
  `review=pending|passed`。
- 重跑时重新读取 tracker 和 Git，不信任会话快照。请求模式与已有 mode 不一致时停止，
  不在中途切换。旧进度评论没有 `mode` 时按历史行为恢复为 `parallel`。
- 每票开始时记录 `ticket_base`，实现与返修产生的连续提交以
  `ticket_base..ticket_tip` 表示。串行 candidate 的 tip 必须从 campaign branch 可达；
  并行 candidate 必须从已记录子 branch 可达。`campaign-accepted` 的 tip 必须已经进入
  campaign branch；否则停止，不把游离 commit 当作完成。
- 恢复 `candidate` 且 `review=passed`、ticket_tip 可达、对应 worktree clean 的 Ticket 时，
  直接恢复主代理验收和资产门禁，不重复实现。`review=pending` 或旧进度评论没有 review
  字段时，先恢复单票 review：原实现子代理可恢复就交回同一子代理；原子代理已丢失就从
  已提交候选成果 fork fresh context 子代理，只执行 review、必要返修和追加 commit。
- 恢复 `implementing` 且原实现子代理仍可恢复时，把当前状态交回同一子代理；原子代理已
  丢失时，clean 且存在可达新 commit 的成果转为 `candidate` 并记 `review=pending`，clean
  且没有新 commit 的票退回 `pending`，dirty 时停止并报告所有权不明，不 fork 替代实现。
- `blocked` Ticket 每轮重新读取阻塞条件；条件未变化时保持 blocked，也不解锁 dependents。
- 只有实现已进入 campaign branch、所需检查通过、工作树 clean、开发资产和标签均已
  回读验证的 Ticket 才是 `campaign-accepted`。口头摘要、关闭状态或裸 commit hash
  均不足以恢复为已验收。

## 开发资产

1. 使用
   `<!-- handle-all-tickets:asset parent=<父 Ticket> ticket=<子 Ticket> -->`
   查找本 campaign 的唯一子 Ticket 资产评论；不存在则创建，存在则更新同一条。
2. 评论至少包含：
   - campaign base、ticket_base、ticket_tip 和 `ticket_base..ticket_tip`；
   - 可持续访问的远端 commit、MR，或支持二进制变更的可下载 patch；
   - patch 的 SHA-256 校验和；
   - 修改文件和实现范围；
   - Acceptance criteria 的逐条证据；
   - 实际运行的测试命令与结果；
   - 唯一一次单票 code review 的结论、残余风险和未执行的外部动作。
3. 本地路径、本地 branch 和裸 commit hash 不是可持续访问的开发资产。没有获准 push
   或创建 MR/PR 时，从 ticket_base 到 ticket_tip 导出 patch 并上传 tracker 附件。
4. 发布后重新读取评论和附件，确认幂等标记唯一、链接可访问、校验和及 commit 区间与
   当前候选成果一致。

## Triage 与最终状态

- 从 `docs/agents/triage-labels.md` 解析五个 triage 角色的实际字符串。本仓库“需要人工
  处理”为 `ready-for-human`；不得把 wayfinder 等非 triage 标签一起移除。
- 子 Ticket 通过资产门禁后，移除其他 triage 角色标签并添加“需要人工处理”，再回读
  确认只有一个 triage 角色标签且值正确。Ticket 保持 open。
- 全部子 Ticket `campaign-accepted` 且父目标级检查通过后，在父进度评论写入最终
  `final campaign head` 和 `awaiting-human-acceptance`，再将父 Ticket 流转为“需要人工
  处理”并回读确认。
- 未经用户额外明确授权，不得 push、创建 MR/PR 或关闭 Ticket。
