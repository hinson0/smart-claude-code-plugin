import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

function compact(value) {
  return value.replaceAll(/\s+/g, "");
}

test("parent Ticket delivery defaults to serial and preserves explicit parallel", async () => {
  const [skill, chinese, metadata, campaign, campaignChinese, codex, claude] =
    await Promise.all([
      read("plugins/fuzz/skills/handle-all-tickets/SKILL.md"),
      read("plugins/fuzz/skills/handle-all-tickets/CN.md"),
      read("plugins/fuzz/skills/handle-all-tickets/agents/openai.yaml"),
      read("plugins/fuzz/references/ticket-campaign.md"),
      read("plugins/fuzz/references/CN[ticket-campaign].md"),
      readJson("plugins/fuzz/.codex-plugin/plugin.json"),
      readJson("plugins/fuzz/.claude-plugin/plugin.json"),
    ]);

  assert.match(
    skill,
    /^---\nname: handle-all-tickets\ndescription: .+\ndisable-model-invocation: true\n---\n/,
  );
  const description = skill.match(
    /^---\nname: handle-all-tickets\ndescription: (.+)\ndisable-model-invocation: true\n---\n/,
  )?.[1];
  assert.match(description ?? "", /^Orchestrate and deliver.+Use when the user asks.+$/);
  assert.doesNotMatch(
    description ?? "",
    /serial mode|parallel mode|fresh context|\/implement|primary agent/,
  );

  for (const contract of [
    "$handle-all-tickets <parent Ticket> [并行]",
    "/fuzz:handle-all-tickets <parent Ticket> [并行]",
    "omitting `并行` selects serial mode",
    "only optional argument",
    "any other extra argument",
    "../../references/ticket-campaign.md",
    "create_goal",
    "get_goal",
    "update_goal",
    "different parent Ticket",
    "only one implementation subagent at a time",
    "current campaign worktree",
    "fresh context",
    "$implement",
    "candidate commit",
    "ticket_base",
    "current Ticket as Spec source",
    "single two-axis `code-review`",
    "review again after every modification",
    "does not modify implementation",
    "ticket_base..ticket_tip",
    "same implementer",
    "independent branch and worktree",
    "current accepted campaign HEAD",
    "fill all implementation slots",
    "yields before `code-review`",
    "reviewer slots",
    "pause new Ticket dispatch",
    "stable Ticket order",
    "Acceptance criterion",
    "Never treat a subagent summary as fact",
    "development assets",
    "ready-for-human",
    "awaiting-human-acceptance",
    "does not authorize push, MR/PR creation, or Ticket closure",
    "clean worktree",
    "status: complete",
  ]) {
    assert.ok(compact(skill).includes(compact(contract)), `missing skill contract: ${contract}`);
  }

  const serial = skill.match(/## Default serial mode\n\n([\s\S]+?)\n## Explicit parallel mode/)?.[1];
  assert.ok(serial, "default serial workflow must be defined");
  assert.match(compact(serial), /candidatecommit.*singletwo-axis`code-review`/);
  assert.doesNotMatch(serial, /primary agent creates an implementation commit/i);

  const parallel = skill.match(/## Explicit parallel mode\n\n([\s\S]+?)\n## Primary-agent acceptance/)?.[1];
  assert.ok(parallel, "explicit parallel workflow must remain defined");
  assert.match(compact(parallel), /independentbranchandworktree/);
  assert.match(compact(parallel), /reviewerslots/);
  assert.match(compact(parallel), /stableTicketorder/);

  for (const contract of [
    "Parent: #<iid>",
    "## Parent",
    "Blocked by",
    "mode=serial|parallel",
    "legacy progress comment without `mode`",
    "`parallel`",
    "ticket_base..ticket_tip",
    "parallel candidate must be reachable from its recorded child branch",
    "review=pending|passed",
    "`candidate` with `review=passed`",
    "without reimplementation",
    "resume the original implementer",
    "dirty stops",
    "<!-- handle-all-tickets:asset parent=<parent Ticket> ticket=<child Ticket> -->",
    "<!-- handle-all-tickets:progress parent=<parent Ticket> -->",
    "SHA-256",
    "evidence mapped to every Acceptance criterion",
    "exactly one correct triage-role label",
  ]) {
    assert.ok(compact(campaign).includes(compact(contract)), `missing shared contract: ${contract}`);
  }

  assert.match(metadata, /display_name: "Parent Ticket Delivery"/);
  assert.match(metadata, /default_prompt: ".*\$handle-all-tickets #123.*serial mode.*"/);
  assert.match(metadata, /allow_implicit_invocation: false/);
  assert.match(chinese, /父票据全程交付/);
  assert.match(campaignChinese, /Ticket campaign 共享合同/);
  assert.doesNotMatch(skill.replaceAll("并行", ""), /[\p{Script=Han}]/u);
  assert.doesNotMatch(metadata, /[\p{Script=Han}]/u);
  assert.doesNotMatch(campaign, /[\p{Script=Han}]/u);
  assert.equal(codex.version, claude.version);
  assert.match(codex.version, /^\d+\.\d+\.\d+$/);
});
