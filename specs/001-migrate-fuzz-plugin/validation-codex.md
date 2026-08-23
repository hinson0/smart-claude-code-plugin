# Codex 远端 Fuzz 验收

**日期**：2026-08-23

- 远端来源：GitHub codeload，分支 `yzb/migrate-fuzz-plugin`
- 对应检查点：`7118cf3cd9045ad0faa6cf0115363677fb2bea1c`
- 隔离配置：`CODEX_HOME=/tmp/fuzz-codeload-verify.HrMzUc/codex`
- 安装命令：`codex plugin add fuzz@smart --json`
- 安装结果：`fuzz@smart` 2.0.0，installed/enabled 均为 true

Codex marketplace list 同时发现已安装 Fuzz 2.0.0 和可选 Smart 4.0.1，二者 source path 独立。
远端归档中 61 项契约/回归测试全部通过。对 Codex 安装副本执行 SessionStart，成功输出宫廷
规则并在隔离目录安装恰好 10 个 `fuzz-*` Agent。

结论：Codex 可从远端检查点重新取得并安装独立 Fuzz 2.0.0。

