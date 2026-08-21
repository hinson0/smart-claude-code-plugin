# smart-codex-plugin

<div align="center">

🌐 [English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md) | [한국어](./README_KO.md) | [日本語](./README_JA.md)

</div>

> コーディングが終わったら **「コミット」** と言うだけです。Smart が無関係な変更を分離し、焦点の合った message を作成してグループごとにコミットします。

**Claude Code** と **Codex** の両方をサポートし、低コストの意味ベースコミット、監査可能な GitLab Issue クローズ、セッションユーティリティ、エンジニアリングルールを提供するプラグインです。

---

## クイックスタート

プラグインは**両方のマニフェストを同梱**しています（Claude Code 用 `.claude-plugin/`、Codex 用 `.codex-plugin/`）。どちらのホストでもネイティブにインストールできます。お使いのホストを選んでください：

### Claude Code

マーケットプレイスを追加してからプラグインをインストールします — Claude Code 内で実行：

```
/plugin marketplace add hinson0/smart-claude-code-plugins
/plugin install smart@smart
```

> すでにローカルに clone 済みですか？マーケットプレイスをクローン先に向ければ OK です：`/plugin marketplace add /path/to/smart-claude-code-plugins`。インストール後はセッションを再起動すると skills・hooks・statusline が読み込まれます。

### Codex

いちばん手軽なのは Codex セッション内で直接追加する方法です — clone 不要：

1. `/plugins` を実行
2. **[Add Marketplace]** を選択
3. ソースを貼り付け — `hinson0/smart-claude-code-plugins`（owner/repo）または完全な git URL — して Enter
4. **Smart** マーケットプレイスを開き、**smart** プラグインをインストール

> CLI が好みですか？Git から直接取得するので clone は不要です：
>
> ```bash
> codex plugin marketplace add hinson0/smart-claude-code-plugins
> codex plugin add smart@smart
> ```

---

## 特徴

**Smart Commit**

- **低コスト実行** — Claude Code は Haiku を使用します。Codex はコミットワークフロー全体を low reasoning の GPT-5.6 Luna worker 1 つに任せ、デフォルトサブエージェントへのフォールバックは 1 回だけです。
- **意味ベースのグループ化** — type はハード境界、purpose はソフト境界で、独立した変更は独立したコミットになります。
- **リポジトリ対応 message** — プロジェクト規則、最近の Git 履歴、Conventional Commits の順で従います。
- **コミット専用** — CI チェック、バージョン変更、push、PR 作成は実行しません。

**保護と自動化**

- **セッション Hook** — セッション開始時に挨拶（macOS `say` TTS による音声出力）。
- **セッションログ** — すべてのツール呼び出しの完全な入力データが `.smart/session-logs/` に記録され、事後のデバッグと監査に活用できます。
- **監査可能な GitLab Issue クローズ** — `/implement` が実装を commit して Review を完了した後、`/smart:close-issue` は現在のブランチ上の実装 commit、受け入れ証拠、Review 結論を確認します。明示的な承認後、それらの開発資産を公開してから Issue を閉じます。対象ブランチへの統合は開示事項であり、クローズ条件ではありません。`glab` のみを使用し、push、merge、MR/PR 作成、checklist や label の変更権限は含みません。

**ユーティリティ**

