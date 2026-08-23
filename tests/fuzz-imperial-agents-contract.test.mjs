import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const PLUGIN_ROOT = fileURLToPath(new URL("plugins/fuzz/", ROOT));
const EXPECTED_AGENTS = new Map([
  ["butou.toml", "六扇门捕头"],
  ["dali.toml", "大理寺卿"],
  ["jinyiwei.toml", "锦衣卫"],
  ["junji.toml", "军机大臣"],
  ["qinchai.toml", "钦差大臣"],
  ["shangshu.toml", "工部尚书"],
  ["shiwei.toml", "御前侍卫"],
  ["xueshi.toml", "翰林学士"],
  ["yushi.toml", "都察院御史"],
  ["zongguan.toml", "大内总管"],
]);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

function decodeTomlName(source) {
  const encoded = source.match(/^name = "([^"]+)"$/m)?.[1];
  assert.ok(encoded, "agent must declare a name");
  return JSON.parse(`"${encoded}"`);
}

test("SessionStart sources stay English while runtime prompt preserves titles", async () => {
  const hooks = await readJson("plugins/fuzz/hooks/hooks.json");
  const command = hooks.hooks.SessionStart[0].hooks[0].command;
  const source = await readFile(
    new URL("plugins/fuzz/scripts/session-start.mjs", ROOT),
    "utf8",
  );

  assert.match(command, /PLUGIN_ROOT/);
  assert.match(command, /CLAUDE_PLUGIN_ROOT/);
  assert.match(command, /scripts\/session-start\.mjs/);
  assert.match(source, /exact Chinese name/);
  assert.match(source, /Set task_name to the chosen title/);
  assert.match(source, /In Claude Code, randomly choose a title/);
  assert.doesNotMatch(source, /[\p{Script=Han}]/u);

  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-runtime-prompt-"));
  try {
    const output = execFileSync("/bin/sh", ["-c", command], {
      encoding: "utf8",
      cwd: codexHome,
      env: { ...process.env, CODEX_HOME: codexHome, PLUGIN_ROOT },
    });
    assert.match(output, /万岁爷/);
    assert.match(output, /锦衣卫·核查鉴权代码/);
    assert.match(output, /锦衣卫（其二）·核查支付链路/);
    for (const name of EXPECTED_AGENTS.values()) {
      assert.match(output, new RegExp(name));
    }
  } finally {
    await rm(codexHome, { force: true, recursive: true });
  }
});

test("ten escaped TOML definitions decode to exact Chinese titles", async () => {
  const directory = new URL("plugins/fuzz/codex-agents/", ROOT);
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".toml"))
    .sort();
  assert.deepEqual(files, [...EXPECTED_AGENTS.keys()].sort());

  for (const file of files) {
    const source = await readFile(new URL(file, directory), "utf8");
    assert.doesNotMatch(source, /[\p{Script=Han}]/u);
    assert.equal(decodeTomlName(source), EXPECTED_AGENTS.get(file));
    assert.match(source, /^description = ".+"$/m);
    assert.match(source, /^developer_instructions = """$/m);
  }
});

test("agent installer is idempotent and preserves unmanaged files", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-agent-install-"));
  try {
    const agents = join(codexHome, "agents");
    await mkdir(agents, { recursive: true });
    await writeFile(join(agents, "fuzz-stale.toml"), "stale\n");
    await writeFile(join(agents, "my-own.toml"), "custom\n");
    const command = (
      await readJson("plugins/fuzz/hooks/hooks.json")
    ).hooks.SessionStart[0].hooks[0].command;
    const options = {
      encoding: "utf8",
      cwd: codexHome,
      env: { ...process.env, CODEX_HOME: codexHome, PLUGIN_ROOT },
    };
    execFileSync("/bin/sh", ["-c", command], options);
    execFileSync("/bin/sh", ["-c", command], options);

    const files = (await readdir(agents)).sort();
    assert.ok(files.includes("my-own.toml"));
    assert.ok(!files.includes("fuzz-stale.toml"));
    assert.deepEqual(
      files.filter((file) => file.startsWith("fuzz-")),
      [...EXPECTED_AGENTS.keys()].map((file) => `fuzz-${file}`).sort(),
    );
  } finally {
    await rm(codexHome, { force: true, recursive: true });
  }
});

test("CLAUDE_PLUGIN_ROOT resolves the same independent Fuzz payload", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-claude-root-"));
  try {
    const command = (
      await readJson("plugins/fuzz/hooks/hooks.json")
    ).hooks.SessionStart[0].hooks[0].command;
    const environment = {
      ...process.env,
      CODEX_HOME: codexHome,
      CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
    };
    delete environment.PLUGIN_ROOT;
    execFileSync("/bin/sh", ["-c", command], {
      encoding: "utf8",
      cwd: codexHome,
      env: environment,
    });
    assert.equal((await readdir(join(codexHome, "agents"))).length, 10);
  } finally {
    await rm(codexHome, { force: true, recursive: true });
  }
});

test("agent sync failure still emits the escaped runtime convention", async () => {
  const brokenRoot = await mkdtemp(join(tmpdir(), "fuzz-broken-root-"));
  try {
    await mkdir(join(brokenRoot, "scripts"), { recursive: true });
    await cp(
      join(PLUGIN_ROOT, "scripts", "session-start.mjs"),
      join(brokenRoot, "scripts", "session-start.mjs"),
    );
    await cp(
      join(PLUGIN_ROOT, "scripts", "install-codex-agents.mjs"),
      join(brokenRoot, "scripts", "install-codex-agents.mjs"),
    );
    const command = (
      await readJson("plugins/fuzz/hooks/hooks.json")
    ).hooks.SessionStart[0].hooks[0].command;
    const output = execFileSync("/bin/sh", ["-c", command], {
      encoding: "utf8",
      cwd: brokenRoot,
      env: {
        ...process.env,
        PLUGIN_ROOT: brokenRoot,
        CODEX_HOME: brokenRoot,
      },
      stdio: ["ignore", "pipe", "ignore"],
    });
    assert.match(output, /万岁爷/);
    assert.match(output, /钦差大臣/);
  } finally {
    await rm(brokenRoot, { force: true, recursive: true });
  }
});
