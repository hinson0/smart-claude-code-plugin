# 宫廷模式会话 Hook

Fuzz 在会话启动、恢复、清理、压缩或分叉上下文时运行 `session-start.mjs`。
脚本根据 user 与 project 两级状态决定是否注入宫廷称谓规则，并同步十个 Codex
中文官职 Agent。Agent 同步失败不会阻止有效的称谓规则注入。
