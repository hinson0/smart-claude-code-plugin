---
name: show
description: This skill should be used when the user wants a long deliverable rendered as a visual HTML review page. Trigger on `/smart:show`, "show", "render as html", "html page", equivalent requests in any language to turn content into an HTML review page, or complaints in any language that a plan, analysis, review, report, or Markdown file is too long to read. No args = render the current conversation's main deliverable; a `.md` path argument = render that file. Each run writes a new timestamped, self-contained, zero-JavaScript HTML page to `.smart/pages/`, preserves all earlier pages, and opens the new page in the browser. Presentation layer only — the page is a derived view, never a source of truth.
argument-hint: "no args = render current conversation's deliverable; <path>.md = render that file; trailing words narrow the topic"
model: sonnet
---

# show — Self-Contained HTML Review Page

## Why this exists

Nobody reads a 300-line Markdown wall — attention dies about 100 lines in. This skill renders a deliverable as a single HTML page with layout, color, navigation, and folding, so a human can actually review it and decide.

One principle governs everything: **Markdown/conversation is the Source, HTML is the View.** Generate a new immutable page snapshot from the source whenever content changes; never edit or overwrite an earlier snapshot to change meaning, and never replace the original file, spec, or code.

## Input modes

**Conversation mode (no args, default).** Extract the current session's main deliverable — the plan, analysis, review, or report the user has been building. Take the *final state*, not the journey: keep decisions with their rationale, data, tables, and code; drop dead ends, tool noise, and greetings. If several candidates exist, pick the one most recently worked on, or use trailing argument words as a topic filter.

**File mode (`<path>.md`).** Read the entire file and restructure it visually. Preserve meaning exactly — reorganize, group, and fold, but never invent or drop substantive content.

## Step 1 — Choose a layout recipe

Read `references/layouts.md` and pick the recipe that fits the content:

- `plan-review` — implementation plans, proposals, designs awaiting a go/no-go
- `explainer` — how a system/module/flow works; architecture and call chains
- `report` — everything else: research, analysis, long docs (the safe default)

The recipe dictates section order and which template components to use. Do not freestyle the page structure; consistency across runs is the point of having recipes.

## Step 2 — Build the page from the template

Read `assets/template.html`. It is a complete skeleton: CSS variables, automatic light/dark theme, a sticky TOC sidebar, and styled components (tiles, badges, callouts, details, tables, code, side-by-side panels, checklists). Fill these placeholders and touch nothing else:

| Placeholder | Value |
|---|---|
| `{{LANG}}` | `zh-CN`, `en`, … — match the page content language |
| `{{TITLE}}` / `{{TITLE_SHORT}}` | Page title / short TOC-header variant |
| `{{SUBTITLE}}` | One line: what this page is and what decision it supports |
| `{{TOC}}` | `<a href="#sec-N">…</a>` list; class `l2` for sub-items |
| `{{CONTENT}}` | The body, built from template component classes only |
| `{{GENERATED_AT}}` | `date '+%F %R'` |
| `{{COMMIT}}` | `git rev-parse --short HEAD`, or `n/a` outside a repo |
| `{{SOURCE}}` | `conversation` or the source file path |

Generate *content* HTML only — never rewrite or restyle the skeleton's CSS. The template is what keeps every page visually consistent and keeps token cost on the content, not the chrome.

## Hard rules

- **Single self-contained file.** No CDN, no external stylesheets/fonts/images, no network requests of any kind. Inline SVG for diagrams.
- **Zero JavaScript.** Folding is `<details>`, navigation is anchors, comparison is side-by-side panels. If tab switching is genuinely needed, use the pure-CSS pattern in `references/layouts.md` — still no scripts.
- **Footer metadata is mandatory** (the template's `footer.meta` block): generation time, commit SHA, source. A review page whose provenance is unknown cannot be trusted for decisions.
- **No secrets.** Redact tokens, keys, credentials, and internal URLs if they appear in the source content.
- **Derived, immutable view.** Never modify or overwrite an existing page — generate a new timestamped snapshot from the source instead.

## Step 3 — Write, open, report

1. Ensure `.smart/` is git-ignored (same convention as the other smart scratch files; append to `.gitignore` if missing).
2. Capture one run stamp with `date '+%F-%H%M%S'`, then choose `.smart/pages/<YYYY-MM-DD>-<HHMMSS>-<topic-slug>.html` (kebab-case slug). Resolve the final unused path **before writing**: if that path already exists, append `-2`, then `-3`, and so on until the path is unused. Never pass an existing page path to a write or edit operation; every invocation must preserve all earlier pages as immutable review assets.
3. Open it: `open <file>` on macOS, `xdg-open <file>` on Linux. If neither exists, just print the path.
4. Console report, three lines max: the absolute file path, the recipe used, and the section list.

## Language

Page content language follows the conversation (Chinese conversation → Chinese page). This skill file and the template stay English.
