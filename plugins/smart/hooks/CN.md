# hooks（中文说明）

> 本文件是 `plugins/smart/hooks/` 的中文说明，仅供阅读参考。真正被宿主加载执行的是本目录下的英文脚本与 `hooks.json`。

`hooks.json` 注册了三个钩子：

## SessionStart → `greet.sh`

会话开始时触发。用 `nohup ... &` 在后台播放一句欢迎语（`say`），并把输出丢弃——后台运行是为了防止 Claude Code 进程退出时把 `say` 命令一起 kill 掉。

## PreToolUse → `session-logs.py`

在每次工具调用前触发。从标准输入读取一段 JSON，按日期归档写入项目下的会话日志：

- 目录：`.smart/session-logs/YYYY-MM-DD/`（`CLAUDE_PROJECT_DIR` 下，自动 `mkdir -p`）。
- 文件名：以输入 JSON 的 `session_id` 字段命名。
- 写入策略：先读出已有条目、追加本次、再整体回写，保证文件始终是一个合法的 JSON 数组；遇到损坏或旧格式的文件直接丢弃重建，避免钩子崩溃（`ensure_ascii=False`，中文按原样保存）。
- JSON 解析失败时打印错误到 stderr 并以非零码退出。

## Stop → `notebook-capture.py`

在每次回复结束时触发。读取 stdin JSON 里的 `transcript_path`，取出**最后一条 assistant 消息**的文本，确定性地抓取两类「开放线索」块——`★ Insight … ─────` 边框块，和「建议的下一步 / Suggested next steps」标题段——追加到 `.smart/notebook.md` 的 `## 🔵 Open` 区。

- 每条线索带一个 `<!-- h:hash -->` 内容指纹；重复读到同一块时按指纹跳过，保证幂等（即使每次读全量 transcript 也不重复写）。
- 尽力而为、绝不阻塞：任何畸形输入或异常都静默 `exit 0`，绝不打断回复。
- 配套 `/smart:notebook` skill 负责补上 hook 解析不了的自由形式线索，并管理 open/closed 状态；两者共享 `.smart/notebook.md`，都遵循读-改-写、保留对方的条目（尤其 hook 的 `<!-- h:... -->` 标记）。
