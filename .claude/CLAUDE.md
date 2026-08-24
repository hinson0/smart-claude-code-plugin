# Smart Dual-Host Plugin

Smart 同时支持 Claude Code 与 Codex，提供聚焦的开发工作流、内容工具、会话辅助与工程规则。

## 铁律

- 功能变更、组件增删或用户可见行为改动，必须在同一次操作中同步更新 `README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md`、`README_JA.md`。
- 两个根 marketplace 必须登记相同插件集合；每个 `plugins/<name>` 都必须同时提供 Codex 与 Claude Code manifest。
- Smart 的两份 `plugin.json` 必须使用完全相同的干净 SemVer。

## 项目结构

```text
根目录
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── README.md / README_CN/TW/KO/JA.md
├── assets/imgs/                     # 当前仅保留有效截图
└── plugins/
    └── smart/                       # 唯一发布插件
        ├── .codex-plugin/plugin.json
        ├── .claude-plugin/plugin.json
        ├── hooks/                   # 英文实现 + CN.md
        ├── rules/                   # 英文规则 + CN.md
        └── skills/                  # 13 个独立工作流
```

带 `references/` 的 skill，其英文参考文件必须配同目录 `CN[<名字>].md`。除 `CN.md` 与 `CN[...].md` 外，`plugins/` 下所有宿主加载文件、脚本消息和注释均使用英文。

## 架构原则

- **语义分组提交**：commit skill 逐文件分析；type 是硬边界，purpose 是软边界，不相关改动必须拆分。
- **项目级覆盖**：用户项目的 `AGENTS.md`、`CLAUDE.md`、`CLAUDE.local.md` 优先于默认 commit 格式和语言。
- **低成本 Commit**：Claude Code 通过 `model: haiku` 直接执行；Codex 主 agent 只路由，完整 commit 工作优先交给 `gpt-5.6-luna`、`low` reasoning 的单个 worker。Luna 不可用时只允许一次无模型覆盖的默认子 agent 重试；worker 不得递归委派，主 agent 不得接管分组或提交。
- **独立边界**：commit 只分组、生成 message 和提交，不运行 CI、本地检查、版本升级或远端操作。
- **安全收口**：close-issue 默认只读；`/implement` 完成提交与 Review 后，以当前实现分支上的 commit、验收证据和 Review 作为关闭资产，不要求先集成目标分支；写 note 与关闭 GitLab Issue 必须有明确授权，且不扩展为 push、merge、MR/PR、checklist 或标签权限。
- **单插件边界**：仓库只发布 Smart；所有能力使用 `/smart:*` 与 `$smart:*`，不保留 Fuzz 安装或命名空间兼容入口。
- **相邻能力**：`show` 与 `html`、`learning` 与 `one-by-one` 合同不同，分别保留。

## 维护约束

- 修改任一插件的 `SKILL.md` 时同步同目录 `CN.md`；修改英文 reference 时同步对应 `CN[<名字>].md`。
- Conventional Commits 默认格式为 `<type>(<scope>): <description>`；允许类型：feat、fix、refactor、docs、test、chore、perf、ci；总长不超过 72 字符。
- 修改插件行为后同步 Smart 的两份清单版本和所有用户文档。
- `docs/adr/` 与 `docs/agents/` 是可跟踪的 Matt 工程文档目录；其他根 `docs/` 内容默认忽略。

## 验证命令

```bash
# 确认所有 skill 都有英文原件和中文翻译
for plugin in plugins/*/; do
  for d in "${plugin}"skills/*/; do
    test -f "${d}SKILL.md" && test -f "${d}CN.md"
  done
done

# 检查宿主加载文件为英文
rg '[\p{Script=Han}]' plugins --glob 'SKILL.md' --glob '*.mjs'

# 验证双宿主清单与 close-issue CLI
for plugin in plugins/*/; do claude plugin validate "$plugin"; done
claude plugin validate .
node --test plugins/smart/skills/close-issue/scripts/close-issue.test.mjs
node --test tests/*.test.mjs
```

## 开发工作流

1. 修改英文组件。
2. 同步中文翻译、两个根 marketplace 和五份 README。
3. 同步 Smart 的双宿主版本。
4. 验证清单、skill 成对关系、英文加载边界与相关行为测试。
5. 用本地 marketplace 重装受影响插件，并在新会话确认组件发现结果。
