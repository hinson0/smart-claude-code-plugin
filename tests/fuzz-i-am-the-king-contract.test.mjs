import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const PLUGIN_ROOT = fileURLToPath(new URL("plugins/fuzz/", ROOT));
const SKILL_ROOT = new URL("plugins/fuzz/skills/i-am-the-king/", ROOT);
const TOGGLE_SCRIPT = fileURLToPath(
  new URL("scripts/toggle-i-am-the-king.mjs", SKILL_ROOT),
);
const AGENT_COUNT = 10;

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, ROOT), "utf8"));
}

async function sessionStartCommand() {
  const hooks = await readJson("plugins/fuzz/hooks/hooks.json");
  return hooks.hooks.SessionStart[0].hooks[0].command;
}

function runHook(command, { codexHome, cwd }) {
  return execFileSync("/bin/sh", ["-c", command], {
    encoding: "utf8",
    cwd,
    env: { ...process.env, CODEX_HOME: codexHome, PLUGIN_ROOT },
    stdio: ["ignore", "pipe", "ignore"],
  });
}

async function listAgents(codexHome) {
  try {
    return (await readdir(join(codexHome, "agents"))).sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function makeGitRepository() {
  const root = await mkdtemp(join(tmpdir(), "fuzz-imperial-repo-"));
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  return root;
}

async function writeState(path, state) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${state}\n`, "utf8");
}

test("i-am-the-king keeps explicit invocation and legacy Fuzz state paths", async () => {
  const [skill, translation, metadata] = await Promise.all([
    readFile(new URL("SKILL.md", SKILL_ROOT), "utf8"),
    readFile(new URL("CN.md", SKILL_ROOT), "utf8"),
    readFile(new URL("agents/openai.yaml", SKILL_ROOT), "utf8"),
  ]);

  assert.match(skill, /^name: i-am-the-king$/m);
  assert.match(skill, /^disable-model-invocation: true$/m);
  assert.match(skill, /`\$fuzz:i-am-the-king`/);
  assert.match(skill, /`\/fuzz:i-am-the-king`/);
  assert.match(skill, /\$CODEX_HOME\/fuzz\/i-am-the-king/);
  assert.match(skill, /\.fuzz\/i-am-the-king\.local/);
  assert.match(skill, /fuzz-\*\.toml/);
  assert.match(skill, /next start, resume, or context rebuild/);
  assert.doesNotMatch(skill, /[\p{Script=Han}]/u);
  assert.match(translation, /宫廷模式/);
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.doesNotMatch(metadata, /[\p{Script=Han}]/u);
});

test("imperial mode registers only SessionStart", async () => {
  const hooks = await readJson("plugins/fuzz/hooks/hooks.json");
  assert.deepEqual(Object.keys(hooks.hooks), ["SessionStart"]);
  assert.equal(
    hooks.hooks.SessionStart[0].matcher,
    "startup|resume|clear|compact|fork",
  );
});

test("user off suppresses the prompt and removes only managed agents", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-user-off-"));
  const cwd = await mkdtemp(join(tmpdir(), "fuzz-cwd-"));
  try {
    await mkdir(join(codexHome, "agents"), { recursive: true });
    await writeFile(join(codexHome, "agents", "fuzz-qinchai.toml"), "old\n");
    await writeFile(join(codexHome, "agents", "my-own.toml"), "custom\n");
    await writeState(join(codexHome, "fuzz", "i-am-the-king"), "off");

    const output = runHook(await sessionStartCommand(), { codexHome, cwd });
    assert.equal(output, "");
    assert.deepEqual(await listAgents(codexHome), ["my-own.toml"]);
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(cwd, { force: true, recursive: true });
  }
});

test("project off suppresses the prompt without removing shared agents", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-project-off-"));
  const repository = await makeGitRepository();
  try {
    await writeState(join(repository, ".fuzz", "i-am-the-king.local"), "off");
    const output = runHook(await sessionStartCommand(), {
      codexHome,
      cwd: repository,
    });
    assert.equal(output, "");
    assert.equal((await listAgents(codexHome)).length, AGENT_COUNT);
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(repository, { force: true, recursive: true });
  }
});

test("project on overrides user off for prompt injection only", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-cross-scope-"));
  const repository = await makeGitRepository();
  try {
    await writeState(join(codexHome, "fuzz", "i-am-the-king"), "off");
    await writeState(join(repository, ".fuzz", "i-am-the-king.local"), "on");
    const output = runHook(await sessionStartCommand(), {
      codexHome,
      cwd: repository,
    });
    assert.match(output, /钦差大臣/);
    assert.deepEqual(await listAgents(codexHome), []);
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(repository, { force: true, recursive: true });
  }
});

test("toggle updates user scope and reports English runtime messages", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-toggle-user-"));
  const cwd = await mkdtemp(join(tmpdir(), "fuzz-toggle-cwd-"));
  try {
    const environment = { ...process.env, CODEX_HOME: codexHome };
    const off = spawnSync(process.execPath, [TOGGLE_SCRIPT], {
      cwd,
      env: environment,
      encoding: "utf8",
      input: "2\n",
    });
    assert.equal(off.status, 0, off.stderr);
    assert.match(off.stdout, /Imperial mode: off/);
    assert.match(off.stdout, /next session start, resume, or context rebuild/);
    assert.equal(
      await readFile(join(codexHome, "fuzz", "i-am-the-king"), "utf8"),
      "off\n",
    );

    const on = spawnSync(process.execPath, [TOGGLE_SCRIPT], {
      cwd,
      env: environment,
      encoding: "utf8",
      input: "1\n",
    });
    assert.equal(on.status, 0, on.stderr);
    assert.match(on.stdout, new RegExp(`installed ${AGENT_COUNT}`));
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(cwd, { force: true, recursive: true });
  }
});

test("toggle rejects invalid input before writing project state", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-toggle-invalid-"));
  const repository = await makeGitRepository();
  try {
    const result = spawnSync(process.execPath, [TOGGLE_SCRIPT], {
      cwd: repository,
      env: { ...process.env, CODEX_HOME: codexHome },
      encoding: "utf8",
      input: "9\n",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Imperial-mode toggle did not complete/);
    assert.doesNotMatch(result.stderr, /at .+:\d+:\d+/);
    await assert.rejects(
      readFile(join(repository, ".fuzz", "i-am-the-king.local"), "utf8"),
      { code: "ENOENT" },
    );
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(repository, { force: true, recursive: true });
  }
});

test("project toggle writes state and idempotently ignores .fuzz", async () => {
  const codexHome = await mkdtemp(join(tmpdir(), "fuzz-toggle-project-"));
  const repository = await makeGitRepository();
  try {
    const options = {
      cwd: repository,
      env: { ...process.env, CODEX_HOME: codexHome },
      encoding: "utf8",
      input: "2\n2\n",
    };
    const first = spawnSync(process.execPath, [TOGGLE_SCRIPT], options);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /Write: updated/);
    assert.match(first.stdout, /\.gitignore: added \.fuzz\//);
    assert.match(first.stdout, /agents: unchanged/);
    assert.equal(
      await readFile(join(repository, ".fuzz", "i-am-the-king.local"), "utf8"),
      "off\n",
    );
    assert.match(await readFile(join(repository, ".gitignore"), "utf8"), /^\.fuzz\/$/m);

    const second = spawnSync(process.execPath, [TOGGLE_SCRIPT], options);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /Write: already set/);
    assert.match(second.stdout, /\.fuzz\/ already ignored/);
  } finally {
    await rm(codexHome, { force: true, recursive: true });
    await rm(repository, { force: true, recursive: true });
  }
});
