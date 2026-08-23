# smart-codex-plugin

<div align="center">

🌐 [English](./README.md) | [简体中文](./README_CN.md) | [繁體中文](./README_TW.md) | [한국어](./README_KO.md) | [日本語](./README_JA.md)

</div>

> 코딩이 끝나면 **“커밋”**이라고 말하세요. Smart가 관련 없는 변경을 분리하고 명확한 message를 만든 뒤 그룹별로 커밋합니다.

**Claude Code**와 **Codex**를 모두 지원하며 저비용 의미 기반 커밋, 감사 가능한 GitLab Issue 마감, 세션 유틸리티와 엔지니어링 규칙을 제공하는 플러그인입니다.

---

## 빠른 시작

플러그인은 **두 가지 매니페스트를 모두 내장**합니다(Claude Code용 `.claude-plugin/`, Codex용 `.codex-plugin/`). 두 호스트 어느 쪽에서도 네이티브로 설치됩니다. 사용하는 호스트를 선택하세요:

### Claude Code

마켓플레이스를 추가한 뒤 플러그인을 설치합니다 — Claude Code 안에서 실행:

```
/plugin marketplace add hinson0/smart-claude-code-plugins
/plugin install smart@smart
```

> 이미 로컬에 clone했나요? 마켓플레이스를 클론 경로로 지정하세요: `/plugin marketplace add /path/to/smart-claude-code-plugins`. 설치 후 세션을 재시작하면 skills, hooks, statusline이 로드됩니다.

### Codex

가장 편한 방법은 Codex 세션 안에서 바로 추가하는 것입니다 — clone 불필요:

1. `/plugins` 실행
2. **[Add Marketplace]** 선택
3. 소스를 붙여넣기 — `hinson0/smart-claude-code-plugins`(owner/repo) 또는 전체 git URL — 후 Enter
4. **Smart** 마켓플레이스를 열고 **smart** 플러그인을 설치

> CLI를 선호하나요? Git에서 바로 가져오므로 clone이 필요 없습니다:
>
> ```bash
> codex plugin marketplace add hinson0/smart-claude-code-plugins
> codex plugin add smart@smart
> ```

---

## 이 Marketplace의 플러그인

이 저장소는 Claude Code와 Codex를 모두 지원하는 두 개의 독립 플러그인을 배포합니다.

| 플러그인 | 설치 이름 | 용도 |
|----------|-----------|------|
| Smart | `smart@smart` | 의미 기반 커밋, 안전한 GitLab Issue 마감, 세션 유틸리티 |
| Fuzz | `fuzz@smart` | 읽기 전용 안내, Cycle TDD, 티켓 campaign, HTML/PDF/Wiki, 주간 보고서, 선택적 궁정 모드 |

각 플러그인을 따로 설치하거나 둘 다 설치할 수 있습니다. Claude Code는 `/smart:*`와
`/fuzz:*`를 사용하며, Codex도 대응하는 플러그인 네임스페이스 skill을 제공합니다. 비슷한
기능이 있으면 전체 네임스페이스로 원하는 계약을 명시하세요.

```bash
# Claude Code: marketplace를 추가한 뒤 실행
/plugin install smart@smart
/plugin install fuzz@smart

# Codex: marketplace를 추가한 뒤 실행
codex plugin add smart@smart
codex plugin add fuzz@smart
```

Fuzz는 `ask`, `close-issue`, `generate-wiki`, `github-skills-pdf`, `handle-all-tickets`,
`html`, `i-am-the-king`, `my-weekly`, `one-by-one`, `verify-all-tickets`의 열 개 skill을
포함합니다. 일부 흐름은 Git, `glab`, Python/PDF 도구 또는 호스트의 Goal, Review, 브라우저,
문서 기능이 필요하며, 각 skill은 쓰기 전에 자체 전제 조건을 확인합니다.

### 이전 Marketplace에서 Fuzz 이전

`fuzz@ce-workflow`와 `fuzz@smart`를 동시에 설치하지 마세요. 새 소스를 격리 환경에서 먼저
검증한 뒤 아래 순서로 전환하고 새 세션을 시작합니다.

