import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import inventory from "./fixtures/fuzz-components.json" with { type: "json" };

const ROOT = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(new URL(`${entry.name}/`, directory), relative)));
    } else {
      files.push(relative);
    }
  }
  return files.sort();
}

function pluginNames(marketplace) {
  return marketplace.plugins.map((plugin) => plugin.name).sort();
}

test("both marketplaces publish independent smart and fuzz plugins", async () => {
  const [codex, claude] = await Promise.all([
    readJson(".agents/plugins/marketplace.json"),
    readJson(".claude-plugin/marketplace.json"),
  ]);

  assert.deepEqual(pluginNames(codex), ["fuzz", "smart"]);
  assert.deepEqual(pluginNames(claude), ["fuzz", "smart"]);

  const codexFuzz = codex.plugins.find((plugin) => plugin.name === "fuzz");
  const claudeFuzz = claude.plugins.find((plugin) => plugin.name === "fuzz");
  assert.equal(codexFuzz.source.path, "./plugins/fuzz");
  assert.equal(claudeFuzz.source, "./plugins/fuzz");
});

test("fuzz manifests are independent version 3.0.0", async () => {
  const [codex, claude] = await Promise.all([
    readJson("plugins/fuzz/.codex-plugin/plugin.json"),
    readJson("plugins/fuzz/.claude-plugin/plugin.json"),
  ]);

  assert.equal(codex.name, "fuzz");
  assert.equal(claude.name, "fuzz");
  assert.equal(codex.version, inventory.fuzz.version);
  assert.equal(claude.version, inventory.fuzz.version);
  assert.equal(codex.skills, "./skills/");
});

test("fuzz ships the complete 41-file payload without imperial mode", async () => {
  const actual = await collectFiles(new URL("plugins/fuzz/", ROOT));
  const removed = new Set(inventory.fuzz.removedFiles);
  const expected = [...inventory.source.files, ...inventory.fuzz.additionalFiles]
    .filter((file) => !removed.has(file))
    .sort();
  assert.equal(actual.length, inventory.fuzz.targetFileCount);
  assert.deepEqual(actual, expected);
  assert.ok(actual.every((file) => !file.includes("i-am-the-king")));
  assert.ok(actual.every((file) => !file.startsWith("codex-agents/")));
  assert.ok(actual.every((file) => !file.startsWith("hooks/")));
});

test("every fuzz skill and reference has its Chinese companion", async () => {
  for (const skill of inventory.fuzz.skills) {
    const files = await readdir(new URL(`plugins/fuzz/skills/${skill}/`, ROOT));
    assert.ok(files.includes("SKILL.md"), `${skill} is missing SKILL.md`);
    assert.ok(files.includes("CN.md"), `${skill} is missing CN.md`);
  }

  for (const reference of inventory.fuzz.references) {
    const slash = reference.lastIndexOf("/");
    const directory = reference.slice(0, slash + 1);
    const name = reference.slice(slash + 1, -3);
    const files = await readdir(new URL(`plugins/fuzz/${directory}`, ROOT));
    assert.ok(files.includes(`CN[${name}].md`), `${reference} is missing CN companion`);
  }
});

test("smart payload and version remain unchanged", async () => {
  const tree = execFileSync("git", ["rev-parse", "HEAD:plugins/smart"], {
    cwd: new URL(".", ROOT),
    encoding: "utf8",
  }).trim();
  const [codex, claude] = await Promise.all([
    readJson("plugins/smart/.codex-plugin/plugin.json"),
    readJson("plugins/smart/.claude-plugin/plugin.json"),
  ]);

  assert.equal(tree, inventory.smart.tree);
  assert.equal(codex.version, inventory.smart.version);
  assert.equal(claude.version, inventory.smart.version);
});
