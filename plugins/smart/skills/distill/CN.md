---
name: distill
description: 当用户要求蒸馏、总结、归档、持久化或保存当前会话/聊天到知识库时使用；包括提到 /smart:distill、distill、知识库、会话主题、问答归档、当前 CC 输出、把这次聊天落盘，或指定范围/目标目录做会话知识沉淀。仅适用于当前对话上下文，不用于读取源目录文件。
argument-hint: 可选 —— 收窄范围（如"最近 5 轮"、"关于 langgraph 的部分"）或指定目标目录。默认提炼整场会话并落盘到 .smart/knowledges/。
---

# distill — 从当前会话提炼知识落盘

## 用途

把**当前 CC 会话中产生的有价值问答对**抽取、聚类、格式化,落盘到目标目录,形成可被未来 RAG 检索的主题化知识库。

输入:对话上下文(用户消息 + 助手消息)。
输出:`<目标目录>/<主题键>.md` 一到多个文件。

三个核心承诺:

1. **三态比对(仅目标目录,且豁免已 review 文件)**:每个主题簇必须明确归类为「重复 / 新增 / 差分」之一
2. **不删内容**:仅可删除与主题无关的废话、寒暄、tool 原始 JSON 等噪音;代码、数据、表格、示例、推理过程一律保留
3. **格式统一**:按 `references/format-spec.md` 规范化,所有落盘文件含 `## 触发提问` `## 关键结论` 等固定段落

## Step 0 — 解析目标目录

目标目录在开始时**解析一次**,本次运行的所有读写都限定在该目录内。目标是首次使用时显式问清「本地 vs 全局」,之后保持静默:先读已保存的**本地**设置,首次选择落盘到 `.smart/settings.json` 后,后续运行不再询问。

解析优先级(命中即停):

1. **调用时显式带路径** —— 用户指明了目录(如"distill 到 docs/kb"、"distill 到 ~/knowledges/md/2026-05-28"),直接照用,跳过其余步骤。
2. **本地项目设置** —— 读当前工作目录的 `.smart/settings.json`,若含 `knowledges_dir` 则用它并跳过其余步骤。这是热路径:一旦配置过,后续不再询问。
3. **本地无设置 → 询问(绝不静默采用全局)。** 当本地 `.smart/settings.json` 不存在(或缺 `knowledges_dir`)时,**不要**静默回退到全局,而是用 `AskUserQuestion` 把选择交给用户。具体提供什么,取决于全局配置是否存在:

   **3a —— 存在全局配置**(`~/.smart/settings.json` 含 `knowledges_dir`,设其原始值为 `G`)。用**一个**问题同时给出「读全局 / 建本地」(header 用 `配置来源`,问题用 `本地没有 .smart/settings.json —— 用全局知识库,还是新建一个本地配置?`):

   | 选项 | 解析为 | 选中后 |
   |------|--------|--------|
   | (推荐) 用全局(`G`) | `G` | 把全局的**原始值**写入本地 `.smart/settings.json` 的 `knowledges_dir` 键(merge-safe:文件不存在则新建,存在则只设这一个键、保留其余)—— 固定本地快照,本项目就此锁定,不再询问 |
   | 本地 · `.smart/knowledges/` | `.smart/knowledges/` | 落盘到本地 `.smart/settings.json` |
   | 本地 · `~/knowledges/md/{date}/` | 当日个人库 | 落盘到本地 `.smart/settings.json` |
   | 其他(本地) | 用户输入的路径 | 落盘到本地 `.smart/settings.json` |

   选「用全局」时**原样**复制 `G` —— 保留 `{date}` 占位符不替换,使其仍是每日模板。因为是快照,日后改 `~/.smart/settings.json` 不影响本项目。

   **3b —— 本地、全局都不存在。** 两者皆无仍要询问(不臆测)—— 直接给出目录选择器(header 用 `目标目录`,问题用 `本地和全局都没有 settings.json —— 提炼出的知识落盘到哪个目录?`):

   | 选项 | 路径 | 含义 |
   |------|------|------|
   | (推荐) | `.smart/knowledges/` | 项目本地知识库,相对当前工作目录 |
   | 个人库 | `~/knowledges/md/{date}/` | 个人当日知识库(向后兼容的旧约定) |
   | 其他 | (自定义) | 用户输入的任意路径 |

   3a/3b 任一选择后,**持久化**解析出的值到本地 `.smart/settings.json`,做法是设置它的 `knowledges_dir` 键 —— **读-改-写**,保留文件中已有的其他键;绝不用单键对象整文件覆盖。让后续运行跳过询问。在 Step 6 报告里说明保存位置,并在写了本地文件时提示:把它移到 `~/.smart/settings.json` 即成为所有项目通用的全局默认。

**路径占位符与归一化**(对任意来源解析出的值都适用):