```bash
# Claude Code
claude plugin uninstall fuzz@ce-workflow
claude plugin marketplace add hinson0/smart-claude-code-plugins
claude plugin install fuzz@smart

# Codex
codex plugin remove fuzz@ce-workflow
codex plugin marketplace add hinson0/smart-claude-code-plugins --ref main
codex plugin add fuzz@smart
```

`ce-workflow`의 다른 플러그인을 사용한다면 해당 marketplace는 유지하세요. Fuzz는 계속
`.fuzz/`, `$CODEX_HOME/fuzz/`, `fuzz-*` Agent 파일을 사용하므로 기존 궁정 모드 상태가
이어집니다. 롤백하려면 `fuzz@smart`를 제거하고 `fuzz@ce-workflow`를 설치한 뒤 새 세션을
시작하세요.

---

## 주요 기능

**Smart Commit**

- **저비용 실행** — Claude Code는 Haiku를 사용합니다. Codex는 전체 커밋 워크플로를 low reasoning GPT-5.6 Luna worker 하나에 맡기며 기본 서브 에이전트 폴백은 한 번만 허용합니다.
- **의미 기반 그룹화** — type은 하드 경계, purpose는 소프트 경계이며 독립 변경은 독립 커밋이 됩니다.
- **저장소 인식 message** — 프로젝트 규칙, 최근 Git 기록, Conventional Commits 순서로 따릅니다.
- **커밋 전용** — CI 검사, 버전 변경, push, PR 생성을 실행하지 않습니다.

**보호 및 자동화**

- **세션 Hook** — 세션 시작 시 인사 (macOS `say` TTS를 통한 음성 출력).
- **세션 로그** — 모든 도구 호출의 전체 입력 데이터가 `.smart/session-logs/`에 기록되어 사후 디버깅 및 감사에 활용할 수 있습니다.
- **감사 가능한 GitLab Issue 마감** — `/implement`가 구현을 commit하고 Review를 완료한 뒤 `/smart:close-issue`는 현재 브랜치의 구현 commit, 인수 증거, Review 결론을 확인합니다. 명시적인 종료 승인이 있으면 해당 개발 자산을 게시한 뒤 Issue를 닫습니다. 대상 브랜치 통합은 공개할 경계일 뿐 종료 조건이 아닙니다. `glab`만 사용하며 push, merge, MR/PR 생성, checklist 또는 label 변경 권한을 포함하지 않습니다.

**유틸리티**

