import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

test("the relocated Fuzz plugin preserves legacy state and agent namespaces", async () => {
  const [session, installer, toggle, skill] = await Promise.all([
    readFile(new URL("plugins/fuzz/scripts/session-start.mjs", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/scripts/install-codex-agents.mjs", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/skills/i-am-the-king/scripts/toggle-i-am-the-king.mjs", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/skills/i-am-the-king/SKILL.md", ROOT), "utf8"),
  ]);

  assert.match(session, /join\("fuzz", "i-am-the-king"\)/);
  assert.match(session, /join\("\.fuzz", "i-am-the-king\.local"\)/);
  assert.match(installer, /MANAGED_PREFIX = "fuzz-"/);
  assert.match(toggle, /join\("fuzz", "i-am-the-king"\)/);
  assert.match(toggle, /join\("\.fuzz", "i-am-the-king\.local"\)/);
  assert.match(skill, /\$CODEX_HOME\/fuzz\/i-am-the-king/);
  assert.match(skill, /\.fuzz\/i-am-the-king\.local/);
  assert.match(skill, /fuzz-\*\.toml/);
});

