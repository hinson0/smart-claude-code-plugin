---

description: "迁移独立 Fuzz 插件的依赖有序任务清单"
---

# 任务：迁移独立 Fuzz 插件至 Smart Marketplace

**输入**：`specs/001-migrate-fuzz-plugin/` 下的规格与设计文档

**前置文档**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、
`quickstart.md`

**测试要求**：规格明确要求迁移 11 组 Fuzz 契约/行为测试、仓库级多插件检查和双宿主验收；
每个故事内的测试任务必须先落盘并确认因目标能力尚未实现而失败，再执行实现任务。

**组织方式**：任务按三个用户故事分组。US1 是可独立验证的本地 MVP；US2 在 US1 后完成
远端来源切换；US3 完成长期多插件治理和源仓退役。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可与同阶段其他标记任务并行，涉及不同文件且没有未完成依赖
- **[Story]**：对应用户故事 `US1`、`US2`、`US3`
- 每项任务均包含明确文件路径

## Phase 1：准备与不可变基线

**目的**：冻结源/目标事实并修正仓库级多插件维护说明。

- [X] T001 核对源 commit、源 Fuzz tree、目标 Smart tree 和工作区状态，并把 44 个源文件、59 个目标文件及 11 组测试映射记录到 `specs/001-migrate-fuzz-plugin/migration-inventory.md`
- [X] T002 [P] 按宪法 v1.1.0 把单插件目录、独立版本和验证规则扩展为 Smart/Fuzz 多插件规则，更新 `.claude/CLAUDE.md`

---

## Phase 2：共享基础设施

**目的**：建立所有用户故事共同依赖的确定性测试清单和隔离环境辅助代码。

**关键门禁**：本阶段完成前不得开始任何用户故事实现。

- [X] T003 根据 `migration-inventory.md` 固化 44 个源路径、59 个目标路径、10 个 skill、4 个 reference 和 10 个官职 Agent 的期望集合到 `tests/fixtures/fuzz-components.json`
- [X] T004 [P] 创建临时 `CODEX_HOME`、fake Git/`glab`、插件根目录和 hook 执行辅助函数到 `tests/helpers/fuzz-fixture.mjs`

**检查点**：源基线、目标清单和隔离 fixture 已准备好，US1 测试可开始。

---

## Phase 3：用户故事 1——从同一 Marketplace 独立安装 Fuzz（P1）🎯 MVP

**目标**：目标仓同时列出 `smart` 与独立 `fuzz`；仅安装 Fuzz 即可发现并运行完整 Fuzz，
Smart payload 和版本保持不变。

**独立测试**：从目标本地 marketplace 只安装 Fuzz，验证 10 个 skills、SessionStart、10 个
官职 Agent、59 文件、Fuzz 2.0.0 和 11 组行为契约；`plugins/smart` tree 仍为计划基线。

### US1 测试（必须先失败）

- [X] T005 [P] [US1] 编写两个 marketplace 插件集合、Fuzz 双 manifest 2.0.0、59 文件、配对完整性和 Smart tree 不变合同到 `tests/fuzz-plugin-contract.test.mjs`
- [X] T006 [P] [US1] 迁入并改写 ask 显式只读与 one-by-one Cycle 合同到 `tests/fuzz-ask-contract.test.mjs` 和 `tests/fuzz-one-by-one-contract.test.mjs`
- [X] T007 [P] [US1] 迁入并改写 Fuzz 目标分支集成、授权、note→close、partial 和 secret 门禁到 `tests/fuzz-close-issue.test.mjs`
- [X] T008 [P] [US1] 迁入并改写 Markdown 转义、危险链接、输出路径和不打开浏览器合同到 `tests/fuzz-html.test.mjs`
- [X] T009 [P] [US1] 迁入并改写宫廷模式显式调用、用户/项目状态和原子写入合同到 `tests/fuzz-i-am-the-king-contract.test.mjs`
- [X] T010 [P] [US1] 迁入并改写 Fuzz SessionStart、10 个 Unicode 官职、Agent 安装/卸载和非受管文件保护合同到 `tests/fuzz-imperial-agents-contract.test.mjs`
- [X] T011 [P] [US1] 迁入并改写 GitLab/GitHub/本地 Wiki 目标选择和远程写授权合同到 `tests/generate-wiki-contract.test.mjs`
- [X] T012 [P] [US1] 迁入并改写双语 PDF 固定 commit、参考资料、notes、字体和静态输出合同到 `tests/github-skills-pdf-contract.test.mjs`
- [X] T013 [P] [US1] 迁入并改写父票据默认串行/显式并行、共享 campaign 合同和 fresh-task 只读验收到 `tests/handle-all-tickets-contract.test.mjs` 和 `tests/verify-all-tickets-contract.test.mjs`
- [X] T014 [P] [US1] 迁入并改写自然周、当前用户、远程仓库与只读 Git 历史合同到 `tests/my-weekly-contract.test.mjs`

