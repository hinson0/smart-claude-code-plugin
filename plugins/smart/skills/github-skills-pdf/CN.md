---
name: github-skills-pdf
description: 将固定版本的 GitHub skills 仓库制作为经验证的 A4 手册，英文原文在上、简体中文译文在下。
disable-model-invocation: true
argument-hint: "<仓库或 URL> [--notes 2|4] —— --notes 在每章后插入 1 张或 2 张笔记纸对应的空白页，留空不插入；须在构建前决定"
---

# GitHub Skills 双语 PDF

把一个 GitHub skills 仓库制作成可复现、可核对的英中双语学习手册。

## 调用方式

- Codex：`$smart:github-skills-pdf`
- Claude Code：`/smart:github-skills-pdf`

## 固定范围

1. 使用宿主提供的 GitHub 能力读取仓库；需要完整文件树时再 clone。
2. 记录仓库、默认分支、完整 commit、版本、许可证和构建日期。不要直接引用会移动的
   `main`。
3. 结合插件 manifest、README 的正式命令清单和 `skills/*/SKILL.md` 确定收录范围。
   不把示例、测试 fixture 或废弃目录计为正式 skill。
4. 一个 skill 的正文不只是 `SKILL.md`。许多 skill 把格式说明、模板和深入材料拆到同
   目录的独立 Markdown（如 `MISSION-FORMAT.md`、`mocking.md`、`DEEPENING.md`），
   并在 `SKILL.md` 里用 `@FILE.md` 或相对链接引用。这些文件与 `SKILL.md` 同等重要，
   漏掉会让书里的引用全部断链，所以逐个 skill 目录列全 Markdown：

   ```bash
   find <clone>/skills -name '*.md' | sort
   ```

   每个非 `SKILL.md` 的 Markdown 要么进 `book.json` 的 `references`，要么进
   `skip_references` 并说明理由。构建脚本会重新扫描目录，未做处理的直接报错。
5. 缺少 `SKILL.md`、版本依据或许可证时明确报告；不要猜。

## 判定语种模式

先看源文件本身是什么语种，再决定出双语还是单语：

- **源为英文** → 双语模式（默认）。英文原文在上、简体中文译文在下，逐块同构。
- **源已是中文**（或其他单一语种）→ 单语模式。此时没有原文/译文之分，硬凑一份
  “译文”只会让书里同一段话重复两遍。在 `book.json` 根级写 `"monolingual": true`，
  正文只排一路；目录、书签、页眉页码、固定源码链接、参考文档收录和 `--notes`
  笔记页全部照旧。

两种模式的字段差异见 [book-format.md](references/book-format.md) 的「单语项目」一节。
拿不准时先读几个源文件确认语种，不要靠仓库名或 README 猜。

## 准备项目

1. 在当前任务工作区创建独立项目目录，不在本 skill 目录写生成物。
2. 完整阅读 [book-format.md](references/book-format.md)，创建 `book.json`、导言和
   附录；双语模式下还要逐 skill 出译文。
3. 双语模式下完整阅读 [translation-guide.md](references/translation-guide.md)，
   逐块翻译。参考文档与 `SKILL.md` 同标准：同样出译文、同样逐块同构。
   单语模式跳过这一步。
4. 可按互不重叠的 skills 分批交给子代理；派活时把该 skill 的参考文档一并交给同一个
   子代理，避免它只看 `SKILL.md` 就以为翻完了。主代理必须重新读取译文并运行结构
   校验，不把子代理摘要当作完成证据。

## 构建

先校验，再生成：

```bash
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --check
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --output <output.pdf>
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --output <output.pdf> --notes 2
```

用户可直接写 `$smart:github-skills-pdf --notes 2` 或 `$smart:github-skills-pdf --notes 4`；省略
`--notes` 时不插入笔记页。

从本 `SKILL.md` 所在目录解析 `<this-skill-directory>`，不要按用户当前工作目录猜测
`scripts/` 的位置。

双语模式下构建脚本要求 source 与 translation 的标题、段落、列表、表格和代码块逐块
同构。任何配对失败都先修译文，不降低校验强度。单语模式没有译文可配，此项自动跳过，
`--check` 的输出会写“已读取”而非“已配对”。

默认版式固定为：

- A4 单栏；
- 小节标题为 `English 中文`，下方细分隔线；单语模式下只排一行；
- 英文原文在上，中文翻译紧随其后；单语模式下只排一路；
- 行内代码使用浅灰底；
- 每个 skill 独立成章，并保留固定 commit 的源码链接；
- 参考文档接在该 skill 正文之后，作为章内小节，各自带 `REFERENCE 参考文档 · <文件名>`
  标签和自己的固定源码链接，不另起一章；
- 正文里指向同仓库其他文件的相对链接自动补全为固定 commit 的源码地址；页内锚点
  （`#anchor`）在 PDF 中无对应目标，降级为不可点击的强调文本；
- 自动生成目录、PDF 书签、页眉和页码。
- 如用户需要读书笔记，在构建命令后加 `--notes 2` 或 `--notes 4`：分别在每个 skill
  章节后插入 1 张或 2 张双面纸的纯空白 PDF 页（无页眉、页码或边框）。省略该参数
  时不插入空白页。

笔记页按**纸**计，不按页计。双面打印时奇数页是纸的正面：章末若停在正面，构建器会先
补一页收尾这张纸，再插入完整的笔记纸。因此每个 skill 章节（含其全部参考文档小节）
之后都是完整的笔记纸，下一章也总从纸的正面开始——不会出现某几章有、某几章没有，
也不会出现笔记纸被劈成两半分在两张纸上。

代价是空白页数不恒等于 `--notes` 的数值：章末停在纸正面时会多出一页补白，那一页同样
是可写的空白。省略 `--notes` 时不插入任何空白页，版式与页数完全不受此逻辑影响。

用户提供截图时，以截图的字号、间距、分隔线和代码底色为视觉基准；不改动英上中下的
内容顺序。

## 验收

1. 用宿主 PDF 能力检查元数据、页数、书签、链接和文本。
2. 用 Poppler 渲染全部页面：

```bash
pdftoppm -png -r 144 <output.pdf> <render-dir>/page
```

3. 逐页检查封面、目录、每章首页、表格、代码块、长列表、许可证和最后一页。
4. 确认：
   - 所有正式 skills 均出现；
   - 每个 skill 的参考文档均以章内小节出现，数量与源目录中的 Markdown 一致
     （`skip_references` 中显式豁免的除外）；
   - 所有固定源码链接均存在；
   - 除 `--notes` 请求的笔记页外，无意外空白页、越界字符、截断、孤立标题或未替换
     占位符；
   - 渲染页数等于 PDF 页数；
   - 用户要求的截图式效果已在实际页面中出现。
5. 任一步未执行或失败时，把坏消息放在交付前，不声称全部完成。

## 交付

只交付最终 PDF 的可点击路径，并简述页数、skill 数量、固定版本和已完成的验证。
保留构建项目以便复现；不要把临时渲染图混进交付目录。