- **시각적 진행 추적** — 파이프라인 단계가 실시간 작업 목록으로 표시되며, 대기/진행 중/완료 상태, 타이밍 및 토큰 통계를 보여줍니다.
- **HUD / Statusline 설치기** — 한 줄 명령어로 모델, Git 브랜치, 컨텍스트 사용량, 속도 제한, 시스템 리소스, 도구 호출 통계를 표시하는 상태 표시줄을 설치합니다. 두 가지 설치 레벨(최소 / 전체)과 백업 복원을 지원하며, user 스코프만 지원합니다.
- **도움말 개요** — `/smart:help`로 모든 스킬, 훅, 에이전트를 동적으로 스캔하여 설명과 함께 나열합니다.
- **Joke Teller Agent** — 적절한 타이밍에 프로그래머 농담을 들려주어 업무 스트레스를 해소합니다.
- **내장 코딩 규칙** — 사전 작성된 규칙 파일(예: Pydantic V2 표준)이 `rules/`에 저장됩니다. 프로젝트의 `.claude/rules/`에 심볼릭 링크를 생성하면 활성화됩니다.
- **세션 지식 증류** — `/smart:distill`은 현재 세션에서 가치 있는 Q&A를 추출하고 주제별 markdown 파일로 클러스터링하여 지식 베이스에 기록합니다. 대상 디렉터리는 로컬 `.smart/settings.json`에서 읽으며, 없으면 `AskUserQuestion`으로 전역 `~/.smart/settings.json`을 재사용할지 로컬 설정을 새로 만들지 묻고 — 둘 다 없으면 디렉터리를 묻습니다 — 선택을 로컬에 저장하므로 이후 실행은 조용합니다. 디렉터리 질문은 메인 세션에 남고, 무거운 **분석**은 백그라운드 **fork**에서 `sonnet`으로 실행되며(추출·클러스터링·3상태 차분 비교), 완전히 포맷된 write-plan을 `haiku` 서브 에이전트에 넘겨 기계적인 파일 쓰기를 맡깁니다 — 비싼 판단은 sonnet, 값싼 필사는 haiku가 담당하고, 메인 컨텍스트는 짧은 요약만 받습니다. 기본값 `.smart/knowledges/`; `{date}` 토큰으로 `~/knowledges/md/{date}` 같은 날짜 중첩 디렉터리를 지원합니다. 중복/신규/차분 비교로 재증류 시 중복 없이 추가되며, 검토 완료 파일(`.printed.md` 또는 동일 이름 PDF 동반)은 절대 건드리지 않습니다.
- **Workflow 모델 계층화** — `/smart:wfb`는 Workflow 스크립트를 토큰 절약형으로 만듭니다: 각 `agent()`를 난이도별로 계층화하고(기계적 작업은 haiku, 본체는 sonnet, 수렴 및 중요/어려운 구현은 opus), fan-out 전에 호출을 가지치기하며, schema로 출력을 제약합니다. Workflow 스크립트를 작성할 때마다 자동 적용됩니다.
- **클립보드 스크린샷 업로더** — `/smart:sendshot`은 크로스플랫폼 `sendshot` shell 함수를 설치합니다: 클립보드 이미지를 캡처해 `scp`로 원격 호스트(예: EC2)에 업로드한 뒤 원격 경로를 출력하고 클립보드에 다시 복사합니다. WSL(PowerShell로 Windows 클립보드 읽기)과 macOS(`pngpaste`/`osascript`)를 지원합니다. zsh에서는 **`Ctrl+G`**를 바인딩해 어느 프롬프트에서나 sendshot을 실행할 수 있습니다. 설정 — 호스트, 키, 원격 디렉터리 — 은 `~/.smart/settings.json`에 있으며 런타임에 읽으므로 호스트를 바꿔도 재설치가 필요 없습니다. 원격 디렉터리는 `mkdir -p`로 자동 생성됩니다.
- **학습 모드** — `/smart:learning 1`은 *당신이* 코드를 직접 손으로 작성하는 간단한 협업 코딩 모드를 켭니다. 비율도 설정도 없는 단순한 켜기/끄기 스위치입니다. 켜져 있는 동안 Claude가 작성할 코드는 대신 콘솔로 출력됩니다 — 각 조각은 새 파일 / 새 코드 / 수정 / 삭제로 파일과 위치와 함께 표시되어 — 당신이 입력하고, Claude는 당신이 저장한 코드를 검토한 뒤 다음으로 넘어갑니다(한 번에 한 작업). 켜면 규칙이 `.claude/CLAUDE.local.md`(Claude Code가 매 세션 로드하는 git-ignore된 프로젝트별 메모리)에 주입되어 지속되며, 그 블록의 존재 자체가 전체 상태이고, `/smart:learning 0`이 그것을 제거합니다. `.smart/settings.json`에는 아무것도 저장되지 않습니다.
- **단일 Cycle TDD 교육 게이트** — `/smart:advance-one-step`은 이미 제시된 Red → Green cycle을 한 번에 정확히 하나만 진행합니다. `next`라고 하면 agent가 현재 cycle을 저장하고, 직접 저장한 뒤 `review`라고 하면 agent가 읽기 전용으로 검토합니다. 통과 후에는 다음 cycle만 제시하고 멈추며, 수동 복사를 위해 검색 가능한 정확한 코드 앵커를 제공합니다.
- **대화 할 일 앵커** — `/smart:todo`는 세션 중 Claude가 꺼내 놓는 결정들을 지속적인 `.smart/todo-list.md`에 담아, 분기가 아무리 늘어도 묻히지 않는 하나의 **메인라인**을 고정하고, 갈라져 나온 결정들을 대조·정리된 **브랜치**로 세워 둡니다 — 재실행 시 중복을 쌓지 않고 기존 항목에 병합합니다. 매 실행마다 메인라인을 다시 앞으로 꺼내, 대화가 곁길로 샜을 때 당신을 되돌려 놓습니다. `main <목표>`로 앵커를 설정하고, `done <id>`로 항목을 마무리합니다. git-ignore되는 프로젝트별 개인 스크래치.
- **열린 루프 노트북** — `/smart:notebook`은 Claude가 대화 도중 꺼내 놓는 *열린 루프*(open loop)의 실시간 목록을 유지합니다 — 다른 것을 좇다가 꺼낸 `★ Insight`, 제안된 다음 단계, 후속 질문들로, 대화가 갈라지면서 묻혀 버립니다. `Stop` **hook**이 *매* 응답 후 표시된 블록을 자동으로 포착하고(결정적 — 건너뛰거나 잊을 수 없음), skill은 hook이 파싱할 수 없는 자유 형식 단서를 추가하고 중복을 제거하며 `done <id>`로 루프를 닫게 해 줍니다. `.smart/notebook.md`에 저장(git-ignore). `todo`(양자택일 결정), `distill`(지식 아카이브)과 구별 — 이것은 아직 후속 처리되지 않은 것을 추적합니다.
- **HTML 리뷰 페이지** — `/smart:show`는 긴 산출물 — 현재 대화의 계획/분석/리뷰 또는 Markdown 파일 — 을 단일 파일, 제로 JavaScript의 자체 완결형 HTML 리뷰 페이지로 렌더링해 브라우저로 엽니다. 회색 배경 + 흰 카드 비주얼 시스템: 고정 목차, 번호 섹션, 리스크 배지, 대안 비교 카드(선택안 강조), 인라인 SVG 다이어그램, `<details>` 접기. 세 가지 고정 레이아웃 레시피(plan-review / explainer / report)가 페이지 구조의 일관성을 보장합니다. 모든 페이지는 출처 푸터(시간, commit SHA, 소스)를 필수로 포함하며 파생 뷰일 뿐 — Markdown이 여전히 사실의 원천입니다. 실행할 때마다 `.smart/pages/`(git-ignore)에 타임스탬프가 붙은 새 파일을 쓰며, 이전 페이지를 덮어쓰지 않고 불변 리뷰 자산으로 보존합니다. 데모는 `assets/demos/` 참고.

