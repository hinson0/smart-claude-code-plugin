# 接口契约：Fuzz 跨仓迁移门禁

## 阶段 1：冻结源

**完成条件**：

- 源工作区干净，HEAD 等于 `949d05e585a551fce1d677d95a57c4db84cd1c4b`。
- `plugins/fuzz` tree 等于 `e8f45ca255623202cb8989dbb23a7e631825b37c`。
- 44 个源组件和 11 组专属测试均进入迁移清单。

源漂移时停止写入并重新盘点。

## 阶段 2：目标本地落地

**完成条件**：

- `plugins/fuzz` 含 59 个目标文件，Fuzz 两份 manifest 均为 `2.0.0`。
- 两个根 marketplace 的插件集合均为 `{smart, fuzz}`，source path 一致。
- 11 组迁入测试、配对、英文边界、插件验证和五份 README 检查全部通过。
- Smart tree 仍为 `9353b504196c8de79d009c3612b891850e65ec2b`，版本仍为 `4.0.1`。
- Smart+Fuzz 双装冒烟证明两个插件独立发现、hook 和状态互不覆盖。

失败时只修复目标，不删除源 Fuzz。

## 阶段 3：目标远端验收

**完成条件**：

- 目标变更存在可重新安装的远端 commit 或不可变 `fuzz-v2.0.0` tag。
- 在干净 Claude Code 配置中仅从目标 marketplace 安装 `fuzz@smart` 并通过全部主场景。
- 在干净 Codex 配置中完成相同安装与验收。
- 新会话宫廷规则只注入一次，10 个 Agent 可用且不修改非受管 Agent。
- 记录实际远端 SHA；本地工作树和插件缓存不得作为证据。

失败时发布更高目标 Fuzz 版本修复；源 Fuzz 保持可安装。

## 阶段 4：源仓退役

仅在阶段 3 全部通过后执行独立源仓提交：

- 从两个源 marketplace 删除 Fuzz entry，删除 `plugins/fuzz`。
- 删除或迁走 Fuzz 专属测试，移除 CI 的 PDF 专项测试。
- 将 release loop 和 release contract 改为只发布 `ce-workflow`。
- README 删除旧安装指引并保留迁址通知；AGENTS 删除 Fuzz 版本规则。
- 保留全部历史 `fuzz-v*` tag/Release；`ce-workflow` manifest 不因退役升版。
- 剩余测试、两个 marketplace 校验和更新后的 release contract 全部通过。

## 用户切换与回退

切换固定顺序：卸载 `fuzz@ce-workflow` → 安装 `fuzz@smart` → 新建会话验证。不得同时安装
两个来源的 Fuzz；不要求删除整个 `ce-workflow` marketplace。

- 源未退役：目标失败时继续使用旧来源，修复使用更高目标版本。
- 源已退役：恢复源退役提交删除的插件、entries、测试、README 和 CI 成员。
- 回退时先卸载新来源，再安装旧来源；不移动、不删除、不复用已发布 tag/Release。

