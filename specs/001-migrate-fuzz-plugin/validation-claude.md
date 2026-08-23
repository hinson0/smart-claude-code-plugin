# Claude Code 远端 Fuzz 验收

**日期**：2026-08-23

- 远端来源：GitHub codeload，分支 `yzb/migrate-fuzz-plugin`
- 对应检查点：`7118cf3cd9045ad0faa6cf0115363677fb2bea1c`
- 隔离配置：`CLAUDE_CONFIG_DIR=/tmp/fuzz-codeload-verify.HrMzUc/claude`
- 安装命令：`claude plugin install fuzz@smart --scope user -y`
- 安装结果：`fuzz@smart` 2.0.0，启用状态为 true

远端归档的 `plugins/fuzz` 与本地已验证 payload 逐文件一致。归档中运行 61 项契约/回归测试，
结果为 `61 passed, 0 failed`，覆盖十类 Fuzz 主场景。对 Claude 安装副本执行 SessionStart，
成功输出宫廷规则并在隔离目录安装恰好 10 个 `fuzz-*` Agent。

结论：Claude Code 可从远端检查点重新取得并安装独立 Fuzz 2.0.0。

