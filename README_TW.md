# smart-codex-plugin

<div align="center">

🌐 [English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md) | [한국어](./README_KO.md) | [日本語](./README_JA.md)

</div>

> 寫完程式碼？直接說 **「提交」**——Smart 會拆開不相關改動、產生聚焦的 message，並按組提交。

這是一個同時支援 **Claude Code** 與 **Codex** 的外掛，提供低成本語意提交、可稽核的 GitLab Issue 收口、會話工具和工程規則。

---

## 快速開始

外掛**同時內建兩套清單**（`.claude-plugin/` 給 Claude Code，`.codex-plugin/` 給 Codex），在任一宿主裡都能原生安裝。依你的宿主選擇：

### Claude Code

新增市場，然後安裝外掛——在 Claude Code 內執行：

```
/plugin marketplace add hinson0/smart-claude-code-plugins
/plugin install smart@smart
```

> 已經在本機克隆了？把市場指向你的克隆目錄即可：`/plugin marketplace add /path/to/smart-claude-code-plugins`。安裝後重啟工作階段，讓 skills、hooks 和 statusline 生效。

### Codex

最友好的方式是在 Codex session 內直接新增，無需克隆：

1. 執行 `/plugins`
2. 選擇 **[Add Marketplace]**
3. 貼上來源——`hinson0/smart-claude-code-plugins`（owner/repo）或完整 git URL——按 Enter 確認
4. 開啟 **Smart** 市場，安裝 **smart** 外掛

> 喜歡命令列？它會直接從 Git 拉取，無需克隆：
>
> ```bash
> codex plugin marketplace add hinson0/smart-claude-code-plugins
> codex plugin add smart@smart
> ```

---

## 特性

**Smart Commit**

- **低成本執行** — Claude Code 使用 Haiku；Codex 把完整提交工作流交給一個低 reasoning 的 GPT-5.6 Luna worker，並允許一次預設子 agent 兜底。
- **語意分組** — type 是硬邊界，purpose 是軟邊界，獨立改動必須成為獨立提交。
- **儲存庫感知 message** — 依序遵循專案規則、近期 Git 歷史和 Conventional Commits。
- **僅提交** — 不執行 CI 檢查、版本修改、push 或建立 PR。

**保護與自動化**

- **會話 Hook** — 會話開始時問候（透過 macOS `say` TTS 語音播報）。
- **會話日誌** — 每次工具呼叫的完整輸入資料均記錄到 `.smart/session-logs/`，便於事後除錯和稽核。
- **可稽核的 GitLab Issue 收口** — `/implement` 完成提交與 Review 後，`/smart:close-issue` 會核對目前分支上的實作 commit、驗收證據與 Review 結論。明確授權關閉後，它會先發布這些開發資產、再關閉 Issue；目標分支是否整合只揭露，不作為關閉閘門。僅使用 `glab`，不會推導出 push、merge、建立 MR/PR、修改 checklist 或標籤的權限。

**實用工具**

