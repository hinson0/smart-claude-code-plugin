# smart-claude-code-plugin

一个为 Claude Code 设计的智能插件，提供自动化的 Git 工作流技能（Skills），让提交、检查、推送和创建 PR 更加高效。

## 功能技能（Skills）

| 技能 | 触发命令 | 描述 |
|------|----------|------|
| `hello` | `/hello <name>` | 友好问候用户 |
| `commit` | `/commit` | 智能分析改动并自动生成 commit message，支持多 feature 拆分提交 |
| `check` | `/check` | 根据改动范围自动运行本地检查（后端：ruff + pytest；前端：pnpm turbo lint/type-check/build） |
| `push` | `/push` | 依次执行：本地检查 → add + commit → push |
| `pr` | `/pr [base-branch]` | 依次执行：push → 在 GitHub 创建 Pull Request（自动生成标题与正文） |

## 安装

### 前置要求

- [Claude Code](https://claude.ai/code) CLI 已安装
- Git 仓库环境
- （可选）`gh` CLI：用于 `/pr` 技能创建 Pull Request

### 通过插件市场安装（推荐）

在 Claude Code 中，先注册插件市场：

```
/plugin marketplace add hinson0/smart-claude-code-plugin
```

然后从该市场安装插件：

```
/plugin install smart@smart-claude-code-plugin
```

### 手动安装

```bash
git clone https://github.com/hinson0/smart-claude-code-plugin ~/.claude/plugins/smart
```

重启 Claude Code 后插件自动加载。

## 使用说明

### `/commit`

自动分析工作区改动，按 feature 智能分组并生成英文 commit message。

```
/commit                        # 自动生成 commit message
/commit fix login redirect bug # 使用指定文本作为 commit message
/commit feat A; fix B          # 多 feature 分别指定 message（用 ; 分隔）
```

### `/check`

根据改动的文件路径自动判断检查范围：

- 路径含 `apps/backend/` → 运行 `ruff check` + `pytest`
- 路径含 `apps/web/` 等前端文件 → 运行 `pnpm turbo lint type-check build`
- 仅非代码文件改动 → 跳过检查

### `/push`

完整的本地验证 + 提交 + 推送流程，任一阶段失败则立即停止。

### `/pr [base-branch]`

```
/pr           # 推送并创建 PR，交互确认目标分支
/pr main      # 推送并创建 PR，目标分支为 main
```

## 项目结构

```
smart-claude-code-plugin/
├── .claude-plugin/
│   └── plugin.json       # 插件元数据
└── skills/
    ├── hello/SKILL.md
    ├── commit/SKILL.md
    ├── check/SKILL.md
    ├── push/SKILL.md
    └── pr/SKILL.md
```

## 作者

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
