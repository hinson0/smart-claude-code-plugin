import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

function compact(value) {
  return value.replaceAll(/\s+/g, "");
}

test("parent Ticket campaign receives independent read-only acceptance", async () => {
  const [skill, chinese, metadata, campaign] = await Promise.all([
    read("plugins/fuzz/skills/verify-all-tickets/SKILL.md"),
    read("plugins/fuzz/skills/verify-all-tickets/CN.md"),
    read("plugins/fuzz/skills/verify-all-tickets/agents/openai.yaml"),
    read("plugins/fuzz/references/ticket-campaign.md"),
  ]);

  assert.match(
    skill,
    /^---\nname: verify-all-tickets\ndescription: .+\ndisable-model-invocation: true\n---\n/,
  );
  const description = skill.match(
    /^---\nname: verify-all-tickets\ndescription: (.+)\ndisable-model-invocation: true\n---\n/,
  )?.[1];
  assert.match(description ?? "", /^Independently validate.+Use when the user wants.+$/);
  assert.doesNotMatch(description ?? "", /fresh task|read-only|\$verify-all-tickets/);

  for (const contract of [
    "$verify-all-tickets <parent Ticket>",
    "/fuzz:verify-all-tickets <parent Ticket>",
    "exactly one parent Ticket",
    "../../references/ticket-campaign.md",
    "fresh task",
    "clean worktree",
    "HEAD",
    "final campaign head",
    "read-only",
    "Never modify code, Git, comments, labels, or Ticket state",
    "actual diff",
    "development-asset",
    "Acceptance-criteria",
    "campaign base",
    "one campaign-level two-axis `code-review`",
    "full tests",
    "build",
    "type checks",
    "Execute every automatable scenario",
    "exact steps",
    "Wait for the user's complete results",
    "user-executed evidence",
    "parent objective",
    "Ticket",
    "commit",
    "automated check",
    "manual scenario",
    "awaiting manual acceptance",
  ]) {
    assert.ok(compact(skill).includes(compact(contract)), `missing verification contract: ${contract}`);
  }

  assert.match(skill, /Missing required evidence[\s\S]+prohibit a passing conclusion/i);
  assert.doesNotMatch(skill, /glab issue (?:note|update|close)/);
  assert.doesNotMatch(skill, /git (?:add|commit|push|switch|checkout)/i);
  assert.match(campaign, /final campaign head/);

  const shortDescription = metadata.match(/short_description: "([^"]+)"/)?.[1];
  assert.ok(shortDescription, "UI short description must be present");
  assert.ok(
    [...shortDescription].length >= 25 && [...shortDescription].length <= 96,
    "UI short description must remain concise",
  );
  assert.match(metadata, /display_name: "Parent Ticket Campaign Verification"/);
  assert.match(metadata, /default_prompt: ".*\$verify-all-tickets #123.*read-only.*"/);
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.match(chinese, /父票据整体验收/);
  assert.doesNotMatch(skill, /[\p{Script=Han}]/u);
  assert.doesNotMatch(metadata, /[\p{Script=Han}]/u);
});
