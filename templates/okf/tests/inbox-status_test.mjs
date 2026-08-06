#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inboxStatus } from "../lib/inbox-status.mjs";
import { RunGuardError } from "../lib/run-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../bin/okf-inbox-status.mjs");
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

function makeInbox(items, { kill = { active: false }, index = null } = {}) {
  const parent = mkdtempSync(join(tmpdir(), "okf-inbox-status-"));
  const root = join(parent, "repo");
  const inbox = join(root, "knowledge", "inbox");
  mkdirSync(inbox, { recursive: true });
  mkdirSync(join(root, ".okf"));
  mkdirSync(join(root, ".empty-hooks"));
  for (const [name, content] of Object.entries(items)) writeFileSync(join(inbox, name), content);
  const links = index ?? Object.keys(items).sort().map((name) => `- [${name}](./${name})`).join("\n");
  writeFileSync(join(inbox, "index.md"), `# Inbox\n\n${links}\n`);
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), `${JSON.stringify(kill)}\n`);
  git(root, ["init", "-q"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture"]);
  return { parent, root, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

function inbox({ title, timestamp, tier = "commit", extra = "", body = "# Body\n" }) {
  const tierFields = tier === "session" ? "session_id: session-1\ncapture_tier: session" : tier === "commit" ? "commit_sha: 0123456789abcdef0123456789abcdef01234567\ncapture_tier: commit" : "";
  return `---\ntype: Inbox\ntitle: ${title}\ndescription: test record\ntags: [okf]\ntimestamp: ${timestamp}\n${tierFields}\n${extra}---\n${body}`;
}

function expectCode(run, code) {
  assert.throws(run, (error) => error instanceof RunGuardError && error.code === code);
}

test("reports deterministic mixed pending health without writes or authority", () => {
  const fixture = makeInbox({
    "2026-01-01T00-00-00Z-commit.md": inbox({ title: "Commit", timestamp: "2026-01-01T00:00:00Z" }),
    "2026-01-15T00-00-00Z-session.md": inbox({ title: "Session", timestamp: "2026-01-15T00:00:00Z", tier: "session", body: "# Decisions Made\n# What Was Deprecated\n# Lessons Learned\n# Current State\n" }),
  });
  try {
    const before = git(fixture.root, ["status", "--porcelain"]);
    const report = inboxStatus(fixture.root, { asOf: "2026-02-01T00:00:00Z" });
    assert.equal(report.pending.count, 2);
    assert.deepEqual(report.pending.capture_tiers, { commit: 1, session: 1, "legacy-unspecified": 0, invalid: 0 });
    assert.equal(report.pending.oldest.path, "knowledge/inbox/2026-01-01T00-00-00Z-commit.md");
    assert.equal(report.advisory.oldest_age_30_days, true);
    assert.equal(report.read_only, true);
    assert.equal(report.curation_started, false);
    assert.equal(report.curation_authorized, false);
    assert.deepEqual(report.files_changed, []);
    assert.equal(report.controls.kill_switch.state, "inactive");
    assert.equal(git(fixture.root, ["status", "--porcelain"]), before);
  } finally { fixture.cleanup(); }
});

test("keeps malformed, legacy, duplicate, and index facts as report data", () => {
  const duplicate = inbox({ title: "Duplicate", timestamp: "2026-01-01T00:00:00Z" });
  const malformed = "---\ntype: Inbox\ntitle: one\ntitle: two\n---\nSECRET-BODY-MARKER\n";
  const fixture = makeInbox({ "a.md": duplicate, "b.md": duplicate, "bad.md": malformed }, { index: "# Inbox\n- [a](./a.md)\n- [a duplicate](./a.md)\n- [missing](./missing.md)\n" });
  try {
    const report = inboxStatus(fixture.root, { asOf: "2026-02-01T00:00:00Z" });
    assert.equal(report.duplicates.content_sha256.length, 1);
    assert.equal(report.duplicates.commit_sha.length, 1);
    assert.deepEqual(report.index.duplicate_links, ["knowledge/inbox/a.md"]);
    assert.deepEqual(report.index.dangling, ["knowledge/inbox/missing.md"]);
    assert.ok(report.parser_diagnostics.some((item) => item.path === "knowledge/inbox/bad.md" && item.code === "yaml-duplicate-key"));
    assert.ok(report.quality.some((item) => item.path === "knowledge/inbox/bad.md" && item.code === "malformed"));
    assert.ok(!JSON.stringify(report).includes("SECRET-BODY-MARKER"));
  } finally { fixture.cleanup(); }
});

test("reports active controls but never treats them as a status-command failure", () => {
  const fixture = makeInbox({ "a.md": inbox({ title: "A", timestamp: "2026-01-01T00:00:00Z" }) }, { kill: { active: true, activated_by: "operator", activated_at: "2026-02-01T00:00:00Z", reason: "pause" } });
  try {
    const report = inboxStatus(fixture.root, { asOf: "2026-02-01T00:00:00Z" });
    assert.equal(report.controls.kill_switch.state, "active");
    assert.equal(report.controls.hypothetical_executor_blocked, true);
    const result = spawnSync(process.execPath, [cli, "--root", fixture.root, "--format", "json", "--as-of", "2026-02-01T00:00:00Z"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).controls.kill_switch.state, "active");
  } finally { fixture.cleanup(); }
});

test("reports missing, stale, and malformed controls without changing status success", () => {
  const fixture = makeInbox({ "a.md": inbox({ title: "A", timestamp: "2026-01-01T00:00:00Z" }) });
  try {
    unlinkSync(join(fixture.root, ".okf", "KILL_SWITCH"));
    assert.equal(inboxStatus(fixture.root).controls.kill_switch.state, "indeterminate");
    writeFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), '{"active":false}\n');
    writeFileSync(join(fixture.root, ".okf", "run.lock"), JSON.stringify({ pid: 999999 }));
    assert.equal(inboxStatus(fixture.root).controls.lock.state, "stale");
    writeFileSync(join(fixture.root, ".okf", "run.lock"), "not json");
    assert.equal(inboxStatus(fixture.root).controls.lock.state, "malformed");
  } finally { fixture.cleanup(); }
});

test("uses advisory boundaries without an execution exit code", () => {
  const items = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`item-${index}.md`, inbox({ title: `Item ${index}`, timestamp: "2026-01-31T00:00:00Z" })]));
  const fixture = makeInbox(items);
  try {
    const report = inboxStatus(fixture.root, { asOf: "2026-02-01T00:00:00Z" });
    assert.equal(report.advisory.pending_count_10, true);
    assert.equal(report.advisory.execution_authority, false);
  } finally { fixture.cleanup(); }
});

test("rejects symlink scope and invalid CLI arguments before outside reads", () => {
  const fixture = makeInbox({ "a.md": inbox({ title: "A", timestamp: "2026-01-01T00:00:00Z" }) });
  try {
    const outside = join(fixture.parent, "outside.md");
    writeFileSync(outside, "outside sentinel");
    symlinkSync(outside, join(fixture.root, "knowledge", "inbox", "escape.md"));
    expectCode(() => inboxStatus(fixture.root), "path-symlink");
    const result = spawnSync(process.execPath, [cli, "--root", fixture.root, "--as-of", "not-a-date"], { encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /as-of-invalid/);
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} inbox status test(s) failed.`);
  process.exit(1);
}
console.log("\nAll inbox status tests passed.");
