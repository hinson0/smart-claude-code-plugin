# Fuzz 迁移验证总报告

**日期**：2026-08-23

## 目标本地

- Fuzz 文件：59。
- Fuzz skills：10；每项具有英文 `SKILL.md` 与中文 `CN.md`。
- References：4 组英文/中文配对。
- Fuzz 双 manifest：2.0.0。
- Smart 双 manifest：5.0.0；tree 保持 `ad9d3639e31805814e736afda21f43e59eb86302`。
- 根 marketplace：Codex/Claude Code 均发布 `{smart, fuzz}`。
- `claude plugin validate plugins/fuzz`：通过。
- `claude plugin validate .`：通过。
- 目标全量测试：64 passed，0 failed。

## 目标远端

- 功能分支：`yzb/migrate-fuzz-plugin`。
- 检查点：`7118cf3cd9045ad0faa6cf0115363677fb2bea1c`。
- GitHub codeload 下载成功，Fuzz payload 与本地逐文件一致。
- Claude Code 隔离安装 `fuzz@smart` 2.0.0：通过。
- Codex 隔离安装 `fuzz@smart` 2.0.0：通过。
- 远端归档测试：61 passed，0 failed。
- 两个宿主安装副本的 SessionStart 和 10 个 Agent：通过。

## 来源切换与双装

- `fuzz@ce-workflow` → `fuzz@smart`：Claude Code、Codex 均通过。
- 切换耗时：5 秒。
- `.fuzz`、`$CODEX_HOME/fuzz`、`fuzz-*` 状态延续：通过。
- Smart 5.0.0 与 Fuzz 2.0.0 同时安装：两个宿主均通过。
- Smart/Fuzz hooks、payload、命名空间和状态隔离：通过。

## 源仓退役

- 两个源 marketplace 只保留 `ce-workflow`。
- 源 `plugins/fuzz` 与 11 组专属测试已删除。
- CI 的 PDF 专项和 Fuzz release loop 已删除。
- README 已加入迁址通知，AGENTS 已移除 Fuzz 版本规则。
- 源全量剩余测试：109 passed，0 failed。
- 源 Claude marketplace 验证：通过。
- 历史 `fuzz-v*` tags：保留，最新为 `fuzz-v1.0.0`。
- 源退役分支：`yzb/retire-fuzz-plugin`，远端检查点 `4e9ff0d`。

## 结论

代码、合同、本地和两个远端功能分支验收均通过。目标与源变更尚未合并默认分支；必须先
合并并复验目标，再合并源退役分支，不能把当前状态描述为已经上线。
