#!/usr/bin/env python3

"""
Stop hook: capture CC's open loops into the project notebook.

Fires when the assistant finishes a reply. Reads the transcript, takes the
LAST assistant message, and extracts two kinds of "open loop" block that CC
naturally emits — the `★ Insight … ─────` border block and a
"建议的下一步 / Suggested next steps" heading section — appending each as a
candidate lead to `.smart/notebook.md` under "## 🔵 Open".

Idempotent: each block is fingerprinted with a short content hash embedded as
an `<!-- h:... -->` marker, so re-reading the full transcript never
double-writes the same lead.

This hook is best-effort telemetry, not a gate: it must NEVER block or delay a
reply. Any malformed input or unexpected error exits 0 silently.
"""

import hashlib
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

OPEN_HEADING = "## 🔵 Open（CC 抛出、尚未跟进的线索）\n"
CLOSED_HEADING = "## ✅ Closed（已跟进 / 已回答 / 已采纳）\n"

# ★ Insight opener line, its body, then a closing border of box-drawing dashes.
INSIGHT_RE = re.compile(r"★\s*Insight[^\n]*\n(.*?)\n[ \t]*─{5,}", re.DOTALL)

# "建议的下一步 / 建议下一步 / Suggested next steps / Next steps" heading line,
# optionally wrapped in markdown heading marks or bold.
NEXT_STEP_RE = re.compile(
    r"^[ \t]*(?:#{1,6}[ \t]*|\*\*)?[ \t]*"
    r"(?:建议的?下一步|Suggested next steps|Next steps)\b.*$",
    re.IGNORECASE | re.MULTILINE,
)

# A markdown heading line, used to bound a next-step section.
HEADING_RE = re.compile(r"^[ \t]*#{1,6}[ \t]", re.MULTILINE)


def read_last_assistant_text(transcript_path):
    """Return the text of the last assistant message in the JSONL transcript, or ''."""
    last = ""
    try:
        with open(transcript_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                # Transcript entries usually wrap the message under "message";
                # fall back to the object itself for flatter formats.
                msg = obj.get("message", obj)
                if not isinstance(msg, dict) or msg.get("role") != "assistant":
                    continue
                content = msg.get("content", "")
                if isinstance(content, str):
                    text = content
                elif isinstance(content, list):
                    parts = [
                        b.get("text", "")
                        for b in content
                        if isinstance(b, dict) and b.get("type") == "text"
                    ]
                    text = "\n".join(parts)
                else:
                    text = ""
                if text.strip():
                    last = text
    except OSError:
        return ""
    return last


def extract_blocks(text):
    """Return a list of (source, block_text) open-loop blocks found in text."""
    blocks = []

    for m in INSIGHT_RE.finditer(text):
        body = m.group(1).strip()
        if body:
            blocks.append(("insight", body))

    for m in NEXT_STEP_RE.finditer(text):
        start = m.end()
        nxt = HEADING_RE.search(text, start)
        end = nxt.start() if nxt else len(text)
        body = text[start:end].strip()
        if body:
            blocks.append(("next-step", body))

    return blocks


def norm_hash(s):
    """Short stable fingerprint of normalized content, for dedup."""
    norm = re.sub(r"\s+", " ", s).strip().lower()
    return hashlib.sha1(norm.encode("utf-8")).hexdigest()[:10]


def ensure_scaffold(text):
    """Guarantee the file has the Open/Closed sections; preserve any user content."""
    if OPEN_HEADING in text:
        return text
    header = (
        "# 做题本 · Notebook\n"
        "<!-- 自动由 Stop hook 捕获 · /smart:notebook 管理 -->\n\n"
        + OPEN_HEADING
        + "\n"
        + CLOSED_HEADING
    )
    return header if not text.strip() else header + "\n" + text


def insert_into_open(text, new_block):
    """Insert new_block right after the Open heading (newest first)."""
    idx = text.find(OPEN_HEADING)
    if idx == -1:
        return text.rstrip() + "\n\n" + new_block
    at = idx + len(OPEN_HEADING)
    return text[:at] + "\n" + new_block + text[at:]


def main():
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return  # never block the reply

    transcript_path = data.get("transcript_path")
    if not transcript_path or not Path(transcript_path).exists():
        return

    text = read_last_assistant_text(transcript_path)
    if not text:
        return

    blocks = extract_blocks(text)
    if not blocks:
        return

    project_dir = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
    nb = project_dir / ".smart" / "notebook.md"
    nb.parent.mkdir(parents=True, exist_ok=True)

    existing = nb.read_text(encoding="utf-8") if nb.exists() else ""
    seen = set(re.findall(r"<!--\s*h:([0-9a-f]{10})\s*-->", existing))
    ids = [int(n) for n in re.findall(r"^[ \t]*-[ \t]*\[[ x]\][ \t]*N(\d+)\b", existing, re.MULTILINE)]
    next_id = (max(ids) + 1) if ids else 1

    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    added = []
    for source, body in blocks:
        h = norm_hash(body)
        if h in seen:
            continue
        seen.add(h)
        title = re.sub(r"\s+", " ", body.splitlines()[0]).strip()[:80]
        excerpt = re.sub(r"\s+", " ", body).strip()[:280]
        added.append(
            f"- [ ] N{next_id} {title}  · 🕒 {ts} · 来源:{source} <!-- h:{h} -->\n"
            f"  > {excerpt}\n"
        )
        next_id += 1

    if not added:
        return

    out = ensure_scaffold(existing)
    for block in reversed(added):  # keep numeric order after newest-first insert
        out = insert_into_open(out, block)
    nb.write_text(out, encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Best-effort: a capture failure must never disrupt the session.
        sys.exit(0)
