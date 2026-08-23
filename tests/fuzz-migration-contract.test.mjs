import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const READMES = ["README.md", "README_CN.md", "README_TW.md", "README_KO.md", "README_JA.md"];

test("all README variants document a no-double-install Fuzz source switch", async () => {
  for (const file of READMES) {
    const content = await readFile(new URL(file, ROOT), "utf8");
    assert.match(content, /fuzz@ce-workflow/, `${file} must name the old installation`);
    assert.match(content, /fuzz@smart/, `${file} must name the new installation`);
    assert.match(content, /claude plugin uninstall fuzz@ce-workflow/);
    assert.match(content, /claude plugin install fuzz@smart/);
    assert.match(content, /codex plugin remove fuzz@ce-workflow/);
    assert.match(content, /codex plugin add fuzz@smart/);
    assert.match(content, /new session|新(?:建)?会话|新(?:建|立)?會話|새 세션|新しいセッション/i);
    assert.match(content, /do not install both|不得同时安装|不得同時安裝|동시에 설치하지|同時にインストールしない/i);
    assert.doesNotMatch(content, /marketplace remove ce-workflow|marketplace delete ce-workflow/i);
  }
});
