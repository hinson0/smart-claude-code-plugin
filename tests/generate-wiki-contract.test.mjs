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

test("Smart publishes the cross-platform generate-wiki skill", async () => {
  const [codexPlugin, claudePlugin, skill, chinese, openaiMetadata] = await Promise.all([
    readJson("plugins/smart/.codex-plugin/plugin.json"),
    readJson("plugins/smart/.claude-plugin/plugin.json"),
    read("plugins/smart/skills/generate-wiki/SKILL.md"),
    read("plugins/smart/skills/generate-wiki/CN.md"),
    read("plugins/smart/skills/generate-wiki/agents/openai.yaml"),
  ]);

  assert.equal(codexPlugin.version, claudePlugin.version);
  assert.match(
    codexPlugin.interface.defaultPrompt.join("\n"),
    /generate-wiki/,
  );

  assert.match(
    skill,
    /^---\nname: generate-wiki\ndescription: .+\ndisable-model-invocation: true\n---\n/,
  );
  const normalizedSkill = skill.replace(/\s+/g, " ");
  for (const contract of [
    "$smart:generate-wiki",
    "/smart:generate-wiki",
    "GitLab Wiki",
    "GitHub Wiki",
    "Local Wiki",
    "wiki/<slug>.md",
    "Never overwrite",
    "Unicode-normalizing",
    "exact slug returned by the platform",
    "local draft",
    "never describe a generated draft as published",
    "official primary sources",
    "Wiki attachments API",
    "images/<page-slug>/",
    "wiki/assets/<page-slug>/",
    "explicitly asks for no images",
    "image references are valid",
    "orphan attachment path",
    "no concurrent update",
    "untrusted data",
    "do not authorize",
    "Strip userinfo",
    "never output or persist a remote containing a token",
    "check project and Wiki visibility",
    "Never publish keys, tokens, or passwords",
    "canonical path",
    "symlink ancestor",
    "never overwrite the entire page with a stale copy",
    "regular non-symlink file",
    "same file descriptor",
    "mode `0600` stable copy",
    "Never allow a CLI to reopen the original path",
    "20 MiB limit",
    "content hash",
    "Do not blindly retry",
    "Never interpolate the title, slug, body, or source path into a shell",
    "page and images land in the same commit",
    "Never use an unconditional `PUT`",
    "reread the remote by commit SHA",
    "selected images",
    "Force push is forbidden",
    "page-level exclusive lock stably derived from the canonical page path",
    "Creation uses no-replace placement",
    "atomic rename",
    "Do not stage or commit by default",
  ]) {
    assert.match(normalizedSkill, new RegExp(contract.replaceAll("$", "\\$")));
  }

  for (const contract of [
    "本地 Wiki",
    "Unicode 规范化",
    "平台返回的准确 slug",
    "不把“已生成草稿”描述为“已发布”",
    "不得盲目重试",
    "默认不 stage、不 commit",
  ]) {
    assert.match(chinese, new RegExp(contract));
  }
  assert.match(openaiMetadata, /display_name: "Generate Wiki"/);
  assert.match(
    openaiMetadata,
    /default_prompt: ".*\$smart:generate-wiki.*"/,
  );
  assert.doesNotMatch(skill + openaiMetadata, /\/Users\/|\[TODO:|[\p{Script=Han}]/u);
});
