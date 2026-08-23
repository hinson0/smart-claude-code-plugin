# hooks（中文说明）

> 本文件是 `plugins/smart/hooks/` 的中文说明，仅供阅读参考。真正被宿主加载执行的是本目录下的英文脚本与 `hooks.json`。

`hooks.json` 注册了两个钩子：

## SessionStart → `greet.sh`

会话开始时触发。用 `nohup ... &` 在后台播放一句欢迎语（`say`），并把输出丢弃——后台运行是为了防止 Claude Code 进程退出时把 `say` 命令一起 kill 掉。

## PreToolUse → `session-logs.py`

在每次工具调用前触发。从标准输入读取一段 JSON，按日期归档写入项目下的会话日志：

- 目录：`.smart/session-logs/YYYY-MM-DD/`（`CLAUDE_PROJECT_DIR` 下，自动 `mkdir -p`）。
- 文件名：以输入 JSON 的 `session_id` 字段命名。
- 写入策略：先读出已有条目、追加本次、再整体回写，保证文件始终是一个合法的 JSON 数组；遇到损坏或旧格式的文件直接丢弃重建，避免钩子崩溃（`ensure_ascii=False`，中文按原样保存）。
- JSON 解析失败时打印错误到 stderr 并以非零码退出。