- `{date}` → 系统注入的今日日期(`YYYY-MM-DD`)。不含 `{date}` 的路径是静态目录(如 `.smart/knowledges`);含 `{date}` 的路径每天重新解析(如 `~/knowledges/md/{date}` → `~/knowledges/md/2026-05-28`)。
- `~` → 用户 home 目录。

**不存在则创建** —— 占位符替换后,若目录(及其父目录)不存在则创建。空目录或新建目录意味着所有提炼出的主题都走新增。

解析完成后,全程以 `<目标目录>` 称之。该路径本次运行固定,不再二次询问或覆盖。

**`settings.json` 格式** —— distill 拥有 `knowledges_dir` 键,用 Read 工具读取。该文件可能被其他键共用,因此务必**读-改-写**、保留不属于自己的键 —— 绝不用单键对象整文件替换。文件缺失或格式错误则静默忽略(按上面的优先级回退):

```json
{ "knowledges_dir": "~/knowledges/md/{date}" }
```

## 把重活交给后台 fork

Step 0 —— 解析 `<目标目录>`(含可能的 `AskUserQuestion`)—— **在主会话内联执行**,因为交互式提问就该留在用户这边。其后的一切(扫描 `<目标目录>`、三态比对、读已有文件、写文件)才是烧 token 的部分,把它交给一个**后台 fork**,让主上下文保持干净、只收到最终总结。

`<目标目录>` 一旦确定,就用 Agent 工具 spawn 一个 fork(`subagent_type: fork`)。fork **继承整段对话**——所以 worker 读得到要蒸馏的会话——而它自己的读取、比对、写入都**不回灌主上下文**,只有最终消息返回。交给它这样一个任务:

> 你是蒸馏 worker,以 fork 身份运行。`<目标目录>` 已解析为 `<已解析路径>` —— 不要重新解析,也不要调用 `AskUserQuestion`。按 distill skill 的**扫描范围铁律**、**已 review 文件豁免**和 **Step 1–6**(都在上文可见)蒸馏你继承到的这段对话。所有读写都限定在 `<目标目录>` 内。自己干活 —— **不要**再委派。只返回 Step 6 的总结报告。

随后把 fork 的总结作为本 skill 的结果转达给用户。若环境不支持 fork(旧版 Claude Code),就直接内联跑 Step 1–6 —— 指令完全一样,只是少了隔离。

下文即 fork 要执行的内容。

## 扫描范围铁律

- ✅ 只与 `<目标目录>` 中**直接位于该层**的文件做三态比对
- ✅ `<目标目录>` 不存在或为空 → 所有提炼出的主题**直接新增**
- ❌ **绝不**扫描 `<目标目录>` 的父目录、兄弟目录或任何子目录
- ❌ **绝不**扫描或改写目标目录之外的任何路径(例如当 `<目标目录>` 为 `~/knowledges/md/{date}/` 时,即绝不触碰其他日期目录或 `backend/`、`frontend/` 等主题归档目录)

目标目录之外的一切都不查询、不修改、不引用作为比对基准。

## 已 review 文件豁免(不参与三态比对)

`<目标目录>` 中,以下两类文件视为**用户已 review 完成、内容定稿**,本 skill **不读取、不比对、不覆盖、不合并**:

| 豁免类型 | 判定规则 | 含义 |
|---------|---------|------|
| `.printed.md` 后缀 | 文件名以 `.printed.md` 结尾(如 `langgraph-checkpointer.printed.md`) | 用户已打印归档 |
| 同名 pdf 伴随 | 同目录下存在与 md **主干名相同**的 pdf(如 `1.md` + `1.pdf`,`langgraph-checkpointer.md` + `langgraph-checkpointer.pdf`) | 用户已导出 PDF,视为 review 完成 |

**执行逻辑**:

1. 在 Step 3 枚举目标目录文件清单前,**先过滤掉**这两类豁免文件,过滤后的清单才参与主题匹配
2. 即使本次 distill 提炼的主题键与被豁免文件的主干名**命中**,也**强制走新增**——用差异化命名(如追加 `-v2`、`-followup`,或加时间短串)落到新文件,绝不修改已豁免文件
3. 在 Step 6 汇总报告中加 `frozen` 段,列出被豁免的文件以及"原本可能命中的主题键",让用户知道为什么没合并

**实现要点**:

- 主干名匹配使用**精确匹配**(`stem(md) == stem(pdf)`,即去掉 `.md`/`.pdf` 后字面相等),不做模糊匹配,避免误判
- `.printed.md` 豁免优先于同名 pdf 豁免;两条都命中只算一次豁免
- `.printed.md` 自带豁免,不需要它再额外配套同名 pdf

**伪代码**:

```python
from pathlib import Path
from glob import glob

def list_target_files(target_dir: str) -> tuple[list[str], list[str]]:
    """返回 (active, frozen):active 参与三态比对,frozen 跳过。"""
    all_md = glob(f"{target_dir}/*.md")
    pdf_stems = {Path(p).stem for p in glob(f"{target_dir}/*.pdf")}
    active, frozen = [], []
    for md in all_md:
        name = Path(md).name
        stem = Path(md).stem  # 去掉 .md 的主干名(包含可能的 .printed 中缀)
        if name.endswith(".printed.md") or stem in pdf_stems:
            frozen.append(md)
        else:
            active.append(md)
    return active, frozen
```

## 触发后的执行流程

### Step 1 — 圈定会话提炼范围

默认范围:**本次 CC 会话从启动到触发本 skill 之间**的所有用户消息与助手消息。用户可显式收窄:

- "distill 最近 5 轮" → 只取末尾 5 个 Q/A 对
- "distill 关于 langgraph 的部分" → 主题词过滤,只保留命中的轮次
- "distill 从我问 reasoning_content 开始" → 锚点截断

不要把 system reminder、tool call 原始 JSON、命令行 stdout 当作"对话内容"——它们是噪音,要剥离。

### Step 2 — 价值判定(决定哪些轮次值得落盘)

逐个轮次过一遍,只保留满足**至少一条**价值标准的内容:

1. **概念解释**:Claude 输出了新概念的定义、schema、字段表
2. **代码示例**:出现了可复用的代码片段(>3 行 或 含关键 API 调用)
3. **坑/Why**:用户报错 + Claude 解释根因,或 Claude 主动指出"这里容易踩坑因为..."
4. **决策推理**:多方案对比、A/B 权衡、选型理由
5. **用户的非显然提问**:问题本身蕴含上下文(比如"为什么 reasoning_content 不在 content 里" — 提问本身就是知识入口)

**直接丢弃**的轮次:

- 寒暄("你好"/"在吗"/"好的")
- 纯命令执行("ls 一下"/"运行测试")没有解释
- 已被后续修正的错误尝试(保留修正后的最终结论)
- 用户对工具调用结果的简短确认("收到"/"好")

判断不准时倾向保留,在汇总报告里标 "kept-uncertain"。

详细判定见 `references/topic-clustering.md`。

### Step 3 — 主题聚类与主题键生成

把保留下来的轮次按语义聚成若干主题簇。一次会话可能产出 0~N 个主题。

**主题键规则**:

- 提取主名词短语 → kebab-case
- 长度建议 2~5 个词,如 `langgraph-checkpointer`、`reasoning-content-vs-content`、`bge-m3-embedding-dim`
- 避免泛词单独成键(`python-tips` ❌,`python-asyncio-gather-bug` ✓)
- 若多轮聚焦同一对象但视角不同(schema vs 用法),合成一个主题还是拆开?见 `references/topic-clustering.md` 的"切片边界"

聚类完成后,与 `<目标目录>` 的**已过滤清单**(按"已 review 文件豁免"规则剔除 `.printed.md` 与有同名 pdf 的 md)做文件名模糊匹配(去 `-schema` `-mechanism` `-bug` 等后缀),命中即进入差分判定。

若聚类得到的主题键与被**豁免**的文件主干名命中,记录到 frozen 报告并以差异化命名落新文件(如 `<键>-v2.md`),不要修改豁免文件本体。

### Step 4 — 三态判定

| 状态 | 判定标准 | 操作 |
|------|---------|------|
| **重复** | 本次会话提炼出的主题完全被 `<目标目录>` 已有文件覆盖(无新事实/代码/坑) | 跳过,仅在汇总报告中列出 |
| **新增** | `<目标目录>` 无对应主题文件(或命中豁免被强制改走新增) | 在 `<目标目录>/<主题键>.md` 创建新文件 |
| **差分** | 主题已存在,但本次会话补充了新示例/字段/坑 | 用 Edit 把**新增部分**追加到已有文件,原内容不动 |

详细判定算法、语义等价规则、Case A~F 边界处理,见 `references/diff-rules.md`。

### Step 5 — 格式化与写入

每个主题文件按以下模板组织:

```markdown
# <主题>

## 触发提问
<把用户的原始提问引用块保留,多轮用空行分隔>

## 关键结论
<从 Claude 输出中抽取核心答案,3~5 个 bullet>

## Schema / 字段表
<若涉及数据结构,见 references/format-spec.md>

## 代码示例
<带语言标识的代码块>

## 坑 / Why
<报错根因、A/B 对比、避坑要点>

## 关联
<指向同目录其他主题的链接,如 [[reasoning-content-vs-content]]>
```

字段命名、代码块语言标识、Why/How 段落、来源标注、删除许可清单,全部规范参见 `references/format-spec.md`。

差分合并用 Edit `old_string`/`new_string` 增量追加;新增用 Write 整文件落盘。

### Step 6 — 输出汇总报告

执行结束在对话中输出简表(不写文件):