---

## 사용 방법

**💬 자연어** — 채팅에서 원하는 것을 직접 설명:

| 말하는 내용 | 실행 결과 |
|---|---|
| "commit" / "커밋해" / "완료" | 스마트 커밋만 (스테이징 + 그룹화 + 커밋) |
| "이 Issue를 닫아도 돼?" / "GitLab Issue 42 닫아줘" | 읽기 전용 준비 상태 확인, 또는 명시적 승인 후 note → close |

**⌨️ 슬래시 명령어** — 정확한 제어:

| 명령어 | 기능 |
|---|---|
| `/smart:commit` | 커밋만 수행 (스마트 그룹화, 자동 메시지 생성) |
| `/smart:close-issue <IID-or-URL>` | 단일 GitLab Issue를 읽기 전용으로 확인하고, 명시적 종료 승인 후 감사 가능한 개발 자산 note를 게시한 다음 닫기 |
| `/smart:hud [0\|1\|2\|reset\|normal\|all]` | 상태 표시줄 설치 (`1`/`normal`=최소, `2`/`all`=전체) 또는 백업 복원 (`0`/`reset`), user 스코프 |
| `/smart:help [skill\|hook\|agent]` | 모든 플러그인 컴포넌트 개요 표시 (또는 카테고리별 필터) |
| `/smart:distill [디렉터리]` | 현재 세션을 주제별 지식 파일로 증류 (기본값 `.smart/knowledges/`) |
| `/smart:wfb` | Workflow 스크립트 작성을 위한 토큰 절약·모델 계층화 가이드(난이도별 haiku/sonnet/opus) |
| `/smart:sendshot [install\|config\|uninstall]` | 크로스플랫폼 `sendshot` 함수 설치(클립보드 이미지 → `scp`로 원격 전송 → 원격 경로 복사); 설정은 `~/.smart/settings.json` |
| `/smart:learning [0\|1]` | 학습 모드 토글 — *당신이* 코드를 직접 작성; Claude가 각 조각을 새 파일 / 새 코드 / 수정 / 삭제로 표시해 콘솔에 출력하면 당신이 입력하고, 저장한 코드를 검토. `1`=켜기, `0`=끄기, 비어 있음=상태. 상태는 `.claude/CLAUDE.local.md`에 주입된 블록 — 설정도 비율도 없음 |
| `/smart:advance-one-step` | 하나의 완전한 Red → Green 교육 cycle을 진행합니다. `next`는 agent가 저장하고, `review`는 사용자가 저장한 내용을 검토합니다. 통과 후 다음 cycle만 제시하고 멈춥니다 |
| `/smart:todo [main <목표>\|done <id>]` | 세션에서 갈라져 나온 결정을 `.smart/todo-list.md`에 앵커 — 고정된 메인라인 + 대조·정리된 브랜치; 매 실행마다 메인라인을 다시 꺼내 되돌려 놓음. `main`=메인라인 설정, `done`=항목 마무리, 비어 있음=수집 및 대조 |
| `/smart:notebook [done <id>]` | Claude가 꺼내는 열린 루프(★ Insight, 제안된 다음 단계, 후속 질문)를 `.smart/notebook.md`에 추적해 묻히지 않게 함. `Stop` hook이 매 응답마다 표시된 블록을 자동 포착; skill은 자유 형식 단서를 추가하고 상태를 관리. `done`=루프 닫기, 비어 있음=수집 및 목록 |
| `/smart:show [<path>.md]` | 현재 대화 산출물(또는 Markdown 파일)을 타임스탬프가 붙은 새로운 자체 완결형 제로 JS HTML 리뷰 페이지로 렌더링해 `.smart/pages/`에 쓰고, 이전 페이지를 보존한 채 브라우저로 열기. 레이아웃 레시피 3종: plan-review / explainer / report |

