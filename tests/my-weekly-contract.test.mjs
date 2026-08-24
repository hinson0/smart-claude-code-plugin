import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

test("Smart publishes the read-only my-weekly skill", async () => {
  const [codexPlugin, claudePlugin, skill, chinese, openaiMetadata, reportFormat, chineseFormat] =
    await Promise.all([
      readJson("plugins/smart/.codex-plugin/plugin.json"),
      readJson("plugins/smart/.claude-plugin/plugin.json"),
      read("plugins/smart/skills/my-weekly/SKILL.md"),
      read("plugins/smart/skills/my-weekly/CN.md"),
      read("plugins/smart/skills/my-weekly/agents/openai.yaml"),
      read("plugins/smart/skills/my-weekly/references/report-format.md"),
      read("plugins/smart/skills/my-weekly/references/CN[report-format].md"),
    ]);

  assert.equal(codexPlugin.version, claudePlugin.version);
  assert.match(codexPlugin.interface.defaultPrompt.join("\n"), /my-weekly/);

  assert.match(
    skill,
    /^---\nname: my-weekly\ndescription: .+\ndisable-model-invocation: true\n---\n/,
  );
  const normalizedSkill = skill.replace(/\s+/g, " ");
  for (const contract of [
    "$smart:my-weekly",
    "/smart:my-weekly",
    "$smart:my-weekly <repo> [-N]",
    "`-1` means last week",
    "Monday 00:00",
    "committer timestamp",
    "Never fetch",
    "shallow",
    "inspect the shallow boundary",
    "deepen all remote branches",
    "Do not compute a commit diff or statistics until its parent is present",
    "`ext::`",
    "--no-ext-diff --no-textconv",
    "user.email",
    "author email exactly",
    "Exclude merge commits",
    "deduplicate by full SHA",
    "Do not read stash",
    "untrusted data",
    "no commits",
    "Do not invent business impact",
    "do not integrate Issue, PR/MR",
    "authentication failure",
    "clone failure",
    "<repository-base>/-/commit/<full SHA>",
    "<repository-base>/commit/<full SHA>",
    "same Markdown link every time a short SHA appears",
    "credential-free",
    "Return Markdown directly by default",
    "Read [Weekly Report Format](references/report-format.md) completely",
    "sole source of truth for structure and wording",
    "task-private remote repository directory has been cleaned up",
  ]) {
    assert.ok(normalizedSkill.includes(contract), `缺少契约：${contract}`);
  }

  const normalizedFormat = reportFormat.replace(/\s+/g, " ");
  for (const contract of [
    "Period: <start date and time> to <end date and time>",
    "## Completed This Week",
    "Could not safely derive commit URL",
    "earliest to latest committer timestamp",
    "only when correcting an already delivered report",
    "ordinary report starts directly with the level-one title",
    "No matching non-merge commits were found in this period",
  ]) {
    assert.ok(normalizedFormat.includes(contract), `缺少格式契约：${contract}`);
  }

  for (const contract of [
    "`-1` 表示上周",
    "周一 00:00",
    "不得 fetch",
    "不读取 stash",
  ]) {
    assert.match(chinese, new RegExp(contract));
  }
  assert.match(chineseFormat, /## 本周完成/);
  assert.match(chineseFormat, /本周期没有匹配的非合并提交/);
  assert.match(openaiMetadata, /display_name: "My Weekly Report"/);
  assert.match(openaiMetadata, /default_prompt: ".*\$smart:my-weekly.*"/);
  assert.doesNotMatch(
    skill + openaiMetadata + reportFormat,
    /\/Users\/|\[TODO:|[\p{Script=Han}]/u,
  );
});
