#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const REQUIRED_NOTE_HEADINGS = [
  "## Implementation assets",
  "## Acceptance evidence",
  "## Review conclusion",
  "## Closeout boundaries",
];

const SECRET_PATTERNS = [
  /^\s*(?:authorization|private-token)\s*:/im,
  /\b(?:GLAB_TOKEN|GITLAB_TOKEN|CI_JOB_TOKEN|OPENAI_API_KEY)\s*=/,
  /\bBearer\s+[A-Za-z0-9._~-]{8,}/i,
];

function usage() {
  return `Usage:
  close-issue.mjs check --issue <iid-or-url> --commit <sha> [--repo <group/project>]
  close-issue.mjs close --issue <iid-or-url> --commit <sha> --note-file <path> [--repo <group/project>]`;
}

function parseArgs(argv) {
  const action = argv.shift();
  if (!new Set(["check", "close"]).has(action)) {
    throw new Error("The first argument must be check or close");
  }

  const values = {};
  const valueOptions = new Set([
    "--issue",
    "--commit",
    "--repo",
    "--note-file",
  ]);

  while (argv.length > 0) {
    const option = argv.shift();
    if (!valueOptions.has(option)) throw new Error(`Unknown option: ${option}`);
    if (Object.hasOwn(values, option)) {
      throw new Error(`${option} must not be repeated`);
    }
    const value = argv.shift();
    if (!value || value.startsWith("--")) {
      throw new Error(`${option} requires a value`);
    }
    values[option] = value;
  }

  for (const required of ["--issue", "--commit"]) {
    if (!values[required]) throw new Error(`${required} is required`);
  }
  if (action === "close" && !values["--note-file"]) {
    throw new Error("close requires --note-file");
  }
  if (action === "check" && values["--note-file"]) {
    throw new Error("check does not accept write options");
  }

  const issue = validateIssue(values["--issue"]);
  const commit = values["--commit"];
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error("--commit must be a 7-40 character hexadecimal commit SHA");
  }

  return {
    action,
    issue,
    commit,
    repo: values["--repo"]
      ? validateProjectPath(values["--repo"])
      : undefined,
    noteFile: values["--note-file"],
  };
}

function validateIssue(value) {
  if (/^#?\d+$/.test(value)) return value.replace(/^#/, "");
  try {
    const url = new URL(value);
    if (
      !new Set(["http:", "https:"]).has(url.protocol) ||
      !url.hostname ||
      !/\/-\/issues\/\d+\/?$/.test(url.pathname) ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return value;
  } catch {
    throw new Error("--issue must be exactly one Issue IID or GitLab Issue URL");
  }
}

function validateProjectPath(value) {
  const segments = value.split("/");
  if (
    !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(value) ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error("--repo must be a safe GitLab project path");
  }
  return value;
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) {
    return { ok: false, stdout: "", failure: `${label} could not start` };
  }
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    failure:
      result.status === 0
        ? undefined
        : `${label} failed with exit code ${result.status}`,
  };
}

function glabArgs(args, repo) {
  return repo ? [...args, "--repo", repo] : args;
}

function parseIssue(stdout, fallback) {
  try {
    const issue = JSON.parse(stdout);
    return {
      id: issue.iid ?? fallback,
      state: String(issue.state ?? "").toLowerCase(),
      url:
        issue.web_url ??
        issue.webUrl ??
        (/^https?:\/\//.test(fallback) ? fallback : undefined),
    };
  } catch {
    return {
      id: fallback,
      state: "unknown",
      url: /^https?:\/\//.test(fallback) ? fallback : undefined,
    };
  }
}

function extractUrl(stdout) {
  const matches = stdout.match(/https?:\/\/[^\s]+/g);
  return matches?.at(-1)?.replace(/[),.;]+$/, "");
}

