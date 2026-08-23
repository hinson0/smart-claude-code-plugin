# 研究结论：迁移独立 Fuzz 插件

## 1. 固定权威源和目标边界

**决策**：源基线固定为 commit `949d05e585a551fce1d677d95a57c4db84cd1c4b`，其中
`plugins/fuzz` tree 为 `e8f45ca255623202cb8989dbb23a7e631825b37c`。目标 Smart payload
基线为 tree `ad9d3639e31805814e736afda21f43e59eb86302`。实施开始前重新核对源工作区干净、
HEAD 未漂移；目标完成后重新核对 Smart tree 未变。

**理由**：不可变 tree 能区分“迁移 Fuzz”与“意外修改 Smart”，也避免缓存或旧 worktree
成为事实源。

**考虑过的替代方案**：使用插件缓存、持续跟随源 `main` 或仅靠人工 diff。三者都不能
稳定证明迁移边界，因此拒绝。

## 2. 目标 marketplace 同时发布两个独立插件

**决策**：目标两个根 marketplace 均保留现有 `smart` entry，并新增指向
`./plugins/fuzz` 的 `fuzz` entry。Fuzz 保留自己的双宿主 manifest、skills、hooks、状态、
Agent 和测试；不写入 `plugins/smart`。

**理由**：用户要求迁移的是托管仓，而不是插件身份；宪法 v1.1.0 允许一个 marketplace
分发多个独立插件，并禁止 payload 隐式融合。

**考虑过的替代方案**：把 Fuzz 并入 Smart、新建第二套根 marketplace、重命名 Fuzz。
这些方案会破坏独立安装、命名空间或根级事实源，均拒绝。

## 3. Fuzz 目标版本定为 2.0.0

**决策**：目标 Fuzz 两份 manifest 都使用 `2.0.0`；Smart 两份 manifest 继续使用 `5.0.0`。

**理由**：源 Fuzz `1.0.0` 的宿主指令、脚本消息和注释以中文为默认运行合同；目标宪法要求
英文运行源并把中文转为配对文档。这会改变默认交互和确定性错误消息，属于不兼容变更，
必须升级 MAJOR。新增 Fuzz 不改变 Smart payload，给 Smart 制造空版本违反独立版本原则。

**考虑过的替代方案**：`1.0.1` 不能表达运行合同变化；`1.1.0` 只适合向后兼容增量；复用
`1.0.0` 会造成缓存和审计混淆；同步升级 Smart 没有对应行为变化，全部拒绝。

## 4. 44 个源文件扩展为 59 个目标文件

**决策**：44 个源文件全部保持独立 Fuzz 路径；10 个 `SKILL.md` 翻译为英文并新增 10 个
`CN.md`，4 个 reference 翻译为英文并新增 4 个 `CN[...]`，新增 `hooks/CN.md`。manifest、
`openai.yaml`、脚本注释/消息和 HTML 模板运行文本改为英文。中文官职与称谓使用 Unicode
转义保存，运行时解码为原精确值。

**理由**：这同时满足完整迁移、英文运行源和中文配对三项门禁。总数为
`44 + 10 + 4 + 1 = 59`。

**考虑过的替代方案**：原样复制中文源违反宪法；只复制 skills 会断开脚本、Agent、资源和
reference；为每个脚本另建中文副本没有治理价值，均拒绝。

## 5. Smart 与 Fuzz 共存但不融合

**决策**：Smart+Fuzz 可以同时安装。两套 `close-issue`、Fuzz `html` 与 Smart `show` 均
保留各自完整命名空间和合同；Fuzz `one-by-one` 保持独立，不依赖 Smart 5.0 已移除的旧
逐 Cycle 入口。两插件 hooks 分别加载，无需跨插件去重。Smart 不管理
`$CODEX_HOME/fuzz`、`.fuzz/` 或 `fuzz-*.toml`。

**理由**：完整命名空间已隔离同名能力，相关入口的门禁、写权限主体和用户结果并不相同。
Smart greet 不输出宫廷提示，与 Fuzz SessionStart 也没有重复副作用。

**考虑过的替代方案**：统一入口、共享实现、合并 hook 或让 Smart 清理 Fuzz Agent，都会
改变已发布合同或越过插件边界，因此拒绝。

## 6. 旧来源与新来源 Fuzz 禁止双装

**决策**：用户切换顺序固定为“在隔离环境验证新 Fuzz → 卸载 `fuzz@ce-workflow` → 安装
`fuzz@smart` → 新建会话验证”。不为两个同名 Fuzz 实例设计共存锁或桥接；用户仍可保留
源 `ce-workflow` marketplace 和其中的其他插件。

**理由**：两个来源具有相同插件名、命名空间、hook 和 Agent 管理范围，双装只会重复注入，
且没有长期业务价值。既有 `.fuzz` 状态和 `fuzz-*` Agent 路径不变，因此顺序切换无需状态
迁移。

**考虑过的替代方案**：先安装新来源、删除整个源 marketplace、增加跨仓运行锁。它们会
分别造成短暂双装、误删仍需插件或永久复杂度，均拒绝。

## 7. 迁移专属测试，不复制源仓制度

**决策**：迁入并适配 11 组 Fuzz 专属测试，继续验证 `plugins/fuzz`、完整 Fuzz 命名空间、
HTML/PDF/close-issue 确定性行为、宫廷状态和 10 个 Agent。新增目标仓测试验证 10 个
skill 配对、4 个 reference 配对、英文边界、两个 marketplace 集合、Fuzz 双 manifest、
Smart tree 不变和五份 README 一致。源 `release-ci-contract`、中文 description 规则、CE
全仓验收器和 CE Workflow 测试不机械迁入。

**理由**：Fuzz 行为合同可迁移，源仓 GitLab Release 循环和 CE Workflow 结构不是目标
Fuzz payload 的一部分。

**考虑过的替代方案**：不迁测试无法证明兼容性；复制全部源测试会引入不存在的 CI 和
插件假设，均拒绝。

## 8. 目标远端验收先于源退役

**决策**：目标本地通过后，必须记录可重新安装的远端 commit 或 `fuzz-v2.0.0` tag，在干净
Codex 与 Claude Code 配置中仅安装 `fuzz@smart` 并完成验收。之后才在源仓独立提交删除
Fuzz marketplace entry、目录、专属测试和发布成员，同时保留历史 `fuzz-v*` tag/Release。

**理由**：目标仓当前没有可替代远端分发事实；本地工作树或缓存不能证明用户可安装。
独立提交让目标发布和源退役分别回退。

**考虑过的替代方案**：先删源、跨仓一次性切换、删除历史 tag，都会制造分发空窗或破坏
审计，因此拒绝。
