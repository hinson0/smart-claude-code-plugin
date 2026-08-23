import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const SCRIPT = fileURLToPath(
  new URL("plugins/fuzz/skills/html/scripts/ce-html.mjs", ROOT),
);

test("Fuzz HTML preserves document structure and escapes raw HTML", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fuzz-html-"));
  try {
    const input = join(directory, "review.md");
    await writeFile(
      input,
      [
        "# Release check",
        "",
        "Confirm **scope** first.",
        "",
        "## Result",
        "",
        "- repo-a",
        "  - api",
        "- repo-b",
        "",
        "```sh",
        "git status --short",
        "```",
        "",
        "<script>alert('x')</script>",
        "",
      ].join("\n"),
    );

    const output = execFileSync(process.execPath, [SCRIPT, input], {
      encoding: "utf8",
    });
    const htmlPath = join(directory, "review.html");
    const html = await readFile(htmlPath, "utf8");

    assert.equal(output, `HTML generated: [View HTML](${htmlPath})\n`);
    assert.match(html, /<h1>Release check<\/h1>/);
    assert.match(html, /<strong>scope<\/strong>/);
    assert.match(html, /<ul>[\s\S]*<li>api<\/li>[\s\S]*<\/ul>/);
    assert.match(html, /<code class="language-sh">git status --short<\/code>/);
    assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /Derived from Markdown/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("Fuzz HTML keeps safe relative links clickable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "fuzz-html-"));
  try {
    const input = join(directory, "review.md");
    await writeFile(input, "# Review\n\nSee [Spec](docs/spec.md).\n");
    execFileSync(process.execPath, [SCRIPT, input]);
    const html = await readFile(join(directory, "review.html"), "utf8");
    assert.match(html, /See <a href="docs\/spec\.md">Spec<\/a>\./);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("Fuzz HTML reports deterministic input and output failures", async () => {
  const missing = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
  assert.equal(missing.status, 64);
  assert.equal(
    missing.stderr,
    "html: missing Markdown input file\nUsage: html <input.md> [output.html]\n",
  );

  const directory = await mkdtemp(join(tmpdir(), "fuzz-html-"));
  try {
    const input = join(directory, "review.md");
    await writeFile(input, "# Review\n");
    const samePath = spawnSync(process.execPath, [SCRIPT, input, input], {
      encoding: "utf8",
    });
    assert.equal(samePath.status, 64);
    assert.equal(
      samePath.stderr,
      "html: output path must differ from the input path\n",
    );
    assert.equal(await readFile(input, "utf8"), "# Review\n");

    const blockedParent = join(directory, "blocked");
    const output = join(blockedParent, "review.html");
    await writeFile(blockedParent, "not a directory");
    const blocked = spawnSync(process.execPath, [SCRIPT, input, output], {
      encoding: "utf8",
    });
    assert.equal(blocked.status, 73);
    assert.equal(blocked.stderr, `html: cannot write HTML output: ${output}\n`);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("Fuzz HTML exposes English runtime sources and a Chinese pair", async () => {
  const [skill, translation, metadata, script, template] = await Promise.all([
    readFile(new URL("plugins/fuzz/skills/html/SKILL.md", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/skills/html/CN.md", ROOT), "utf8"),
    readFile(
      new URL("plugins/fuzz/skills/html/agents/openai.yaml", ROOT),
      "utf8",
    ),
    readFile(new URL("plugins/fuzz/skills/html/scripts/ce-html.mjs", ROOT), "utf8"),
    readFile(new URL("plugins/fuzz/skills/html/assets/document.html", ROOT), "utf8"),
  ]);

  assert.match(skill, /`\$fuzz:html`/);
  assert.match(skill, /`\/fuzz:html`/);
  assert.match(skill, /<this-skill-directory>\/scripts\/ce-html\.mjs/);
  assert.match(translation, /将一个 Markdown 文件转换/);
  for (const source of [skill, metadata, script, template]) {
    assert.doesNotMatch(source, /[\p{Script=Han}]/u);
  }
});
