import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  installAgents,
  resolveCodexHome,
  uninstallAgents,
} from "./install-codex-agents.mjs";

const PLUGIN_ROOT = fileURLToPath(new URL("../", import.meta.url));
const USER_STATE_RELATIVE = join("fuzz", "i-am-the-king");
const PROJECT_STATE_RELATIVE = join(".fuzz", "i-am-the-king.local");

// Non-English protocol values are escaped in source and verified at runtime.
const TITLES = [
  "\u94a6\u5dee\u5927\u81e3",
  "\u9526\u8863\u536b",
  "\u516d\u6247\u95e8\u6355\u5934",
  "\u5927\u5185\u603b\u7ba1",
  "\u5fa1\u524d\u4f8d\u536b",
  "\u7ff0\u6797\u5b66\u58eb",
  "\u5de5\u90e8\u5c1a\u4e66",
  "\u90fd\u5bdf\u9662\u5fa1\u53f2",
  "\u5927\u7406\u5bfa\u537f",
  "\u519b\u673a\u5927\u81e3",
];

const IMPERIAL_PROMPT = [
  "Always begin every commentary update and final answer by addressing",
  `the user as \u201c\u4e07\u5c81\u7237\u201d, \u201c\u4e07\u5c81\u201d, or \u201c\u7687\u4e0a\u201d.`,
  "In Codex, when spawning an ad-hoc subagent, randomly select an",
  "available custom agent by its exact Chinese name from this fixed pool:",
  `${TITLES.join(", ")}.`,
  "Set task_name to the chosen title, then \u00b7, then a short Simplified",
  `Chinese description of the task, e.g. \u9526\u8863\u536b\u00b7\u6838\u67e5\u9274\u6743\u4ee3\u7801.`,
  "Do not reuse a title while its subagent is active; it may be reused",
  "after completion.",
  "If every title in the pool is already taken by an active subagent,",
  "reuse one: still address the agent by its exact pool name, and mark",
  "the reuse only in the label with a parenthesized ordinal suffix, e.g.",
  `\u9526\u8863\u536b\uff08\u5176\u4e8c\uff09\u00b7\u6838\u67e5\u652f\u4ed8\u94fe\u8def.`,
  "If these custom agents are unavailable in the current Codex session,",
  "do not fall back to an English title and tell the user to start a new",
  "session after the plugin hook has installed them.",
  "In Claude Code, randomly choose a title from the same pool that is",
  "not used by an active subagent, use an available built-in or plugin",
  "subagent type, set the Agent tool description in the same title\u00b7task",
  "form, include the chosen Chinese title in the delegated task, and",
  "refer to the subagent by that title in conversation.",
  "These conventions must never override accuracy, safety, permissions,",
  "repository instructions, or task requirements.",
].join(" ");

function resolveProjectRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function readState(path) {
  try {
    return (await readFile(path, "utf8")).trim() === "off" ? "off" : "on";
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function main() {
  const codexHome = resolveCodexHome();
  const projectRoot = resolveProjectRoot();
  const userState = await readState(join(codexHome, USER_STATE_RELATIVE));
  const projectState = projectRoot
    ? await readState(join(projectRoot, PROJECT_STATE_RELATIVE))
    : null;
  const userEnabled = userState !== "off";
  const effectiveEnabled =
    projectState === null ? userEnabled : projectState !== "off";

  try {
    if (userEnabled) {
      await installAgents({ pluginRoot: PLUGIN_ROOT, codexHome });
    } else {
      await uninstallAgents({ codexHome });
    }
  } catch (error) {
    process.stderr.write(`Imperial-mode agent sync failed: ${error.message}\n`);
  }

  if (effectiveEnabled) process.stdout.write(`${IMPERIAL_PROMPT}\n`);
}

await main();