- **HUD / Statusline 安裝器** — 一條指令安裝功能豐富的狀態列，顯示模型、Git 分支、上下文用量、速率限制、系統資源和工具呼叫統計。提供兩個安裝級別（簡化版 / 完整版）及從備份還原，僅 user 作用域。
- **說明概覽** — `/smart:help` 動態掃描並列出所有技能、hook 和 agent 及其描述。
- **Joke Teller Agent** — 在合適的時機講個程式設計師笑話，緩解工作壓力。
- **內建編碼規則** — 預置規則檔案（如 Pydantic V2 標準）存於 `rules/` 目錄，按需軟連結至專案的 `.claude/rules/` 即可啟用。
- **會話知識蒸餾** — `/smart:distill` 從當前會話擷取有價值的問答對，按主題聚類成 markdown 檔案，落盤到知識庫。目標目錄讀自本地 `.smart/settings.json`；若本地缺失，則用 `AskUserQuestion` 詢問是複用全域 `~/.smart/settings.json` 還是新建本地設定——兩者都沒有時再問落盤目錄——隨後把選擇保存到本地，之後靜默。目錄詢問留在主工作階段；繁重的**分析**隨後在後台 **fork** 中以 `sonnet` 進行（擷取、聚類、三態比對），再把完全格式化好的落盤計畫交給一個 `haiku` 子 agent 做機械寫盤——昂貴的判斷跑 sonnet、便宜的謄寫跑 haiku，主上下文只收到一份精簡總結。預設 `.smart/knowledges/`；`{date}` 佔位符支援按日期嵌套的目錄（如 `~/knowledges/md/{date}`）。重複/新增/差分三態比對讓重複蒸餾只追加不重複，已 review 檔案（`.printed.md` 或有同名 PDF）絕不觸碰。
- **Workflow 模型分層** — `/smart:wfb` 讓 Workflow 腳本更省 token：按難度給每個 `agent()` 分層（機械活用 haiku、軀幹用 sonnet、收口與重要/硬實作用 opus），在 fan-out 前剪枝，並用 schema 壓縮輸出。編寫任何 Workflow 腳本時自動套用。
- **剪貼簿截圖上傳** — `/smart:sendshot` 安裝一個跨平台的 `sendshot` shell 函數：擷取剪貼簿圖片，透過 `scp` 上傳到遠端主機（如 EC2），隨後印出並把遠端路徑回寫剪貼簿。支援 WSL（PowerShell 讀 Windows 剪貼簿）和 macOS（`pngpaste`/`osascript`）。zsh 下還會把 **`Ctrl+G`** 綁定為在任意提示符處觸發 sendshot。設定——主機、金鑰、遠端目錄——位於 `~/.smart/settings.json`，執行時讀取，所以換主機無需重裝；遠端目錄用 `mkdir -p` 自動建立。
- **學習模式** — `/smart:learning 1` 開啟一種簡單的協作編碼模式：由*你*親手編寫程式碼。它是一個純粹的開/關開關——沒有占比、沒有設定。開啟時，凡是 Claude 本會寫的程式碼都改為印到主控台——每段標明 新增檔案 / 新增程式碼 / 修改 / 刪除，並附檔案與位置——由你敲入，然後 Claude 審查你落盤的程式碼再繼續，每次只處理一個任務。開啟時把規則注入 `.claude/CLAUDE.local.md`（Claude Code 每次工作階段載入的、已 git-ignore 的專案級記憶）使其持續生效；該塊是否存在就是全部狀態，`/smart:learning 0` 移除它。`.smart/settings.json` 裡不存任何東西。
- **單 Cycle TDD 教學閘門** — `/smart:advance-one-step` 每次只推進一個已展示的完整 Red → Green cycle。說 `next` 由 agent 落盤目前 cycle；你自行落盤後說 `review`，由 agent 唯讀審查。通過後只展示下一個 cycle 並停止，人工複製時必須提供可搜尋的準確程式碼錨點。
- **對話待辦錨點** — `/smart:todo` 把 Claude 在工作階段中發散出的決策收進持久的 `.smart/todo-list.md`，釘住唯一的**主線**（分支再多也衝不掉），並把發散的決策停成對帳後的**分支**——重複呼叫會合併進既有條目，而非堆疊出一堆重複。每次執行都重新把主線擺到最前面，在對話跑偏時把你拉回來。`main <目標>` 設定錨點，`done <id>` 結掉某項。已 git-ignore，個人的專案級草稿。
- **開放線索記錄本** — `/smart:notebook` 維護一份 Claude 在對話中途拋出的*開放線索*滾動清單——它在追別的問題時順帶拋出的 `★ Insight`、建議的下一步、反問，這些會隨對話發散被掩埋。一個 `Stop` **hook** 在*每次*回覆後自動擷取帶標記的塊（確定性——不會被跳過或遺忘），skill 則補上 hook 解析不了的自由形式線索、去重，並讓你用 `done <id>` 閉合一條。落盤到 `.smart/notebook.md`（已 git-ignore）。區別於 `todo`（二選一決策）和 `distill`（知識歸檔）——它追蹤的是尚未跟進的東西。
- **HTML 審閱頁** — `/smart:show` 把冗長交付物——當前對話的方案/分析/評審，或一個 Markdown 檔案——渲染成單檔案、零 JavaScript 的自包含 HTML 審閱頁並在瀏覽器開啟。灰底白卡視覺系統：黏性目錄、編號章節、風險徽章、方案對比卡（選定項高亮）、內聯 SVG 架構圖與 `<details>` 摺疊。三種固定版式配方（plan-review / explainer / report）保證每次生成的頁面結構一致。每頁強制攜帶出處頁腳（時間、commit SHA、來源），且僅是衍生視圖——Markdown 仍是事實來源。每次執行都在 `.smart/pages/`（已 git-ignore）寫入帶時間戳的新檔案，保留舊頁面作為不可變審閱資產，不再覆蓋。示例見 `assets/demos/`。

