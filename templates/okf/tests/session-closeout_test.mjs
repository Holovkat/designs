#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { canonicalKnowledgeChangeJson } from "../lib/knowledge-change-set.mjs";
import { publicSessionCloseoutPlan, writeSessionCloseout } from "../lib/session-closeout.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(resolve(testDir, "../schema/fixtures/knowledge-change/valid/complete.json"), "utf8"));
let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack ?? error.message}`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixtureRoot() {
  const root = mkdtempSync(resolve(realpathSync(tmpdir()), "okf-session-closeout-"));
  git(root, ["init", "-b", "test-session"]);
  git(root, ["config", "user.email", "okf@example.invalid"]);
  git(root, ["config", "user.name", "OKF Fixture"]);
  mkdirSync(resolve(root, "knowledge/inbox"), { recursive: true });
  mkdirSync(resolve(root, ".okf/closeout"), { recursive: true });
  const inboxIndex = "# Inbox\n\n| Title | Timestamp | Tags | Issues |\n|-------|-----------|------|--------|\n<!-- Rows added by agents, removed by curation agent -->\n";
  const rootIndex = "# Fixture Knowledge\n\n| Group | Count | Description |\n|-------|-------|-------------|\n| [Inbox](./inbox/index.md) | 8 | Pending captures |\n";
  writeFileSync(resolve(root, "knowledge/inbox/index.md"), inboxIndex);
  writeFileSync(resolve(root, "knowledge/index.md"), rootIndex);

  const value = structuredClone(fixture);
  for (const [index, capture] of value.captures.entries()) {
    const content = Buffer.from(`---\ntype: Inbox\ntitle: Capture ${index + 1}\n---\n# Why And How\n\nFixture ${index + 1}.\n# Impact\n\nFixture.\n`, "utf8");
    writeFileSync(resolve(root, capture.source.path), content);
    capture.source.size_bytes = content.length;
    capture.source.sha256 = sha256(content);
  }
  value.capture_selection.manifest_sha256 = sha256(Buffer.from(inboxIndex));
  git(root, ["add", "knowledge"]);
  git(root, ["commit", "-m", "fixture: seed closeout inputs"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  value.session.repository = "fixture/session-closeout";
  value.session.branch = "test-session";
  value.session.base_revision = head;
  value.session.head_revision = head;
  value.inbox.commit_shas = [head];
  const changeSetPath = ".okf/closeout/session.change.json";
  writeFileSync(resolve(root, changeSetPath), canonicalKnowledgeChangeJson(value));
  return { root, value, changeSetPath };
}

test("one source plans and writes the Tier 2 Markdown, sidecar, and indexes", () => {
  const { root, changeSetPath } = fixtureRoot();
  const plan = publicSessionCloseoutPlan(root, changeSetPath);
  assert.equal(plan.complete, true);
  assert.equal(plan.writes.filter(({ action }) => action === "create").length, 2);
  const receipt = writeSessionCloseout(root, changeSetPath);
  assert.equal(receipt.status, "written-complete");
  const markdown = readFileSync(resolve(root, receipt.outputs.markdown), "utf8");
  assert.deepEqual([...markdown.matchAll(/^# (.+)$/gmu)].map((match) => match[1]), [
    "Decisions Made", "What Was Deprecated", "Lessons Learned", "Current State",
  ]);
  assert.equal(readFileSync(resolve(root, "knowledge/inbox/index.md"), "utf8").includes(receipt.outputs.markdown.split("/").at(-1)), true);
  assert.equal(readFileSync(resolve(root, "knowledge/index.md"), "utf8").includes("| [Inbox](./inbox/index.md) | 9 |"), true);
});

test("identical replay is idempotent and does not duplicate the index row", () => {
  const { root, changeSetPath } = fixtureRoot();
  const first = writeSessionCloseout(root, changeSetPath);
  const second = writeSessionCloseout(root, changeSetPath);
  assert.equal(second.writes.every(({ action }) => action === "unchanged"), true);
  const index = readFileSync(resolve(root, "knowledge/inbox/index.md"), "utf8");
  assert.equal(index.split(first.outputs.markdown.split("/").at(-1)).length - 1, 1);
});

test("unrelated dirty work and capture drift fail closed", () => {
  const unrelated = fixtureRoot();
  writeFileSync(resolve(unrelated.root, "README.md"), "unrelated\n");
  assert.throws(() => publicSessionCloseoutPlan(unrelated.root, unrelated.changeSetPath), (error) => error.code === "working-tree-scope-conflict");

  const drifted = fixtureRoot();
  writeFileSync(resolve(drifted.root, drifted.value.captures[0].source.path), "changed\n");
  assert.throws(() => publicSessionCloseoutPlan(drifted.root, drifted.changeSetPath), (error) => error.code === "capture-source-drift");
});

if (failures > 0) {
  console.error(`\n${failures} session-closeout test(s) failed.`);
  process.exit(1);
}
console.log("\nAll session-closeout tests passed.");
