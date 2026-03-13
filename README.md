# smart-claude-code-plugin

一个为 Claude Code 设计的智能插件，提供自动化的 Git 工作流技能（Skills），让提交、检查、推送和创建 PR 更加高效。

## 功能技能（Skills）

| 技能     | 触发命令                  | 描述                                                                                              |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `commit` | `/smart:commit`           | 语义分析改动，自动判断单/多 feature，按目录/模块边界分组并生成聚焦"为什么改"的英文 commit message |
| `check`  | `/smart:check`            | 自动读取 `.github/workflows/*.yml`，推断并运行对应的本地检查（Python/JS/TS/Go），无 CI 配置则跳过 |
| `push`   | `/smart:push`             | 依次执行：本地检查 → add + commit → push；自动检测并创建 GitHub remote（需 `gh` CLI 已登录）      |
| `pr`     | `/smart:pr [base-branch]` | 依次执行：push → 在 GitHub 创建 Pull Request（自动生成标题与正文）                                |

## 安装

### 前置要求

- [Claude Code](https://claude.ai/code) CLI 已安装
- Git 仓库环境
- `gh` CLI：用于 `/push` 自动创建 GitHub remote 及 `/pr` 创建 Pull Request（需提前 `gh auth login`）

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


### `/smart:check`

自动读取 `.github/workflows/*.yml`，从 CI 配置推断本地需要运行哪些检查：

- 检测到 `ruff` / `pytest` / `mypy` → 运行对应 Python 检查（自动识别 `uv` 环境）
- 检测到 `eslint` / `tsc` / `vitest` / `turbo` → 运行对应 JS/TS 检查
- 检测到 `go test` / `golangci-lint` → 运行 Go 检查
- 无 `.github/workflows/` 文件 或 CI 中无已知工具 → 跳过检查

### `/smart:commit`

语义分析工作区所有改动（`M`/`A`/`??` 均计入），自动判断单/多 feature 并按目录或模块边界分组提交。commit message 聚焦"为什么改"而非"改了什么"。

```
/smart:commit                        # 自动生成 commit message
```


### `/smart:push`

完整的本地验证 + 提交 + 推送流程，任一阶段失败则立即停止。若 `origin` 未配置，自动使用 `gh` CLI 创建 GitHub 仓库并关联。

### `/smart:pr [base-branch]`

```
/smart:pr           # 推送并创建 PR，默认目标分支为 main
/smart:pr dev       # 推送并创建 PR，目标分支为 dev
```

## 项目结构

```
smart-claude-code-plugin/
├── .claude-plugin/
│   └── plugin.json       # 插件元数据
└── skills/
    ├── commit/SKILL.md
    ├── check/SKILL.md
    ├── push/SKILL.md
    └── pr/SKILL.md
```

## 作者

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