---

## 使用方式

**💬 自然語言** — 在對話中直接描述你的意圖：

| 你說的話 | 執行效果 |
|---|---|
| "commit" / "提交" / "完成了" | 僅智慧提交（暫存 + 分組 + 提交） |
| "這個 Issue 能關嗎" / "關閉 GitLab Issue 42" | 唯讀收口閘門，或在明確授權後 note → close |

**⌨️ 斜線指令** — 精確控制：

| 指令 | 作用 |
|---|---|
| `/smart:commit` | 僅提交（智慧分組，自動產生 message） |
| `/smart:close-issue <IID或URL>` | 唯讀核對單一 GitLab Issue；明確授權關閉後，先發布可稽核的開發資產記錄，再關閉 Issue |
| `/smart:hud [0\|1\|2\|reset\|normal\|all]` | 安裝狀態列（`1`/`normal`=簡化版，`2`/`all`=完整版）或還原備份（`0`/`reset`），user 作用域 |
| `/smart:help [skill\|hook\|agent]` | 顯示所有外掛元件概覽（或按類別篩選） |
| `/smart:distill [目錄]` | 把當前會話蒸餾成按主題命名的知識檔案（預設 `.smart/knowledges/`） |
| `/smart:wfb` | 編寫 Workflow 腳本時的省 token、模型分層指導（按難度選 haiku/sonnet/opus） |
| `/smart:sendshot [install\|config\|uninstall]` | 安裝跨平台 `sendshot` 函數（剪貼簿圖片 → `scp` 到遠端 → 複製遠端路徑）；設定在 `~/.smart/settings.json` |
| `/smart:learning [0\|1]` | 切換學習模式——由*你*親手寫程式碼；Claude 把每段印到主控台並標明 新增檔案 / 新增程式碼 / 修改 / 刪除 供你敲入，再審查你落盤的程式碼。`1`=開，`0`=關，留空=狀態。狀態就是注入到 `.claude/CLAUDE.local.md` 的塊——無設定、無占比 |
| `/smart:advance-one-step` | 推進一個完整 Red → Green 教學 cycle。說 `next` 由 agent 落盤，說 `review` 審查你已落盤的內容；通過後只展示下一個 cycle 並停止 |
| `/smart:todo [main <目標>\|done <id>]` | 把工作階段中發散的決策錨定在 `.smart/todo-list.md`——釘住的主線 + 對帳後的分支；每次執行都重述主線把你拉回來。`main`=設定主線，`done`=結掉某項，留空=擷取並對帳 |
| `/smart:notebook [done <id>]` | 把 Claude 拋出的開放線索（★ Insight、建議的下一步、反問）追蹤進 `.smart/notebook.md`，防止被掩埋。`Stop` hook 每次回覆自動擷取帶標記的塊；skill 補自由形式線索並管理狀態。`done`=閉合一條，留空=挖掘並列出 |
| `/smart:show [<path>.md]` | 把當前對話交付物（或指定 Markdown 檔案）渲染成帶時間戳的全新自包含零 JS HTML 審閱頁，寫入 `.smart/pages/`，保留舊頁面並在瀏覽器開啟。三種版式配方：plan-review / explainer / report |

---

## Smart Commit

`/smart:commit` 讀取狀態、已暫存和未暫存 diff、近期歷史；為每個變更檔案輸出具體 purpose 與 type；先按 type、再按不相關 purpose 拆分，並分別提交。

Claude Code 使用 `haiku` 執行整個 turn。Codex 把完整工作流交給一個低 reasoning 的 `gpt-5.6-luna` worker；Luna 不可用時，用使用者設定的預設子 agent 重試一次。主 agent 不自行分組或提交。

單組使用 `git add -A`；多組暫存明確檔案清單。技能輸出 message、檔案歸屬和最終狀態，不執行檢查、不改版本、不 push，也不建立 PR。

---

## 內建規則

外掛預置了編碼規則檔案，存放在 `rules/` 目錄下。按需將規則檔案軟連結到專案的 `.claude/rules/` 中即可啟用：