---

## Smart Commit

`/smart:commit`은 상태, staged/unstaged diff와 최근 기록을 읽고, 모든 변경 파일의 purpose와 type을 출력하고, type과 독립 purpose 순서로 분리해 각각 커밋합니다.

Claude Code는 전체 turn을 `haiku`로 실행합니다. Codex는 전체 워크플로를 low reasoning `gpt-5.6-luna` worker 하나에 맡기며, Luna를 사용할 수 없으면 사용자 기본 서브 에이전트로 한 번 재시도합니다. 기본 agent는 직접 그룹화하거나 커밋하지 않습니다.

단일 그룹은 `git add -A`, 여러 그룹은 명시적 파일 목록을 stage합니다. message, 파일 소속과 최종 상태를 출력하며 검사, 버전 변경, push, PR 생성을 실행하지 않습니다.

---

## 내장 규칙

플러그인에는 미리 작성된 코딩 규칙 파일이 `rules/` 디렉터리에 포함되어 있습니다. 프로젝트의 `.claude/rules/`에 심볼릭 링크를 생성하면 활성화됩니다:

```bash
ln -s /path/to/plugin/rules/pydantic-v2.md .claude/rules/pydantic-v2.md
```

**사용 가능한 규칙:**

| 규칙 파일 | 적용 내용 |
|---|---|
| `pydantic-v2.md` | Pydantic V2 표준: `ConfigDict`, 검증기, 판별 유니온, `TypeAdapter`, `RootModel`, `SecretStr`, `pydantic-settings`, V1→V2 마이그레이션 |
| `python-3.14.md` | Python 3.14 표준: 지연 어노테이션, `[T]` 제네릭, `@override`, `Self`, `TaskGroup`, `StrEnum`, `datetime.UTC`, 서브인터프리터, `match` 가드 |
| `fastapi.md` | FastAPI 0.115+ 표준: `Annotated` 의존성 주입, `lifespan`, `APIRouter` 조직, `BackgroundTasks`, `dependency_overrides`, 보안 스코프 |
| `sqlalchemy-v2.md` | SQLAlchemy 2.0 표준: `DeclarativeBase`, `Mapped[T]`, 명명 규칙, 비동기 세션, `AsyncAttrs`, `selectinload`, UPSERT, Alembic |

