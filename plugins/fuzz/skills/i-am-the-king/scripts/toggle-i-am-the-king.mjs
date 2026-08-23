import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import {
  installAgents,
  resolveCodexHome,
  uninstallAgents,
} from "../../../scripts/install-codex-agents.mjs";

const PLUGIN_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const USER_STATE_RELATIVE = join("fuzz", "i-am-the-king");
const PROJECT_STATE_RELATIVE = join(".fuzz", "i-am-the-king.local");
const PROJECT_IGNORE_ENTRY = ".fuzz/";
const NEXT_SESSION_MESSAGE =
  "\nImperial mode will use the new state at the next session start, resume, or context rebuild.\n";

function createPrompter() {
  const terminal = createInterface({ input: process.stdin });
  const answers = terminal[Symbol.asyncIterator]();
  return {
    ask: async (prompt) => {
      process.stdout.write(prompt);
      const answer = await answers.next();
      if (answer.done) throw new Error("input ended before an answer was received");
      return answer.value;
    },
    close: () => terminal.close(),
  };
}

function projectRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function readState(statePath) {
  try {
    return (await readFile(statePath, "utf8")).trim() === "off" ? "off" : "on";
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeState(statePath, state) {
  const desired = `${state}\n`;
  let current;
  try {
    current = await readFile(statePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (current === desired) return false;

  await mkdir(dirname(statePath), { recursive: true });
  const temporaryPath = `${statePath}.tmp`;
  await writeFile(temporaryPath, desired, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, statePath);
  return true;
}

async function ensureProjectIgnore(root) {
  const ignorePath = join(root, ".gitignore");
  let content = "";
  try {
    content = await readFile(ignorePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (content.split("\n").some((line) => line.trim() === PROJECT_IGNORE_ENTRY)) {
    return false;
  }
  const separator = content && !content.endsWith("\n") ? "\n" : "";
  await writeFile(
    ignorePath,
    `${content}${separator}${PROJECT_IGNORE_ENTRY}\n`,
    "utf8",
  );
  return true;
}

function describeState(state) {
  if (state === null) return "not set";
  return state === "on" ? "on" : "off";
}

async function chooseScope(prompter, root, userState, projectState) {
  process.stdout.write(`Current user scope: ${describeState(userState)}\n`);
  if (!root) {
    process.stdout.write("Not in a Git repository; only user scope is available.\n\n");
    return "user";
  }

  process.stdout.write(
    `Current project scope (${root}): ${describeState(projectState)}\n`,
  );
  process.stdout.write("Imperial mode defaults to on when neither scope is set.\n\n");
  const answer = (
    await prompter.ask("Choose scope [1] user-wide [2] current project: ")
  ).trim();
  if (answer === "1") return "user";
  if (answer === "2") return "project";
  throw new Error("scope must be 1 or 2");
}

async function chooseState(prompter) {
  const answer = (
    await prompter.ask("Choose target state [1] on [2] off: ")
  ).trim();
  if (answer === "1") return "on";
  if (answer === "2") return "off";
  throw new Error("target state must be 1 or 2");
}

async function main() {
  const prompter = createPrompter();
  try {
    const root = projectRoot();
    const codexHome = resolveCodexHome();
    const userStatePath = join(codexHome, USER_STATE_RELATIVE);
    const projectStatePath = root ? join(root, PROJECT_STATE_RELATIVE) : null;
    const userState = await readState(userStatePath);
    const projectState = projectStatePath
      ? await readState(projectStatePath)
      : null;
    const scope = await chooseScope(prompter, root, userState, projectState);
    const state = await chooseState(prompter);
    const statePath = scope === "user" ? userStatePath : projectStatePath;
    const changed = await writeState(statePath, state);

    process.stdout.write(`\nState file: ${statePath}\n`);
    process.stdout.write(`Scope: ${scope === "user" ? "user-wide" : "current project"}\n`);
    process.stdout.write(`Imperial mode: ${describeState(state)}\n`);
    process.stdout.write(changed ? "Write: updated\n" : "Write: already set\n");

    if (scope === "project") {
      const ignored = await ensureProjectIgnore(root);
      process.stdout.write(
        ignored ? ".gitignore: added .fuzz/\n" : ".gitignore: .fuzz/ already ignored\n",
      );
      process.stdout.write(
        "Official-title agents: unchanged; only user scope manages shared agents.\n",
      );
      process.stdout.write(NEXT_SESSION_MESSAGE);
      return;
    }

    if (state === "on") {
      const installed = await installAgents({
        pluginRoot: PLUGIN_ROOT,
        codexHome,
      });
      process.stdout.write(`Official-title agents: installed ${installed}\n`);
    } else {
      const removed = await uninstallAgents({ codexHome });
      process.stdout.write(`Official-title agents: removed ${removed}\n`);
    }
    process.stdout.write(NEXT_SESSION_MESSAGE);
  } finally {
    prompter.close();
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write(`Imperial-mode toggle did not complete: ${error.message}\n`);
  process.exitCode = 1;
}
