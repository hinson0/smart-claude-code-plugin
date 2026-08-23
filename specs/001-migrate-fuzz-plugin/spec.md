# 功能规格：迁移独立 Fuzz 插件至 Smart Marketplace

**功能分支**：未创建（未配置 `before_specify` 钩子）

**创建日期**：2026-08-23

**状态**：草案

**输入**：用户描述：“把 `~/ce_repos/ce-workflow-codex-plugins` 的 Fuzz 插件迁到本仓库；
Fuzz 在 Smart marketplace 中仍以独立 Fuzz 插件存在，不融合进 Smart 插件。”

## 用户场景与测试 *(必填)*

### 用户故事 1 - 从同一 Marketplace 独立安装 Fuzz（优先级：P1）

用户添加 Smart marketplace 后，可以分别选择安装 `smart` 或 `fuzz`；安装 Fuzz 不会改变
Smart 插件，也不要求先安装 Smart。

**优先级原因**：独立插件身份是用户明确要求的核心边界。

**独立测试**：只从目标 marketplace 安装 Fuzz，确认能够发现并使用 Fuzz 的全部能力，
同时 Smart 未被自动安装或修改。

**验收场景**：

1. **假设** 用户已添加目标 marketplace，**当** 用户查看可安装插件，**那么** `smart` 和
   `fuzz` 显示为两个独立条目。
2. **假设** 用户仅安装 Fuzz，**当** 用户启动新会话，**那么** Fuzz 的 10 个 skills、
   SessionStart hook 和 10 个官职 Agent 可用，Smart 的功能不作为前置条件。
3. **假设** 用户同时安装 Smart 和 Fuzz，**当** 两个插件运行，**那么** 各自的命名空间、
   hook、状态和版本保持独立，不覆盖对方文件或行为。

---

### 用户故事 2 - 从旧 Marketplace 切换 Fuzz（优先级：P2）

现有用户可以把 Fuzz 的安装来源从 `ce-workflow` marketplace 切换到 Smart marketplace，
继续使用相同的 Fuzz 命名空间、宫廷模式状态和受管 Agent。

**优先级原因**：迁移托管仓不能让现有用户丢失状态、命令或安装入口。

**独立测试**：从已安装旧来源 Fuzz 的状态开始，按照迁移说明先卸载旧来源、再安装新来源
并启动新会话，确认主要能力和既有状态保持可用。

**验收场景**：

1. **假设** 用户安装了旧来源 Fuzz，**当** 用户按照说明切换，**那么** 安装过程明确要求
   先卸载旧来源，避免两个同名 Fuzz 实例并存。
2. **假设** 用户已设置用户级或项目级宫廷模式，**当** 用户从新来源启动 Fuzz，**那么**
   原有状态继续生效，受管 Agent 仍使用 `fuzz` 命名空间。
3. **假设** 目标 Fuzz 尚未通过远端双宿主验收，**当** 维护者评估源仓退役，**那么** 源
   marketplace 继续保留 Fuzz，不产生分发空窗。

---

### 用户故事 3 - 独立维护两个插件（优先级：P3）

维护者可以在同一仓库分别维护 Smart 和 Fuzz；每个插件拥有自己的双宿主 manifest、版本、
skills、hooks、测试和发布证据，修改其中一个插件不会迫使另一个插件升级。

**优先级原因**：清晰的插件边界能防止版本、行为和测试相互污染。

**独立测试**：只修改 Fuzz 并执行仓库门禁，确认仅 Fuzz 版本和资产发生变化，Smart 两份
manifest、skill 和 hook 保持不变。

**验收场景**：

1. **假设** 维护者更新 Fuzz，**当** 检查最终差异，**那么** Smart 插件 payload 和版本未被
   无关修改。
2. **假设** 两个插件存在同名 skill，**当** 用户显式调用完整命名空间，**那么** 每个插件
   执行自己的合同，不要求合并或共享实现。

---

### 边界情况

- 源 checkout 不存在、不干净或 HEAD 偏离冻结基线时，必须停止写入并重新盘点。
- 同时安装旧来源和新来源的 Fuzz 会产生两个同名插件及重复 hook，迁移说明必须禁止该状态。
- Smart 与 Fuzz 都提供 `close-issue` 时，必须用完整命名空间区分；不得把两者描述为等价。
- Fuzz `html` 与 Smart `show`、Fuzz `one-by-one` 与 Smart `advance-one-step` 可以并存，文档
  必须说明各自用途，不得因主题相近而合并。
- Fuzz 的精确中文官职和称谓属于运行协议值；其他宿主加载内容仍须遵守目标仓语言规则。
- 目标远端安装或任一宿主验收失败时，源 Fuzz 不得退役。
- 用户卸载 Fuzz 前若希望清理全机受管 Agent，必须先通过 Fuzz 的用户级关闭流程处理；
  Smart 不负责清理 Fuzz 状态。

## 需求 *(必填)*

### 功能需求

- **FR-001**：目标仓库的 Codex 与 Claude Code marketplace 必须同时登记 `smart` 和 `fuzz`
  两个独立插件，且 Fuzz source 指向 `plugins/fuzz`。
- **FR-002**：Fuzz 必须保留独立的 `.codex-plugin/plugin.json` 和
  `.claude-plugin/plugin.json`；两份 manifest 的名称必须为 `fuzz`，版本必须相同且为干净
  SemVer。