```
范围: 本次会话 (24 轮) → .smart/knowledges/
保留: 18 轮  丢弃: 6 轮(寒暄/重复)
主题聚类: 4 个
目标目录文件: 6 个 (active 4, frozen 2)
─ 新增(new): 3  ─ 差分(merge): 1  ─ 重复(skip): 0  ─ 命中冻结(frozen-hit): 0
新落盘文件:
  + langgraph-stream-modes.md
  + interrupt-vs-breakpoint.md
  + reasoning-content-parsing.md
被合并文件:
  ↻ checkpointer-vs-store.md  (+1 段:跨 thread 隔离)
被豁免文件(frozen, 跳过比对):
  · ai-message-schema.printed.md          (.printed.md 后缀)
  · langgraph-checkpointer.md + .pdf      (同名 pdf 伴随)
```

`frozen-hit` 是本次聚类的主题键命中了豁免文件主干名却被强制改走新增的次数;为 0 说明无冲突。

## 不删内容护栏(必读)

唯一允许删除的内容类型:

- 寒暄、连续 3+ 空行、单字符语气词独立段、明显的打字残稿、被后续完整覆盖的半句话
- system reminder、hook 输出、tool 原始 JSON(噪音)
- 与文档主题完全无关的待办(应转移而非删)

**永远不删**:代码片段、报错信息、数据/数字、表格、示例、命令行输出、用户推理过程(即使被推翻——推翻过程本身是知识)。

特别注意:**用户的原始提问** 即使措辞不正式也要在「触发提问」段落里**完整保留主干**——它常常是检索召回的最佳锚点。

判断不准时默认保留,并在汇总报告里标注 `kept-uncertain`。

## 目标目录的硬约束

落盘目录由 Step 0 解析确定,是本次运行的唯一真相源。所有读写都限定在 `<目标目录>` 内,本 skill 绝不向上回溯到父目录或横向进入兄弟目录。当 `<目标目录>` 为个人当日知识库(`~/knowledges/md/{date}/`)时,其日期在解析时即固定,之后不可被覆盖——与全局 AGENTS.md / CLAUDE.md 约定一致。

## 附加资源

- **`references/topic-clustering.md`** — 主题聚类边界、价值判定细则、主题键命名规则
- **`references/diff-rules.md`** — 三态判定(重复/新增/差分)细则、语义等价规则、6 种边界 case 处理
- **`references/format-spec.md`** — 知识文件格式规范(标题层级、触发提问/关键结论段、代码块、字段表、Why/How、来源标注、删除许可清单)


---

# 参考文档：diff-rules

# 三态判定细则(distill 专属)

本文件描述 distill 在 Step 4 把**会话提炼出的主题簇**与 **`<目标目录>` 已有知识文件**做三态比对(重复/新增/差分)的判定规则。

## 总原则

三态判定一旦出错有两类损失:

- 误判为「重复」→ 信息丢失(本次对话里的新事实/坑没沉淀进知识库)
- 误判为「新增」→ 知识库出现重复主题文件(后续 RAG 召回噪音)

**判错时倾向于「差分」**:差分操作只追加不覆盖,是安全的;重复和新增都有不可逆副作用。

## 扫描范围铁律

- ✅ 扫:`<目标目录>` 中**直接位于该层**的文件
- ❌ 不扫:`<目标目录>` 的父目录、兄弟目录或任何子目录
- ❌ 不扫:目标目录之外的任何路径(例如当 `<目标目录>` 为个人当日库时,即其他日期目录,以及 `backend/`、`frontend/`、`ai-agent/`、`tools/` 等主题归档目录)
- ❌ 不读:被「已 review 文件豁免」规则排除的文件(`.printed.md` 与有同名 pdf 的 md)

目标目录之外的一切与豁免文件都不查询、不修改、不作为比对基准。`<目标目录>` 不存在或经豁免过滤后为空 → 所有主题簇直接新增,跳过三态判定。

## Step 1 — 主题键对齐

对会话提炼出的主题键 `S_key` 与 `<目标目录>` 中已有文件(已过滤豁免)`K_file`,先建立主题对齐。

### 主题键来源

distill 的主题键由**对话语义聚类**生成(详见 `topic-clustering.md`),典型形态:

| 主题键示例 | 说明 |
|-----------|------|
| `langgraph-checkpointer-sqlite` | 库 + 概念 + 实现 |
| `reasoning-content-vs-content` | 字段对比 |
| `bge-m3-embedding-dim-mismatch` | bug 特征词 |

### 模糊匹配

已有文件命名通常带后缀如 `-schema`、`-mechanism`、`-vs-`、`-quirks`、`-bug`,对齐时**先去后缀再匹配主干**:

