# Smart 与 Fuzz 双装验收

**日期**：2026-08-23

**远端来源**：GitHub codeload 分支 `yzb/migrate-fuzz-plugin`，检查点
`7118cf3cd9045ad0faa6cf0115363677fb2bea1c`

## Claude Code

隔离配置同时安装：

- `smart@smart` 5.0.0，enabled=true
- `fuzz@smart` 2.0.0，enabled=true

两个插件分别位于自己的 cache 路径，没有 payload 合并。

## Codex

隔离配置的 installed 列表同时包含 Smart 5.0.0 与 Fuzz 2.0.0；两者 source 分别指向
`plugins/smart` 和 `plugins/fuzz`，available 列表为空。

## Hook 与状态边界

- Smart 安装副本具有 SessionStart、PreToolUse、Stop 三类既有 hook。
- Fuzz 安装副本仅具有独立 SessionStart 宫廷 hook。
- Fuzz SessionStart 已在两个宿主安装副本中分别验证，均生成恰好 10 个 `fuzz-*` Agent。
- 多插件治理测试确认 Smart 不引用 `.fuzz`、`fuzz-*` 或宫廷状态，Fuzz 不引用 Smart payload。

结论：Smart 与 Fuzz 可在同一 marketplace、同一宿主配置中独立共存。

