---
name: op
description: 当用户说"analyze"、"优化插件"、"禁用无用插件"、"节省上下文"、"减少上下文占用"、"我需要哪些插件"、"清理插件"、"聚焦上下文"、"精简插件"，或想要检测项目类型并禁用无关插件以节省上下文窗口空间时，应使用此技能。通过 /smart:op 显式调用。
argument-hint: 无需参数。自动检测项目类型并推荐插件变更。
---

# Aim — 上下文感知插件优化器

检测当前项目类型，识别与本项目无关的已启用插件，提供禁用建议——减少始终加载的插件元数据对上下文窗口的占用。

## 为何重要

每个已启用的插件在每轮对话中贡献约 100-500 token 的元数据（名称 + 描述）。禁用与当前项目无关的插件可以为实际工作腾出上下文空间。

## 步骤

### 1) 检测项目类型

扫描当前工作目录根目录的标志文件。完整映射参见 `references/plugin-relevance.md` § "项目类型检测"。

快速参考：

| 标志                                                                 | 类型                                       |
| -------------------------------------------------------------------- | ------------------------------------------ |
| `pyproject.toml`、`requirements.txt`、`setup.py`、`Pipfile`          | python                                     |
| `package.json`                                                       | javascript（检查依赖确定框架 — 见步骤 1b） |
| `tsconfig.json`                                                      | typescript                                 |
| `Cargo.toml`                                                         | rust                                       |
| `go.mod`                                                             | go                                         |
| `Gemfile`                                                            | ruby                                       |
| `*.sln`、`*.csproj`                                                  | dotnet                                     |
| `build.gradle`、`pom.xml`                                            | java                                       |
| `pubspec.yaml`                                                       | flutter                                    |
| `.codex-plugin/plugin.json`、`.agents/plugins/marketplace.json` 或子目录 `*/.codex-plugin/plugin.json` | codex-plugin |
| `.claude-plugin/plugin.json` 或子目录 `*/.claude-plugin/plugin.json` | claude-plugin |

**1b) 框架检测** — 若 `package.json` 存在，读取 `dependencies` 和 `devDependencies` 键以识别框架（react、vue、next、svelte、angular、react-native、express 等）。将每个检测到的框架作为额外类型标签添加。

**1c) Supabase 检测** — 检查 `package.json` 依赖或 Python 依赖中是否有 `supabase` / `@supabase/supabase-js`。若有，添加 `supabase` 标签。

若存在多个标志，项目具有多种类型（如包含 Python + TypeScript 的 monorepo）。

输出检测到的类型：

```
检测到的项目类型：python, typescript, react
```

若未找到任何标志文件，报告"无法检测项目类型 — 不推荐任何变更"并停止。

### 2) 读取已启用插件

读取两个设置文件以确定插件的有效状态：

1. **全局**：读取 `~/.claude/settings.json` → 提取 `enabledPlugins` 映射。
2. **项目级**：读取 `.claude/settings.json`（项目根目录） → 提取 `enabledPlugins` 映射（若存在）。
3. **合并**：项目级条目覆盖全局条目。插件有效值为 `true` 时才视为活跃。

收集所有有效活跃的插件——这些是需要分类的对象。

### 3) 对每个插件进行分类

查阅 `references/plugin-relevance.md` 获取完整的相关性映射。

对每个已启用的插件：

1. 提取插件名称（`@` 前的部分）。
2. 检查**通用**列表——若插件是通用的，标记为**保留**。
3. 检查**条件性**列表——若插件所需的项目类型与检测到的类型重叠，标记为**保留**。否则，标记为**建议禁用**。
4. 若插件不在任何列表中，应用参考文件中的**启发式规则**（基于名称匹配）。不确定时，默认**保留**。

### 4) 展示建议

**若有插件建议禁用：**

显示摘要表：

```
项目类型：python

| 插件              | 状态             | 原因                                         |
|-------------------|------------------|----------------------------------------------|
| pyright-lsp       | 保留             | Python LSP — 匹配项目类型                      |
| typescript-lsp    | 建议禁用         | TypeScript LSP — 本项目无 TS/JS                |
| frontend-design   | 建议禁用         | 前端设计 — 未检测到 Web 前端                     |
| playwright        | 建议禁用         | 浏览器测试 — 未检测到 Web 项目                   |
| ui-ux-pro-max     | 建议禁用         | UI/UX 设计 — 未检测到前端                        |
| plugin-dev        | 建议禁用         | 插件开发 — 非 Codex 或 Claude Code 插件仓库      |
```

然后使用 AskUserQuestion 确认：

- 列出每个建议禁用的插件及一行原因
- 询问："是否为本项目禁用这些插件？（可随时在 .claude/settings.json 中重新启用）"

**若确认：**

编辑 `.claude/settings.json`（项目级，非全局 `~/.claude/settings.json`）— 将每个确认的插件在 `enabledPlugins` 映射中的值添加或更新为 `false`。若 `.claude/settings.json` 不存在则创建，包含 `enabledPlugins` 键。若存在但无 `enabledPlugins` 键则添加。使用 Edit 工具精准修改，不要重写整个文件。绝不修改全局 `~/.claude/settings.json`。

**若用户拒绝或想保留部分：**

尊重用户选择。仅禁用明确同意的插件。

**若无插件需要建议禁用：**

报告："所有已启用插件均与本项目相关 — 无需变更。"

