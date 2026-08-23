# 数据模型：独立 Fuzz 插件迁移

本功能不新增数据库；以下模型定义 marketplace、插件发行单元、组件映射和迁移检查点，
供任务、测试和发布验收共同使用。

## 1. Marketplace 目录（MarketplaceCatalog）

| 字段 | 含义 | 约束 |
|------|------|------|
| `host` | Codex 或 Claude Code | 两个固定值 |
| `catalog_name` | 根 marketplace 名称 | 继续为 `smart`，不得因新增 Fuzz 改名 |
| `plugin_entries` | 可安装插件集合 | 两个宿主必须同为 `{smart, fuzz}` |
| `source_path` | entry 指向的插件目录 | Smart/Fuzz 分别指向 `plugins/smart`、`plugins/fuzz` |

## 2. 插件发行单元（PluginRelease）

| 字段 | 含义 | 约束 |
|------|------|------|
| `name` | 插件身份 | `smart` 或 `fuzz`，相互独立 |
| `codex_manifest` | Codex manifest | 必须存在且名称匹配插件 |
| `claude_manifest` | Claude Code manifest | 必须存在且名称匹配插件 |
| `version` | 插件 SemVer | 同一插件两 manifest 相同，不同插件互不绑定 |
| `payload_tree` | 插件目录内容指纹 | Fuzz 形成新 tree；Smart 必须保持基线不变 |
| `validation_evidence` | 测试、插件验证和远端安装证据 | 发布完成前必须齐全 |

## 3. Fuzz 组件（FuzzComponent）

| 字段 | 含义 | 约束 |
|------|------|------|
| `source_path` | 源仓相对路径 | 44 个源文件中唯一 |
| `target_path` | 目标仓相对路径 | 必须位于 `plugins/fuzz` |
| `kind` | manifest、skill、metadata、hook、agent、script、asset、reference | 固定枚举 |
| `language_role` | 英文运行源、中文配对或协议值 | 每个文件必须有明确角色 |
| `dependencies` | 文件、工具、宿主或权限依赖 | 不得因迁移扩大授权 |
| `evidence` | 对应测试或配对检查 | 目标远端验收前必填 |

## 4. 中文配对（TranslationPair）

| 字段 | 含义 | 约束 |
|------|------|------|
| `runtime_source` | 英文 `SKILL.md`、reference 或 hook 实现 | 必须通过英文边界检查 |
| `chinese_companion` | `CN.md`、`CN[...]` 或 hook 中文说明 | 10+4+1 共 15 个新增配对 |
| `semantic_parity` | 两者描述的合同一致性 | 命令、门禁和错误语义不得漂移 |
| `protocol_exceptions` | 必须保留的中文协议值 | 仅官职和称谓，必须由测试登记 |

## 5. 宿主入口（HostSurface）

| 字段 | 含义 | 约束 |
|------|------|------|
| `plugin` | 入口所属插件 | Smart 或 Fuzz，不得跨插件代理 |
| `host` | Codex 或 Claude Code | 每个 Fuzz skill 两宿主可发现 |
| `namespace` | 完整插件命名空间 | Fuzz 始终保持 Fuzz 命名空间 |
| `activation` | 显式或自然触发 | 迁移不得扩大隐式触发 |
| `behavior_contract` | 用户结果、授权和失败边界 | 与所属插件独立测试绑定 |

## 6. 安装来源（InstallationSource）

| 字段 | 含义 | 约束 |
|------|------|------|
| `plugin_name` | 安装的插件 | 两个来源均为 `fuzz` |
| `marketplace` | `ce-workflow` 或 `smart` | 同一时间只能激活一个来源 |
| `version` | 安装版本 | 旧来源 `1.x`，目标首版 `2.0.0` |
| `state_namespace` | 用户/项目状态路径 | 两来源均沿用 `.fuzz` 与 `$CODEX_HOME/fuzz` |

## 7. 迁移检查点（MigrationCheckpoint）

| 字段 | 含义 | 约束 |
|------|------|------|
| `stage` | `source_frozen`、`target_local_validated`、`target_remote_verified`、`source_retired` | 只能按顺序前进 |
| `repository` | 源仓或目标仓 | 每个检查点绑定唯一仓库 |
| `commit` | 不可变 Git commit | 远端验收必须记录实际 SHA |
| `version` | 该阶段的 Fuzz 版本 | 不得复用或改写已发布版本 |
| `gate_evidence` | 进入下一阶段的证据 | 缺一项即停留当前阶段 |

## 关系与状态

- 一个 `MarketplaceCatalog` 包含两个 `PluginRelease` entry。
- Fuzz `PluginRelease` 由 59 个目标 `FuzzComponent` 组成，其中 15 个形成
  `TranslationPair` 中文侧。
- 每个 Fuzz skill 对应 Codex、Claude Code 两个 `HostSurface`。
- `InstallationSource` 切换不改变 Fuzz 状态命名空间，但禁止两个来源并存。
- `MigrationCheckpoint` 按以下顺序推进：

```text
source_frozen
  -> target_local_validated
  -> target_remote_verified
  -> source_retired
```

- 任一目标门禁失败：源 Fuzz 保持可安装，修复使用更高目标版本。
- 源已退役后回退：恢复源分发资产和 CI 成员，不移动历史 tag。