```bash
ln -s /path/to/plugin/rules/pydantic-v2.md .claude/rules/pydantic-v2.md
```

**可用規則：**

| 規則檔案 | 約束內容 |
|---|---|
| `pydantic-v2.md` | Pydantic V2 規範：`ConfigDict`、校驗器、判別聯合、`TypeAdapter`、`RootModel`、`SecretStr`、`pydantic-settings`、V1→V2 遷移 |
| `python-3.14.md` | Python 3.14 規範：延遲注解、`[T]` 泛型、`@override`、`Self`、`TaskGroup`、`StrEnum`、`datetime.UTC`、子直譯器、`match` 守衛 |
| `fastapi.md` | FastAPI 0.115+ 規範：`Annotated` 依賴注入、`lifespan`、`APIRouter` 組織、`BackgroundTasks`、`dependency_overrides`、安全作用域 |
| `sqlalchemy-v2.md` | SQLAlchemy 2.0 規範：`DeclarativeBase`、`Mapped[T]`、命名約定、非同步會話、`AsyncAttrs`、`selectinload`、UPSERT、Alembic |

規則預設不啟用，按需軟連結即可。

---

## HUD（狀態列）

一條指令安裝功能豐富的狀態列：

```
/smart:hud
```

![hud](./assets/imgs/hud.png)

**顯示內容（6 行）：**

| 行 | 內容 |
|----|------|
| 1 | 會話 ID / 會話名稱、模型@版本、總花費（USD） |
| 2 | 目錄、Git 分支（dirty/ahead/behind/stash）、最近 commit 時間、worktree 名稱、電池 |
| 3 | 上下文進度條 + tokens + cache、速率限制（5h/7d）含重置倒數、會話時長、agent 名稱 |
| 4 | CPU、記憶體、磁碟、運行時間、Runtime 版本（Node/Python/Go/Rust/Ruby）、本機 IP |
| 5 | 工具呼叫統計（Bash/Skill/Agent/Edit 次數，從 transcript 即時解析） |
| 6 | 輸出風格、vim 模式（僅啟用時顯示） |

**指令：**

| 指令 | 操作 |
|------|------|
| `/smart:hud` · `/smart:hud 2` · `/smart:hud all` | 安裝完整版狀態列（全部 6 行）到 user 作用域，自動備份 |
| `/smart:hud 1` · `/smart:hud normal` | 安裝簡化版狀態列（僅 session + ctx） |
| `/smart:hud 0` · `/smart:hud reset` | 從備份還原之前的狀態列 |

**注意：** 跨平台（macOS + Linux/WSL/Ubuntu）—— 自動偵測作業系統，電量、CPU、記憶體、IP 各取對應指令。需要 `jq`；缺少時 `/smart:hud` 會自動安裝（apt/dnf/pacman/apk/brew）。

---

## Agents

### 笑話講述器（Joke Teller）

講個程式設計師笑話來緩解工作壓力。

```
"tell me a joke" / "講個笑話" / "I need a laugh"
```

- 自動偵測對話語言，用對應語言講笑話
- 短格式（2–4 句，抖包袱風格，不用一問一答範本）
- 附帶一句溫馨提醒（喝水、伸展、休息）

---

## 會話 Hooks

外掛包含在會話邊界和工具呼叫時觸發的 hooks：

| Hook | 觸發時機 | 功能 |
|------|---------|------|
| `greet.sh` | `SessionStart` | 透過 macOS TTS（`say`）播放歡迎語 |
| `session-logs.py` | `PreToolUse`（所有工具） | 將每次工具呼叫的完整輸入記錄到 `.smart/session-logs/<日期>/<session_id>.json` |

內置 hook 配置在 Claude 相容宿主中透過 `${CLAUDE_PLUGIN_ROOT}` 解析路徑。TTS hooks 在背景執行（`nohup &`），不阻塞宿主進程。

---

## 前置需求

- **Claude Code** 或 **Codex**（支援外掛）—— 外掛內建兩套清單，在任一宿主都能原生執行
- `git`
- [`glab` CLI](https://gitlab.com/gitlab-org/cli) — 僅供 `/smart:close-issue` 寫入操作使用
- `jq` — 僅 HUD 狀態列需要（其他功能無需）

---

## 作者

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
