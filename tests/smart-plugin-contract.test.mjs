import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const SMART_SKILLS = [
  "ask",
  "close-issue",
  "commit",
  "generate-wiki",
  "github-skills-pdf",
  "help",
  "html",
  "hud",
  "learning",
  "local",
  "my-weekly",
  "one-by-one",
  "show",
];
const REFERENCES = [
  "skills/github-skills-pdf/references/book-format.md",
  "skills/github-skills-pdf/references/translation-guide.md",
  "skills/my-weekly/references/report-format.md",
  "skills/show/references/layouts.md",
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

function pluginNames(marketplace) {
  return marketplace.plugins.map((plugin) => plugin.name).sort();
}

test("both marketplaces publish only Smart", async () => {
  const [codex, claude] = await Promise.all([
    readJson(".agents/plugins/marketplace.json"),
    readJson(".claude-plugin/marketplace.json"),
  ]);

  assert.deepEqual(pluginNames(codex), ["smart"]);
  assert.deepEqual(pluginNames(claude), ["smart"]);
});

test("Smart is one dual-host version 6.0.0 release", async () => {
  const [codex, claude] = await Promise.all([
    readJson("plugins/smart/.codex-plugin/plugin.json"),
    readJson("plugins/smart/.claude-plugin/plugin.json"),
  ]);

  assert.equal(codex.name, "smart");
  assert.equal(claude.name, "smart");
  assert.equal(codex.version, "6.0.0");
  assert.equal(claude.version, "6.0.0");
  assert.equal(codex.skills, "./skills/");
});

test("Smart exposes exactly the agreed skill surface", async () => {
  const entries = await readdir(new URL("plugins/smart/skills/", ROOT), {
    withFileTypes: true,
  });
  const actual = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(actual, SMART_SKILLS);
  await assert.rejects(access(new URL("plugins/fuzz/.codex-plugin/plugin.json", ROOT)));
});

test("every Smart skill and reference has its Chinese companion", async () => {
  for (const skill of SMART_SKILLS) {
    const files = await readdir(new URL(`plugins/smart/skills/${skill}/`, ROOT));
    assert.ok(files.includes("SKILL.md"), `${skill} is missing SKILL.md`);
    assert.ok(files.includes("CN.md"), `${skill} is missing CN.md`);
  }

  for (const reference of REFERENCES) {
    const slash = reference.lastIndexOf("/");
    const directory = reference.slice(0, slash + 1);
    const name = reference.slice(slash + 1, -3);
    const files = await readdir(new URL(`plugins/smart/${directory}`, ROOT));
    assert.ok(files.includes(`CN[${name}].md`), `${reference} is missing CN companion`);
  }
});
