# 源仓 Fuzz 退役验收

**日期**：2026-08-23

**源仓**：`/Users/a114514/ce_repos/ce-workflow-codex-plugins`

## 已退役内容

- 两个源 marketplace 的 Fuzz entry。
- `plugins/fuzz/` 下 44 个源 payload 文件及空目录。
- 11 组已迁移的 Fuzz 专属契约/行为测试。
- GitLab CI 的 PDF 专项测试和 `ce-workflow fuzz` 双插件发布循环。
- README 的旧本地安装说明，替换为指向新仓的迁址通知。
- AGENTS 中的 Fuzz 版本维护规则。

## 保留内容

- `ce-workflow` 插件及其 manifest 版本。
- 两个源 marketplace 的 `ce-workflow` entry。
- 全部历史 `fuzz-v*` tag/Release；最新可见历史 tag 仍为 `fuzz-v1.0.0`。

## 验证

```bash
node --test $(find tests -name '*.test.mjs' -print)
claude plugin validate .
```

结果：源仓剩余测试 `109 passed, 0 failed`；Claude marketplace 验证通过；两个 marketplace
均只包含 `ce-workflow`；更新后的 release contract 通过；`git diff --check` 通过。

源退役变更当前仅存在于源仓工作区，尚未提交或推送；目标远端 Fuzz 已通过双宿主安装验收，
因此不存在分发空窗。

