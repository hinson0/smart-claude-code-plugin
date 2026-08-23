# Smart Dual-Host Plugin

Smart 同时支持 Claude Code 与 Codex，提供低成本语义分组提交、GitLab Issue 安全收口、会话辅助与工程规则。

## 铁律

- 功能变更、组件增删或用户可见行为改动，必须在同一次操作中同步更新 `README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md`、`README_JA.md`。
- 双宿主格式必须并存：Codex 使用 `.agents/plugins/marketplace.json` 与 `plugins/smart/.codex-plugin/plugin.json`；Claude Code 使用 `.claude-plugin/marketplace.json` 与 `plugins/smart/.claude-plugin/plugin.json`。
- 两份 `plugin.json` 必须使用完全相同的干净 SemVer，不添加宿主专用构建元数据。

## 项目结构

```text
根目录
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── README.md / README_CN/TW/KO/JA.md
├── assets/imgs/                     # 当前仅保留有效截图
└── plugins/smart/
    ├── .codex-plugin/plugin.json
    ├── .claude-plugin/plugin.json
    ├── hooks/                       # 英文实现 + CN.md
    ├── rules/                       # 英文规则 + CN.md
    └── skills/
        ├── <name>/SKILL.md          # 宿主加载的英文原件
        ├── <name>/CN.md             # 同目录中文翻译
        └── …（close-issue / commit / help / hud / learning / local / show）
```

带 `references/` 的 skill，其英文参考文件必须配同目录 `CN[<名字>].md`。除 `CN.md` 与 `CN[...].md` 外，`plugins/` 下所有宿主加载文件、脚本消息和注释均使用英文。

## 架构原则

- **语义分组提交**：commit skill 逐文件分析；type 是硬边界，purpose 是软边界，不相关改动必须拆分。
- **项目级覆盖**：用户项目的 `AGENTS.md`、`CLAUDE.md`、`CLAUDE.local.md` 优先于默认 commit 格式和语言。
- **低成本 Commit**：Claude Code 通过 `model: haiku` 直接执行；Codex 主 agent 只路由，完整 commit 工作优先交给 `gpt-5.6-luna`、`low` reasoning 的单个 worker。Luna 不可用时只允许一次无模型覆盖的默认子 agent 重试；worker 不得递归委派，主 agent 不得接管分组或提交。
- **独立边界**：commit 只分组、生成 message 和提交，不运行 CI、本地检查、版本升级或远端操作。
- **安全收口**：close-issue 默认只读；`/implement` 完成提交与 Review 后，以当前实现分支上的 commit、验收证据和 Review 作为关闭资产，不要求先集成目标分支；写 note 与关闭 GitLab Issue 必须有明确授权，且不扩展为 push、merge、MR/PR、checklist 或标签权限。

## 维护约束

- 修改 `SKILL.md` 时同步同目录 `CN.md`；修改英文 reference 时同步对应 `CN[<名字>].md`。
- Conventional Commits 默认格式为 `<type>(<scope>): <description>`；允许类型：feat、fix、refactor、docs、test、chore、perf、ci；总长不超过 72 字符。
- 修改插件行为后同步两份清单版本与所有用户文档。

## 验证命令

```bash
# 确认所有 skill 都有英文原件和中文翻译
for d in plugins/smart/skills/*/; do
  test -f "${d}SKILL.md" && test -f "${d}CN.md"
done

# 检查宿主加载文件为英文
rg '[\p{Script=Han}]' plugins/smart/skills --glob 'SKILL.md' --glob '*.mjs'

# 验证双宿主清单与 close-issue CLI
claude plugin validate plugins/smart
claude plugin validate .
node --test plugins/smart/skills/close-issue/scripts/close-issue.test.mjs
```

## 开发工作流

1. 修改英文组件。
2. 同步中文翻译和五份 README。
3. 验证清单、skill 成对关系、英文加载边界与相关行为测试。
4. 用本地 marketplace 重装新版本，并在新会话确认组件发现结果。