- **HUD / Statusline インストーラー** — 1つのコマンドでモデル、Git ブランチ、コンテキスト使用量、レート制限、システムリソース、ツール呼び出し統計を表示するステータスラインをインストールします。2つのインストールレベル（最小 / フル）とバックアップ復元をサポート、user スコープのみ。
- **ヘルプ概要** — `/smart:help` で全スキル、フック、エージェントを動的にスキャンし、説明付きで一覧表示します。
- **Joke Teller Agent** — 適切なタイミングでプログラマージョークを提供し、作業ストレスを和らげます。
- **組み込みコーディングルール** — 事前に用意されたルールファイル（例：Pydantic V2 標準）が `rules/` に格納されています。プロジェクトの `.claude/rules/` にシンボリックリンクを作成するだけで有効化できます。
- **セッション知識蒸留** — `/smart:distill` は現在のセッションから価値ある Q&A を抽出し、トピック別の markdown ファイルにクラスタリングして知識ベースに書き出します。対象ディレクトリはローカルの `.smart/settings.json` から読み取り、なければ `AskUserQuestion` でグローバル `~/.smart/settings.json` を再利用するかローカル設定を新規作成するかを尋ね — どちらも無ければ書き出し先ディレクトリを尋ね — 選択をローカルに保存するので以降の実行は静かです。ディレクトリの確認はメインセッションに残り、重い**分析**はバックグラウンドの **fork** で `sonnet` により実行され（抽出・クラスタリング・3状態の差分比較）、整形済みの write-plan を `haiku` サブエージェントに渡して機械的なファイル書き込みを任せます — 高価な判断は sonnet、安価な書き写しは haiku が担い、メインコンテキストには短い要約だけが返ります。デフォルト `.smart/knowledges/`；`{date}` トークンで `~/knowledges/md/{date}` のような日付ネストディレクトリに対応。重複/新規/差分の比較により再蒸留時は重複せず追記され、レビュー済みファイル（`.printed.md` または同名 PDF 付き）には一切触れません。
- **Workflow モデル階層化** — `/smart:wfb` は Workflow スクリプトを省 token にします：各 `agent()` を難易度で階層化し（機械的な作業は haiku、本体は sonnet、収束と重要/難しい実装は opus）、fan-out の前に呼び出しを剪定し、schema で出力を制約します。Workflow スクリプトを書くたびに自動的に適用されます。
- **クリップボードスクリーンショットアップローダー** — `/smart:sendshot` はクロスプラットフォームの `sendshot` shell 関数をインストールします：クリップボードの画像をキャプチャし、`scp` でリモートホスト（例：EC2）にアップロードして、リモートパスを出力しクリップボードに再コピーします。WSL（PowerShell で Windows クリップボードを読む）と macOS（`pngpaste`/`osascript`）に対応。zsh では **`Ctrl+G`** をバインドし、どのプロンプトからでも sendshot を実行できます。設定 — ホスト、鍵、リモートディレクトリ — は `~/.smart/settings.json` にあり実行時に読むため、ホストを変えても再インストール不要です。リモートディレクトリは `mkdir -p` で自動作成されます。
- **学習モード** — `/smart:learning 1` は*あなたが*コードを自分の手で書く、シンプルな協働コーディングモードを有効にします。割合も設定もない、単純なオン/オフのスイッチです。オンの間、Claude が書くはずのコードは代わりにコンソールへ出力され——各片は 新規ファイル / 新規コード / 修正 / 削除 とファイル・位置つきでラベル付けされ——あなたが入力し、Claude はあなたが保存したコードをレビューしてから次へ進みます（一度に一タスク）。有効化するとルールが `.claude/CLAUDE.local.md`（Claude Code が毎セッション読み込む、git-ignore されたプロジェクト別メモリ）に注入されて持続し、そのブロックの有無こそが状態のすべてで、`/smart:learning 0` がそれを削除します。`.smart/settings.json` には何も保存しません。
- **単一 Cycle TDD 教学ゲート** — `/smart:advance-one-step` は、すでに提示された Red → Green cycle を一度に正確に一つだけ進めます。`next` なら agent が現在の cycle を書き込み、自分で書き込んだ後の `review` なら agent が読み取り専用で確認します。成功後は次の cycle を提示するだけで停止し、手動コピー用に検索可能な正確なコードアンカーを示します。
- **会話 ToDo アンカー** — `/smart:todo` はセッション中に Claude が出してくる決定を永続的な `.smart/todo-list.md` に取り込み、分岐がいくら増えても埋もれない唯一の**メインライン**を固定し、枝分かれした決定を突き合わせ済みの**ブランチ**として停めておきます——再実行では重複を積み上げず既存項目にマージします。実行のたびにメインラインを再び最前面に出し、会話が逸れたときにあなたを引き戻します。`main <目標>` でアンカーを設定、`done <id>` で項目を片付けます。git-ignore される、プロジェクトごとの個人用スクラッチ。
- **オープンループ・ノート** — `/smart:notebook` は Claude が会話の途中で出してくる*オープンループ*の実時間リストを保ちます——別のことを追う途中で出した `★ Insight`、提案された次のステップ、フォローアップの問いで、会話が枝分かれするにつれ埋もれていきます。`Stop` **hook** が*毎*返信のあとに印付きブロックを自動捕捉し（確定的——スキップも忘れもされない）、skill は hook が解析できない自由形式の手がかりを補い、重複を除き、`done <id>` でループを閉じられるようにします。`.smart/notebook.md` に保存（git-ignore）。`todo`（二者択一の決定）や `distill`（知識アーカイブ）とは別物——これはまだフォローされていないものを追跡します。
- **HTML レビューページ** — `/smart:show` は長い成果物——現在の会話のプラン/分析/レビュー、または Markdown ファイル——を単一ファイル・ゼロ JavaScript の自己完結型 HTML レビューページにレンダリングし、ブラウザで開きます。グレー地に白カードのビジュアルシステム：固定目次、番号付きセクション、リスクバッジ、代替案比較カード（採用案をハイライト）、インライン SVG 図、`<details>` 折りたたみ。3 つの固定レイアウトレシピ（plan-review / explainer / report）がページ構造の一貫性を保証します。全ページに出所フッター（時刻、commit SHA、ソース）を必須で刻み、あくまで派生ビュー——Markdown が事実の源泉のままです。実行のたびに `.smart/pages/`（git-ignore 済み）へタイムスタンプ付きの新規ファイルを書き出し、以前のページを上書きせず、不変のレビュー資産として保持します。デモは `assets/demos/` を参照。