```
主题键:    interrupt-control
K 文件:    hitl-interrupt-mechanism.md   → 匹配(主干 hitl-interrupt 与 interrupt-control 重合度高)

主题键:    stream-modes
K 文件:    langgraph-stream-chunks.md    → 匹配(主干 stream-chunks/stream-modes 同义)

主题键:    new-totally-unique-thing
K 文件:    (无命中)                      → 进入 Step 2 新增判定
```

匹配判据:去掉常见后缀后,两边主干**至少 60% token 重合或含等价同义词**(如 `chunks` ↔ `modes`)。判不准倾向不匹配,走新增。

未命中任何 K → Step 2 新增判定;命中某 K → Step 3 重复 vs 差分判定。

## Step 2 — 新增判定

主题键在 `<目标目录>` 无命中(且未与豁免文件主干名冲突)→ 标记为新增。

写入路径:`<目标目录>/<主题键>.md`,内容按 `format-spec.md` 的模板组织(必含「触发提问」「关键结论」段)。

若主题键命中**豁免文件**主干名,改用差异化命名(如追加 `-v2`、`-followup`、`-cont`)落到新文件,并在汇总报告记录 `frozen-hit`。

## Step 3 — 重复 vs 差分判定

主题对齐到某个 K 文件后,提取双方的「信息点集合」做比对。

### 信息点的定义

distill 语境下,一个信息点 = 一条独立、可被引用的事实/经验,典型类型:

- **概念定义**:某术语的一句话定义或 schema
- **schema 字段**:字段名 + 类型 + 语义
- **代码示例**:一段可运行片段及其触发场景
- **bug 三元组**:现象 + 根因 + 修复
- **Why/How 经验**:一条规则 + 它成立的原因 + 应用边界
- **数字结论**:`σ=0`、`token 节省 26.7%` 等量化结果
- **用户原始提问**:即提问本身(distill 独有的信息点类型,作为召回锚点)

不算信息点:

- 泛泛的"我学到了 X"叙述
- 已被同次对话其他段落完整覆盖的复述
- 寒暄/确认/转折连接词

### 比对算法

```python
S_points = extract_from_conversation(theme_cluster)   # 从对话簇提取
K_points = extract_from_file(K_file)                  # 从已有文件提取
new_points = S_points - K_points                       # 集合差(语义等价去重后)

if not new_points:
    state = "重复"   # skip,仅在报告中列出
else:
    state = "差分"   # merge new_points 到 K
```

差分判定时**禁止丢失 new_points 中任何元素**,即使是一句小注释。

### 等价判断

判断信息点是否相等使用「语义等价」而非字符相等:

| S(对话中) | K(已有文件) | 是否等价 |
|---------|---------------|---------|
| `tool_calls 是 list[dict]` | `tool_calls: list[ToolCall]` | 等价(类型同义) |
| `interrupt 抛 GraphInterrupt` | `interrupt() raises GraphInterrupt` | 等价 |
| `MemorySaver 用于内存 checkpoint` | `MemorySaver 适合开发期,生产用 SqliteSaver` | **不等价**,S 是 K 的子集,仍属重复 |
| `第3次调用 tool 时漂移` | `key drift on retry` | 等价(同一现象) |

不确定等价时倾向判为不等价,进入差分流程。

## 「触发提问」段的特殊处理(distill 独有)

distill 的每个新增文件含 `## 触发提问` 段,记录用户原始提问。差分合并时**不要**把本次提问替换或覆盖 K 中原有提问,而是:

- 若主题完全相同,追加新提问到原有引用块后,用空行隔开:
  ```markdown
  ## 触发提问

  > 原有提问(之前会话留下)

  > 本次新提问(本次会话补充) <!-- from: chat 2026-05-13 14:32 -->
  ```
- 多条提问累积体现该主题的"用户视角演进",对 RAG 召回是加分项,不是噪音

## 边界 case

### Case A:对话精炼版优于 K 中表述

会话产出的某结论 = K 已有内容的子集 + 更精炼的表达。

处理:判为差分,把精炼版作为「另一种表述」段追加到 K,**不删除** K 原文:

```markdown
## 另一种表述 <!-- from: chat 2026-05-13 14:32 -->
<对话中提炼出的精炼版>
```

### Case B:对话推翻 K 的某结论

会话中出现新证据,推翻 K 中某条结论。

处理:判为差分,**保留 K 原结论**,追加修正段:

```markdown
## 修正 <!-- from: chat 2026-05-13 14:32 -->
原结论: "<K 中原话>"
新证据: <对话中的新事实>
当前判断: <新结论>
Why: <为什么之前判断错了>
```

绝不直接改写 K 中原结论——推翻过程本身是元知识。

### Case C:一次会话聚出多主题

一次对话产出 N 个主题簇,每簇独立走三态判定。可能出现「2 个差分到现有 K + 3 个新增 + 1 个重复 skip」的混合结果。

切片由 `topic-clustering.md` 的"多主题混合的会话切片"规则负责。

