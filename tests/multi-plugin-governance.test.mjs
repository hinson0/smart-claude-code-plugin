import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

test("smart and fuzz are independent dual-host releases", async () => {
  const [smartCodex, smartClaude, fuzzCodex, fuzzClaude, codexMarket, claudeMarket] =
    await Promise.all([
      readJson("plugins/smart/.codex-plugin/plugin.json"),
      readJson("plugins/smart/.claude-plugin/plugin.json"),
      readJson("plugins/fuzz/.codex-plugin/plugin.json"),
      readJson("plugins/fuzz/.claude-plugin/plugin.json"),
      readJson(".agents/plugins/marketplace.json"),
      readJson(".claude-plugin/marketplace.json"),
    ]);

  assert.equal(smartCodex.version, smartClaude.version);
  assert.equal(smartCodex.version, "5.0.0");
  assert.equal(fuzzCodex.version, fuzzClaude.version);
  assert.equal(fuzzCodex.version, "2.0.0");
  assert.notEqual(smartCodex.version, fuzzCodex.version);
  assert.deepEqual(codexMarket.plugins.map((p) => p.name).sort(), ["fuzz", "smart"]);
  assert.deepEqual(claudeMarket.plugins.map((p) => p.name).sort(), ["fuzz", "smart"]);

  const smartTree = execFileSync("git", ["rev-parse", "HEAD:plugins/smart"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  assert.equal(smartTree, "ad9d3639e31805814e736afda21f43e59eb86302");
});

test("plugin payloads do not proxy each other", async () => {
  const [smartHooks, fuzzHooks, fuzzSession] = await Promise.all([
    readFile(new URL("plugins/smart/hooks/hooks.json", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/hooks/hooks.json", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/scripts/session-start.mjs", ROOT), "utf8"),
  ]);

  assert.doesNotMatch(smartHooks, /i-am-the-king|fuzz-|imperial/i);
  assert.doesNotMatch(fuzzHooks, /session-logs|notebook-capture|greet\.sh/);
  assert.doesNotMatch(fuzzSession, /plugins\/smart|\.smart\//);
});