### 5) 报告

显示最终摘要：

- 检测到的项目类型
- 已禁用插件（数量和名称）
- 已保留插件（数量）
- 提醒："切换项目后可再次运行 `/smart:op` 重新优化。"

## 边界情况

- **混合类型的 Monorepo**：若同时存在 Python 和 TypeScript 标志，保留与任一类型相关的插件。
- **空/新仓库**：无标志文件 → 无法确定类型 → 不推荐任何变更。
- **同时是开发项目的插件仓库**：若同时存在 Codex/Claude 插件标记和语言标志，同时保留插件开发工具和语言工具。

## 附加资源

### 参考文件

- **`references/plugin-relevance.md`** — 已知插件到项目类型的完整映射、检测标志、框架检测规则，以及未知插件的启发式回退规则。


---

# 参考文档：plugin-relevance

# 插件相关性映射

按相关性类别对已知插件进行分类。根据此映射判断在给定项目类型下应推荐禁用哪些插件���

## 相关性类别

### 通用 — 始终保留

这些插件不分项目类型都有用。不要推荐禁用。

| 插件 ID 模式 | 用途 |
|---|---|
| `claude-md-management` | CLAUDE.md 文件管理 |
| `code-review` | 代码审查辅助 |
| `code-simplifier` | 代码简化 |
| `context7` | 查阅任意���的文档 |
| `feature-dev` | 功能开发工作流 |
| `security-guidance` | 安全最佳实践 |
| `sentry` | 错误监控与调试 |
| `smart` | 工作流自动化（自身 — 永不禁用） |
| `remember` | 记忆管理 |
| `pr-review-toolkit` | PR 审查 |

### 条件性 — 仅在特定项目类型中相关

这些插件是专用的。当项目类型不匹配时推荐禁用。

| 插件 ID 模式 | 相关场景 | 项目类型 |
|---|---|---|
| `pyright-lsp` | 存在 Python 代码 | python |
| `typescript-lsp` | 存在 TypeScript/JavaScript 代码 | typescript, javascript, react, vue, nextjs, svelte, react-native, angular |
| `frontend-design` | 存在 Web 前端 UI | react, vue, nextjs, svelte, angular, html |
| `ui-ux-pro-max` | 需要 UI/UX 设计工作 | react, vue, nextjs, svelte, angular, react-native, flutter, html |
| `playwright` | 需要浏览器测试 | react, vue, nextjs, svelte, angular, html, web |
| `supabase` | Supabase 是项目依赖 | （检��� package.json/requirements 中是否有 "supabase"） |
| `plugin-dev` | Codex 或 Claude Code 插件仓库 | codex-plugin, claude-plugin |
| `skill-creator` | Codex 或 Claude Code 插件仓库 | codex-plugin, claude-plugin |
| `superpowers` | Codex 或 Claude Code 插件仓库 | codex-plugin, claude-plugin |

## 项目类型检测

### 标志文件 → 项目类型

| 标志 | 项目类型标签 |
|---|---|
| `pyproject.toml` | python |
| `requirements.txt` | python |
| `setup.py` | python |
| `Pipfile` | python |
| `package.json` | javascript（需检查依赖确定框架） |
| `tsconfig.json` | typescript |
| `Cargo.toml` | rust |
| `go.mod` | go |
| `Gemfile` | ruby |
| `*.sln` 或 `*.csproj` | dotnet |
| `build.gradle` 或 `pom.xml` | java |
| `pubspec.yaml` | flutter |
| `mix.exs` | elixir |
| `deno.json` 或 `deno.jsonc` | deno |
| `bun.lockb` | bun（同时添加 javascript） |
| `.agents/plugins/marketplace.json` | codex-plugin |
| `.codex-plugin/plugin.json` | codex-plugin |
| `*/.codex-plugin/plugin.json`（子目录） | codex-plugin |
| `.claude-plugin/plugin.json` | claude-plugin |
| `*/.claude-plugin/plugin.json`（子目录） | claude-plugin |

### 从 package.json 检测框架

当 `package.json` 存在时，读取 `dependencies` 和 `devDependencies`：

| 依赖键 | 框架标签 |
|---|---|
| `react` | react |
| `react-native` | react-native |
| `next` | nextjs |
| `vue` | vue |
| `nuxt` | vue |
| `svelte` | svelte |
| `@sveltejs/kit` | svelte |
| `@angular/core` | angular |
| `express` | javascript |
| `fastify` | javascript |
| `nestjs` 或 `@nestjs/core` | javascript |
| `flutter`（在 pubspec.yaml 依赖中） | flutter |

### Supabase 检测

在以下位置检查 `supabase` 或 `@supabase/supabase-js`：
- `package.json` 的 dependencies/devDependencies
- `requirements.txt` 或 `pyproject.toml` 依���
- 是否存在 `supabase/` 目录

## 未知插件的启发式规则

对于上表未列出的插件，按名称启发式判断：

- 名称包含 `lsp`、`lint` 或语言名（如 `ruby-lsp`）→ 语言专用，按语言匹配
- 名���包含 `frontend`、`ui`、`design`、`css` → 前端专用
- 名称包含 `backend`、`api`、`db`、`database` ��� 后端专用
- 名称��含 `plugin`、`skill`、`hook` → 插件开发专用
- 其他 → 视为通用（不推荐禁用）

不确定时，倾向于保留插件启用状态。