### Case D:对话主题疑似在目标目录之外已存在(不查询)

目标目录之外的路径(其他日期或主题归档目录)可能有同主题文件,但本 skill **不去查询**——一律视为「目标目录内无此主题」走新增。

理由:

1. 目标目录之外是用户资产,跨目录改写有破坏历史索引风险
2. 用户跨目录复盘可用 grep / RAG 自行串联,比 skill 自动跨目录合并更可控
3. 目标目录内新增的 `<主题键>.md` 与目录外可能撞名——允许,两份独立存在不冲突

如果用户**明确要求**合并到目录外的某文件(如"把这个合并到 `~/knowledges/md/backend/fastapi/xxx.md`"),才走 Edit 增量追加;否则不主动跨目录。

### Case E:双方都不完整

会话与 K 各有部分信息,且都不完整。

处理:判为差分,把会话中 K 没有的部分追加到 K。会话本身没有"源文件"可改(distill 输入是上下文),所以不存在反向修改问题。

### Case F:命中豁免文件

主题键去后缀后与某个豁免文件(`.printed.md` 或有同名 pdf)主干名相同。

处理:**不进入 Step 3**,直接走 Step 2 新增,但用差异化命名(`-v2` / `-followup`),并在报告标记 `frozen-hit`。豁免文件本体不读取、不修改。

## 报告格式

每次执行后输出一段汇总到对话(不写文件),模板:

```
范围: 本次会话 (N 轮) → <目标目录>
保留: M 轮  丢弃: K 轮(寒暄/重复)
主题聚类: T 个
目标目录文件: F 个 (active A, frozen Z)
─ 新增(new): N1  ─ 差分(merge): N2  ─ 重复(skip): N3  ─ 命中冻结(frozen-hit): N4

新落盘文件:
  + <new_file_1>.md
  + ...

被合并文件:
  ↻ <existing_file>.md  (+P 段, +Q 字段)

重复(skip):
  · <主题键> → <existing_file>

命中冻结(强制新增):
  ⊘ <主题键> → 命中 frozen 文件 <stem>,改写为 <主题键>-v2.md

被豁免文件(frozen, 跳过比对):
  · <file>.printed.md           (.printed.md 后缀)
  · <file>.md + .pdf            (同名 pdf 伴随)

不确定(保留原文):
  ? <主题键>:<信息点摘要>
```


---

# 参考文档：format-spec

# distill 知识文件格式规范

本文档完整描述 distill 落盘文件的格式规范,自给自足,不依赖外部 skill。

## 标题层级

唯一 H1 = 主题名(与文件名主干一致)。
H2 = 内容分区,固定候选集,按需出现,顺序如下:

```markdown
# <主题>

## 触发提问          # distill 特有,放最前
## 关键结论          # distill 必出现
## 概念              # 一句话定义 + 必要时 2-3 句扩展
## Schema            # 数据结构(TypedDict / Pydantic / dataclass / dict)
## 字段表            # markdown 表格描述 schema 各字段
## 代码示例          # Python / bash / curl / repl 输出
## 坑 / Why          # 踩坑经验、Why 推理
## 关联              # 相关知识文件链接
```

非候选集中的 H2 一律降级为 H3(嵌入相关 H2 下)或合并。
H2 内容为空时,**整段删除**——不允许出现空 H2 占位符。

## 「触发提问」段(distill 独有)

这是 distill 区别于其他知识落盘工具的关键段落,必须出现在 `# <主题>` 之后、其他 H2 之前。

### 内容来源

- 取该主题簇内**最具体、信息量最大**的那一轮用户提问作为主提问
- 若多轮提问递进(从泛到精),只取最后一轮精确提问
- 用户原话即使措辞不正式也要保留主干,可做轻度清洗:
  - 删除明显口误重复("我我想问")
  - **保留**所有专有名词、关键参数、错误信息

### 格式

```markdown
## 触发提问

> reasoning_content 和 content 为什么是两个字段?能不能合并?
> 我在解析的时候 parser 直接拿 content 拿不到思考过程。

(可选,2~3 行的"提问背景":用户当时在做什么、上下文)
```

- 使用 markdown 引用块 `>` 包裹原始提问
- 多轮拼接用空行分隔,不要合并成一段
- 不要加"用户问:"这种冗余前缀

### 反例

❌ 不要写成转述:

```markdown
## 触发提问

用户想了解 reasoning_content 和 content 的区别。
```

转述会丢失检索锚点。原话保留才能在 RAG 召回时匹配未来类似提问。

## 「关键结论」段(distill 必出现)

- 用 3~5 个 bullet 罗列从 Claude 输出中抽出的核心答案
- 每个 bullet 一行,不超过 30 字
- bullet 间无序,不嵌套
- 若答案本质是代码,这段可仅写一句"见代码示例"指向

例:

