# smart-codex-plugin

<div align="center">

🌐 [English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md) | [한국어](./README_KO.md) | [日本語](./README_JA.md)

</div>

> Finished coding? Say **"commit"** — Smart groups unrelated changes, writes focused messages, and commits them.

A dual-host plugin for **Claude Code** and **Codex** with low-cost semantic commits, auditable GitLab Issue closeout, session utilities, and engineering rules.

---

## Quick Start

The plugin ships **both manifests** (`.claude-plugin/` for Claude Code and `.codex-plugin/` for Codex), so it installs natively in either host. Pick yours:

### Claude Code

Add the marketplace, then install the plugin — run these inside Claude Code:

```
/plugin marketplace add hinson0/smart-claude-code-plugins
/plugin install smart@smart
```

> Already cloned locally? Point the marketplace at your clone instead: `/plugin marketplace add /path/to/smart-claude-code-plugins`. After installing, restart the session so skills, hooks, and the statusline load.

### Codex

The friendliest way is right inside a Codex session — no clone needed:

1. Run `/plugins`
2. Select **[Add Marketplace]**
3. Paste the source — `hinson0/smart-claude-code-plugins` (owner/repo) or the full git URL — and press Enter
4. Open the **Smart** marketplace, then install the **smart** plugin

> Prefer the CLI? It fetches straight from Git — no clone needed:
>
> ```bash
> codex plugin marketplace add hinson0/smart-claude-code-plugins
> codex plugin add smart@smart
> ```

---

## Features

**Smart Commit**

- **Low-Cost Execution** — Claude Code uses Haiku; Codex delegates the complete commit workflow to one low-reasoning GPT-5.6 Luna worker, with one default-subagent fallback.
- **Semantic Grouping** — Type is a hard boundary and purpose is a soft boundary, so independent changes become independent commits.
- **Repository-Aware Messages** — Respects project rules, recent Git history, then Conventional Commits.
- **Commit Only** — No CI checks, version changes, push, or pull request creation.

**Protection & Automation**

- **Session Hooks** — Greet on session start (via macOS `say` TTS).
- **Session Logs** — Every tool call is logged to `.smart/session-logs/` with full input data for post-session debugging and audit.
- **Auditable GitLab Issue Closeout** — `/smart:close-issue` checks one Issue read-only by default. With explicit close authorization, it verifies the clean worktree, implementation commit, and local and refreshed remote target branches, then publishes a development asset note before closing. It uses `glab` and never implies push, merge, MR/PR creation, checklist edits, or label changes.

**Utilities**

