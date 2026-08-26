---
name: code-simplifier
description: 由一个全新上下文 worker 简化明确范围内的近期代码，同时保持可观察行为不变。
disable-model-invocation: true
argument-hint: "[路径或 diff]（空=工作区代码改动）"
license: Apache-2.0
---

<!-- 改编自 Anthropic 的 code-simplifier agent，并已作修改；采用 Apache-2.0 许可。详见 LICENSE。 -->

# Code Simplifier 路由

把完整简化流程交给一个全新上下文 worker。只有 worker 可以读取目标代码、编辑文件
或运行检查。
始终派发：缺失、含糊或为空的范围是 worker 输入，不是主 agent 的前置检查条件。
只有 worker 可以返回 `blocked`。

## 宿主路由

- **Claude Code：** 只在前台调用一次插件 subagent
  `smart:code-simplifier-worker`。完整传递用户请求和明确范围，不得在摘要中遗漏
  路径、符号、约束或排除项。未提供范围时原样传递空范围。等待完成后转述结果。
- **Codex：** 只派生一个不带对话历史的子 agent，将 `fork_turns` 设置为 `none`。
  不覆盖模型或 reasoning effort。指示它：“你是 code-simplifier worker。完整读取
  `<本-skill-目录>/references/worker.md`，在当前 checkout 中执行该工作流，以下述
  请求为范围，不得委派：`<完整用户请求和参数>`。”等待完成后转述结果。
- worker 串行运行。worker 启动前及活跃期间，主 agent 对目标代码和 Git index
  保持只读，不检查仓库、不验证范围，也不执行其他 preflight 工作。
- 指定 worker 无法启动或未完成时，报告失败并停止。主 agent 不得接管、重复分析、
  编辑文件或重新运行 worker 的检查。

完成标准是原样转述 worker 的最终结果，主上下文不再执行第二遍实现。