규칙은 기본적으로 비활성화되어 있습니다 — 필요한 것만 심볼릭 링크하세요.

---

## HUD (상태 표시줄)

한 줄 명령어로 기능이 풍부한 상태 표시줄을 설치합니다:

```
/smart:hud
```

![hud](./assets/imgs/hud.png)

**표시 내용 (6줄):**

| 줄 | 내용 |
|----|------|
| 1 | 세션 ID / 세션 이름, 모델@버전, 총 비용 (USD) |
| 2 | 디렉토리, Git 브랜치 (dirty/ahead/behind/stash), 최근 커밋 시간, worktree 이름, 배터리 |
| 3 | 컨텍스트 진행 바 + 토큰 + 캐시, 속도 제한 (5h/7d) 리셋 카운트다운, 세션 시간, agent 이름 |
| 4 | CPU, 메모리, 디스크, 가동 시간, 런타임 버전 (Node/Python/Go/Rust/Ruby), 로컬 IP |
| 5 | 도구 호출 통계 (Bash/Skill/Agent/Edit 횟수, transcript에서 실시간 파싱) |
| 6 | 출력 스타일, vim 모드 (활성화 시에만 표시) |

**명령어:**

| 명령어 | 동작 |
|--------|------|
| `/smart:hud` · `/smart:hud 2` · `/smart:hud all` | 전체 상태 표시줄(6줄 전체) user 스코프 설치, 자동 백업 |
| `/smart:hud 1` · `/smart:hud normal` | 최소 상태 표시줄 설치 (session + ctx만) |
| `/smart:hud 0` · `/smart:hud reset` | 백업에서 이전 상태 표시줄 복원 |

**참고:** 크로스 플랫폼(macOS + Linux/WSL/Ubuntu) — OS를 자동 감지하여 배터리·CPU·메모리·IP에 맞는 도구를 사용합니다. `jq`가 필요하며, 없으면 `/smart:hud`가 자동으로 설치합니다(apt/dnf/pacman/apk/brew).

---

## Agents

### 농담 전달자 (Joke Teller)

프로그래머 농담을 들려주어 업무 스트레스를 해소합니다.

```
"tell me a joke" / "농담 해줘" / "I need a laugh"
```

- 대화 언어를 자동 감지하여 해당 언어로 농담을 전달
- 짧은 형식 (2–4문장, 펀치라인 스타일 — Q&A 형식 아님)
- 부드러운 셀프케어 알림 포함 (수분 섭취, 스트레칭, 휴식)

---

## 세션 Hooks

세션 경계와 도구 호출 시 트리거되는 hook이 포함되어 있습니다:

| Hook | 트리거 | 기능 |
|------|--------|------|
| `greet.sh` | `SessionStart` | macOS TTS (`say`)를 통해 환영 메시지 재생 |
| `session-logs.py` | `PreToolUse` (모든 도구) | 모든 도구 호출의 전체 입력을 `.smart/session-logs/<날짜>/<session_id>.json`에 기록 |

번들 hook 구성은 Claude 호환 host에서 `${CLAUDE_PLUGIN_ROOT}`를 통해 경로를 해석합니다. TTS hook은 백그라운드에서 실행되어 (`nohup &`) host 프로세스를 차단하지 않습니다.

---

## 사전 요구 사항

- **Claude Code** 또는 **Codex**(플러그인 지원) — 플러그인이 두 매니페스트를 모두 내장하여 어느 호스트에서도 네이티브로 동작
- `git`
- [`glab` CLI](https://gitlab.com/gitlab-org/cli) — `/smart:close-issue` 쓰기 작업에만 사용
- `jq` — HUD 상태 표시줄에만 필요 (다른 기능은 불필요)

---

## 저자

**Hinson** · [GitHub](https://github.com/hinson0)

## License

MIT
