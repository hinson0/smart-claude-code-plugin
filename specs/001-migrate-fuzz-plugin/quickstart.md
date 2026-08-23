# 快速验证：独立 Fuzz 插件迁移

本指南用于实施后的端到端验收。执行顺序必须遵守
[migration-gates.md](contracts/migration-gates.md)，不得先退役源插件。

## 1. 验证不可变基线

```bash
git -C ~/ce_repos/ce-workflow-codex-plugins status --short
git -C ~/ce_repos/ce-workflow-codex-plugins rev-parse HEAD
git -C ~/ce_repos/ce-workflow-codex-plugins rev-parse HEAD:plugins/fuzz
git rev-parse HEAD:plugins/smart
```

预期：源工作区干净；源 commit、源 Fuzz tree 和目标 Smart tree 分别等于计划记录值。

## 2. 验证目标目录与配对

```bash
test "$(find plugins/fuzz -type f | wc -l | tr -d ' ')" = 59

for d in plugins/fuzz/skills/*/; do
  test -f "${d}SKILL.md" && test -f "${d}CN.md"
done

find plugins/fuzz -path '*/references/*.md' ! -name 'CN*.md' -print
```

预期：Fuzz 共 59 个文件；10 个 skills 全部配对；清单中的 4 个英文 reference 均有对应
`CN[名称].md`。reference 的逐项断言由迁移契约测试执行。

## 3. 验证英文运行源与协议值

```bash
rg '[\p{Script=Han}]' plugins/fuzz \
  --glob 'SKILL.md' --glob '*.mjs' --glob '*.py' --glob '*.toml' \
  --glob '*.yaml' --glob '*.json' --glob '*.html'
```

预期：没有未登记汉字字面量。十个中文官职和宫廷称谓通过 Unicode 转义保存，契约测试
验证运行时解码结果逐字正确。

## 4. 验证独立 manifest 与 marketplace

```bash
node -e '
const fs = require("node:fs");
for (const plugin of ["smart", "fuzz"]) {
  const c = JSON.parse(fs.readFileSync(`plugins/${plugin}/.codex-plugin/plugin.json`));
  const a = JSON.parse(fs.readFileSync(`plugins/${plugin}/.claude-plugin/plugin.json`));
  if (c.name !== plugin || a.name !== plugin || c.version !== a.version) process.exit(1);
}
'

claude plugin validate plugins/fuzz
claude plugin validate .
```

预期：Fuzz 为 `2.0.0`，Smart 为 `4.0.1`；两个根 marketplace 均发现 `{smart, fuzz}`；
插件验证全部通过。

## 5. 运行契约与不变性检查

```bash
node --test tests/*.test.mjs
node --test plugins/smart/skills/close-issue/scripts/close-issue.test.mjs
git rev-parse HEAD:plugins/smart
```

预期：11 组 Fuzz 专属测试、仓库级 marketplace/配对/语言测试和 Smart 回归通过；实施提交中
`plugins/smart` tree 与计划基线一致。

PDF 能力还必须完成 A4、目录、书签、页码、英中上下排版、字体和逐页渲染验收；不得只依赖
静态契约。

## 6. 验证 Smart 与 Fuzz 双装

在隔离配置中从同一目标 marketplace 同时安装 `smart@smart` 与 `fuzz@smart`，新建会话后
确认：

- 两插件各自 skills 均以完整命名空间可发现。
- Smart greet、PreToolUse、Stop hook 各保持一套。
- Fuzz 宫廷 SessionStart 只输出一次，并安装恰好 10 个 `fuzz-*` Agent。
- Smart 不创建、修改或清理 Fuzz 状态和 Agent。
- `close-issue`、逐 Cycle 和 HTML 相邻入口均可显式选择，行为互不污染。

## 7. 验证远端新来源与用户切换

先在未安装旧 Fuzz 的干净环境从目标远端安装 `fuzz@smart`，记录目标 commit SHA 并完成
10 类主场景。通过后，现有用户按宿主执行：

```bash
claude plugin uninstall fuzz@ce-workflow
claude plugin marketplace add hinson0/smart-claude-code-plugins
claude plugin install fuzz@smart
```

或：

```bash
codex plugin remove fuzz@ce-workflow
codex plugin marketplace add hinson0/smart-claude-code-plugins --ref main
codex plugin add fuzz@smart
```

随后新建会话。预期：10 分钟内完成切换，`.fuzz` 与 `fuzz-*` 状态继续生效；任何时刻都不
同时安装两个来源的 Fuzz。

## 8. 验证源退役

目标远端门禁通过并完成源退役提交后，确认：

- 源两个 marketplace 不再登记 Fuzz，README 指向新托管仓。
- 源 `plugins/fuzz` 和 Fuzz 专属测试已删除或迁走。
- 源 CI 与 release contract 只发布 `ce-workflow`。
- 源剩余测试通过，历史 `fuzz-v*` tag/Release 保持不变。
- 目标远端 `fuzz@smart` 仍能从记录的 SHA/tag 重新安装。

任一结果失败时按 [migration-gates.md](contracts/migration-gates.md) 回退，不得声称迁移完成。
