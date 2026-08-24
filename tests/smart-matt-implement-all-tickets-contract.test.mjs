import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

test("Smart matt-implement-all-tickets serializes Matt implement workers and closeout", async () => {
  const [skill, translation, metadata] = await Promise.all([
    read("plugins/smart/skills/matt-implement-all-tickets/SKILL.md"),
    read("plugins/smart/skills/matt-implement-all-tickets/CN.md"),
    read("plugins/smart/skills/matt-implement-all-tickets/agents/openai.yaml"),
  ]);

  assert.match(skill, /^name: matt-implement-all-tickets$/m);
  assert.match(skill, /^disable-model-invocation: true$/m);
  assert.match(skill, /Matt `implement` skill to have been explicitly invoked/);
  assert.match(skill, /Use exactly the ordered Ticket set/);
  assert.match(skill, /Fork one fresh implementation/);
  assert.match(skill, /only then fork the next one/);
  assert.match(skill, /GitHub Issues, GitLab Issues, or local Markdown Tickets/);
  assert.match(skill, /report every other tracker as unsupported/);
  assert.match(skill, /worker report as a pointer to evidence, not as evidence/);
  for (const heading of [
    "Implementation assets",
    "Acceptance evidence",
    "Review conclusion",
    "Closeout boundaries",
  ]) {
    assert.match(skill, new RegExp(`## ${heading}`));
  }
  assert.match(skill, /Only verified closure completes this Ticket/);
  assert.match(skill, /does not authorize push, merge, MR\/PR creation/);

  assert.match(translation, /^name: matt-implement-all-tickets$/m);
  assert.match(translation, /显式调用 Matt 的 `implement` skill/);
  assert.match(translation, /严格遵循 `\/to-tickets` 的发布顺序/);
  assert.match(translation, /其他 tracker 一律报告为不支持/);

  assert.match(metadata, /display_name: "smart:matt-implement-all-tickets"/);
  assert.match(metadata, /\$smart:matt-implement-all-tickets/);
  assert.match(metadata, /\$mattpocock-skills:implement/);
  assert.match(metadata, /allow_implicit_invocation: false/);
});
