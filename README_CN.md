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
- **会话知识蒸馏** — `/smart:distill` 从当前会话抽取有价值的问答对，按主题聚类成 markdown 文件，落盘到知识库。目标目录读自本地 `.smart/settings.json`；若本地缺失，则用 `AskUserQuestion` 询问是复用全局 `~/.smart/settings.json` 还是新建本地配置——两者都没有时再问落盘目录——随后把选择保存到本地，之后静默。目录询问留在主会话；繁重的**分析**随后在后台 **fork** 中以 `sonnet` 进行（抽取、聚类、三态比对），再把完全格式化好的落盘计划交给一个 `haiku` 子 agent 做机械写盘——昂贵的判断跑 sonnet、便宜的誊写跑 haiku，主上下文只收到一份精简总结。默认 `.smart/knowledges/`；`{date}` 占位符支持按日期嵌套的目录（如 `~/knowledges/md/{date}`）。重复/新增/差分三态比对让重复蒸馏只追加不重复，已 review 文件（`.printed.md` 或有同名 PDF）绝不触碰。
- **Workflow 模型分层** — `/smart:wfb` 让 Workflow 脚本更省 token：按难度给每个 `agent()` 分层（机械活用 haiku、躯干用 sonnet、收口与重要/硬实现用 opus），在 fan-out 前剪枝，并用 schema 压缩输出。编写任何 Workflow 脚本时自动应用。
- **剪贴板截图上传** — `/smart:sendshot` 安装一个跨平台的 `sendshot` shell 函数：抓取剪贴板图片，通过 `scp` 上传到远程主机（如 EC2），随后打印并把远程路径回写剪贴板。支持 WSL（PowerShell 读 Windows 剪贴板）和 macOS（`pngpaste`/`osascript`）。zsh 下还会把 **`Ctrl+G`** 绑定为在任意提示符处触发 sendshot。配置——主机、密钥、远程目录——位于 `~/.smart/settings.json`，运行时读取，所以换主机无需重装；远程目录用 `mkdir -p` 自动创建。
- **学习模式** — `/smart:learning 1` 开启一种简单的协作编码模式：由*你*亲手编写代码。它是一个纯粹的开/关开关——没有占比、没有配置。开启时，凡是 Claude 本会写的代码都改为打到控制台——每段标明 新增文件 / 新增代码 / 修改 / 删除，并附文件与位置——由你敲入，然后 Claude 审查你落盘的代码再继续，每次只处理一个任务。开启时把规则注入 `.claude/CLAUDE.local.md`（Claude Code 每次会话载入的、已 git-ignore 的项目级记忆）使其持续生效；该块是否存在就是全部状态，`/smart:learning 0` 移除它。`.smart/settings.json` 里不存任何东西。
- **单 Cycle TDD 教学门禁** — `/smart:advance-one-step` 每次只推进一个已经展示的完整 Red → Green cycle。说 `next` 由 agent 落盘当前 cycle；你自己落盘后说 `review`，由 agent 只读审查。通过后只展示下一个 cycle 并停止，人工复制时必须给出可搜索的准确代码锚点。
- **会话待办锚点** — `/smart:todo` 把 Claude 在会话中发散出的决策收进持久的 `.smart/todo-list.md`，钉住唯一的**主线**（分支再多也冲不掉），并把发散的决策停成对账后的**分支**——重复调用会合并进既有条目，而非堆叠出一堆重复。每次运行都重新把主线摆到最前面，在对话跑偏时把你拉回来。`main <目标>` 设定锚点，`done <id>` 结掉某项。已 git-ignore，个人的项目级草稿。
- **开放线索记录本** — `/smart:notebook` 维护一份 Claude 在对话中途抛出的*开放线索*滚动清单——它在追别的问题时顺带抛出的 `★ Insight`、建议的下一步、反问，这些会随对话发散被掩埋。一个 `Stop` **hook** 在*每次*回复后自动捕获带标记的块（确定性——不会被跳过或遗忘），skill 则补上 hook 解析不了的自由形式线索、去重，并让你用 `done <id>` 闭合一条。落盘到 `.smart/notebook.md`（已 git-ignore）。区别于 `todo`（二选一决策）和 `distill`（知识归档）——它追踪的是尚未跟进的东西。
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
| `/smart:distill [目录]` | 把当前会话蒸馏成按主题命名的知识文件（默认 `.smart/knowledges/`） |
| `/smart:wfb` | 编写 Workflow 脚本时的省 token、模型分层指导（按难度选 haiku/sonnet/opus） |
| `/smart:sendshot [install\|config\|uninstall]` | 安装跨平台 `sendshot` 函数（剪贴板图片 → `scp` 到远程 → 复制远程路径）；配置在 `~/.smart/settings.json` |
| `/smart:learning [0\|1]` | 切换学习模式——由*你*亲手写代码；Claude 把每段打到控制台并标明 新增文件 / 新增代码 / 修改 / 删除 供你敲入，再审查你落盘的代码。`1`=开，`0`=关，留空=状态。状态就是注入到 `.claude/CLAUDE.local.md` 的块——无设置、无占比 |
| `/smart:advance-one-step` | 推进一个完整 Red → Green 教学 cycle。说 `next` 由 agent 落盘，说 `review` 审查你已落盘的内容；通过后只展示下一个 cycle 并停止 |
| `/smart:todo [main <目标>\|done <id>]` | 把会话中发散的决策锚定在 `.smart/todo-list.md`——钉住的主线 + 对账后的分支；每次运行都重述主线把你拉回来。`main`=设定主线，`done`=结掉某项，留空=捕获并对账 |
| `/smart:notebook [done <id>]` | 把 Claude 抛出的开放线索（★ Insight、建议的下一步、反问）追踪进 `.smart/notebook.md`，防止被掩埋。`Stop` hook 每次回复自动捕获带标记的块；skill 补自由形式线索并管理状态。`done`=闭合一条，留空=挖掘并列出 |
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
