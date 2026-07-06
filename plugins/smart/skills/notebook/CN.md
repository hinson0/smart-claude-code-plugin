---
name: notebook
description: 当用户想捕获、查看或闭合 Claude 在当前对话中抛出的开放线索时使用——那些 Claude 在追另一个问题时顺带抛出的 insight、建议的下一步、反问，随着对话发散而被逐渐掩埋。把它们持久化到 `.smart/notebook.md`，作为一份「尚未跟进的线索」滚动清单。在 `/smart:notebook` 时触发，或当用户说「notebook」「记录本」「做题本」「open loops」「有哪些没跟进的」「别丢」「被掩埋」「未跟进」「现在有哪些没跟进的」时触发。有一个配套的 `Stop` hook 已在每次回复后自动捕获带标记的块（★ Insight、建议下一步）；本 skill 补上 hook 解析不了的自由形式线索，并管理它们的 open/closed 状态。它**不是** `todo`（二选一决策 + 钉住的主线），也**不是** `distill`（可复用知识 Q/A 归档）——notebook 追踪未闭合的线索，让一个被追进另一个问题的问题永远不会丢。
argument-hint: "空 = 回溯对话并列出开放线索 · done <id> = 闭合一条"
model: sonnet
---

# notebook —— Claude 开放线索记录本（做题本）

## 这是什么——以及它与 todo / distill 有何不同

当你在追一个问题时，Claude 会顺带抛出别的——一个 `★ Insight`、一句「建议的下一步」、一个反问。对话一发散，这些线索就被**掩埋**了。记录本是一份**开放线索（open loop）**的滚动清单：Claude 抛出、但尚未被跟进的线索。

它刻意是第三样东西，与两个兄弟正交：

- **todo** 追踪一个钉住主线下的*二选一决策*。
- **distill** 把*可复用知识 Q/A* 归档进按 topic 的知识库。
- **notebook**（本 skill）追踪*未闭合的线索*——开放线索——让任何东西都不会在对话游走中丢失。

内容语言跟随对话。

## 两层设计（为什么既要 hook 又要 skill）

捕获开放线索**不能**依赖 Claude *记得*去记录——对话发散的那一刻，恰恰是 Claude 最容易忘的时候。所以捕获拆成两层：

- **一个 `Stop` hook（`hooks/notebook-capture.py`）已在每次回复后确定性运行**——不可跳过、不靠 Claude 自觉。它抓取 Claude 以固定格式产出的两种块——`★ Insight … ─────` 边框块，和「建议的下一步 / Suggested next steps」标题段——追加进 `.smart/notebook.md`。
- **本 skill 是聪明的那一半。** hook 是个死爬虫：只抓带标记的块，判断不了自由形式的建议或句中夹带的反问。被调用时，本 skill 重读对话，补上 hook 漏掉的线索，并管理它们的 open/closed 状态。

合起来：hook 保证「凡有标记的都不丢」，skill 保证「完整性」并让你闭合线索。

## 状态文件：`.smart/notebook.md`

每个项目一个固定文件，已 git-ignore（个人 scratch，从不提交）。文件不存在时由 hook 创建。结构：

```markdown
# 做题本 · Notebook
<!-- 自动由 Stop hook 捕获 · /smart:notebook 管理 · updated <YYYY-MM-DD HH:MM> -->

## 🔵 Open（CC 抛出、尚未跟进的线索）
- [ ] N1 <线索标题>  · 🕒 <ts> · 来源:insight <!-- h:xxxxxxxxxx -->
  > <摘录 / 要点>
- [ ] N2 <反问>  · 🕒 <ts> · 来源:notebook

## ✅ Closed（已跟进 / 已回答 / 已采纳）
- [x] N0 <标题> → 已跟进 (<date>) · <一句话结果>
```

每个 Open 条目带一个稳定的 `N#` id 和一个隐藏的 `<!-- h:hash -->` 指纹（hook 用它去重）。本 skill 自己补的线索用 `来源:notebook`（不需要 hash——skill 按语义去重）。

## 参数

| `$0` | 行为 |
|---|---|
| _（空）_ | **同步 + 列出** —— 从当前对话挖开放线索，对账进 `.smart/notebook.md`，打印 Open 列表。 |
| `done <id>` | **闭合** —— 把某条线索（如 `done N2`）从 Open 移到 Closed，附一句结果。 |

## 空参：同步 + 列出

1. **定位文件。** 项目根用 `git rev-parse --show-toplevel`（回退当前工作目录）；记录本是 `<root>/.smart/notebook.md`。存在则读取——hook 可能已经写过了。
2. **从当前对话挖掘** —— 本会话的 user + assistant 消息。收集开放线索：Claude 抛出但从未真正被追进或回答的 insight、建议的下一步、反问。刻意包含 hook 解析不了的**自由形式**那些——用散文表述的建议、段落中夹带的问题。**不要**重新挖源码里的 TODO 注释或原生任务列表——那是不同的东西。
   - 一条线索只有在**没被跟进**时才「开放」。如果 Claude 抛出了它*且*对话已经解决了它，它属于 Closed，不属于 Open。
3. **对账**每条线索与已有条目——按语义、不按字面（这套心法借鉴 `todo`）：
   - **New** —— 无匹配 → 用下一个 `N#` id 加进 Open，`来源:notebook`。
   - **Duplicate** —— 已有条目（含 hook 抓的）已覆盖 → 原样不动；计为已追踪。也要与 hook 的条目比对，这样绝不重复添加它已抓到的。
   - **Diff** —— 匹配已有条目但补充了细节 → 把新增的一点追加到那条；不要另起一条。
4. **写回**，然后刷新 `updated` 时间戳。
5. **打印** Open 列表到对话，最该跟进的排最前——一个紧凑视图，让用户看到还有什么悬着。绝不把报告本身写进 notebook 以外的任何文件。

## `done <id>`：闭合一条线索

把该 id 的条目从 Open 移到 Closed：`[ ]`→`[x]`，追加 `→ 已跟进 (<date>) · <一句话结果>`。**绝不删除它**——闭合是状态变更，这样一个后来被重开的问题仍保留它的历史。

## 护栏

- **绝不删除线索。** 只追加，或翻转 open→closed。拿不准某条是否已闭合时，保持 Open——一条悬着的条目代价很小；丢一条线索才是用户想极力避免的。
- **与 hook 安全共享文件。** hook 和本 skill 都写 `.smart/notebook.md`——务必读-改-写，保留你没动过的条目，**包括 hook 的 `<!-- h:... -->` 标记**（删掉一个，hook 就会把那条线索当新的重加一遍）。
- **不要覆盖 hook 的成果。** 把 hook 抓的条目当一等公民；对它们去重，而不是重写它们。
- 报告只打到对话；文件里放线索。
- 本 skill 恰好拥有一个文件（`.smart/notebook.md`），在 `.smart/settings.json` 里不拥有任何键。