```markdown
## 关键结论

- `reasoning_content` 在 `additional_kwargs` 里,不在 `content` 字段
- DeepSeek `v4-flash` 思考模式默认关,需 `reasoning_effort="high"` 触发
- LangChain `AIMessage` parser 读不到思考过程,要自己从 raw response 抠
```

## 代码块

所有代码块必须带语言标识。常见取值:

| 内容 | 标识 |
|------|------|
| Python | `python` |
| 命令行 | `bash` |
| JSON | `json` |
| 表/伪代码 | `text` |
| 报错堆栈 | `text` 或 `traceback` |

无语言标识的代码块需补全;判断不出语言时用 `text`。

## 字段表规范

凡涉及 schema 字段说明,统一用 markdown 表格:

```markdown
| 字段 | 类型 | 必选 | 语义 | 示例 |
|------|------|------|------|------|
| `id` | `str` | ✓ | 唯一标识 | `"msg_abc"` |
| `tool_calls` | `list[dict] \| None` | ✗ | 工具调用列表,无则为 None | `[{...}]` |
```

字段名用 inline code 包裹。类型用 Python type hint 风格。可选性用 `✓`/`✗`。

## Why / How 三段式

经验类沉淀(规则、避坑、判断)使用三段式:

```markdown
**结论**:<一句话规则或事实>

**Why**:<为什么这条规则成立——理由、机制、过去的事故>

**How to apply**:<什么时候触发、怎么应用、边界条件>
```

三段缺一不可。结论必须可独立引用,Why/How 必须解释结论的成立条件。

## 来源标注

### 段级标注(差分合并追加新段时)

```markdown
## <新段标题> <!-- from: chat 2026-05-13 14:32 (round #18) -->
```

- 时间戳精确到分钟
- `round #N` 是会话内轮次编号(只数用户消息,从 1 起)
- 不易确定具体轮次时允许只写时间:`<!-- from: chat 2026-05-13 14:32 -->`

HTML 注释形式,渲染不可见但 grep 可查。

### 文末来源段(新增整文件时)

```markdown
---
来源: distill from CC 会话
日期: 2026-05-13
覆盖轮次: round #15 - #21
```

`覆盖轮次` 可选,建议写——帮助未来回溯。

## 表格优先于段落叙述

遇到「A vs B」「多个备选方案对比」「字段含义解释」时,**优先用表格不用段落**。表格是高密度信息的最短路径。

## 链接关联

文末 `## 关联` 段使用相对路径链接:

```markdown
## 关联

- [hitl-interrupt-mechanism.md](./hitl-interrupt-mechanism.md) — interrupt 续跑机制
- [reasoning-content-vs-content.md](./reasoning-content-vs-content.md) — DeepSeek 思考字段分离
```

跨目录链接(用户显式要求时)用 `../<目录>/<文件>.md`。链接锚文本必须含一句话说明,避免裸链接。

也可用 wiki 链接形式标注未来主题:`[[bge-m3-embedding-tuning]]` — 即使该文件尚未创建,也可标记"该主题值得后续 distill"。

## 文件命名

- 全小写 kebab-case:`reasoning-content-parsing.md`
- 不含日期/版本号:主题键即检索 query,日期归属于目录路径或差分合并的来源标注,不进文件名
- 不含动词:用名词短语
- 末尾不加 `-notes` `-draft`:knowledges 都是成品

豁免相关的特殊命名:

- `*.printed.md` 是用户手动标记"已 review 打印",distill **不创建**这类文件,只识别它们做豁免
- `<键>-v2.md` / `<键>-followup.md` 是 distill 在命中豁免文件时使用的差异化命名

## 删除许可清单

仅以下内容允许删除:

| 可删 | 原因 |
|------|------|
| 连续 3+ 空行 | 排版噪音 |
| 单字符语气词独立段("嗯。" "好。") | 无信息 |
| 半句被下文完整覆盖的打字残稿 | 显式重写 |
| 与文档主题完全无关的待办(应转移而非删) | 跑题 |
| 空 H2(无内容标题占位) | 排版 |
| system reminder / hook 输出 / tool 原始 JSON | 噪音 |

**禁删**:

- 任何代码(即使看起来像草稿)
- 任何数字 / 数据 / 量化结论
- 任何报错堆栈
- 任何被推翻的推理(推翻过程是元知识)
- 任何用户写下的"猜测/直觉"标注
- 任何用户原始提问的主干(即使措辞不正式)

判不准时默认保留,在汇总报告标 `kept-uncertain`。


---

# 参考文档：topic-clustering

# 主题聚类与价值判定细则

本文档为 distill skill 的 Step 2、Step 3 提供详细执行规则。

## 价值判定细则

### 一定要保留的内容

1. **新概念引入**
   - 用户问"X 是什么"且 Claude 给出定义/schema/字段表
   - Claude 主动引入未在前文出现过的术语并解释

