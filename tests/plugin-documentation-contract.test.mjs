import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const READMES = ["README.md", "README_CN.md", "README_TW.md", "README_KO.md", "README_JA.md"];
const REQUIRED = [
  "smart@smart",
  "fuzz@smart",
  "/smart:*",
  "/fuzz:*",
  "fuzz@ce-workflow",
  "claude plugin uninstall fuzz@ce-workflow",
  "codex plugin remove fuzz@ce-workflow",
  "close-issue",
  "one-by-one",
  "advance-one-step",
  "html",
  "show",
];

test("all five README variants describe the same independent plugin surface", async () => {
  for (const file of READMES) {
    const content = await readFile(new URL(file, ROOT), "utf8");
    for (const token of REQUIRED) {
      assert.ok(content.includes(token), `${file} is missing ${token}`);
    }
  }
});