### US1 实现

- [X] T015 [P] [US1] 创建 Fuzz 2.0.0 双宿主 manifest 并保留独立作者、描述、默认提示和 `./skills/` 入口到 `plugins/fuzz/.codex-plugin/plugin.json` 和 `plugins/fuzz/.claude-plugin/plugin.json`
- [X] T016 [P] [US1] 迁入并英文化 10 个官职 Agent、Fuzz SessionStart、Agent 安装脚本和 hook 中文说明到 `plugins/fuzz/codex-agents/`、`plugins/fuzz/scripts/` 和 `plugins/fuzz/hooks/`
- [X] T017 [P] [US1] 迁入并英文化宫廷模式 skill 与元数据，同时保留中文配对和 `.fuzz`/`fuzz-*` 状态合同到 `plugins/fuzz/skills/i-am-the-king/`
- [X] T018 [P] [US1] 迁入并英文化 ask 与 one-by-one skills、元数据和中文配对到 `plugins/fuzz/skills/ask/` 和 `plugins/fuzz/skills/one-by-one/`
- [X] T019 [P] [US1] 迁入并英文化 Fuzz close-issue skill、脚本、元数据和中文配对，保持其独立目标分支门禁到 `plugins/fuzz/skills/close-issue/`
- [X] T020 [P] [US1] 迁入并英文化 HTML skill、转换脚本、模板、元数据和中文配对到 `plugins/fuzz/skills/html/`
- [X] T021 [P] [US1] 迁入并英文化 Wiki skill、元数据和中文配对到 `plugins/fuzz/skills/generate-wiki/`
- [X] T022 [P] [US1] 迁入并英文化双语 PDF skill、构建器、两组 reference、元数据和全部中文配对到 `plugins/fuzz/skills/github-skills-pdf/`
- [X] T023 [P] [US1] 迁入并英文化共享 ticket campaign reference、handle-all-tickets、verify-all-tickets、元数据和中文配对到 `plugins/fuzz/references/`、`plugins/fuzz/skills/handle-all-tickets/` 和 `plugins/fuzz/skills/verify-all-tickets/`
- [X] T024 [P] [US1] 迁入并英文化周报 skill、格式 reference、元数据和中文配对到 `plugins/fuzz/skills/my-weekly/`
- [X] T025 [US1] 在保留现有 Smart entry 的前提下新增独立 Fuzz entry，并保证两个宿主插件集合及 source path 一致，更新 `.agents/plugins/marketplace.json` 和 `.claude-plugin/marketplace.json`
- [X] T026 [US1] 增加 Smart 与 Fuzz 两个独立插件的安装入口、功能总览、完整命名空间和 Smart+Fuzz 双装说明，更新 `README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md` 和 `README_JA.md`
- [X] T027 [US1] 运行 US1 的 11 组契约、manifest、59 文件、配对、英文边界、插件验证和 Smart tree 不变检查，并把命令与结果记录到 `specs/001-migrate-fuzz-plugin/validation-us1.md`

**检查点**：目标本地 marketplace 可以独立安装 Fuzz；US1 可单独演示和验收。

---

## Phase 4：用户故事 2——从旧 Marketplace 切换 Fuzz（P2）

**目标**：用户按“卸载旧来源 → 安装新来源 → 新建会话”切换，保留 `.fuzz` 状态和
`fuzz-*` Agent；源 Fuzz 在目标远端验收前继续可用。

**独立测试**：在隔离配置中先验证远端 `fuzz@smart`，再从 `fuzz@ce-workflow` 切换到
`fuzz@smart`，全过程不双装并在 10 分钟内恢复 10 个 skills、hook、Agent 和既有状态。

### US2 测试（必须先失败）

- [X] T028 [P] [US2] 编写 Claude/Codex 卸载旧来源、安装新来源、新建会话、禁止双装和保留 `ce-workflow` marketplace 的文档合同到 `tests/fuzz-migration-contract.test.mjs`
- [X] T029 [P] [US2] 编写 `.fuzz`、`$CODEX_HOME/fuzz/` 和 `fuzz-*.toml` 在来源切换前后保持兼容的状态合同到 `tests/fuzz-state-compatibility.test.mjs`