2. **代码片段**(满足任一)
   - 行数 >3 行
   - 含关键 API 调用(`STORE.put`、`graph.invoke`、`embeddings.embed_query` 等)
   - 含非显然的参数(`reasoning_effort="high"`、`thinking={"type": "enabled"}`)
   - 含数据结构定义(TypedDict / Pydantic / dataclass)

3. **报错-根因对**
   - 用户贴出 traceback / 错误现象
   - Claude 给出根因分析(不是"试试这个"而是"因为 X 所以 Y")

4. **A/B 决策**
   - 多方案对比表
   - "为什么不选 A 选 B"的推理段
   - 性能数字对比(σ、token、延迟)

5. **用户表达的偏好/约束**
   - "我希望以后..."
   - "在这个项目里我们用..."
   - 用户纠正 Claude 的尝试("不要这样,应该...")

### 一定要丢弃的内容

- 寒暄(`你好` / `在吗` / `好的` / `继续`)
- 工具调用结果的简短确认(`收到` / `好` / `知道了`)
- 已被后续修正的错误尝试(只保留修正后的最终版本)
- 纯命令执行无解释(`ls 一下` / `运行 pytest`)
- 重复确认已有结论的轮次("再说一下 X" 但 Claude 复述已存在的内容)
- system reminder / hook 输出 / 工具原始 JSON

### 灰区(倾向保留,标 kept-uncertain)

- 半成品代码(用户写一半被打断)
- 异常但未追到根因的报错
- 多轮反复横跳的讨论(可能后续会沉淀)

## 主题聚类规则

### 聚类的颗粒度

**一个主题文件 = 一个可被独立检索的知识点**。判断标准:

- 给这个主题起一个 kebab-case 文件名,是否能准确召回内容?
- 半年后用户搜这个文件名,是否能找到他想要的内容?

### 切片边界(关键决策)

当多轮对话涉及"看起来相关但视角不同"的内容,要不要拆?

| 情况 | 决策 | 例子 |
|------|------|------|
| 同对象同视角 | 合并 | `AIMessage 的 tool_calls 字段`(多轮深入同一字段)→ 一个文件 |
| 同对象不同视角 | 拆分 | `AIMessage schema` vs `AIMessage.additional_kwargs 的 reasoning 解析` → 两个文件 |
| 不同对象同主题 | 合并 | `interrupt 用法` 和 `Command 用法`(都是 HITL 控制流)→ 一个文件 `hitl-control-primitives` |
| 同对象同视角但有 bug 经验 | 拆分 | `bge-m3 embedding 基础` vs `bge-m3 维度不匹配 bug` → 两个文件 |

**优先拆分**:文件粒度细更利于 RAG 召回精度。除非两段内容互相强依赖(脱离其一另一个不成立),否则倾向拆。

### 主题键命名规则

**目标**:文件名本身就是检索 query。

**好的命名**:

| 命名 | 为什么好 |
|------|---------|
| `langgraph-checkpointer-sqlite` | 库名 + 概念 + 实现 → 精确 |
| `reasoning-content-vs-content` | 对比关系明显,易召回 |
| `bge-m3-embedding-dim-mismatch` | 含 bug 特征词,定位错误 |
| `arq-worker-graceful-shutdown` | 库 + 行为 + 状态,精准 |

**坏的命名**:

| 命名 | 问题 |
|------|------|
| `langgraph-tips` | 泛词,无法定位 |
| `embedding-notes` | "notes" 是无效词 |
| `bug-fix-1` | 编号无信息量 |
| `general-stuff` | 灾难 |

### 命名长度

- 2~5 个 kebab 段为佳
- 超过 6 段说明应该拆成多个主题
- 单段词只在专有名词时允许(`langgraph.md` 除非真的是 langgraph 总览,否则别用)

### 与已有文件的匹配

聚类完成后,把每个主题键与 `<目标目录>` 已有文件名做模糊匹配:

- 去掉后缀 `-schema` / `-mechanism` / `-bug` / `-error` 后比较
- 若主词(前 2~3 段)完全一致 → 判为同主题,走差分判定
- 若主词部分重合(如 `langgraph-stream-modes` vs `langgraph-checkpointer`)→ 不同主题,新增

## 多主题混合的会话切片

一次会话可能横跨多个不相关主题(用户在调 langgraph 时顺便问了 docker)。

**做法**:

1. 按时间顺序扫描保留下来的轮次
2. 每轮打"主题候选标签"
3. 相邻轮次标签相同/相关 → 合并为同一簇
4. 标签跳变(从 langgraph 跳到 docker)→ 起新簇
5. 跳变后若再次回到原主题,**不合并回去**——按"二次出现"独立处理,合并阶段再决定

避免一种错误:把整个会话当作一个主题强行命名为 `2026-05-13-session.md`。这违反了"主题键 = 检索 query"原则。
