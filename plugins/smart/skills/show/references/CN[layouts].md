# 版式配方

三个配方。每页只选一个；配方固定 section 顺序，让同类页面每次读起来都一样。本文引用的组件（`tiles`、`badge`、`callout`、`details`、`grid2`、`panel`、`options`/`opt`、`check`、`tablewrap`）都已在 `assets/template.html` 中定义样式——类名原样使用。

所有配方的共享规则：

- 页面是灰色画布上的白色卡片：**每个顶层 section 包在 `<section id="sec-N">` 里**——模板把 `section` 样式化为卡片。卡片之外不放任何内容。
- 每个 `h2` 以编号章开头并有对应目录项：`<h2><span class="num">N</span> 标题</h2>`；页面较长时 `h3` 可加 `l2` 目录子项。
- 读者应在第一屏就拿到结论：任何细节之前，先给 `tiles` 指标条和/或陈述结论的 `callout`。
- 超过约 30 行且属于*佐证材料*的内容（完整代码清单、长表格、原始数据）放进 `<details>`——结构可见、深度可选。
- 图只用内联 SVG。保持简单：`<rect>` 盒子 + `<line>`/`<path>` 箭头 + `<text>` 标签，用 `currentColor` 并克制地使用 CSS 变量的色值，使其在暗色模式下也合理。

---

## 配方：`plan-review`

**适用：** 实现方案、提案、设计——一切等待人类拍板（go/no-go）的东西。

Section 顺序：

1. **结论条** —— `tiles`：影响范围（文件/模块数）、预估工作量、按等级统计的风险数、未决问题数。
2. **目标与非目标** —— `grid2` 双栏：`panel good` 列目标，素色 `panel` 列明确的非目标（避免日后扯范围）。
3. **方案设计** —— 设计本体。曾考虑多个备选时，渲染为 `options` 卡片——每个备选一张 `opt` 卡、带 `pro`/`con` 行，选定项标 `opt chosen` 并加 `tag` 徽章——后接一个 `callout` 陈述决策及理由。这里并排优于散文：读者应一眼看到被否方案和它们的致命伤。
4. **架构/数据流** —— 方案改变结构或数据流时给一张内联 SVG `figure`；没改就跳过。
5. **风险矩阵** —— `tablewrap` 表格：风险 · `badge` 等级 · 影响 · 缓解。按高→低排序。
6. **里程碑/任务分解** —— 有序列表；每个里程碑的长任务细节折进 `<details>`。
7. **未决问题** —— 每个阻塞拍板的问题一个 `callout warn`。这个 section 是人类读这页的原因；绝不埋没。
8. **验收清单** —— `ul.check`：什么叫"完成"，只列可验证项。

## 配方：`explainer`

**适用：** 解释既有系统、模块或流程如何运作。

Section 顺序：

1. **是什么、在哪里** —— `tiles`：入口、关键文件、外部依赖。
2. **心智模型** —— 一个 `callout`，装下同事在白板前会讲的那一段话。
3. **架构图** —— 内联 SVG `figure`；盒子是组件，箭头是调用/数据。这是本配方的核心——在这里下功夫。
4. **端到端走查** —— 沿一条代表性请求/调用从头走到尾，每一跳一个 `h3`。代码摘录用 `pre`，只留关键行；完整清单折进 `<details>`。
5. **边界与坑** —— 每条一个 `callout warn`/`risk`；这些是读者改代码时会踩的。
6. **想改什么、动哪里** —— `tablewrap` 表格："如果你想…… · 动这些文件"。

## 配方：`report`

**适用：** 研究总结、分析、对比、长文档——前两个配方都不合适时的安全默认。

Section 顺序：

1. **TL;DR** —— 结论 `callout` + 核心数字/事实的 `tiles` 条。
2. **正文 sections** —— 文件模式镜像源文档自身结构；对话模式按交付物的自然论证顺序。套用共享规则：佐证折叠、严重度打徽章、可枚举事实进表格。
3. **对比** —— A/B 选项用 `grid2` 面板；3 个以上按共享标准对比时用 `tablewrap` 表格。
4. **局限/未尽事项** —— 分析*没有*覆盖什么；`callout warn` 条目。
5. **来源** —— 文件模式给源路径；对话模式列会话中引用的 URL/文件。

---

## 可选：纯 CSS tab

仅当并排（`grid2`）确实放不下时使用——例如同一产物的 3 个以上全宽变体。radio-hack 方案；实例 CSS 跟随实例走，不进模板：

```html
<div class="tabs">
  <style>
    .tabs input{display:none}
    .tabs label{display:inline-block;padding:6px 14px;cursor:pointer;
      border:1px solid var(--line);border-bottom:none;border-radius:8px 8px 0 0;
      color:var(--muted);font-size:13px;font-weight:600}
    .tabs input:checked+label{color:var(--fg);background:var(--accent-soft)}
    .tabs .tabpanel{display:none;border:1px solid var(--line);border-radius:0 8px 8px 8px;padding:14px}
    #tab-a:checked~.tabpanel.a, #tab-b:checked~.tabpanel.b{display:block}
  </style>
  <input type="radio" name="tabs-1" id="tab-a" checked><label for="tab-a">变体 A</label>
  <input type="radio" name="tabs-1" id="tab-b"><label for="tab-b">变体 B</label>
  <div class="tabpanel a">…</div>
  <div class="tabpanel b">…</div>
</div>
```

每个 tab 组用唯一的 radio `name` 和唯一 id，并同步扩展 `#tab-x:checked~.tabpanel.x` 选择器列表。依然零 JavaScript。
