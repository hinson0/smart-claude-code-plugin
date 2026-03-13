---
description: add/commit/push 자동 완료 및 GitHub에서 Pull Request 생성 (PR 제목 및 본문 자동 생성)
argument-hint: 인수 불필요. 자동 [check+add+commit+push+pr]
---

당신은 저장소 커밋 및 PR 어시스턴트입니다. 목표: 표준 커밋과 푸시를 먼저 완료한 후 GitHub에서 Pull Request를 생성합니다.

실행 단계 (반드시 순서대로 수행, 건너뛰기 불가):

---

## 1단계: Push

@../push/SKILL_KO.md

- 작업 트리가 깨끗한 경우(변경 사항 없음), 1단계를 건너뛰고 2단계로 바로 진행합니다.

---

## 2단계: Pull Request 생성

7) 기본 정보 수집 (병렬 실행):
- `git branch --show-current` (현재 브랜치 이름, `HEAD_BRANCH`로 기록)
- `git log -1 --oneline` (최신 커밋 1건, 단일 커밋 시나리오 판단용)

8) 대상 브랜치(base branch) 결정:
- 사용자가 $0을 통해 대상 브랜치를 명시적으로 지정한 경우, 해당 브랜치 이름을 base branch로 사용합니다.
- 그렇지 않으면 **반드시** `AskUserQuestion` 도구를 사용하여 사용자에게 질문합니다:
  > PR의 대상 브랜치는 무엇인가요? (기본값: `main`, Enter를 누르면 됩니다)
- 사용자의 답변을 `BASE_BRANCH`로 기록합니다. 사용자가 Enter를 누르거나 비워두면 `BASE_BRANCH=main`으로 설정합니다.

9) PR 존재 여부 확인:
- 실행: `gh pr list --head <HEAD_BRANCH> --json number,url,state`
- 동일한 head 브랜치의 **open** PR이 이미 존재하면, 기존 PR URL을 표시하고 PR이 이미 존재함을 알린 후 종료합니다.

10) 전체 커밋 목록 수집:
- 실행: `git log <BASE_BRANCH>..HEAD --oneline`
- 모든 커밋(hash + message)을 기록하여 PR 본문 생성에 사용합니다.

11) PR 제목 및 본문 생성:
- **제목**:
  - 이 브랜치에 커밋이 1개뿐이면, 해당 커밋 메시지를 그대로 제목으로 사용합니다.
  - 커밋이 여러 개이면, 브랜치 이름과 커밋 목록을 기반으로 영문 요약 제목 1문장(50자 이내)을 생성하며, 최근 커밋 스타일과 일치시킵니다.
  - 사용자가 명령어 뒤에 설명 텍스트를 추가한 경우, 이를 우선적으로 제목에 반영합니다.
- **본문** (영문, Markdown 형식):
  ```markdown
  ## Summary
  <3-10개 요점, 이 PR이 무엇을 하며 왜 이렇게 했는지 설명>

  ## Commits
  <git log BASE_BRANCH..HEAD의 모든 커밋 나열, 형식: `- <hash>: <message>`>

  ## Test Plan
  - [x] <이번 변경에서 검증해야 할 핵심 사항 1>
  - [x] <이번 변경에서 검증해야 할 핵심 사항 2>
  ```

12) PR 생성 실행:
```bash
gh pr create \
  --title "<PR 제목>" \
  --base <BASE_BRANCH> \
  --body "$(cat <<'EOF'
<PR 본문>
EOF
)"
```
- `gh` 명령어가 없으면, 사용자에게 설치를 안내합니다: `brew install gh && gh auth login`, 그리고 종료합니다.

---

## 출력 결과

성공 시 표시:
1. 1단계에서 사용된 모든 커밋 메시지 (변경 사항이 있었던 경우).
2. **PR URL** (눈에 띄는 형식): `PR: <url>`
3. PR 제목 및 대상 브랜치 (`HEAD_BRANCH` -> `BASE_BRANCH`).
4. 최종 `git status` (작업 트리가 깨끗한지 확인).

실패 시 표시:
- 어떤 단계에서 실패가 발생했는지.
- 구체적인 오류 메시지.
- 다음으로 실행할 수 있는 수정 명령어.

---

## 제약 사항

- git config를 수정하지 않습니다.
- `--amend`, `--force`, `--no-verify`를 사용하지 않습니다.
- 이번 커밋 및 PR과 직접 관련된 명령어만 실행하며, 추가적인 리팩토링이나 파일 수정은 하지 않습니다.
- PR을 자동으로 merge하거나 reviewer를 자동 assign하지 않으며, 생성 후 다음 단계는 사용자가 결정합니다.
