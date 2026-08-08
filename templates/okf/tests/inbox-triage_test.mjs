#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { triageInbox } from "../lib/inbox-triage.mjs";
import { RunGuardError } from "../lib/run-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../bin/okf-inbox-triage.mjs");
let failures = 0;

function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack ?? error.message}`); }
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function session({ title, timestamp, sessionId, sha, body = "# Decisions Made\n\nDecision.\n\n# What Was Deprecated\n\nNothing.\n\n# Lessons Learned\n\nLesson.\n\n# Current State\n\nCurrent.\n" }) {
  return `---\ntype: Inbox\ntitle: ${title}\ndescription: Fixture session\ntags: [okf, fixture]\ntimestamp: ${timestamp}\nsession_id: ${sessionId}\ncommit_sha: [${sha}]\nbranch: test\ncapture_tier: session\n---\n\n${body}`;
}

function makeRepo() {
  const parent = mkdtempSync(join(tmpdir(), "okf-inbox-triage-"));
  const createdRoot = join(parent, "repo");
  mkdirSync(createdRoot, { recursive: true });
  const root = realpathSync(createdRoot);
  const inbox = join(root, "knowledge", "inbox");
  mkdirSync(join(inbox, "processed"), { recursive: true });
  mkdirSync(join(root, ".okf"), { recursive: true });
  mkdirSync(join(root, ".empty-hooks"));
  writeFileSync(join(inbox, "index.md"), "# Inbox\n");
  writeFileSync(join(root, "knowledge", "index.md"), "# Knowledge\n");
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), "{\"active\":false}\n");
  git(root, ["init", "-q"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "base"]);
  const sha = git(root, ["rev-parse", "HEAD"]);

  const duplicate = session({ title: "Duplicate", timestamp: "2026-01-31T00:00:00Z", sessionId: "11111111-1111-4111-8111-111111111111", sha });
  const items = {
    "2026-02-01T00-00-00Z-actionable.md": session({ title: "Actionable", timestamp: "2026-02-01T00:00:00Z", sessionId: "22222222-2222-4222-8222-222222222222", sha }),
    "duplicate-a.md": duplicate,
    "duplicate-b.md": duplicate,
    "2026-01-31T01-00-00Z-oversized.md": session({ title: "Oversized", timestamp: "2026-01-31T01:00:00Z", sessionId: "33333333-3333-4333-8333-333333333333", sha, body: `# Decisions Made\n\n${"x".repeat(17 * 1024)}\n\n# What Was Deprecated\n\nNothing.\n\n# Lessons Learned\n\nLesson.\n\n# Current State\n\nCurrent.\n` }),
    "2025-12-01T00-00-00Z-stale.md": session({ title: "Stale", timestamp: "2025-12-01T00:00:00Z", sessionId: "44444444-4444-4444-8444-444444444444", sha }),
    "malformed.md": "---\ntype: Inbox\ntitle: first\ntitle: second\n---\nSECRET-RAW-BODY\n",
    "2026-01-31T02-00-00Z-low-signal.md": `---\ntype: Inbox\ntitle: Low signal\ndescription: Fixture commit\ntags: [okf]\ntimestamp: 2026-01-31T02:00:00Z\ncommit_sha: ${sha}\nbranch: test\ncapture_tier: commit\nrationale_missing: true\nimpact_missing: true\n---\n\n# Why And How\n\nNot recorded.\n\n# Impact\n\nNot recorded.\n`,
    "2026-01-31T03-00-00Z-provenance.md": `---\ntype: Inbox\ntitle: Provenance warning\ndescription: Fixture commit\ntags: [okf]\ntimestamp: 2026-01-31T03:00:00Z\ncommit_sha: abc1234\nbranch: external\ncapture_tier: commit\n---\n\n# Why And How\n\nReason.\n\n# Impact\n\nImpact.\n`,
    "2026-01-31T04-00-00Z-legacy.md": "---\ntype: Inbox\ntitle: Legacy\ndescription: Historical fixture\ntags: [okf]\ntimestamp: 2026-01-31T04:00:00Z\nbranch: test\n---\n\n# Historical Session\n\nRetained history.\n",
  };
  for (const [name, content] of Object.entries(items)) writeFileSync(join(inbox, name), content);
  writeFileSync(join(inbox, "processed", "ignored.md"), duplicate);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "triage fixture"]);
  return { parent, root, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

function byPath(report, suffix) {
  return report.items.find((item) => item.path.endsWith(suffix));
}

test("classifies every direct pending category deterministically without exposing bodies", () => {
  const fixture = makeRepo();
  try {
    const before = git(fixture.root, ["status", "--porcelain"]);
    const report = triageInbox(fixture.root, { asOf: "2026-02-01T00:00:00Z" });
    assert.equal(report.summary.count, 9);
    assert.equal(byPath(report, "actionable.md").primary_classification, "actionable");
    assert.equal(byPath(report, "duplicate-a.md").primary_classification, "duplicate");
    assert.equal(byPath(report, "oversized.md").primary_classification, "oversized");
    assert.equal(byPath(report, "stale.md").primary_classification, "stale");
    assert.equal(byPath(report, "malformed.md").primary_classification, "malformed");
    assert.equal(byPath(report, "low-signal.md").primary_classification, "low-signal");
    assert.equal(byPath(report, "provenance.md").primary_classification, "provenance-warning");
    assert.equal(byPath(report, "legacy.md").primary_classification, "needs-human-review");
    assert.deepEqual(report.items.map((item) => item.path), [...report.items.map((item) => item.path)].sort());
    assert.equal(report.read_only, true);
    assert.equal(report.archive_started, false);
    assert.equal(report.deletion_performed, false);
    assert.ok(!JSON.stringify(report).includes("SECRET-RAW-BODY"));
    assert.equal(git(fixture.root, ["status", "--porcelain"]), before);
  } finally { fixture.cleanup(); }
});

test("CLI emits the same direct-only JSON projection and no execution authority", () => {
  const fixture = makeRepo();
  try {
    const result = spawnSync(process.execPath, [cli, "--root", fixture.root, "--as-of", "2026-02-01T00:00:00Z", "--format", "json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.scope, "direct-pending-inbox-only");
    assert.equal(report.summary.count, 9);
    assert.equal(report.curation_started, false);
    assert.equal(report.archive_started, false);
  } finally { fixture.cleanup(); }
});

test("rejects symlink scope and non-physical roots", () => {
  const fixture = makeRepo();
  try {
    const outside = join(fixture.parent, "outside.md");
    writeFileSync(outside, "outside sentinel");
    symlinkSync(outside, join(fixture.root, "knowledge", "inbox", "escape.md"));
    assert.throws(() => triageInbox(fixture.root), (error) => error instanceof RunGuardError && error.code === "path-symlink");
    const alias = join(fixture.parent, "repo-alias");
    symlinkSync(fixture.root, alias);
    assert.throws(() => triageInbox(alias), (error) => error instanceof RunGuardError && error.code === "root-not-physical");
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} inbox triage test(s) failed.`);
  process.exit(1);
}
console.log("\nAll inbox triage tests passed.");
