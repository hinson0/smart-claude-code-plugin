import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

test("Fuzz ask exposes one explicit read-only contract on both hosts", async () => {
  const [skill, translation, metadata] = await Promise.all([
    read("plugins/fuzz/skills/ask/SKILL.md"),
    read("plugins/fuzz/skills/ask/CN.md"),
    read("plugins/fuzz/skills/ask/agents/openai.yaml"),
  ]);

  assert.match(
    skill,
    /^---\nname: ask\ndescription: .+\ndisable-model-invocation: true\n---\n/,
  );
  assert.match(skill, /explicitly invokes `\$fuzz:ask`/);
  assert.match(skill, /`\/fuzz:ask`/);
  assert.match(skill, /Do not modify files/);
  assert.match(skill, /run shell commands/);
  assert.match(skill, /call external services/);
  assert.match(skill, /start subagents/);
  assert.doesNotMatch(skill, /[\p{Script=Han}]/u);

  assert.match(translation, /\$fuzz:ask/);
  assert.match(translation, /不修改文件/);
  assert.match(metadata, /default_prompt: "Use \$fuzz:ask/);
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.doesNotMatch(metadata, /[\p{Script=Han}]/u);
});
