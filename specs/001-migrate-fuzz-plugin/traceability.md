# 需求与证据追踪矩阵

## 功能需求

| 需求 | 实现/任务 | 测试或证据 |
|------|-----------|------------|
| FR-001 | T025 | `tests/fuzz-plugin-contract.test.mjs` |
| FR-002 | T015 | `validation-us1.md`、插件验证 |
| FR-003 | T001、T016–T024 | `migration-inventory.md`、59 文件合同 |
| FR-004 | T016、T017、T029 | `tests/fuzz-state-compatibility.test.mjs` |
| FR-005 | T015–T025、T035 | Smart tree 门禁、`multi-plugin-governance.test.mjs` |
| FR-006 | T026、T036、T042 | `plugin-documentation-contract.test.mjs`、`validation-dual-install.md` |
| FR-007 | T016–T024 | 配对检查、运行语言扫描、11 组技能合同 |
| FR-008 | T010、T016 | `fuzz-imperial-agents-contract.test.mjs` |
| FR-009 | T005–T014 | 目标全量 64 项测试 |
| FR-010 | T026、T030、T036 | 五份 README 文档合同 |
| FR-011 | T025、T035 | marketplace 集合与 Smart entry 合同 |
| FR-012 | T015、T035 | Fuzz 2.0.0 / Smart 4.0.1 独立版本合同 |
| FR-013 | T028–T034 | `validation-switch.md` |
| FR-014 | T031–T034、T041 | 远端双宿主验收、历史 tag 检查 |
| FR-015 | T037–T041 | 源剩余 109 项测试与 release contract |

## 成功标准

| 标准 | 结果 | 证据 |
|------|------|------|
| SC-001 | 通过 | 两个 marketplace 均为 `{smart, fuzz}` |
| SC-002 | 通过 | 44→59 迁移清单，无遗漏 |
| SC-003 | 通过 | Claude/Codex 远端安装、61 项远端合同、各 10 个 Agent |
| SC-004 | 通过 | Smart tree `9353b504...`、版本 4.0.1 |
| SC-005 | 通过 | 10 个 skill、4 个 reference 和 hook 中文配对 |
| SC-006 | 通过 | 五语言文档合同 |
| SC-007 | 通过 | 来源切换 5 秒，状态和 Agent 延续 |
| SC-008 | 远端分支通过、待默认分支合并 | 源退役分支已推送，109 项测试通过；待目标先合并、源后合并 |
