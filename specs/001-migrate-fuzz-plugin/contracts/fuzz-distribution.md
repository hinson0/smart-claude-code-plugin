# 接口契约：Fuzz 2.0.0 分发内容

## Manifest

- 路径：`plugins/fuzz/.codex-plugin/plugin.json` 与
  `plugins/fuzz/.claude-plugin/plugin.json`
- `name`：`fuzz`
- `version`：`2.0.0`
- Codex `skills`：`./skills/`
- 描述、默认提示和元数据：英文，只描述 Fuzz 的 10 项能力
- 两份 manifest 不引用 `plugins/smart`

## 文件完整性

目标 Fuzz 共 59 个文件：

- 44 个源组件各有唯一目标路径。
- 10 个 skills 各有英文 `SKILL.md` 与中文 `CN.md`。
- 4 个英文 reference 各有一个 `CN[名称].md`。
- `hooks/CN.md` 说明英文 hook 的中文合同。
- manifest、10 个 `agents/openai.yaml`、脚本、HTML 模板和 hook 配置按目标语言规则适配。

不要求为 manifest、YAML、每个脚本分别复制中文文件；中文配对只按宪法和项目约定创建。

## 语言合同

- 宿主加载源、可执行消息、错误和代码注释使用英文。
- 十个中文官职与宫廷称谓是必要协议值；源文件使用 Unicode 转义，运行时结果逐字匹配。
- 中文配对必须与英文运行源保持命令、授权、失败和完成门禁一致。
- 源中文正文不能同时留在 `SKILL.md` 和 `CN.md`，避免双重事实源。

## 状态兼容

Fuzz 2.0.0 必须继续使用：

- `$CODEX_HOME/fuzz/i-am-the-king`
- `<repo>/.fuzz/i-am-the-king.local`
- `$CODEX_HOME/agents/fuzz-*.toml`

改变托管仓不得重置用户状态，也不得改成 `.smart` 或 `smart-*`。

## 测试合同

迁入并适配 11 组 Fuzz 专属测试：ask、close-issue、HTML、宫廷开关、宫廷 Agent、
one-by-one、Wiki、双语 PDF、父票据交付、周报和父票据验收。

目标仓另行验证：

- 10 个 skill 配对和 4 个 reference 配对完整。
- Fuzz 运行源英文边界通过，协议值例外有精确测试。
- 两个 Fuzz manifest 名称、版本一致。
- 两个根 marketplace 插件集合均为 `{smart, fuzz}`。
- 五份 README 插件集合和命名空间一致。
- Smart tree 与版本未因迁移改变。

