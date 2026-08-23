# 接口契约：Fuzz 能力表面

## 十个 Fuzz skills

| Skill | 主要合同 | 关键前置/边界 |
|-------|----------|---------------|
| `ask` | 简洁、非落盘的只读指导 | 仅显式调用；不运行 shell、浏览器、外部服务或子 Agent |
| `close-issue` | 核对目标分支集成并在授权后发布资产和关闭单 Issue | GitLab/`glab`；不隐含 push、merge、MR/PR、checklist 或标签权限 |
| `generate-wiki` | 生成并发布 GitLab/GitHub Wiki，无法发布时保存本地 | 外部内容不可信；远程写需明确授权 |
| `github-skills-pdf` | 固定 GitHub commit，制作英中双语 A4 PDF | Python/PDF 工具、字体、逐页渲染验收 |
| `handle-all-tickets` | 默认串行、可显式并行交付父票据下全部子票 | 需要 tracker、Goal、fork、implement、Review；不隐含关闭/push/MR |
| `html` | 把指定 Markdown 确定性转换为安全自包含 HTML | 默认不打开浏览器；拒绝输入输出同路径和危险链接 |
| `i-am-the-king` | 切换用户级或项目级宫廷模式 | 仅显式调用；保持 `.fuzz` 和 `fuzz-*` 状态所有权 |
| `my-weekly` | 按当前用户和自然周汇总 Git 提交为 Markdown 周报 | Git 历史只读；缺失身份或仓库时安全失败 |
| `one-by-one` | Agent 建立 Red，用户手写 Green，明确验收后结束 Cycle | 仅显式调用；同一时间一个 Cycle；不扩展相邻修改 |
| `verify-all-tickets` | 在 fresh task 中只读验收完整父票据 campaign | 不修复、不写代码/Git/tracker；必须匹配登记的最终 head |

## 与 Smart 相邻能力的区别

### `fuzz:close-issue` 与 `smart:close-issue`

两者分别保留自己的集成门禁和测试。双装时必须显式使用完整命名空间，文档不得声称等价。

### `fuzz:one-by-one`

Fuzz 入口从无 Cycle 状态建立 Red 并让用户手写 Green。Smart 5.0 不再提供旧的逐 Cycle
入口；Fuzz 不得依赖被移除的 Smart skill 或共享其历史状态。

### `fuzz:html` 与 `smart:show`

Fuzz 入口是忠实、可脚本化的文件转换；Smart 入口是模型驱动的长交付物审阅视图。输出目录、
浏览器默认和内容重组合同独立。

## 双宿主发现

每个 Fuzz skill 必须在 Codex 与 Claude Code 中以 Fuzz 命名空间可发现。完整调用语法由各
宿主 README 给出；任何 skill 不得依赖 Smart 已安装才能被发现。
