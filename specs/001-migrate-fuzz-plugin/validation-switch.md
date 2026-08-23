# Fuzz 来源切换验收

**日期**：2026-08-23

**隔离根目录**：`/tmp/fuzz-switch-verify.HVsw28`

## Claude Code

1. 从源 checkout 安装 `fuzz@ce-workflow` 1.0.0。
2. 使用独立状态目录创建 `$CODEX_HOME/fuzz/i-am-the-king=on`。
3. 执行旧 SessionStart，确认 10 个 `fuzz-*` Agent。
4. 卸载 `fuzz@ce-workflow`，保留 `ce-workflow` marketplace。
5. 从远端 codeload 验证归档安装 `fuzz@smart` 2.0.0。
6. 使用相同状态目录执行新 SessionStart，状态仍为 `on`，Agent 仍为 10 个。

## Codex

执行与 Claude Code 相同的来源切换顺序。Codex 安装输出确认旧版本来自 `ce-workflow`、
新版本来自 `smart`；相同状态目录和 `fuzz-*` Agent 命名空间保持有效。

## 结果

- 总耗时：5 秒，小于 10 分钟目标。
- 任一时刻仅安装一个来源的 Fuzz。
- Claude Code Agent：10。
- Codex Agent：10。
- 用户状态：两边均保持 `on`。
- 未删除源 `ce-workflow` marketplace，其他插件不受影响。

结论：US2 来源切换与状态延续通过。

