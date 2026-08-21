import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./close-issue.mjs", import.meta.url));
const implementationCommit = "0123456789abcdef0123456789abcdef01234567";
const validNote = `## Implementation assets

Commit and scope.

## Acceptance evidence

Checks passed.

## Review conclusion

Approved.

## Closeout boundaries

No push, merge, or merge request was performed.
`;

async function createFakeCommand(binDir, name, body) {
  const commandPath = path.join(binDir, name);
  await writeFile(commandPath, `#!/usr/bin/env node\n${body}`, { mode: 0o755 });
}

async function readCalls(callsFile) {
  try {
    return (await readFile(callsFile, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function runCli(args, scenario = {}, note = validNote) {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "smart-close-issue-test-"));
  const binDir = path.join(fixture, "bin");
  await mkdir(binDir);
  const callsFile = path.join(fixture, "calls.jsonl");
  const noteFile = path.join(fixture, "note.md");
  await writeFile(noteFile, note);

  await createFakeCommand(
    binDir,
    "git",
    `
import { appendFileSync } from "node:fs";
const scenario = JSON.parse(process.env.SCENARIO);
const args = process.argv.slice(2);
appendFileSync(process.env.CALLS_FILE, JSON.stringify(["git", ...args]) + "\\n");
if (args[0] === "status") {
  if (scenario.dirty) process.stdout.write(" M changed.txt\\n");
} else if (args[0] === "rev-parse") {
  if (scenario.commitExists === false) process.exit(1);
  process.stdout.write(scenario.resolvedCommit ?? "${implementationCommit}\\n");
} else if (args[0] === "symbolic-ref") {
  if (scenario.currentBranchExists === false) process.exit(1);
  process.stdout.write(scenario.currentBranch ?? "feature/issue-42\\n");
} else if (args[0] === "merge-base") {
  if (scenario.headContainsCommit === false) process.exit(1);
}
`,
  );
  await createFakeCommand(
    binDir,
    "glab",
    `
import { appendFileSync } from "node:fs";
const scenario = JSON.parse(process.env.SCENARIO);
const args = process.argv.slice(2);
appendFileSync(process.env.CALLS_FILE, JSON.stringify(["glab", ...args]) + "\\n");
if (args[0] !== "issue") process.exit(90);
if (args[1] === "view") {
  if (scenario.issueReadSucceeds === false) process.exit(1);
  process.stdout.write(JSON.stringify({
    iid: 42,
    state: scenario.issueState ?? "opened",
    web_url: "https://gitlab.example/group/project/-/issues/42",
  }));
} else if (args[1] === "note") {
  if (scenario.noteSucceeds === false) process.exit(1);
  process.stdout.write("Created note: https://gitlab.example/group/project/-/issues/42#note_7\\n");
} else if (args[1] === "close") {
  if (scenario.closeSucceeds === false) process.exit(1);
  process.stdout.write("Closed https://gitlab.example/group/project/-/issues/42\\n");
}
`,
  );

  const resolvedArgs = args.map((arg) => (arg === "$NOTE" ? noteFile : arg));
  const result = spawnSync(process.execPath, [script, ...resolvedArgs], {
    cwd: fixture,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
      CALLS_FILE: callsFile,
      SCENARIO: JSON.stringify(scenario),
    },
  });
  const calls = await readCalls(callsFile);
  await rm(fixture, { recursive: true, force: true });
  return {
    ...result,
    calls,
    json: result.stdout.trim() ? JSON.parse(result.stdout) : undefined,
  };
}

const checkArgs = [
  "check",
  "--issue",
  "42",
  "--commit",
  implementationCommit,
];
const closeArgs = [
  "close",
  "--issue",
  "42",
  "--commit",
  implementationCommit,
  "--note-file",
  "$NOTE",
];

function gitLabWrites(calls) {
  return calls.filter(
    ([command, group, action]) =>
      command === "glab" && group === "issue" && ["note", "close"].includes(action),
  );
}

test("check reports ready after implementation assets are committed on the current branch", async () => {
  const result = await runCli(checkArgs);
  assert.equal(result.status, 0);
  assert.equal(result.json.status, "ready");
  assert.equal(result.json.currentBranch, "feature/issue-42");
  assert.equal(result.json.headContainsCommit, true);
  assert.equal(
    result.calls.some(
      ([command, action]) =>
        command === "git" && ["fetch", "show-ref"].includes(action),
    ),
    false,
  );
  assert.deepEqual(gitLabWrites(result.calls), []);
});

test("check accepts exactly one full GitLab Issue URL", async () => {
  const issueUrl = "https://gitlab.example/group/project/-/issues/42";
  const result = await runCli(checkArgs.with(2, issueUrl));
  assert.equal(result.status, 0);
  assert.equal(result.json.status, "ready");
  assert.equal(
    result.calls.find(([command, group, action]) =>
      command === "glab" && group === "issue" && action === "view"
    )[3],
    issueUrl,
  );
});

for (const [name, scenario, blocker] of [
  ["the Issue cannot be read", { issueReadSucceeds: false }, "Issue read"],
  ["the Issue is closed", { issueState: "closed" }, "Issue is closed"],
  ["the worktree is dirty", { dirty: true }, "uncommitted changes"],
  ["the implementation commit is missing", { commitExists: false }, "Implementation commit check"],
  ["the current branch cannot be confirmed", { currentBranchExists: false }, "current implementation branch"],
  ["the current branch excludes the commit", { headContainsCommit: false }, "does not contain"],
]) {
  test(`check reports not_ready and performs no GitLab write when ${name}`, async () => {
    const result = await runCli(checkArgs, scenario);
    assert.equal(result.status, 2);
    assert.equal(result.json.status, "not_ready");
    assert.match(result.json.blockers.join("\n"), new RegExp(blocker, "i"));
    assert.deepEqual(gitLabWrites(result.calls), []);
  });
}

for (const [name, note] of [
  ["required headings are missing", "## Implementation assets\n\nOnly one section."],
  ["an Authorization header is present", `${validNote}\nAuthorization: Bearer abcdefghijklmnop`],
  ["a known token assignment is present", `${validNote}\nGITLAB_TOKEN=secret-value`],
]) {
  test(`close rejects the note before writing when ${name}`, async () => {
    const result = await runCli(closeArgs, {}, note);
    assert.equal(result.status, 2);
    assert.equal(result.json.status, "not_ready");
    assert.equal(result.json.failure, "note_failed");
    assert.deepEqual(gitLabWrites(result.calls), []);
  });
}

test("a note publishing failure prevents Issue close", async () => {
  const result = await runCli(closeArgs, { noteSucceeds: false });
  assert.equal(result.status, 1);
  assert.equal(result.json.status, "not_ready");
  assert.equal(result.json.failure, "note_failed");
  assert.equal(gitLabWrites(result.calls).length, 1);
  assert.equal(gitLabWrites(result.calls)[0][2], "note");
});

test("a close failure after a successful note reports partial completion", async () => {
  const result = await runCli(closeArgs, { closeSucceeds: false });
  assert.equal(result.status, 1);
  assert.equal(result.json.status, "partially_completed");
  assert.equal(result.json.stage, "noted");
  assert.equal(result.json.failure, "close_failed");
  assert.equal(result.json.noteUrl, "https://gitlab.example/group/project/-/issues/42#note_7");
});

test("a successful close returns durable note and Issue URLs", async () => {
  const result = await runCli(closeArgs);
  assert.equal(result.status, 0);
  assert.equal(result.json.status, "closed");
  assert.equal(result.json.noteUrl, "https://gitlab.example/group/project/-/issues/42#note_7");
  assert.equal(result.json.issueUrl, "https://gitlab.example/group/project/-/issues/42");
});

for (const [name, args] of [
  ["multiple Issue candidates", checkArgs.with(2, "42,43")],
  ["a non-SHA commit", checkArgs.with(4, "not-a-sha")],
  ["a write option on check", [...checkArgs, "--note-file", "$NOTE"]],
  ["the removed integration exception", [...closeArgs, "--allow-local-only"]],
  ["an unsafe GitLab project path", [...checkArgs, "--repo", "../project"]],
]) {
  test(`argument validation fails closed for ${name}`, async () => {
    const result = await runCli(args);
    assert.equal(result.status, 64);
    assert.deepEqual(result.calls, []);
  });
}
