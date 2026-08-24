---
name: html
description: 将 Markdown 文档转换为安全的自包含 HTML 文件。
disable-model-invocation: true
---

# Smart HTML

将一个 Markdown 文件转换为派生 HTML 视图。以 Markdown 为唯一事实来源。

Codex 用户调用 `$smart:html`；Claude Code 用户调用 `/smart:html`。两个宿主使用同一 Skill 和脚本。

## 转换

运行：

```text
node <this-skill-directory>/scripts/smart-html.mjs <input.md> [output.html]
```

从本 `SKILL.md` 所在目录解析脚本。不得通过仓库根目录、安装缓存路径、环境变量或裸
`PATH` 命令定位脚本。

- 省略 `output.html` 时，在输入文件旁写入同主文件名的文件。
- 用户提供输出路径时，传入该明确路径。
- 成功时原样返回 stdout，其中包含可点击的绝对输出路径。
- 失败时原样返回 stderr，不得声称已生成输出。
- 除非用户明确要求，否则不得打开浏览器。

捆绑脚本会转义输入 HTML、保留常见文档结构、加载自带的自包含模板，并创建缺失的输出目录。
