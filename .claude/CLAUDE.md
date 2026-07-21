# Smart Codex Plugin

Codex 格式插件，自动化 commit → push → PR 流程（push 内含 version bump）。

## 铁律

凡涉及功能变更、组件新增/删除、或用户可见行为改动，**必须在同一次操作中主动同步更新所有 README 文件**（`README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md`、`README_JA.md`），无需用户提醒，不可遗漏。

## 项目结构

> **双格式并存（铁律）**：本插件同时支持 Codex 和 Claude Code 两个宿主，二者读各自的清单文件，互不冲突，**任何一方都不可删**：
>
> - Codex：`.agents/plugins/marketplace.json` + `plugins/smart/.codex-plugin/plugin.json`
> - Claude Code：`.claude-plugin/marketplace.json` + `plugins/smart/.claude-plugin/plugin.json`（其余组件 skills/hooks/agents 由 CC 按约定自动发现。`CN.md` 是纯中文参考文件，不会被当作 skill 或组件加载）
>   两套 plugin.json 必须使用完全相同的干净 semver，不添加 `+codex.*` 或其他宿主专用构建元数据。

```
根目录
├── .agents/plugins/marketplace.json # Codex marketplace 注册文件（指向 plugins/smart）
├── .claude-plugin/marketplace.json  # Claude Code marketplace 注册文件（指向 plugins/smart）
├── assets/imgs/                     # 截图资源
├── README.md / README_CN/TW/KO/JA.md # 多语言用户文档
└── docs/                            # 设计文档（gitignored，不提交）

plugins/smart/                    # 主插件目录（被 Codex 和 Claude Code 同时加载）
├── .codex-plugin/plugin.json     # Codex 插件元数据
├── .claude-plugin/plugin.json    # Claude Code 插件元数据（清单文件，缺失则 CC 无法加载插件）
├── agents/                       # 空占位，暂无 agent
├── hooks/
│   ├── hooks.json                # hook 配置
│   ├── greet.sh                  # 会话开始 hook
│   ├── session-logs.py           # hook 输入日志（PreToolUse）
│   ├── notebook-capture.py       # 开放线索捕获（Stop）
│   └── CN.md                     # hooks 中文说明（仅供阅读，不被加载）
├── rules/
│   ├── fastapi.md / pydantic-v2.md / python-3.14.md / sqlalchemy-v2.md
│   └── CN.md                     # 4 份规则的中文汇总（仅供阅读，不被加载）
└── skills/                       # EN skills（按 Agent Skills 规范，脚本在各自 scripts/ 子目录）
    ├── <name>/SKILL.md           # 英文版（被宿主加载）
    ├── <name>/CN.md              # 同目录中文翻译（仅供阅读，不被加载）
    ├── distill/                  # 除 SKILL.md 外还有 references/；CN.md 仅译正文，参考文档各自成 references/CN[<名字>].md
    └── …（check / commit / help / hud / learning / local / notebook / optimize-tokens / pr / push / sendshot / todo / version / wfb）
```

语言版本组织：中文不再单独成树。每个组件目录下英文原件（`SKILL.md`、脚本、`hooks.json`、`rules/*.md`）被宿主加载，对应的 `CN.md` 是**同目录**的中文翻译，仅供阅读、不被宿主加载。带 `references/` 的 skill（distill / optimize-tokens）：其 `CN.md` 只翻译 `SKILL.md` 正文；`references/` 下每个英文 md（如 `diff-rules.md`）各自对应**同目录**的 `CN[<名字>].md`（如 `CN[diff-rules].md`）中文翻译——方括号命名保证不会被宿主当作参考文档 `@` 引用误加载。

## 架构原则