- **FR-003**：迁移必须覆盖源 Fuzz 的 44 个插件文件及其完整用户合同，包括 10 个 skills、
  10 个 skill 元数据、10 个官职 Agent、hook、脚本、资源、reference 和两个 manifest。
- **FR-004**：迁入后的 Fuzz 必须继续使用 Fuzz 命名空间、`$CODEX_HOME/fuzz/`、项目
  `.fuzz/` 和 `fuzz-*.toml`，不得迁到 Smart 命名空间。
- **FR-005**：Fuzz 的 skill、hook、Agent、脚本和版本不得合并进 `plugins/smart`；Fuzz
  迁移不得改变 Smart 的既有 skill、hook、manifest 或运行合同。
- **FR-006**：Smart 与 Fuzz 的同名或相邻能力必须分别保留并通过完整命名空间发现；文档
  必须解释 `close-issue`、逐 Cycle 和 HTML 相关入口的行为差异。
- **FR-007**：迁入 Fuzz 的宿主加载源、脚本消息和注释必须使用英文；每个 skill 必须有
  同目录 `CN.md`，每个英文 reference 必须有对应 `CN[名称].md`。
- **FR-008**：十个中文官职和宫廷称谓必须保持精确运行值，同时不得借此放宽其他运行源的
  英文边界。
- **FR-009**：Fuzz 的 11 组专属契约/行为测试必须迁入并适配目标仓；CE Workflow 专属发布
  和全仓测试不得机械复制。
- **FR-010**：五份 README 必须把仓库描述为同时分发 Smart 和 Fuzz 的 marketplace，并
  分别说明安装、命令、依赖、双装行为、卸载和回退。
- **FR-011**：现有 Smart marketplace entry 必须保持有效；新增 Fuzz 不得替换、改名或
  隐藏 Smart。
- **FR-012**：Fuzz 必须拥有独立版本生命周期；只修改 Fuzz 时只升级 Fuzz，Smart 未发生
  payload 变化时不得因迁移被动升级。
- **FR-013**：现有用户切换来源时必须遵循“卸载旧 Fuzz → 安装新 Fuzz → 新建会话验证”的
  顺序；不支持两个来源的 Fuzz 同时安装。
- **FR-014**：源仓只能在目标 Fuzz 已从远端 marketplace 被 Codex 与 Claude Code 独立安装
  并通过全部验收后退役；历史 Fuzz tag 和 Release 必须保留。
- **FR-015**：源退役必须同步处理两个 marketplace、`plugins/fuzz`、Fuzz 专属测试、README、
  发布 CI 和版本规则，且不得影响仍保留的 `ce-workflow` 插件。

### 关键实体

- **Marketplace**：仓库级插件目录；目标 marketplace 同时登记 Smart 和 Fuzz，但不拥有
  两者的运行状态。
- **插件发行单元**：可独立安装和版本化的 Smart 或 Fuzz；拥有自己的双宿主 manifest、
  payload 和验收证据。
- **Fuzz 组件**：Fuzz 发行单元中的 skill、hook、Agent、脚本、资源、reference 或元数据。
- **宿主入口**：Codex 或 Claude Code 对某个插件 skill 的完整命名空间调用方式。
- **迁移检查点**：冻结源、目标本地通过、目标远端通过、源已退役等阶段及其证据。

## 成功标准 *(必填)*

### 可衡量结果

- **SC-001**：目标两个 marketplace 中 `smart` 和 `fuzz` 条目覆盖率均为 100%，且分别指向
  正确的独立插件目录。
- **SC-002**：源 Fuzz 44 个组件迁移状态覆盖率达到 100%，没有未解释遗漏。
- **SC-003**：从目标远端仅安装 Fuzz 时，Codex 与 Claude Code 均发现 10 个 Fuzz skills、
  1 套 SessionStart 行为和 10 个官职 Agent，主场景通过率达到 100%。
- **SC-004**：Smart 插件迁移前后 payload 和版本的无关变化数量为 0。
- **SC-005**：Fuzz 的 skill 与 reference 中文配对完整率达到 100%，宿主加载源语言检查通过。
- **SC-006**：五份 README 对两个独立插件的入口、差异和切换顺序描述一致率达到 100%。
- **SC-007**：现有用户可在 10 分钟内完成旧来源卸载、新来源安装和新会话验证，且不丢失
  宫廷模式状态。
- **SC-008**：源 Fuzz 退役后，源仓独立 Fuzz 安装入口数量为 0，目标远端 Fuzz 可重新安装，
  `ce-workflow` 剩余测试和发布流程保持通过。

## 假设

- “迁到本插件”最终解释为迁到 `smart-claude-code-plugins` marketplace 仓库，而不是并入
  `plugins/smart` 发行单元。
- Fuzz 保持独立名称、命名空间、作者身份、状态路径和 Agent 前缀。
- Smart 与 Fuzz 可以同时安装；旧来源 Fuzz 与新来源 Fuzz 不支持同时安装。
- 目标仓的语言、翻译、双宿主和验证治理适用于仓库内每个独立插件。
- 当前源基线为 `949d05e585a551fce1d677d95a57c4db84cd1c4b`；实施前必须再次确认。

