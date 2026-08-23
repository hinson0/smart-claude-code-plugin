# 实施计划：迁移独立 Fuzz 插件至 Smart Marketplace

**分支**：`001-migrate-fuzz-plugin` | **日期**：2026-08-23 | **规格**：[spec.md](spec.md)

**输入**：`specs/001-migrate-fuzz-plugin/spec.md` 中的功能规格

## 摘要

把源仓库 commit `949d05e585a551fce1d677d95a57c4db84cd1c4b` 中的独立 Fuzz 插件
迁到本仓库的 `plugins/fuzz`，让两个根级 marketplace 同时发布 `smart` 与 `fuzz`。
Fuzz 保留自己的名称、命名空间、状态、hook、Agent 和行为合同；因宿主运行源由中文改为
英文并新增中文配对，Fuzz 目标版本定为 `2.0.0`。Smart payload 保持 tree
`9353b504196c8de79d009c3612b891850e65ec2b` 和版本 `4.0.1` 不变。目标远端双宿主验收通过后，
再单独退役源仓的 Fuzz 分发入口。

## 技术背景

**语言/版本**：Markdown；Node.js 24 基线的 ESM `.mjs`；Python 3；Bash

**主要依赖**：Node.js 内置模块、Git CLI、`glab`、Python ReportLab；PDF 验收使用
Poppler、pypdf、pdfplumber、Pillow；部分 skill 按自身合同依赖宿主文档、浏览器、Goal、
fork、`implement` 和 Review 能力

**存储**：仓库内独立 `plugins/fuzz` payload；Fuzz 用户状态继续位于
`$CODEX_HOME/fuzz/`，项目状态继续位于 `.fuzz/`，受管 Agent 继续使用 `fuzz-*.toml`

**测试**：迁入并适配 11 组 Fuzz 专属 `node:test` 契约/行为测试；marketplace、manifest、
英文边界、中文配对、Smart payload 不变检查；`claude plugin validate`；PDF 全页验收；
Codex 与 Claude Code 远端隔离安装和 Smart+Fuzz 双装冒烟

**目标平台**：Codex 与 Claude Code；macOS、Linux/WSL；PDF 字体探测继续兼容 Windows

**项目类型**：一个 marketplace 仓库分发两个独立双宿主插件；迁移涉及目标仓落地和源仓
后续退役两个检查点

**性能目标**：Fuzz SessionStart 重复执行保持 Agent 文件幂等；Smart+Fuzz 双装时宫廷提示
仅由 Fuzz 输出一次，Smart 原有 greet、日志和 notebook hook 各保持一套

**约束**：不得融合插件 payload；不得无关升级 Smart；旧来源 Fuzz 与新来源 Fuzz 禁止
双装；运行源必须英文，精确中文官职使用 Unicode 转义并由测试证明；源退役晚于目标远端验收

**规模/范围**：44 个源插件文件迁为 59 个目标插件文件（新增 10 个 skill `CN.md`、4 个
reference 配对和 1 个 hook 中文说明）；10 个 skills、10 个 Agent、11 组专属测试；两个根
marketplace 和五份 README 同步更新

## 宪法检查

*门禁：Phase 0 前必须通过；Phase 1 设计完成后再次检查。*

### 设计前门禁

- **I. 多插件双宿主一致性：通过。** 目标两个 marketplace 均保留 Smart 并新增 Fuzz；
  Fuzz 自带两份同名、同版本 manifest，路径均为 `plugins/fuzz`。
- **II. 用户文档同步：通过。** 五份 README 必须同时说明两个插件、独立安装、完整命名空间、
  Smart+Fuzz 双装和旧/新来源 Fuzz 切换顺序。
- **III. 中英文源文件配对：通过。** Fuzz 运行源翻译为英文，新增 15 个中文配对文件；精确
  中文官职作为协议值使用 Unicode 转义并由测试验证。
- **IV. 自动化范围与安全：通过。** Fuzz 各 skill 的授权与失败边界原样保留；Smart 不调用、
  清理或开关 Fuzz 的状态和 Agent。
- **V. 独立版本化且经过验证的交付：通过。** Fuzz 因不兼容语言合同变化升至 `2.0.0`；
  Smart payload 无变化，版本保持 `4.0.1`。
- **仓库约束与质量门禁：通过。** Fuzz 位于独立目录，测试和文档明确适用范围；源退役
  保留历史版本和回退证据。

### 设计后复核

- [research.md](research.md) 已解决版本、目录映射、双插件共存、安装切换和退役顺序。
- [plugin-boundary.md](contracts/plugin-boundary.md) 明确 Smart 与 Fuzz 不融合、不联动版本。
- [fuzz-distribution.md](contracts/fuzz-distribution.md) 固定 Fuzz `2.0.0`、59 文件和运行合同。
- [capability-surface.md](contracts/capability-surface.md) 明确 10 个 Fuzz 入口及与 Smart 相邻
  能力的差异。
- [migration-gates.md](contracts/migration-gates.md) 将源退役置于目标远端双宿主验收之后。
- 结论：设计后仍满足 v1.1.0 全部宪法门禁，无待澄清项或复杂性豁免。

## 项目结构

### 本功能文档

```text
specs/001-migrate-fuzz-plugin/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── plugin-boundary.md
│   ├── fuzz-distribution.md
│   ├── capability-surface.md
│   └── migration-gates.md
├── checklists/
│   └── requirements.md
└── tasks.md                    # 后续由 $speckit-tasks 生成
```

### 目标仓库结构

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
.claude/CLAUDE.md
README.md
README_CN.md
README_TW.md
README_KO.md
README_JA.md
plugins/
├── smart/                      # payload 与 4.0.1 保持不变
└── fuzz/
    ├── .codex-plugin/plugin.json
    ├── .claude-plugin/plugin.json
    ├── codex-agents/           # 10 个官职 Agent
    ├── hooks/
    ├── references/
    ├── scripts/
    └── skills/                 # 10 个独立 Fuzz skills

tests/                          # 11 组迁入并适配的 Fuzz 专属测试
```

### 源仓库退役结构

```text
~/ce_repos/ce-workflow-codex-plugins/
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── .gitlab-ci.yml
├── AGENTS.md
├── README.md
├── plugins/fuzz/               # 目标远端验收后删除
└── tests/                      # 删除/改写 Fuzz 专属与发布契约
```

**结构决策**：根 marketplace 是两个独立插件的共享目录，不是 Smart 插件本体。Fuzz
payload 原层级迁入 `plugins/fuzz` 并按目标仓语言规则扩展配对文件；Smart 目录不参与迁移。

## 复杂性跟踪

无宪法违规或待批准复杂性豁免。

