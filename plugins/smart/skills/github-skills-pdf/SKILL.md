---
name: github-skills-pdf
description: Build a verified A4 handbook from a pinned GitHub skills repository, with English source above Simplified Chinese translation.
disable-model-invocation: true
argument-hint: "<repository-or-url> [--notes 2|4] -- decide before building; 2 or 4 inserts one or two sheets of blank note pages after each chapter"
---

# GitHub Skills Bilingual PDF

Turn a GitHub skills repository into a reproducible, auditable English-Chinese
study handbook.

## Invocation

- Codex: `$smart:github-skills-pdf`
- Claude Code: `/smart:github-skills-pdf`

## Pin the scope

1. Read the repository through the host's GitHub capability; clone only when a
   complete file tree is necessary.
2. Record the repository, default branch, full commit, version, license, and
   build date. Never cite a moving `main` ref as the source revision.
3. Determine the official skill set from the plugin manifest, the README's
   official command list, and `skills/*/SKILL.md`. Exclude examples, test
   fixtures, and deprecated directories.
4. A skill body is more than `SKILL.md`. Skills often split format contracts,
   templates, and deeper material into sibling Markdown files such as
   `MISSION-FORMAT.md`, `mocking.md`, or `DEEPENING.md`, then reference them
   with `@FILE.md` or relative links. List every Markdown file in each skill:

   ```bash
   find <clone>/skills -name '*.md' | sort
   ```

   Every non-`SKILL.md` file must appear in either the skill's `references` or
   `skip_references` with a reason. The builder rescans the directory and fails
   when a file is unaccounted for.
5. Report a missing `SKILL.md`, version basis, or license instead of guessing.

## Choose the language mode

Inspect the source files before choosing a mode:

- **English source** -> bilingual mode, the default. Put the English source
  above a block-structurally identical Simplified Chinese translation.
- **Source already in Chinese or another single language** -> monolingual mode.
  Set `"monolingual": true` at the root of `book.json` and render one content
  stream rather than duplicating the same language as a fake translation.

Both modes retain the table of contents, bookmarks, headers, page numbers,
fixed source links, references, and `--notes` behavior. See the monolingual
section of [book-format.md](references/book-format.md) for field differences.
Read several source files when uncertain; do not infer language from a
repository name or README.

## Prepare the project

1. Create a dedicated project directory in the current task workspace. Never
   write generated artifacts inside this skill directory.
2. Read [book-format.md](references/book-format.md) completely, then create
   `book.json`, front matter, and back matter. In bilingual mode also create one
   translation for every skill and included reference.
3. In bilingual mode, read
   [translation-guide.md](references/translation-guide.md) completely and
   translate block by block. References follow the same completeness and
   structure rules as `SKILL.md`. Skip this step in monolingual mode.
4. Translation may be partitioned among subagents by non-overlapping skills.
   Assign a skill and all its references to the same subagent. The primary
   agent must reread translations and run structural validation; never treat a
   subagent summary as completion evidence.

## Build

Validate before generating:

```bash
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --check
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --output <output.pdf>
python3 <this-skill-directory>/scripts/build_bilingual_skills_pdf.py <project-dir> --output <output.pdf> --notes 2
```

Users may invoke `$smart:github-skills-pdf --notes 2` or
`$smart:github-skills-pdf --notes 4`. Omitting `--notes` inserts no note pages. Resolve
`<this-skill-directory>` from this `SKILL.md`; never guess the scripts path from
the user's current directory.

In bilingual mode, source and translation must have identical heading,
paragraph, list, table, and fenced-code-block structures. Fix translation
pairing failures rather than weakening validation. Monolingual mode has no
translation pairing; `--check` reports blocks as read rather than paired.

The layout contract is:

- A4, single column.
- Bilingual section headings use `English Chinese` on one line followed by a
  thin divider; monolingual headings use one line.
- English source appears above its Chinese translation; monolingual mode
  renders one stream.
- Inline code has a light-gray background.
- Every skill starts a chapter and links to source pinned at the exact commit.
- References follow the skill body as in-chapter sections, each with a
  `REFERENCE · <file>` label and its own fixed source link.
- Relative links to repository files resolve to fixed-commit source URLs.
  In-page anchors have no PDF target and degrade to non-clickable emphasized
  text.
- The builder creates a table of contents, PDF bookmarks, headers, and page
  numbers.
- `--notes 2` and `--notes 4` insert one or two complete sheets of blank PDF
  pages after every skill chapter, including its references. Blank pages have
  no header, page number, or border. No argument means no blank pages.

Notes are counted by physical sheet, not by page. For duplex printing, an odd
page is the front of a sheet. If a chapter ends on a front, the builder first
adds a blank page to finish that sheet, then inserts the complete note sheets.
Consequently the number of blank pages may be one greater than the `--notes`
value. This ensures every chapter's notes occupy complete sheets and the next
chapter starts on a front page.

When the user provides a screenshot, use its type size, spacing, divider, and
code background as visual references without changing the source-above-
translation ordering.

## Validate

1. Use the host PDF capability to inspect metadata, page count, bookmarks,
   links, and text.
2. Render every page with Poppler:

   ```bash
   pdftoppm -png -r 144 <output.pdf> <render-dir>/page
   ```

3. Review the cover, contents, every chapter opener, tables, code blocks, long
   lists, license, and final page.
4. Confirm that:
   - every official skill appears;
   - every reference appears in its chapter and the count matches source
     Markdown except explicit `skip_references` entries;
   - every fixed source link exists;
   - apart from requested note pages, there are no unexpected blank pages,
     out-of-bounds characters, truncation, orphan headings, or unresolved
     placeholders;
   - rendered page count equals PDF page count; and
   - screenshot-driven styling is visible in rendered pages.
5. Put any skipped or failed validation before delivery and do not claim full
   completion.

## Deliver

Return only the clickable path to the final PDF plus a concise statement of
page count, skill count, pinned version, and completed validation. Preserve the
build project for reproducibility; do not mix temporary page renders into the
delivery directory.