- **HUD / Statusline Installer** — One command to install a feature-rich statusline showing model, git branch, context usage, rate limits, system stats, and tool call counts. Two install levels (minimal / full) plus restore from backup, user scope.
- **Help Overview** — `/smart:help` dynamically scans and lists all skills, hooks, and agents with descriptions.
- **Joke Teller Agent** — Tells a programmer joke to lighten the mood during work.
- **Bundled Coding Rules** — Pre-written rule files (e.g. Pydantic V2 standards) in `rules/`. Symlink any file to your project's `.claude/rules/` to activate it.
- **Session Knowledge Distillation** — `/smart:distill` extracts the valuable Q&A from your current session, clusters it into topic-keyed markdown files, and writes them to a knowledge base. The target directory comes from the local `.smart/settings.json`; when it's missing, `/smart:distill` asks via `AskUserQuestion` whether to reuse the global `~/.smart/settings.json` or set up a local one — and asks for a directory when neither exists — then saves the choice locally so later runs are silent. The directory prompt stays in the main session; the heavy **analysis** then runs in a background **fork** on `sonnet` (extraction, clustering, three-state diffing), which hands a fully formatted write-plan to a `haiku` sub-agent for the mechanical file writes — so the expensive judgment runs on sonnet and the cheap copying on haiku, while the main context receives only a short summary. Default `.smart/knowledges/`; a `{date}` token enables date-nested dirs like `~/knowledges/md/{date}`. A duplicate/new/diff comparison appends instead of duplicating on re-distill, and reviewed files (`.printed.md` or with a sibling PDF) are never touched.
- **Workflow Model Tiering** — `/smart:wfb` makes Workflow scripts token-lean: it tiers each `agent()` by difficulty (haiku for mechanical work, sonnet for the body, opus for convergence and important/hard implementation), prunes calls before fan-out, and constrains output with schemas. Applied automatically whenever a Workflow script is being authored.
- **Clipboard Screenshot Uploader** — `/smart:sendshot` installs a cross-platform `sendshot` shell function that captures the clipboard image and uploads it to a remote host (e.g. EC2) over `scp`, then prints and re-copies the remote path. Works on WSL (Windows clipboard via PowerShell) and macOS (`pngpaste`/`osascript`). Under zsh it also binds **`Ctrl+G`** to fire sendshot from any prompt. Config — host, key, remote dir — lives in `~/.smart/settings.json` and is read at runtime, so changing the host never needs a reinstall; the remote dir is auto-created via `mkdir -p`.
- **Learning Mode** — `/smart:learning 1` turns on a simple co-coding mode where *you* hand-write the code yourself. It is a plain on/off switch — no ratios, no config. While on, any code Claude would write goes to the console instead — each piece labeled New file / New code / Modify / Delete with its file and location — for you to type in, and Claude reviews what you land before moving on, one task at a time. Enabling injects the rules into `.claude/CLAUDE.local.md` (the git-ignored per-project memory Claude Code loads every session) so they persist; the presence of that block is the entire state, and `/smart:learning 0` removes it. Nothing is stored in `.smart/settings.json`.
- **One-Cycle TDD Teaching Gate** — `/smart:advance-one-step` advances exactly one already-presented Red → Green cycle. `next` lets the agent land the current cycle; `review` tells it to review the cycle you landed. After success it only presents the next cycle and stops, with exact searchable code anchors for manual copy-and-paste.
- **Conversation Todo Anchor** — `/smart:todo` captures the decisions Claude surfaces during a session into a persistent `.smart/todo-list.md`, pinning one **Mainline** that branch churn can never bury and parking divergent decisions as reconciled **branches** — re-runs merge into existing entries instead of piling up duplicates. Every run re-surfaces the mainline to pull you back when the conversation has wandered. `main <goal>` sets the anchor, `done <id>` resolves an item. Git-ignored, personal per-project scratch.
- **Open-Loop Notebook** — `/smart:notebook` keeps a running list of the *open loops* Claude surfaces mid-conversation — the `★ Insight`s, suggested next steps, and follow-up questions it raises while chasing something else, which get buried as the chat branches. A `Stop` **hook** auto-captures the marked blocks after *every* reply (deterministic — it can't be skipped or forgotten), and the skill adds the free-form leads the hook can't parse, dedups, and lets you close a loop with `done <id>`. Persisted to `.smart/notebook.md` (git-ignored). Distinct from `todo` (either/or decisions) and `distill` (knowledge archive) — this tracks what hasn't been followed up.
- **HTML Review Pages** — `/smart:show` renders a long deliverable — the current conversation's plan/analysis/review, or a Markdown file — as a single self-contained, zero-JavaScript HTML review page and opens it in the browser. Card-on-gray visual system: sticky TOC, numbered sections, risk badges, option-comparison cards (chosen one highlighted), inline SVG diagrams, and `<details>` folding. Three fixed layout recipes (plan-review / explainer / report) keep pages structurally consistent across runs. Every page carries a mandatory provenance footer (time, commit SHA, source) and is a derived view only — Markdown stays the source of truth. Each run writes a new timestamped file to `.smart/pages/` (git-ignored), preserving earlier pages as immutable review assets instead of overwriting them. Live demos in `assets/demos/`.

---

## Usage

**💬 Natural language** — just describe what you want:

| What you say | What happens |
|---|---|
| "commit" / "save my work" / "done" | Smart commit only (stage + group + commit) |
| "can this Issue close?" / "close GitLab Issue 42" | Read-only readiness gate, or note → close after explicit authorization |

**⌨️ Slash commands** — for precise control:

| Command | What it does |
|---|---|
| `/smart:commit` | Stage & commit only (smart grouping, auto message) |
| `/smart:close-issue <IID-or-URL>` | Check one GitLab Issue read-only; with explicit close authorization, publish an auditable development asset note and then close it |
| `/smart:hud [0\|1\|2\|reset\|normal\|all]` | Install statusline (`1`/`normal`=minimal, `2`/`all`=full) or restore backup (`0`/`reset`), user scope |
| `/smart:help [skill\|hook\|agent]` | Show overview of all plugin components (or filter by category) |
| `/smart:distill [dir]` | Distill the current session into topic-keyed knowledge files (default `.smart/knowledges/`) |
| `/smart:wfb` | Token-lean, model-tiered guidance for authoring Workflow scripts (haiku/sonnet/opus by difficulty) |
| `/smart:sendshot [install\|config\|uninstall]` | Install the cross-platform `sendshot` function (clipboard image → `scp` to remote → copy remote path); config in `~/.smart/settings.json` |
| `/smart:learning [0\|1]` | Toggle learning mode — *you* hand-write the code; Claude prints each piece to the console labeled New file / New code / Modify / Delete for you to type in, then reviews what you land. `1`=on, `0`=off, empty=status. State is the injected block in `.claude/CLAUDE.local.md` — no settings, no ratios |
| `/smart:advance-one-step` | Advance one complete Red → Green teaching cycle. Say `next` for the agent to land it or `review` after you land it; success only presents the next cycle and stops |
| `/smart:todo [main <goal>\|done <id>]` | Anchor the session's surfaced decisions in `.smart/todo-list.md` — a pinned mainline + reconciled branches; re-surfaces the mainline each run to pull you back. `main`=set mainline, `done`=resolve item, empty=capture & reconcile |
| `/smart:notebook [done <id>]` | Track the open loops Claude surfaces (★ Insights, suggested next steps, follow-up questions) in `.smart/notebook.md` so they aren't buried. A `Stop` hook auto-captures marked blocks every reply; the skill adds free-form leads & manages status. `done`=close a loop, empty=mine & list |
| `/smart:show [<path>.md]` | Render the current conversation's deliverable (or a Markdown file) as a new timestamped, self-contained zero-JS HTML review page in `.smart/pages/`, preserve previous pages, and open it in the browser. Three layout recipes: plan-review / explainer / report |

---

## Smart Commit

`/smart:commit` reads status, staged and unstaged diffs, and recent history; prints a concrete purpose and type for every changed file; splits first by type and then by unrelated purpose; and commits each group separately.

Claude Code runs the turn on `haiku`. Codex delegates the complete workflow to one low-reasoning `gpt-5.6-luna` worker. If Luna is unavailable, it retries once with the user's configured default subagent. The primary agent never performs grouping or commit work itself.

Single-group commits use `git add -A`; multiple groups stage explicit file lists. The skill reports messages, file membership, and final status. It never runs checks, changes versions, pushes, or creates pull requests.

---

## Bundled Rules

The plugin ships pre-written coding rule files in `rules/`. Activate any rule in your project by symlinking it to `.claude/rules/`:

```bash
ln -s /path/to/plugin/rules/pydantic-v2.md .claude/rules/pydantic-v2.md
```

**Available rules:**

| Rule file | What it enforces |
|---|---|
| `pydantic-v2.md` | Pydantic V2 standards: `ConfigDict`, validators, discriminated unions, `TypeAdapter`, `RootModel`, `SecretStr`, `pydantic-settings`, V1→V2 migration |
| `python-3.14.md` | Python 3.14 standards: deferred annotations, `[T]` generics, `@override`, `Self`, `TaskGroup`, `StrEnum`, `datetime.UTC`, subinterpreters, `match` guards |
| `fastapi.md` | FastAPI 0.115+ standards: `Annotated` dependencies, `lifespan`, `APIRouter` organization, `BackgroundTasks`, `dependency_overrides`, security scopes |
| `sqlalchemy-v2.md` | SQLAlchemy 2.0 standards: `DeclarativeBase`, `Mapped[T]`, naming conventions, async sessions, `AsyncAttrs`, `selectinload`, UPSERT, Alembic |

Rules are inactive by default — symlink only what's relevant to your project.

---

## HUD (Statusline)

Install a feature-rich statusline with one command:

```
/smart:hud
```

![hud](./assets/imgs/hud.png)

**What it shows (6 lines):**

| Line | Content |
|------|---------|
| 1 | Session ID / session name, model@version, total cost (USD) |
| 2 | Directory, git branch (dirty/ahead/behind/stash), last commit time, worktree name, battery |
| 3 | Context progress bar + tokens + cache, rate limits (5h/7d) with reset countdown, session duration, agent name |
| 4 | CPU, memory, disk, uptime, runtime versions (Node/Python/Go/Rust/Ruby), local IP |
| 5 | Tool call stats (Bash/Skill/Agent/Edit counts, parsed from transcript in real time) |
| 6 | Output style, vim mode (shown only when enabled) |

**Commands:**

| Command | Action |
|---------|--------|
| `/smart:hud` · `/smart:hud 2` · `/smart:hud all` | Install full statusline (all 6 lines) to user scope, auto-backup |
| `/smart:hud 1` · `/smart:hud normal` | Install minimal statusline (session + ctx only) |
| `/smart:hud 0` · `/smart:hud reset` | Restore your previous statusline from backup |

**Note:** Cross-platform (macOS + Linux/WSL/Ubuntu) — auto-detects the OS and picks the right tools for battery, CPU, memory, and IP. Requires `jq`; if it's missing, `/smart:hud` auto-installs it (apt/dnf/pacman/apk/brew).

---

## Agents

### Joke Teller

Tells a programmer joke to lighten the mood.

```
"tell me a joke" / "I need a laugh"
```

- Detects conversation language and tells jokes accordingly
- Short format (2–4 sentences, punchline style — no Q&A templates)
- Includes a gentle self-care reminder (hydrate, stretch, rest)

---

## Session Hooks

The plugin includes hooks that trigger at session boundaries and tool calls:

| Hook | Trigger | What it does |
|------|---------|--------------|
| `greet.sh` | `SessionStart` | Plays a welcome message via macOS TTS (`say`) |
| `session-logs.py` | `PreToolUse` (all tools) | Logs every tool call's full input to `.smart/session-logs/<date>/<session_id>.json` |

The bundled hook config uses `${CLAUDE_PLUGIN_ROOT}` for path resolution in Claude-compatible hosts. TTS hooks run in the background (`nohup &`) to avoid blocking the host process.

---

## Requirements

- **Claude Code** or **Codex** (with plugin support) — the plugin ships both manifests and runs natively in either
- `git`
- [`glab` CLI](https://gitlab.com/gitlab-org/cli) — only for `/smart:close-issue` writes
- `jq` — for HUD statusline only (optional otherwise)

---

## Author

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
