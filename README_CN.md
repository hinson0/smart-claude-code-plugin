# smart-codex-plugin

<div align="center">

🌐 [English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md) | [한국어](./README_KO.md) | [日本語](./README_JA.md)

</div>

> 写完代码？直接说 **“提交”**——Smart 会拆开不相关改动、生成聚焦的 message，并按组提交。

这是一个同时支持 **Claude Code** 与 **Codex** 的插件，提供低成本语义提交、可审计的 GitLab Issue 收口、会话工具和工程规则。

---

## 快速开始

插件**同时内置两套清单**（`.claude-plugin/` 给 Claude Code，`.codex-plugin/` 给 Codex），在任一宿主里都能原生安装。按你的宿主选择：

### Claude Code

添加市场，然后安装插件——在 Claude Code 内执行：

```
/plugin marketplace add hinson0/smart-claude-code-plugins
/plugin install smart@smart
```

> 已经本地克隆了？把市场指向你的克隆目录即可：`/plugin marketplace add /path/to/smart-claude-code-plugins`。安装后重启会话，让 skills、hooks 和 statusline 生效。

### Codex

最友好的方式是在 Codex session 内直接添加，无需克隆：

1. 运行 `/plugins`
2. 选择 **[Add Marketplace]**
3. 粘贴来源——`hinson0/smart-claude-code-plugins`（owner/repo）或完整 git URL——回车确认
4. 打开 **Smart** 市场，安装 **smart** 插件

> 喜欢命令行？它会直接从 Git 拉取，无需克隆：
>
> ```bash
> codex plugin marketplace add hinson0/smart-claude-code-plugins
> codex plugin add smart@smart
> ```

---

## 本 Marketplace 的插件

本仓库发布两个相互独立、同时支持 Claude Code 与 Codex 的插件：

| 插件 | 安装名 | 用途 |
|------|--------|------|
| Smart | `smart@smart` | 语义提交、安全 GitLab Issue 收口和会话工具 |
| Fuzz | `fuzz@smart` | 只读指导、逐 Cycle TDD、票据 campaign、HTML/PDF/Wiki、周报和可选宫廷模式 |

两个插件可以分别安装，也可以同时安装。Claude Code 使用 `/smart:*` 和 `/fuzz:*`；Codex
提供对应的插件命名空间 skill。两个插件存在相邻能力时，请使用完整命名空间明确选择。

```bash
# Claude Code：添加 marketplace 后执行
/plugin install smart@smart
/plugin install fuzz@smart

# Codex：添加 marketplace 后执行
codex plugin add smart@smart
codex plugin add fuzz@smart
```

Fuzz 包含十个 skills：`ask`、`close-issue`、`generate-wiki`、`github-skills-pdf`、
`handle-all-tickets`、`html`、`i-am-the-king`、`my-weekly`、`one-by-one` 和
`verify-all-tickets`。部分流程依赖 Git、`glab`、Python/PDF 工具或宿主提供的 Goal、Review、
浏览器和文档能力；每个 skill 都会在写入前检查自己的前置条件。

### 从旧 Marketplace 迁移 Fuzz

不得同时安装 `fuzz@ce-workflow` 和 `fuzz@smart`。先在隔离环境验证新来源，再按以下顺序
切换并新建会话：

```bash
# Claude Code
claude plugin uninstall fuzz@ce-workflow
claude plugin marketplace add hinson0/smart-claude-code-plugins
claude plugin install fuzz@smart

# Codex
codex plugin remove fuzz@ce-workflow
codex plugin marketplace add hinson0/smart-claude-code-plugins --ref main
codex plugin add fuzz@smart
```

如果仍使用 `ce-workflow` 的其他插件，请保留该 marketplace。Fuzz 继续使用 `.fuzz/`、
`$CODEX_HOME/fuzz/` 和 `fuzz-*` Agent 文件，因此既有宫廷模式状态会延续。回退时先卸载
`fuzz@smart`，再安装 `fuzz@ce-workflow` 并新建会话。

---

## 特性

**Smart Commit**

- **低成本执行** — Claude Code 使用 Haiku；Codex 把完整提交工作流交给一个低 reasoning 的 GPT-5.6 Luna worker，并允许一次默认子 agent 兜底。
- **语义分组** — type 是硬边界，purpose 是软边界，独立改动必须成为独立提交。
- **仓库感知 message** — 依次遵循项目规则、近期 Git 历史和 Conventional Commits。
- **仅提交** — 不执行 CI 检查、版本修改、push 或创建 PR。

**保护与自动化**

