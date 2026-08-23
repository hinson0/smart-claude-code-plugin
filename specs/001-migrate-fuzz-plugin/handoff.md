# Fuzz 跨仓迁移交接

**日期**：2026-08-23

## 目标仓

- 仓库：`hinson0/smart-claude-code-plugins`
- 分支：`yzb/migrate-fuzz-plugin`
- 已验证远端检查点：`7118cf3cd9045ad0faa6cf0115363677fb2bea1c`
- 插件：Fuzz 2.0.0、Smart 5.0.0
- Fuzz 文件：59；Smart tree：`ad9d3639e31805814e736afda21f43e59eb86302`
- 本地最终测试：64 passed，0 failed
- 远端归档测试：61 passed，0 failed
- Claude Code/Codex 远端安装、来源切换和 Smart+Fuzz 双装：通过

目标实现提交：

- `a4c229c` `feat(fuzz): migrate plugin into independent marketplace`
- `16b0295` `test(fuzz): add migration contract coverage`
- `11edb22` `docs: define multi-plugin migration workflow`
- `7118cf3` `chore: register fuzz in root marketplaces`

## 源仓

- 仓库：`webhub/ce-workflow-codex-plugins`
- 分支：`yzb/retire-fuzz-plugin`
- 远端检查点：`4e9ff0d`
- 剩余测试：109 passed，0 failed
- Marketplace 验证：通过
- 历史 Fuzz tags：保留

源退役提交：

- `8c0ae3b` `refactor(fuzz): retire source plugin implementation`
- `a5b5362` `test(fuzz): remove retired source plugin tests`
- `aa5efd5` `chore: remove retired Fuzz release references`
- `4e9ff0d` `docs: remove retired Fuzz documentation`

## 未完成的外部集成

- 目标功能分支尚未合并到 GitHub 默认分支。
- 源退役分支尚未合并到 GitLab 默认分支。
- 未创建 PR/MR，未移动或创建 Release tag。

这些是明确未执行的仓库集成操作，不得把“远端功能分支已验证”表述为“默认分支已上线”。
正确集成顺序是：先合并并复验目标分支，再合并源退役分支。

