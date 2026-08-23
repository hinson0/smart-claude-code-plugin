import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const SCRIPT = fileURLToPath(
  new URL(
    "plugins/fuzz/skills/close-issue/scripts/close-issue.mjs",
    ROOT,
  ),
);
const COMMIT = "a".repeat(40);
const NOTE = `## 实现资产

- commit: ${COMMIT}

## 验收证据

- mock test passed

## Review 结论

- 无阻塞问题

## 收口边界

- 未执行 push 或 MR
`;

async function createFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "close-issue-test-"));
  const bin = join(root, "bin");
  const log = join(root, "commands.log");
  const note = join(root, "note.md");
  await mkdir(bin);
  await writeFile(note, NOTE);

  const git = join(bin, "git");
  await writeFile(
    git,
    `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
appendFileSync(process.env.MOCK_LOG, \`git \${args.join(" ")}\\n\`);
if (args[0] === "status") {
  if (process.env.MOCK_DIRTY === "1") process.stdout.write(" M changed.txt\\n");
  process.exit(0);
}
if (args[0] === "rev-parse") {
  process.stdout.write("${COMMIT}\\n");
  process.exit(0);
}
if (args[0] === "show-ref" && args.at(-1).startsWith("refs/remotes/") && process.env.MOCK_REMOTE_EXISTS === "0") {
  process.exit(1);
}
if (args[0] === "merge-base" && args.at(-1).startsWith("refs/remotes/") && process.env.MOCK_REMOTE_INCLUDED === "0") {
  process.exit(1);
}
process.exit(0);
`,
  );

  const glab = join(bin, "glab");
  await writeFile(
    glab,
    `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const args = process.argv.slice(2);
const operation = \`\${args[0]} \${args[1]}\`;
appendFileSync(process.env.MOCK_LOG, \`glab \${operation}\\n\`);
if (operation === "issue view") {
  process.stdout.write(JSON.stringify({ iid: 79, state: "opened", web_url: "https://gitlab.example.test/group/project/-/issues/79" }));
  process.exit(0);
}
if (operation === "issue note") {
  if (process.env.MOCK_NOTE_FAIL === "1") process.exit(1);
  process.stdout.write("https://gitlab.example.test/group/project/-/issues/79#note_42\\n");
  process.exit(0);
}
if (operation === "issue close") {
  if (process.env.MOCK_CLOSE_FAIL === "1") process.exit(1);
  process.stdout.write("closed\\n");
  process.exit(0);
}
process.exit(64);
`,
  );
  await Promise.all([chmod(git, 0o755), chmod(glab, 0o755)]);
  t.after(() => rm(root, { recursive: true, force: true }));

  return { root, bin, log, note };
}

