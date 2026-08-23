# 接口契约：Smart 与 Fuzz 插件边界

## Marketplace 合同

两个根级 marketplace 必须同时登记：

| 插件 | Source | 安装单元 |
|------|--------|----------|
| `smart` | `./plugins/smart` | `smart@smart` |
| `fuzz` | `./plugins/fuzz` | `fuzz@smart` |

Smart entry 的名称、source 和安装策略不得因新增 Fuzz 改变。Fuzz entry 必须是并列插件，
不得描述为 Smart 子能力。

## 发行单元合同

- `plugins/smart` 与 `plugins/fuzz` 各自拥有两份 manifest、skills、hooks、状态和测试合同。
- Fuzz 迁移不得写入或调用 Smart payload；Smart 不安装、清理或开关 Fuzz Agent 和状态。
- Fuzz 两份 manifest 名称均为 `fuzz`、版本均为 `2.0.0`。
- Smart 两份 manifest 和 payload 保持 `4.0.1` 与计划记录的 tree 基线。
- 两插件可以同时安装；它们的版本不要求相同，也不联动升级。

## Hook 合同

- Smart 独立保留 SessionStart greet、PreToolUse session logs、Stop notebook capture。
- Fuzz 独立保留宫廷 SessionStart 与 10 个 `fuzz-*` Agent 的同步。
- Smart greet 不输出宫廷 prompt，因此 Smart+Fuzz 双装不需要跨插件 claim 或 hook 去重。
- Fuzz 只能清理受管 `fuzz-*` Agent；不得修改 Smart 或用户其他 Agent。

## 同名入口合同

Smart 与 Fuzz 都可以提供 `close-issue`，但必须用完整插件命名空间区分。两者不得互相调用、
共享脚本或统一门禁：

- Smart 保持“当前实现分支资产 + 集成事实披露”合同。
- Fuzz 保持“本地/远端目标分支集成 + 明确 local-only 例外”合同。

自然语言可能产生路由歧义时，README 必须推荐显式完整命名空间。

## 不变性门禁

迁移完成时必须重新计算 `plugins/smart` tree，并与
`9353b504196c8de79d009c3612b891850e65ec2b` 比较。若不同，必须解释为另一个独立变更或
回退意外修改；不得把它混入 Fuzz 迁移。

