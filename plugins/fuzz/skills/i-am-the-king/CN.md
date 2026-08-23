---
name: i-am-the-king
description: 开启或关闭宫廷模式，并询问作用域为 user 全机或 project 当前仓库。用于用户要启用或停用宫廷称谓、调整中文官职子 Agent 约定，或切换 user/project 作用域时。
disable-model-invocation: true
---

# Fuzz I Am The King

仅接受用户显式调用：

- Codex：`$fuzz:i-am-the-king`
- Claude Code：`/fuzz:i-am-the-king`

## 调用边界

- 不得从自然语言称谓请求推断调用。
- 其他 Skill 不得自动进入本 Skill。

## 执行

从本 `SKILL.md` 所在目录解析并运行确定性脚本，原样返回其输出：

```text
node <this-skill-directory>/scripts/toggle-i-am-the-king.mjs
```

脚本依次询问作用域与目标状态，并负责状态文件的原子写入、幂等判定、`.gitignore` 登记与
官职 Agent 装卸。不得代替脚本写入状态文件，也不得替用户猜测作用域或目标状态。

## 状态语义

状态文件内容为单行 `on` 或 `off`：

- user 级：`$CODEX_HOME/fuzz/i-am-the-king`，默认 `~/.codex/fuzz/i-am-the-king`
- project 级：`<Git 仓库顶层目录>/.fuzz/i-am-the-king.local`

project 级存在时覆盖 user 级；两者都不存在时默认开启。不读取或迁移旧路径
`fuzz/imperial-mode` 与 `.fuzz/imperial-mode.local`。

## 作用域差异

`~/.codex/agents/fuzz-*.toml` 是全机共享资源，只由 user 级管理：

- user 级关闭：立即卸载官职 Agent；
- user 级开启：立即安装官职 Agent；
- project 级关闭：只停止当前仓库注入，不触碰官职 Agent。

project 开启而 user 关闭时，下次会话仍注入规则，但官职 Agent 可能不可用；不得回退英文
称号，应提示用户开启 user 级并新建会话。

状态文件与 Agent 文件当场更新；提示词和会话 Agent 清单在下一次启动、恢复或上下文重建时生效。

## 执行边界

- 不修改 `~/.codex/agents/` 下不带 `fuzz-` 前缀的用户 Agent。
- 不改动两个状态位置与项目 `.gitignore` 之外的文件。
- 未获得作用域与目标状态的明确答复前，不写入或删除任何文件。