### US2 实现与远端门禁

- [X] T030 [US2] 在五种语言中补充 `fuzz@ce-workflow` 到 `fuzz@smart` 的卸载、安装、新会话、回退及禁止双装步骤，更新 `README.md`、`README_CN.md`、`README_TW.md`、`README_KO.md` 和 `README_JA.md`
- [ ] T031 [US2] 在获得远端写入授权后创建可重新安装的目标 commit 或 `fuzz-v2.0.0` 检查点，并把 SHA、版本和来源记录到 `specs/001-migrate-fuzz-plugin/target-remote-checkpoint.md`
- [ ] T032 [P] [US2] 从 T031 记录的远端检查点在干净 Claude Code 配置中仅安装 `fuzz@smart`，执行 10 类主场景并记录到 `specs/001-migrate-fuzz-plugin/validation-claude.md`
- [ ] T033 [P] [US2] 从 T031 记录的远端检查点在干净 Codex 配置中仅安装 `fuzz@smart`，执行 10 类主场景并记录到 `specs/001-migrate-fuzz-plugin/validation-codex.md`
- [ ] T034 [US2] 在隔离环境执行旧来源卸载、新来源安装和新会话状态延续流程，并把耗时、状态、Agent 和禁止双装证据记录到 `specs/001-migrate-fuzz-plugin/validation-switch.md`

**检查点**：目标远端 Fuzz 可替代旧来源，且源退役硬门禁已有双宿主证据。

---

## Phase 5：用户故事 3——独立维护两个插件（P3）

**目标**：Smart 与 Fuzz 在目标仓独立版本、测试和运行；目标远端验收后安全退役源仓 Fuzz，
不影响 `ce-workflow`。

**独立测试**：只修改 Fuzz 时，Smart tree/4.0.1 不变；源退役后目标可重装 Fuzz，源两个
marketplace、CI、测试和版本规则只保留 `ce-workflow` 且全部通过。

### US3 测试（必须先失败）

- [ ] T035 [P] [US3] 编写每插件双 manifest 自洽、不同插件版本独立、两个 marketplace 集合一致和 Smart tree 不变合同到 `tests/multi-plugin-governance.test.mjs`
- [ ] T036 [P] [US3] 编写五份 README 的插件集合、完整命名空间、相邻能力差异、双装与切换说明一致性合同到 `tests/plugin-documentation-contract.test.mjs`
- [ ] T037 [P] [US3] 为源仓退役后的 Fuzz entry、目录、专属测试、PDF CI 命令和 release loop 消失条件补充断言到 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/tests/release-ci-contract.test.mjs`

### US3 实现与源退役

- [ ] T038 [US3] 在 T032、T033、T034 全部通过且获得源仓退役授权后，删除源 Fuzz entries 并加入迁址说明、移除 Fuzz 版本规则，更新 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/.agents/plugins/marketplace.json`、`/Users/a114514/ce_repos/ce-workflow-codex-plugins/.claude-plugin/marketplace.json`、`/Users/a114514/ce_repos/ce-workflow-codex-plugins/README.md` 和 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/AGENTS.md`
- [ ] T039 [P] [US3] 在 T032、T033、T034 全部通过且获得源仓退役授权后，按 `specs/001-migrate-fuzz-plugin/migration-inventory.md` 删除 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/plugins/fuzz/` 及 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/tests/` 中已迁出的 11 组 Fuzz 专属测试
- [ ] T040 [P] [US3] 在 T032、T033、T034 全部通过且获得源仓退役授权后，移除 PDF 专项测试并把发布循环改为仅 `ce-workflow`，更新 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/.gitlab-ci.yml` 和 `/Users/a114514/ce_repos/ce-workflow-codex-plugins/tests/release-ci-contract.test.mjs`
- [ ] T041 [US3] 运行源仓剩余测试、两个 marketplace 和更新后发布契约，确认历史 `fuzz-v*` tag/Release 未移动，并把结果记录到 `specs/001-migrate-fuzz-plugin/validation-source-retirement.md`
- [ ] T042 [US3] 在目标隔离配置同时安装 `smart@smart` 与 `fuzz@smart`，验证各自命名空间、相邻能力、hook、状态和 Agent 独立，并记录到 `specs/001-migrate-fuzz-plugin/validation-dual-install.md`

**检查点**：目标 marketplace 可长期独立维护两个插件，源仓 Fuzz 已安全退役且可回退。

---

## Phase 6：收尾与跨故事门禁

**目的**：汇总宪法合规、需求追踪和完整端到端证据。

