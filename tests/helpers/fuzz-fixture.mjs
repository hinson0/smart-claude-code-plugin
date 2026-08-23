import { chmod, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = new URL("../../", import.meta.url);
export const ROOT_PATH = fileURLToPath(ROOT);
export const FUZZ_ROOT = new URL("plugins/fuzz/", ROOT);

export async function makeCodexHome(prefix = "smart-fuzz-test-") {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function installExecutable(directory, name, source) {
  await mkdir(directory, { recursive: true });
  const path = join(directory, name);
  await writeFile(path, source, "utf8");
  await chmod(path, 0o755);
  return path;
}

export async function installFakeGitAndGlab(directory, { git = "", glab = "" } = {}) {
  const defaultProgram = "#!/bin/sh\nexit 0\n";
  await Promise.all([
    installExecutable(directory, "git", git || defaultProgram),
    installExecutable(directory, "glab", glab || defaultProgram),
  ]);
  return { PATH: `${directory}:${process.env.PATH ?? ""}` };
}

export function isolatedEnvironment(codexHome, extra = {}) {
  return {
    ...process.env,
    CODEX_HOME: codexHome,
    HOME: codexHome,
    ...extra,
  };
}