- **会话 Hook** — 会话开始时问候（通过 macOS `say` TTS 语音播报）。
- **会话日志** — 每次工具调用的完整输入数据均记录到 `.smart/session-logs/`，便于事后调试和审计。
- **可审计的 GitLab Issue 收口** — `/implement` 完成提交与 Review 后，`/smart:close-issue` 会核对当前分支上的实现 commit、验收证据和 Review 结论。明确授权关闭后，它先发布这些开发资产、再关闭 Issue；目标分支是否集成只披露，不作为关闭门禁。仅使用 `glab`，不会推导出 push、merge、创建 MR/PR、修改 checklist 或标签的权限。

**实用工具**

- **HUD / Statusline 安装器** — 一条命令安装功能丰富的状态栏，显示模型、Git 分支、上下文用量、速率限制、系统资源和工具调用统计。提供两个安装级别（简化版 / 完整版）及从备份恢复，仅 user 作用域。
- **帮助概览** — `/smart:help` 动态扫描并列出所有技能、hook 和 agent 及其描述。
- **Joke Teller Agent** — 在合适的时机讲个程序员笑话，缓解工作压力。
- **内置编码规则** — 预置规则文件（如 Pydantic V2 标准）存于 `rules/` 目录，按需软链到项目的 `.claude/rules/` 即可激活。
- **学习模式** — `/smart:learning 1` 开启一种简单的协作编码模式：由*你*亲手编写代码。它是一个纯粹的开/关开关——没有占比、没有配置。开启时，凡是 Claude 本会写的代码都改为打到控制台——每段标明 新增文件 / 新增代码 / 修改 / 删除，并附文件与位置——由你敲入，然后 Claude 审查你落盘的代码再继续，每次只处理一个任务。开启时把规则注入 `.claude/CLAUDE.local.md`（Claude Code 每次会话载入的、已 git-ignore 的项目级记忆）使其持续生效；该块是否存在就是全部状态，`/smart:learning 0` 移除它。`.smart/settings.json` 里不存任何东西。
- **HTML 审阅页** — `/smart:show` 把冗长交付物——当前对话的方案/分析/评审，或一个 Markdown 文件——渲染成单文件、零 JavaScript 的自包含 HTML 审阅页并在浏览器打开。灰底白卡视觉系统：粘性目录、编号章节、风险徽章、方案对比卡（选定项高亮）、内联 SVG 架构图与 `<details>` 折叠。三种固定版式配方（plan-review / explainer / report）保证每次生成的页面结构一致。每页强制携带出处页脚（时间、commit SHA、来源），且仅是派生视图——Markdown 仍是事实来源。每次运行都在 `.smart/pages/`（已 git-ignore）写入带时间戳的新文件，保留旧页面作为不可变审阅资产，不再覆盖。示例见 `assets/demos/`。

---

## 使用方式

**💬 自然语言** — 在对话中直接描述你的意图：

| 你说的话 | 执行效果 |
|---|---|
| "commit" / "提交" / "完成了" | 仅智能提交（暂存 + 分组 + 提交） |
| "这个 Issue 能关吗" / "关闭 GitLab Issue 42" | 只读收口门禁，或在明确授权后 note → close |

**⌨️ 斜杠命令** — 精确控制：

| 命令 | 作用 |
|---|---|
| `/smart:commit` | 仅提交（智能分组，自动生成 message） |
| `/smart:close-issue <IID或URL>` | 只读核对单个 GitLab Issue；明确授权关闭后，先发布可审计的开发资产记录，再关闭 Issue |
| `/smart:hud [0\|1\|2\|reset\|normal\|all]` | 安装状态栏（`1`/`normal`=简化版，`2`/`all`=完整版）或恢复备份（`0`/`reset`），user 作用域 |
| `/smart:help [skill\|hook\|agent]` | 显示所有插件组件概览（或按类别筛选） |
| `/smart:learning [0\|1]` | 切换学习模式——由*你*亲手写代码；Claude 把每段打到控制台并标明 新增文件 / 新增代码 / 修改 / 删除 供你敲入，再审查你落盘的代码。`1`=开，`0`=关，留空=状态。状态就是注入到 `.claude/CLAUDE.local.md` 的块——无设置、无占比 |
| `/smart:show [<path>.md]` | 把当前对话交付物（或指定 Markdown 文件）渲染成带时间戳的全新自包含零 JS HTML 审阅页，写入 `.smart/pages/`，保留旧页面并在浏览器打开。三种版式配方：plan-review / explainer / report |

---

## Smart Commit

`/smart:commit` 读取状态、已暂存和未暂存 diff、近期历史；为每个变更文件输出具体 purpose 与 type；先按 type、再按不相关 purpose 拆分，并分别提交。