---

## 使い方

**💬 自然言語** — チャットでやりたいことを直接説明：

| 言う内容 | 実行結果 |
|---|---|
| "commit" / "コミットして" / "完了" | スマートコミットのみ（ステージング + グループ化 + コミット） |
| "この Issue は閉じられる？" / "GitLab Issue 42 を閉じて" | 読み取り専用の準備確認、または明示的な承認後に note → close |

**⌨️ スラッシュコマンド** — 正確な制御：

| コマンド | 機能 |
|---|---|
| `/smart:commit` | コミットのみ（スマートグルーピング、メッセージ自動生成） |
| `/smart:close-issue <IID-or-URL>` | 単一 GitLab Issue を読み取り専用で確認し、明示的なクローズ承認後に監査可能な開発資産 note を公開してから閉じる |
| `/smart:hud [0\|1\|2\|reset\|normal\|all]` | ステータスライン設置（`1`/`normal`=最小、`2`/`all`=フル）またはバックアップ復元（`0`/`reset`）、user スコープ |
| `/smart:help [skill\|hook\|agent]` | 全プラグインコンポーネントの概要表示（カテゴリ別フィルタも可能） |
| `/smart:distill [ディレクトリ]` | 現在のセッションをトピック別の知識ファイルに蒸留（デフォルト `.smart/knowledges/`） |
| `/smart:wfb` | Workflow スクリプト作成のための省 token・モデル階層化ガイド（難易度別に haiku/sonnet/opus） |
| `/smart:sendshot [install\|config\|uninstall]` | クロスプラットフォーム `sendshot` 関数をインストール（クリップボード画像 → `scp` でリモート → リモートパスをコピー）；設定は `~/.smart/settings.json` |
| `/smart:learning [0\|1]` | 学習モードの切り替え — *あなたが*コードを自分で書く；Claude が各片を 新規ファイル / 新規コード / 修正 / 削除 とラベル付けしてコンソールに出力し、あなたが入力、保存したコードをレビュー。`1`=オン、`0`=オフ、空=状態。状態は `.claude/CLAUDE.local.md` に注入されたブロック——設定も割合もなし |
| `/smart:advance-one-step` | 完全な Red → Green 教学 cycle を一つ進めます。`next` は agent が書き込み、`review` は自分で書き込んだ内容を確認します。成功後は次の cycle だけを提示して停止します |
| `/smart:todo [main <目標>\|done <id>]` | セッションで枝分かれした決定を `.smart/todo-list.md` にアンカー——固定メインライン + 突き合わせ済みブランチ；実行のたびにメインラインを再提示して引き戻す。`main`=メインライン設定、`done`=項目を片付け、空=取り込みと突き合わせ |
| `/smart:notebook [done <id>]` | Claude が出すオープンループ（★ Insight、提案された次のステップ、フォローアップの問い）を `.smart/notebook.md` に追跡し、埋もれないようにする。`Stop` hook が毎返信で印付きブロックを自動捕捉；skill が自由形式の手がかりを補い状態を管理。`done`=ループを閉じる、空=収集して一覧 |
| `/smart:show [<path>.md]` | 現在の会話の成果物（または Markdown ファイル）をタイムスタンプ付きの新しい自己完結型ゼロ JS HTML レビューページにレンダリングし、以前のページを保持したまま `.smart/pages/` に書き出してブラウザで開く。レイアウトレシピ 3 種：plan-review / explainer / report |

---

## Smart Commit

`/smart:commit` は状態、staged/unstaged diff、最近の履歴を読み、全変更ファイルの purpose と type を出力し、type と独立 purpose の順で分割して個別にコミットします。

Claude Code は turn 全体を `haiku` で実行します。Codex はワークフロー全体を low reasoning の `gpt-5.6-luna` worker 1 つに任せ、Luna が使えない場合はユーザー設定のデフォルトサブエージェントで 1 回再試行します。primary agent は直接グループ化やコミットを行いません。

単一グループは `git add -A`、複数グループは明示的ファイル一覧を stage します。message、ファイル所属、最終状態を出力し、チェック、バージョン変更、push、PR 作成は実行しません。

---

## 組み込みルール