- **Fail-fast 管道**：任何阶段失败立即停止，不执行后续操作
- **多 feature 智能拆分**：commit skill 逐文件语义分析，不同目的的改动强制拆分为多次提交
- **Skill 链式引用**：push 和 pr skill 通过 `@../path/SKILL.md` 引用上游 skill
- **项目级覆盖**：用户项目的 AGENTS.md / CLAUDE.md 可覆盖默认 commit 格式
- **语言决策链**：commit skill（step 4）为语言的唯一决策源，PR skill 继承 commit 阶段确定的语言；若 commit 阶段被跳过，则从 `git log` 推断
- **版本自动升级**：push 管道在提交后、推送前自动执行 version bump（commit → version → push）；PR 不再单独处理版本
- **本地检查前置于 PR**：check 作为 PR 管道的第一阶段运行（check → commit → version → push → pr），检查不过立即停止；check **不属于** push 管道
- **版本文件自动检测**：version skill 自动检测 plugin.json / package.json / pyproject.toml，monorepo 中按变更文件归属独立 bump
- **模型分层（per-skill）**：`check` / `version` / `push` 用 `haiku`（机械活：跑 CI 检查、SemVer 计算、git 操作），`commit` / `pr` 用 `sonnet`（要生成 commit message、语义分组决策、PR 标题正文）。SKILL.md frontmatter 的 `model` 字段是 **per-turn override，仅在该 skill 被独立激活时生效**；push / pr 通过 `@../` 内联引用上游 skill，内联不会二次激活上游 skill，故**管道内一律由入口 skill 的模型统治**——`/smart:push` 全程 haiku（内联的 commit 步骤也跑 haiku，非 sonnet），`/smart:pr` 全程 sonnet（其内联的 check/version/push 也跑 sonnet）。想要 sonnet 质量的 commit message，单独调用 `/smart:commit`。改 `model` 值须同步 SKILL.md 与同目录 CN.md 两处。
- **模型分层（skill 内部跨阶段）**：`distill` 是唯一在**单个 skill 内部跨阶段分层**的 skill。frontmatter 钉 `model: sonnet` 让分析阶段（价值判断 / 主题聚类 / 三态比对 / 内容提炼与格式化）跑 sonnet；其分析 fork 再**内部 spawn 一个 `model: haiku` 子 agent** 做纯落盘（`Write`/`Edit` 知识文件 + 打印汇总）。根本约束：haiku 子 agent **不继承对话**，只能誊写 fork 已格式化好的成品内容，绝不做语义判断——这就是为何一切内容生成必须留在 sonnet、haiku 只搬运。fork 之所以破例「再委派」，正是为把便宜的机械落盘从 sonnet 挪到 haiku。
- **notebook 双层捕获（hook + skill）**：`notebook` 是唯一同时用 hook 和 skill 的功能。`Stop` hook（`hooks/notebook-capture.py`）在每次回复后**确定性**抓取 CC 的 `★ Insight` / 建议下一步标记块进 `.smart/notebook.md`（不靠 CC 自觉，防线索被对话发散掩埋）；`/smart:notebook` skill（`model: sonnet`）补上 hook 解析不了的自由形式线索、并管理 open/closed 状态。两层共享 `.smart/notebook.md`，均读-改-写、保留对方条目（尤其 hook 的 `<!-- h:... -->` 去重指纹）。与 `todo`（决策+主线）、`distill`（知识 Q/A）正交——notebook 追踪**未闭合线索**。

## 注意事项

- 修改任何 `SKILL.md` 内容后，必须同步更新**同目录**的 `CN.md`（中文翻译）；改动 `references/<名字>.md` 后同步更新同目录的 `CN[<名字>].md`；hooks / rules 同理，改动后更新各自目录的 `CN.md`
- EN/CN 语言严格分离，逻辑与结构保持一致——
  - `plugins/` 下**除 `CN.md` 外**的所有文件（`SKILL.md`、脚本、`hooks.json`、`rules/*.md` 的注释、description、body 等）全英文
  - 每个 `CN.md` 全中文，与同目录的英文文件一一对应（带 `references/` 的 skill：`CN.md` 只对应 `SKILL.md` 正文；`references/*.md` 各自对应 `references/CN[<名字>].md`）
- commit message 遵循 Conventional Commits：`<type>(<scope>): <description>`
  - type: feat, fix, refactor, docs, test, chore, perf, ci
  - scope: 可选，指明改动范围（如 mobile, api, auth）；省略时格式为 `<type>: <description>`
  - description: 首字母小写，无句号，含 type/scope 在内总长不超过 72 字符
- plugin.json 中的版本号需与实际发布版本一致
- 修改功能、新增/删除组件、或变更用户可见行为后，必须同步更新所有 README 文件（`README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md`、`README_JA.md`），保持 5 个语言版本内容一致

## 常用命令

```bash
# 验证 skill 引用路径（EN 原件；CN.md 内的 @../ 仅为文档指针，不被执行）
grep -r '@\.\./' plugins/smart/skills/ --include='SKILL.md' -h | sort -u

# 检查每个 skill 是否 EN/CN 齐全（SKILL.md + CN.md 都在）
for d in plugins/smart/skills/*/; do
  name=$(basename "$d")
  echo "=== $name ===" && ls "$d"SKILL.md "$d"CN.md
done

# 测试完整管道（push 含 version bump；check 仅在 /smart:pr 内自动运行，不可单独调用）
/smart:commit → /smart:push → /smart:pr
```

## 开发工作流

1. 修改 `skills/<name>/SKILL.md`（英文版为主）
2. 同步更新**同目录**的 `skills/<name>/CN.md`（中文翻译）
3. 验证 skill 引用路径正确（`@../` 前缀）
4. 测试完整管道：commit → push → pr
