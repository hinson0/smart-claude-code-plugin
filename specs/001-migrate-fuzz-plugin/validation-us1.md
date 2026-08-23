# US1 本地验收记录

**日期**：2026-08-23

**范围**：目标仓本地独立 Fuzz 2.0.0，不包含远端发布、来源切换或源仓退役。

## 基线与结构

- 源 commit：`949d05e585a551fce1d677d95a57c4db84cd1c4b`
- 源 Fuzz tree：`e8f45ca255623202cb8989dbb23a7e631825b37c`
- Smart tree：`9353b504196c8de79d009c3612b891850e65ec2b`
- 目标 Fuzz 文件：59
- 目标 Fuzz skills：10，全部具有 `SKILL.md` 与 `CN.md`
- 英文 references：4，全部具有 `CN[名称].md`
- 两个 marketplace 插件集合：`{smart, fuzz}`
- Fuzz 双 manifest：`2.0.0`
- Smart 双 manifest：`4.0.1`

## 自动测试

执行：

```bash
node --test tests/*.test.mjs \
  plugins/smart/skills/close-issue/scripts/close-issue.test.mjs
```

结果：`59 passed, 0 failed`。覆盖 11 组 Fuzz 专属合同、marketplace/manifest/配对、
59 文件完整性和 Smart `close-issue` 回归。

## 插件验证

执行：

```bash
claude plugin validate plugins/fuzz
claude plugin validate .
```

结果：Fuzz manifest 与根 marketplace 均通过 Claude Code 验证。

## 运行语言边界

运行源中的普通指令、metadata、脚本注释、CLI help 和错误消息均已英文化。扫描仍可见的
非英文值只属于测试覆盖的协议或生成内容：

- Fuzz `close-issue` 的四个兼容 note 标题。
- `handle-all-tickets` 的显式 `并行` 参数。
- 双语 PDF 成品中的中文标题、标签和排版文本。
- 十个宫廷官职与称谓通过 Unicode 转义保存，源码扫描不含汉字字面量。

这些值均由对应契约测试限定，不构成对其他运行源英文边界的放宽。

## 文档与差异质量

- 五份 README 均列出 Smart/Fuzz 两个独立插件、`fuzz@smart`、完整命名空间和十个 Fuzz
  skills。
- `git diff --check` 通过。
- `plugins/smart` 未发生工作区修改，Git tree 与计划基线一致。

## 结论

US1 本地 MVP 通过。远端可安装性、旧来源切换和源仓退役尚未验证，不得据此宣称完整迁移
已完成。

