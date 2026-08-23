import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Fuzz exclusively manages the fuzz-*.toml namespace under CODEX_HOME/agents.
const MANAGED_PREFIX = "fuzz-";
const MANAGED_SUFFIX = ".toml";

function isManagedAgent(fileName) {
  return (
    fileName.startsWith(MANAGED_PREFIX) && fileName.endsWith(MANAGED_SUFFIX)
  );
}

export function resolveCodexHome() {
  return process.env.CODEX_HOME || join(homedir(), ".codex");
}

export function resolvePluginRoot() {
  return process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT;
}

export async function installAgents({ pluginRoot, codexHome }) {
  const sourceDirectory = join(pluginRoot, "codex-agents");
  const targetDirectory = join(codexHome, "agents");

  await mkdir(targetDirectory, { recursive: true });

  const sourceFiles = (await readdir(sourceDirectory))
    .filter((file) => file.endsWith(MANAGED_SUFFIX))
    .sort();

  for (const sourceFile of sourceFiles) {
    const sourcePath = join(sourceDirectory, sourceFile);
    const targetPath = join(targetDirectory, `${MANAGED_PREFIX}${sourceFile}`);
    const sourceContent = await readFile(sourcePath, "utf8");

    let targetContent;
    try {
      targetContent = await readFile(targetPath, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    if (targetContent !== sourceContent) {
      await writeFile(targetPath, sourceContent, "utf8");
    }
  }

  const managedFiles = new Set(
    sourceFiles.map((file) => `${MANAGED_PREFIX}${file}`),
  );

  for (const installedFile of await readdir(targetDirectory)) {
    if (isManagedAgent(installedFile) && !managedFiles.has(installedFile)) {
      // A stale managed file must not prevent the remaining agents from syncing.
      await rm(join(targetDirectory, installedFile), { force: true });
    }
  }

  return sourceFiles.length;
}

export async function uninstallAgents({ codexHome }) {
  const targetDirectory = join(codexHome, "agents");

  let installedFiles;
  try {
    installedFiles = await readdir(targetDirectory);
  } catch (error) {
    if (error?.code === "ENOENT") return 0;
    throw error;
  }

  let removed = 0;
  for (const installedFile of installedFiles) {
    if (!isManagedAgent(installedFile)) continue;
    await rm(join(targetDirectory, installedFile), { force: true });
    removed += 1;
  }

  return removed;
}

async function main() {
  const pluginRoot = resolvePluginRoot();
  if (!pluginRoot) return;
  await installAgents({ pluginRoot, codexHome: resolveCodexHome() });
}

const entryPoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : "";

if (import.meta.url === entryPoint) await main();