function inspect(options) {
  const issueRead = run(
    "glab",
    glabArgs(
      ["issue", "view", options.issue, "--comments", "--output", "json"],
      options.repo,
    ),
    "Issue read",
  );
  if (!issueRead.ok) {
    return {
      status: "not_ready",
      blockers: [issueRead.failure],
      failure: "issue_read_failed",
    };
  }

  const issue = parseIssue(issueRead.stdout, options.issue);
  const blockers = [];
  if (issue.state !== "opened" && issue.state !== "open") {
    blockers.push(
      issue.state === "closed"
        ? "Issue is closed"
        : "Could not confirm that the Issue is open",
    );
  }

  const worktree = run("git", ["status", "--porcelain=v1"], "Worktree check");
  if (!worktree.ok) blockers.push(worktree.failure);
  const worktreeClean = worktree.ok && worktree.stdout.length === 0;
  if (worktree.ok && !worktreeClean) {
    blockers.push("The worktree contains uncommitted changes");
  }

  const resolved = run(
    "git",
    ["rev-parse", "--verify", "--end-of-options", `${options.commit}^{commit}`],
    "Implementation commit check",
  );
  const commitExists = resolved.ok && /^[0-9a-f]{40}$/i.test(resolved.stdout);
  if (!commitExists) {
    blockers.push(
      resolved.ok ? "Could not resolve the implementation commit" : resolved.failure,
    );
  }
  const implementationCommit = commitExists
    ? resolved.stdout.toLowerCase()
    : options.commit;

  const branch = run(
    "git",
    ["symbolic-ref", "--quiet", "--short", "HEAD"],
    "Current branch check",
  );
  const currentBranch = branch.ok ? branch.stdout : undefined;
  if (!currentBranch) {
    blockers.push("Could not confirm the current implementation branch");
  }

  const headContainsCommit =
    commitExists &&
    run(
      "git",
      ["merge-base", "--is-ancestor", implementationCommit, "HEAD"],
      "Current branch containment check",
    ).ok;
  if (commitExists && !headContainsCommit) {
    blockers.push(
      "The current implementation branch does not contain the implementation commit",
    );
  }

  return {
    status: blockers.length === 0 ? "ready" : "not_ready",
    issue,
    implementationCommit,
    worktreeClean,
    currentBranch,
    headContainsCommit,
    blockers,
  };
}

async function validateNote(path) {
  let note;
  try {
    note = await readFile(path, "utf8");
  } catch {
    throw new Error("Could not read --note-file");
  }
  if (!note.trim()) throw new Error("The development asset note must not be empty");
  const missing = REQUIRED_NOTE_HEADINGS.filter(
    (heading) => !note.includes(heading),
  );
  if (missing.length > 0) {
    throw new Error(`The development asset note is missing: ${missing.join(", ")}`);
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(note))) {
    throw new Error(
      "The development asset note may contain a secret or Authorization header",
    );
  }
  return note;
}

function emit(payload, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = exitCode;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 64;
    return;
  }

  const report = inspect(options);
  if (options.action === "check") {
    emit(report, report.status === "ready" ? 0 : 2);
    return;
  }

  if (report.status !== "ready") {
    emit(report, 2);
    return;
  }

  let note;
  try {
    note = await validateNote(options.noteFile);
  } catch (error) {
    emit(
      {
        ...report,
        status: "not_ready",
        failure: "note_failed",
        blockers: [...report.blockers, error.message],
      },
      2,
    );
    return;
  }

  const noteResult = run(
    "glab",
    glabArgs(
      ["issue", "note", options.issue, "--message", note],
      options.repo,
    ),
    "Development asset note publication",
  );
  if (!noteResult.ok) {
    emit(
      {
        ...report,
        status: "not_ready",
        failure: "note_failed",
        blockers: [...report.blockers, noteResult.failure],
      },
      1,
    );
    return;
  }

  const noteUrl = extractUrl(noteResult.stdout);
  const closeResult = run(
    "glab",
    glabArgs(["issue", "close", options.issue], options.repo),
    "Issue close",
  );
  if (!closeResult.ok) {
    emit(
      {
        ...report,
        status: "partially_completed",
        stage: "noted",
        failure: "close_failed",
        noteUrl,
        blockers: [closeResult.failure],
      },
      1,
    );
    return;
  }

  emit({
    ...report,
    status: "closed",
    noteUrl,
    issueUrl: report.issue.url,
    blockers: [],
  });
}

await main();
