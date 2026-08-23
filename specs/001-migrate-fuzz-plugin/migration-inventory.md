# Fuzz 迁移清单

## 不可变基线

- 源仓库：`/Users/a114514/ce_repos/ce-workflow-codex-plugins`
- 源 commit：`949d05e585a551fce1d677d95a57c4db84cd1c4b`
- 源 `plugins/fuzz` tree：`e8f45ca255623202cb8989dbb23a7e631825b37c`
- 目标 `plugins/smart` tree：`9353b504196c8de79d009c3612b891850e65ec2b`
- 核验日期：`2026-08-23`
- 核验结果：源工作区干净，三项 Git 标识均与计划一致

## 44 个源插件文件

```text
plugins/fuzz/.claude-plugin/plugin.json
plugins/fuzz/.codex-plugin/plugin.json
plugins/fuzz/codex-agents/butou.toml
plugins/fuzz/codex-agents/dali.toml
plugins/fuzz/codex-agents/jinyiwei.toml
plugins/fuzz/codex-agents/junji.toml
plugins/fuzz/codex-agents/qinchai.toml
plugins/fuzz/codex-agents/shangshu.toml
plugins/fuzz/codex-agents/shiwei.toml
plugins/fuzz/codex-agents/xueshi.toml
plugins/fuzz/codex-agents/yushi.toml
plugins/fuzz/codex-agents/zongguan.toml
plugins/fuzz/hooks/hooks.json
plugins/fuzz/references/ticket-campaign.md
plugins/fuzz/scripts/install-codex-agents.mjs
plugins/fuzz/scripts/session-start.mjs
plugins/fuzz/skills/ask/SKILL.md
plugins/fuzz/skills/ask/agents/openai.yaml
plugins/fuzz/skills/close-issue/SKILL.md
plugins/fuzz/skills/close-issue/agents/openai.yaml
plugins/fuzz/skills/close-issue/scripts/close-issue.mjs
plugins/fuzz/skills/generate-wiki/SKILL.md
plugins/fuzz/skills/generate-wiki/agents/openai.yaml
plugins/fuzz/skills/github-skills-pdf/SKILL.md
plugins/fuzz/skills/github-skills-pdf/agents/openai.yaml
plugins/fuzz/skills/github-skills-pdf/references/book-format.md
plugins/fuzz/skills/github-skills-pdf/references/translation-guide.md
plugins/fuzz/skills/github-skills-pdf/scripts/build_bilingual_skills_pdf.py
plugins/fuzz/skills/handle-all-tickets/SKILL.md
plugins/fuzz/skills/handle-all-tickets/agents/openai.yaml
plugins/fuzz/skills/html/SKILL.md
plugins/fuzz/skills/html/agents/openai.yaml
plugins/fuzz/skills/html/assets/document.html
plugins/fuzz/skills/html/scripts/ce-html.mjs
plugins/fuzz/skills/i-am-the-king/SKILL.md
plugins/fuzz/skills/i-am-the-king/agents/openai.yaml
plugins/fuzz/skills/i-am-the-king/scripts/toggle-i-am-the-king.mjs
plugins/fuzz/skills/my-weekly/SKILL.md
plugins/fuzz/skills/my-weekly/agents/openai.yaml
plugins/fuzz/skills/my-weekly/references/report-format.md
plugins/fuzz/skills/one-by-one/SKILL.md
plugins/fuzz/skills/one-by-one/agents/openai.yaml
plugins/fuzz/skills/verify-all-tickets/SKILL.md
plugins/fuzz/skills/verify-all-tickets/agents/openai.yaml
```

## 15 个新增中文配对文件

```text
plugins/fuzz/hooks/CN.md
plugins/fuzz/references/CN[ticket-campaign].md
plugins/fuzz/skills/ask/CN.md
plugins/fuzz/skills/close-issue/CN.md
plugins/fuzz/skills/generate-wiki/CN.md
plugins/fuzz/skills/github-skills-pdf/CN.md
plugins/fuzz/skills/github-skills-pdf/references/CN[book-format].md
plugins/fuzz/skills/github-skills-pdf/references/CN[translation-guide].md
plugins/fuzz/skills/handle-all-tickets/CN.md
plugins/fuzz/skills/html/CN.md
plugins/fuzz/skills/i-am-the-king/CN.md
plugins/fuzz/skills/my-weekly/CN.md
plugins/fuzz/skills/my-weekly/references/CN[report-format].md
plugins/fuzz/skills/one-by-one/CN.md
plugins/fuzz/skills/verify-all-tickets/CN.md
```

目标文件总数：`44 + 15 = 59`。44 个源文件保持 `plugins/fuzz` 下的相对路径；新增文件按
上述路径补齐中文配对。

## 11 组迁移测试

```text
tests/fuzz-ask-contract.test.mjs
tests/fuzz-close-issue.test.mjs
tests/fuzz-html.test.mjs
tests/fuzz-i-am-the-king-contract.test.mjs
tests/fuzz-imperial-agents-contract.test.mjs
tests/fuzz-one-by-one-contract.test.mjs
tests/generate-wiki-contract.test.mjs
tests/github-skills-pdf-contract.test.mjs
tests/handle-all-tickets-contract.test.mjs
tests/my-weekly-contract.test.mjs
tests/verify-all-tickets-contract.test.mjs
```

## 不迁移范围

- CE Workflow 插件 payload 与 `ce-workflow-*`、`ce-pr-*`、`cherry-pick-*` 测试
- 源仓 GitLab Release 流程本身
- 强制中文运行源的旧 description 合同
- CE 全仓 MVP 验收器

