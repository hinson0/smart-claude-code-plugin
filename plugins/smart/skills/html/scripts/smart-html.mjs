import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE = fileURLToPath(
  new URL("../assets/document.html", import.meta.url),
);

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value) {
  const tokens = [];
  const token = (markup) => {
    const key = `\u0000${tokens.length}\u0000`;
    tokens.push(markup);
    return key;
  };

  let rendered = value.replace(
    /\[([^\]\n]+)\]\(([^)\s]+)\)/g,
    (source, label, href) => {
      const safe =
        /^(?:https?:|mailto:|#|\/|\.{1,2}\/)/i.test(href) ||
        !/^[A-Za-z][A-Za-z\d+.-]*:/.test(href);
      if (!safe) return source;
      const rel = /^(?:https?:)?\/\//i.test(href)
        ? ' rel="noopener noreferrer"'
        : "";
      return token(
        `<a href="${escapeHtml(href)}"${rel}>${escapeHtml(label)}</a>`,
      );
    },
  );
  rendered = escapeHtml(rendered)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>");

  return rendered.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[index]);
}

function renderMarkdown(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    }
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    const roots = [];
    const stack = [];
    for (const item of listItems) {
      while (stack.length && item.indent <= stack.at(-1).indent) stack.pop();
      const node = { ...item, children: [] };
      if (stack.length) stack.at(-1).node.children.push(node);
      else roots.push(node);
      stack.push({ indent: item.indent, node });
    }

    const renderList = (items) => {
      const parts = [];
      let type;
      for (const item of items) {
        if (item.type !== type) {
          if (type) parts.push(`</${type}>`);
          type = item.type;
          parts.push(`<${type}>`);
        }
        const children = item.children.length
          ? `\n${renderList(item.children)}\n`
          : "";
        parts.push(`<li>${renderInline(item.text)}${children}</li>`);
      }
      if (type) parts.push(`</${type}>`);
      return parts.join("\n");
    };

    output.push(renderList(roots));
    listItems = [];
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      flush();
      const code = [];
      while (++index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
      }
      const language = fence[1] ? ` class="language-${fence[1]}"` : "";
      output.push(
        `<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^(\s*)[-+*]\s+(.+)$/);
    const ordered = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const match = unordered ?? ordered;
      listItems.push({
        indent: match[1].replaceAll("\t", "  ").length,
        text: match[2],
        type: unordered ? "ul" : "ol",
      });
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flush();
  return output.join("\n");
}

async function main([inputArgument, outputArgument]) {
  const inputPath = resolve(inputArgument);
  const outputPath = outputArgument
    ? resolve(outputArgument)
    : resolve(dirname(inputPath), `${basename(inputPath, extname(inputPath))}.html`);
  if (inputPath === outputPath) {
    const error = new Error("output path must differ from the input path");
    error.exitCode = 64;
    throw error;
  }

  let markdown;
  try {
    markdown = await readFile(inputPath, "utf8");
  } catch {
    const error = new Error(`cannot read Markdown input: ${inputPath}`);
    error.exitCode = 66;
    throw error;
  }

  const template = await readFile(TEMPLATE, "utf8");
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(inputPath);
  const rendered = template
    .replaceAll("{{TITLE}}", escapeHtml(firstHeading))
    .replace("{{CONTENT}}", renderMarkdown(markdown))
    .replace("{{SOURCE}}", escapeHtml(inputPath))
    .replace("{{GENERATED_AT}}", new Date().toISOString());

  try {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, rendered);
  } catch {
    const error = new Error(`cannot write HTML output: ${outputPath}`);
    error.exitCode = 73;
    throw error;
  }

  const target = outputPath.includes(" ") ? `<${outputPath}>` : outputPath;
  console.log(`HTML generated: [View HTML](${target})`);
}

const arguments_ = process.argv.slice(2);
if (!arguments_[0]) {
  console.error("html: missing Markdown input file");
  console.error("Usage: html <input.md> [output.html]");
  process.exitCode = 64;
} else {
  main(arguments_).catch((error) => {
    console.error(`html: ${error.message}`);
    process.exitCode = error.exitCode ?? 1;
  });
}