Claude Code 使用 `haiku` 执行整个 turn。Codex 把完整工作流交给一个低 reasoning 的 `gpt-5.6-luna` worker；Luna 不可用时，用用户配置的默认子 agent 重试一次。主 agent 不自行分组或提交。

单组使用 `git add -A`；多组暂存明确文件列表。技能输出 message、文件归属和最终状态，不运行检查、不改版本、不 push，也不创建 PR。

---

## 内置规则

插件预置了编码规则文件，存放在 `rules/` 目录下。按需将规则文件软链到项目的 `.claude/rules/` 中即可激活：

```bash
ln -s /path/to/plugin/rules/pydantic-v2.md .claude/rules/pydantic-v2.md
```

**可用规则：**

| 规则文件 | 约束内容 |
|---|---|
| `pydantic-v2.md` | Pydantic V2 规范：`ConfigDict`、校验器、判别联合、`TypeAdapter`、`RootModel`、`SecretStr`、`pydantic-settings`、V1→V2 迁移 |
| `python-3.14.md` | Python 3.14 规范：延迟注解、`[T]` 泛型、`@override`、`Self`、`TaskGroup`、`StrEnum`、`datetime.UTC`、子解释器、`match` 守卫 |
| `fastapi.md` | FastAPI 0.115+ 规范：`Annotated` 依赖注入、`lifespan`、`APIRouter` 组织、`BackgroundTasks`、`dependency_overrides`、安全作用域 |
| `sqlalchemy-v2.md` | SQLAlchemy 2.0 规范：`DeclarativeBase`、`Mapped[T]`、命名约定、异步会话、`AsyncAttrs`、`selectinload`、UPSERT、Alembic |

规则默认不激活，按需软链即可。

---

## HUD（状态栏）

一条命令安装功能丰富的状态栏：

```
/smart:hud
```

![hud](./assets/imgs/hud.png)

**显示内容（6 行）：**

| 行 | 内容 |
|----|------|
| 1 | 会话 ID / 会话名、模型@版本、总花费（USD） |
| 2 | 目录、Git 分支（dirty/ahead/behind/stash）、最近 commit 时间、worktree 名称、电池 |
| 3 | 上下文进度条 + tokens + cache、速率限制（5h/7d）含重置倒计时、会话时长、agent 名称 |
| 4 | CPU、内存、磁盘、运行时间、Runtime 版本（Node/Python/Go/Rust/Ruby）、本机 IP |
| 5 | 工具调用统计（Bash/Skill/Agent/Edit 次数，从 transcript 实时解析） |
| 6 | 输出风格、vim 模式（仅启用时显示） |

**命令：**

| 命令 | 操作 |
|------|------|
| `/smart:hud` · `/smart:hud 2` · `/smart:hud all` | 安装完整版状态栏（全部 6 行）到 user 作用域，自动备份 |
| `/smart:hud 1` · `/smart:hud normal` | 安装简化版状态栏（仅 session + ctx） |
| `/smart:hud 0` · `/smart:hud reset` | 从备份恢复之前的状态栏 |

**注意：** 跨平台（macOS + Linux/WSL/Ubuntu）—— 自动检测操作系统，电量、CPU、内存、IP 各取对应命令。需要 `jq`；缺失时 `/smart:hud` 会自动安装（apt/dnf/pacman/apk/brew）。

---

## Agents

### 笑话讲述器（Joke Teller）

讲个程序员笑话来缓解工作压力。

```
"tell me a joke" / "讲个笑话" / "I need a laugh"
```

- 自动检测对话语言，用对应语言讲笑话
- 短格式（2–4 句，抖包袱风格，不用一问一答模板）
- 附带一句温馨提醒（喝水、伸展、休息）

---

## 会话 Hooks

插件包含在会话边界和工具调用时触发的 hooks：

| Hook | 触发时机 | 功能 |
|------|---------|------|
| `greet.sh` | `SessionStart` | 通过 macOS TTS（`say`）播放欢迎语 |
| `session-logs.py` | `PreToolUse`（所有工具） | 将每次工具调用的完整输入记录到 `.smart/session-logs/<日期>/<session_id>.json` |

内置 hook 配置在 Claude 兼容宿主中通过 `${CLAUDE_PLUGIN_ROOT}` 解析路径。TTS hooks 在后台运行（`nohup &`），不阻塞宿主进程。

---

## 前置要求

- **Claude Code** 或 **Codex**（支持插件）—— 插件内置两套清单，在任一宿主都能原生运行
- `git`
- [`glab` CLI](https://gitlab.com/gitlab-org/cli) — 仅供 `/smart:close-issue` 写操作使用
- `jq` — 仅 HUD 状态栏需要（其他功能无需）

---

## 作者

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