プラグインには事前に用意されたコーディングルールファイルが `rules/` ディレクトリに含まれています。プロジェクトの `.claude/rules/` にシンボリックリンクを作成するだけで有効化できます：

```bash
ln -s /path/to/plugin/rules/pydantic-v2.md .claude/rules/pydantic-v2.md
```

**利用可能なルール：**

| ルールファイル | 適用内容 |
|---|---|
| `pydantic-v2.md` | Pydantic V2 標準：`ConfigDict`、バリデータ、判別共用体、`TypeAdapter`、`RootModel`、`SecretStr`、`pydantic-settings`、V1→V2 移行 |
| `python-3.14.md` | Python 3.14 標準：遅延アノテーション、`[T]` ジェネリクス、`@override`、`Self`、`TaskGroup`、`StrEnum`、`datetime.UTC`、サブインタープリタ、`match` ガード |
| `fastapi.md` | FastAPI 0.115+ 標準：`Annotated` 依存性注入、`lifespan`、`APIRouter` 組織、`BackgroundTasks`、`dependency_overrides`、セキュリティスコープ |
| `sqlalchemy-v2.md` | SQLAlchemy 2.0 標準：`DeclarativeBase`、`Mapped[T]`、命名規則、非同期セッション、`AsyncAttrs`、`selectinload`、UPSERT、Alembic |

ルールはデフォルトで無効です — 必要なものだけシンボリックリンクしてください。

---

## HUD（ステータスライン）

1つのコマンドで機能豊富なステータスラインをインストール：

```
/smart:hud
```

![hud](./assets/imgs/hud.png)

**表示内容（6行）：**

| 行 | 内容 |
|----|------|
| 1 | セッション ID / セッション名、モデル@バージョン、総コスト（USD） |
| 2 | ディレクトリ、Git ブランチ（dirty/ahead/behind/stash）、最近のコミット時間、worktree 名、バッテリー |
| 3 | コンテキスト進捗バー + トークン + キャッシュ、レート制限（5h/7d）リセットカウントダウン、セッション時間、agent 名 |
| 4 | CPU、メモリ、ディスク、稼働時間、ランタイムバージョン（Node/Python/Go/Rust/Ruby）、ローカル IP |
| 5 | ツール呼び出し統計（Bash/Skill/Agent/Edit 回数、transcript からリアルタイムにパース） |
| 6 | 出力スタイル、vim モード（有効時のみ表示） |

**コマンド：**

| コマンド | 操作 |
|----------|------|
| `/smart:hud` · `/smart:hud 2` · `/smart:hud all` | フルステータスライン（全6行）を user スコープにインストール、自動バックアップ |
| `/smart:hud 1` · `/smart:hud normal` | 最小ステータスラインをインストール（session + ctx のみ） |
| `/smart:hud 0` · `/smart:hud reset` | バックアップから以前のステータスラインを復元 |

**注意：** クロスプラットフォーム（macOS + Linux/WSL/Ubuntu）—— OS を自動検出し、バッテリー・CPU・メモリ・IP に応じたコマンドを使用します。`jq` が必要で、ない場合は `/smart:hud` が自動インストールします（apt/dnf/pacman/apk/brew）。

---

## Agents

### ジョークテラー（Joke Teller）

プログラマージョークを提供して作業ストレスを和らげます。

```
"tell me a joke" / "ジョーク言って" / "I need a laugh"
```

- 会話言語を自動検出し、該当言語でジョークを提供
- 短い形式（2–4文、オチスタイル — Q&A 形式ではない）
- やさしいセルフケアリマインダー付き（水分補給、ストレッチ、休憩）

---

## セッション Hooks

セッション境界とツール呼び出し時にトリガーされる hook が含まれています：

| Hook | トリガー | 機能 |
|------|---------|------|
| `greet.sh` | `SessionStart` | macOS TTS（`say`）でウェルカムメッセージを再生 |
| `session-logs.py` | `PreToolUse`（すべてのツール） | すべてのツール呼び出しの完全な入力を `.smart/session-logs/<日付>/<session_id>.json` に記録 |

同梱 hook 設定は Claude 互換 host で `${CLAUDE_PLUGIN_ROOT}` を使ってパスを解決します。TTS hook はバックグラウンドで実行され（`nohup &`）、host プロセスをブロックしません。

---

## 前提条件

- **Claude Code** または **Codex**（プラグイン対応）—— プラグインは両方のマニフェストを同梱し、どちらのホストでもネイティブに動作
- `git`
- [`glab` CLI](https://gitlab.com/gitlab-org/cli) — `/smart:close-issue` の書き込み操作にのみ使用
- `jq` — HUD ステータスラインのみ必要（その他の機能には不要）

---

## 作者

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