function invoke(fixture, action, extraEnv = {}, extraArgs = []) {
  const args = [
    SCRIPT,
    action,
    "--issue",
    "79",
    "--commit",
    COMMIT,
    "--target-branch",
    "main",
  ];
  if (action === "close") args.push("--note-file", fixture.note);
  args.push(...extraArgs);

  return spawnSync(process.execPath, args, {
    cwd: fixture.root,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${fixture.bin}${delimiter}${process.env.PATH}`,
      MOCK_LOG: fixture.log,
      ...extraEnv,
    },
  });
}

async function glabOperations(fixture) {
  const log = await readFile(fixture.log, "utf8");
  return log
    .split("\n")
    .filter((line) => line.startsWith("glab ") && line.length > 5);
}

test("close-issue preserves authorization, evidence, and write order", async () => {
  const [skill, chinese, metadata, script, codexPlugin, claudePlugin] =
    await Promise.all([
      readFile(
        new URL("plugins/fuzz/skills/close-issue/SKILL.md", ROOT),
        "utf8",
      ),
      readFile(
        new URL("plugins/fuzz/skills/close-issue/CN.md", ROOT),
        "utf8",
      ),
      readFile(
        new URL("plugins/fuzz/skills/close-issue/agents/openai.yaml", ROOT),
        "utf8",
      ),
      readFile(
        new URL(
          "plugins/fuzz/skills/close-issue/scripts/close-issue.mjs",
          ROOT,
        ),
        "utf8",
      ),
      JSON.parse(
        await readFile(
          new URL("plugins/fuzz/.codex-plugin/plugin.json", ROOT),
          "utf8",
        ),
      ),
      JSON.parse(
        await readFile(
          new URL("plugins/fuzz/.claude-plugin/plugin.json", ROOT),
          "utf8",
        ),
      ),
    ]);

  assert.match(
    skill,
    /^---\nname: close-issue\ndescription: .+\n---\n/,
  );
  const normalizedSkill = skill.replace(/\s+/g, " ");
  for (const contract of [
    "authorizes only a read-only check",
    "Treat unclear intent as a read-only check",
    "does not include push, merge, MR/PR creation, checklist",
    "local target branch",
    "remote target branch",
    "Refresh the target remote ref",
    "does not authorize this exception",
    "## 实现资产",
    "## 验收证据",
    "## Review 结论",
    "## 收口边界",
    "the note was not published and close was not attempted",
    "partially_completed",
    "outside the Git worktree",
    "fake `git` and `glab`",
  ]) {
    assert.match(normalizedSkill, new RegExp(contract.replaceAll("/", "\\/")));
  }
  for (const contract of [
    "仅授权只读核对",
    "意图不明确时按只读核对处理",
    "不包含 push、merge、创建 MR/PR、修改 checklist 或标签",
    "本地目标分支",
    "远端目标分支",
    "普通“关闭 Issue”授权不等于该例外授权",
  ]) {
    assert.match(chinese, new RegExp(contract.replaceAll("/", "\\/")));
  }
  assert.match(metadata, /display_name: "Issue Closeout"/);
  assert.match(metadata, /default_prompt: ".*\$close-issue.*"/);
  assert.doesNotMatch(metadata, /allow_implicit_invocation: false/);
  assert.match(script, /\["issue", "note"/);
  assert.match(script, /\["issue", "close"/);
  assert.equal(codexPlugin.version, claudePlugin.version);
  assert.match(codexPlugin.description, /Issue closeout/i);
  assert.match(claudePlugin.description, /Issue closeout/i);
  const protocolHeadings = /## (?:实现资产|验收证据|Review 结论|收口边界)/gu;
  const protocolNeutralRuntime = (skill + metadata).replace(
    protocolHeadings,
    "",
  );
  assert.doesNotMatch(protocolNeutralRuntime, /[\p{Script=Han}]/u);
  const protocolNeutralScript = script.replace(
    protocolHeadings,
    "",
  );
  assert.doesNotMatch(protocolNeutralScript, /[\p{Script=Han}]/u);
});

test("check remains read-only and returns ready", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(fixture, "check");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "ready");
  assert.deepEqual(await glabOperations(fixture), ["glab issue view"]);
});

test("close closes only after the note succeeds", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(fixture, "close");
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(output.status, "closed");
  assert.equal(
    output.noteUrl,
    "https://gitlab.example.test/group/project/-/issues/79#note_42",
  );
  assert.deepEqual(await glabOperations(fixture), [
    "glab issue view",
    "glab issue note",
    "glab issue close",
  ]);
});

test("a failed note stops before Issue close", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(fixture, "close", { MOCK_NOTE_FAIL: "1" });
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(output.status, "not_ready");
  assert.equal(output.failure, "note_failed");
  assert.deepEqual(await glabOperations(fixture), [
    "glab issue view",
    "glab issue note",
  ]);
});

test("missing remote integration blocks note and close by default", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(fixture, "close", { MOCK_REMOTE_INCLUDED: "0" });
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 2);
  assert.equal(output.status, "not_ready");
  assert.equal(output.target.localIncluded, true);
  assert.equal(output.target.remoteIncluded, false);
  assert.deepEqual(await glabOperations(fixture), ["glab issue view"]);
});

test("explicit authorization bypasses only missing remote integration", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(
    fixture,
    "close",
    { MOCK_REMOTE_INCLUDED: "0" },
    ["--allow-local-only"],
  );
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(output.status, "closed");
  assert.equal(output.warnings.length, 1);
  assert.deepEqual(await glabOperations(fixture), [
    "glab issue view",
    "glab issue note",
    "glab issue close",
  ]);
});

test("a close failure after note reports partial completion", async (t) => {
  const fixture = await createFixture(t);
  const result = invoke(fixture, "close", { MOCK_CLOSE_FAIL: "1" });
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(output.status, "partially_completed");
  assert.equal(output.stage, "noted");
  assert.ok(output.noteUrl);
  assert.deepEqual(await glabOperations(fixture), [
    "glab issue view",
    "glab issue note",
    "glab issue close",
  ]);
});
