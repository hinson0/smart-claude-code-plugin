import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const url = new URL(entry.name, directory);
    if (entry.isDirectory()) files.push(...(await collectFiles(new URL(`${entry.name}/`, directory))));
    else files.push(url);
  }
  return files;
}

test("Smart contains no legacy Fuzz namespace or removed capability", async () => {
  const files = await collectFiles(new URL("plugins/smart/", ROOT));
  for (const file of files) {
    if (!file.pathname.endsWith(".md") && !file.pathname.endsWith(".yaml") && !file.pathname.endsWith(".json")) continue;
    const content = await readFile(file, "utf8");
    assert.doesNotMatch(content, /\/fuzz:|\$fuzz:|fuzz@smart/);
    assert.doesNotMatch(content, /handle-all-tickets|verify-all-tickets|i-am-the-king/);
  }
});

test("Smart keeps its existing hooks and rules", async () => {
  const hooks = await readFile(new URL("plugins/smart/hooks/hooks.json", ROOT), "utf8");
  const rules = await readdir(new URL("plugins/smart/rules/", ROOT));
  assert.match(hooks, /SessionStart/);
  assert.match(hooks, /PreToolUse/);
  assert.deepEqual(
    rules.filter((file) => file.endsWith(".md")).sort(),
    ["CN.md", "fastapi.md", "pydantic-v2.md", "python-3.14.md", "sqlalchemy-v2.md"],
  );
});