- [ ] T043 [P] 对照 FR-001 至 FR-015、SC-001 至 SC-008 和四份 contracts 建立需求到测试/证据追踪矩阵到 `specs/001-migrate-fuzz-plugin/traceability.md`
- [ ] T044 按 `specs/001-migrate-fuzz-plugin/quickstart.md` 顺序复跑目标本地、远端、双装、切换和源退役检查，并汇总到 `specs/001-migrate-fuzz-plugin/validation-report.md`
- [ ] T045 审计目标与源仓最终 Git diff/status、Fuzz 2.0.0、Smart 4.0.1、59 文件、历史 tag 和所有未执行检查，把未验证项明确记录到 `specs/001-migrate-fuzz-plugin/handoff.md`

---

## 依赖与执行顺序

### 阶段依赖

- **Phase 1**：无依赖，立即开始。
- **Phase 2**：依赖 T001 的迁移清单；T004 可与 T003 的清单固化并行准备。
- **US1 / Phase 3**：依赖 Phase 2；测试 T005–T014 先失败，实现 T015–T026 后由 T027 收口。
- **US2 / Phase 4**：依赖 US1；T031 是远端写入人工门禁，T032 与 T033 在其后并行，T034
  依赖两宿主远端验收可用。
- **US3 / Phase 5**：治理测试 T035–T037 可在 US1 后准备；破坏性的源退役 T038–T040 必须
  等待 T032–T034 全部通过并获得明确授权，T041 在退役变更后执行。
- **Phase 6**：依赖所选择交付范围内的全部故事；完整迁移要求 US1、US2、US3 均完成。

### 用户故事依赖

- **US1（P1）**：只依赖共享基础，是本地可交付 MVP。
- **US2（P2）**：依赖 US1 的可安装 Fuzz，但不依赖源仓退役。
- **US3（P3）**：目标多插件治理可在 US1 后独立验证；源退役部分依赖 US2 的远端和切换证据。

### 故事内部顺序

- 测试必须先落盘并确认因目标缺失而失败。
- Manifest、skills、scripts、references、hooks 和 Agent 可以按独立目录并行迁入。
- Marketplace 依赖 Fuzz manifest 和目录存在。
- README 依赖最终入口、版本和切换顺序已经确定。
- 本地验证先于远端检查点；远端检查点先于来源切换；来源切换先于源退役。

## 并行执行示例

### US1

```text
并行测试：T005、T006、T007、T008、T009、T010、T011、T012、T013、T014
并行实现：T015、T016、T017、T018、T019、T020、T021、T022、T023、T024
顺序收口：T025 → T026 → T027
```

### US2

```text
并行测试：T028、T029
顺序门禁：T030 → T031
并行远端验收：T032、T033
切换验收：T034
```

### US3

```text
并行治理测试：T035、T036、T037
远端门禁通过并授权后并行退役：T038、T039、T040
顺序验收：T041 → T042
```

## 实施策略

### MVP 优先：只完成 US1

1. 完成 Phase 1 和 Phase 2。
2. 先完成 T005–T014 的失败测试。
3. 完成 T015–T026 的独立 Fuzz payload、marketplace 和文档。
4. 执行 T027 并停止，独立验收目标本地 Fuzz。
5. 在未取得远端授权前，不执行 T031，也不修改或删除源仓 Fuzz。

### 增量交付

1. **US1**：目标本地独立 Fuzz 可安装、可测试。
2. **US2**：目标远端 Fuzz 可重装，用户可无双装切换来源。
3. **US3**：多插件长期治理完成，源 Fuzz 安全退役。
4. 每个阶段保留源 Fuzz 作为回退，直到下一阶段门禁通过。

### 多人并行策略

1. 团队共同完成源清单和 fixture。
2. US1 中按 skill 目录和测试文件并行迁移，避免修改同一 README/marketplace。
3. US2 中 Claude 与 Codex 远端验收可并行。
4. US3 中源 marketplace/docs、payload/tests、CI/release 可由不同负责人并行，但必须共享同一
   已通过的远端门禁证据。

## 备注

- `[P]` 仅表示文件和依赖允许并行，不扩大远端、删除或发布权限。
- T031、T038、T039、T040 是外部写入或破坏性门禁，未获明确授权时必须停止。
- 任何源或目标基线漂移都必须回到 T001 重新盘点。
- 不得用本地工作树、插件缓存或未运行的命令替代远端安装与验收证据。
- 不移动、不删除、不复用历史 tag/Release；修复必须使用更高版本。
