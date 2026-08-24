---
name: html
description: Convert one Markdown file into a safe, self-contained HTML page without opening a browser.
disable-model-invocation: true
---

# Smart HTML

Convert one Markdown file into a derived HTML view while keeping Markdown as the
single source of truth.

Use `$smart:html` in Codex or `/smart:html` in Claude Code. Both hosts use the same
skill and deterministic script.

## Conversion

Run:

```text
node <this-skill-directory>/scripts/smart-html.mjs <input.md> [output.html]
```

Resolve the script from this `SKILL.md` directory. Do not locate it through the
repository root, installation cache, environment variables, or a bare `PATH` command.

- When `output.html` is omitted, write beside the input with the same base name.
- Pass an explicit output path when the user provides one.
- Return stdout unchanged on success; it contains a clickable absolute path.
- Return stderr unchanged on failure and do not claim that output was generated.
- Do not open a browser unless the user explicitly asks.

The bundled script escapes input HTML, preserves common document structures, loads
its bundled self-contained template, and creates missing output directories.
