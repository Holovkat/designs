#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyArchive, buildArchivePlan, rollbackArchive } from "../lib/inbox-archive.mjs";

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

function session({ title, timestamp, sessionId, sha }) {
  return `---\ntype: Inbox\ntitle: ${title}\ndescription: Archive fixture\ntags: [okf, archive]\ntimestamp: ${timestamp}\nsession_id: ${sessionId}\ncommit_sha: [${sha}]\nbranch: test\ncapture_tier: session\n---\n\n# Decisions Made\n\nDecision.\n\n# What Was Deprecated\n\nNothing.\n\n# Lessons Learned\n\nLesson.\n\n# Current State\n\nCurrent.\n`;
}

function makeRepo() {
  const parent = mkdtempSync(join(tmpdir(), "okf-inbox-archive-"));
  const createdRoot = join(parent, "repo");
  mkdirSync(createdRoot, { recursive: true });
  const root = realpathSync(createdRoot);
  const inbox = join(root, "knowledge", "inbox");
  mkdirSync(inbox, { recursive: true });
  mkdirSync(join(root, ".okf"), { recursive: true });
  mkdirSync(join(root, ".empty-hooks"));
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), "{\"active\":false}\n");
  writeFileSync(join(inbox, "index.md"), "# Inbox\n\n| Title | Timestamp | Tags | Issues |\n|---|---|---|---|\n");
  writeFileSync(join(root, "knowledge", "index.md"), "# Knowledge\n\n| Group | Count | Description |\n|---|---|---|\n| [Inbox](./inbox/index.md) | 0 | Pending |\n");
  git(root, ["init", "-q"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "base"]);
  const sha = git(root, ["rev-parse", "HEAD"]);
  const names = ["2026-02-01T00-00-00Z-one.md", "2026-02-01T01-00-00Z-two.md"];
  writeFileSync(join(inbox, names[0]), session({ title: "One", timestamp: "2026-02-01T00:00:00Z", sessionId: "11111111-1111-4111-8111-111111111111", sha }));
  writeFileSync(join(inbox, names[1]), session({ title: "Two", timestamp: "2026-02-01T01:00:00Z", sessionId: "22222222-2222-4222-8222-222222222222", sha }));
  writeFileSync(join(inbox, "index.md"), `# Inbox\n\n| Title | Timestamp | Tags | Issues |\n|---|---|---|---|\n| [One](./${names[0]}) | 2026-02-01T00:00:00Z | okf | |\n| [Two](./${names[1]}) | 2026-02-01T01:00:00Z | okf | |\n`);
  writeFileSync(join(root, "knowledge", "index.md"), "# Knowledge\n\n| Group | Count | Description |\n|---|---|---|\n| [Inbox](./inbox/index.md) | 2 | Pending |\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "archive fixture"]);
  return { parent, root, names, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

function common(fixture) {
  return {
    root: fixture.root,
    revision: git(fixture.root, ["rev-parse", "HEAD"]),
    operator: "fixture-operator",
    operator_request: "fixture archive request",
    reason: "operator reviewed fixture classification",
    max_items: 2,
    max_input_bytes: 100_000,
    max_generated_bytes: 100_000,
    max_runtime_seconds: 60,
    max_sessions: 1,
  };
}

function savePlan(fixture, plan) {
  const path = join(fixture.root, plan.recommended_manifest_path);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(plan, null, 2)}\n`);
  return plan.recommended_manifest_path;
}

test("dry-run plan records explicit hashes, provenance, indexes, rollback, and no source changes", () => {
  const fixture = makeRepo();
  try {
    const selected = `knowledge/inbox/${fixture.names[0]}`;
    const before = git(fixture.root, ["status", "--porcelain"]);
    const plan = buildArchivePlan({ ...common(fixture), archive_id: "fixture", selected_paths: [selected], as_of: "2026-02-02T00:00:00Z" });
    assert.equal(plan.dry_run, true);
    assert.equal(plan.items.length, 1);
    assert.equal(plan.items[0].source_path, selected);
    assert.match(plan.items[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(plan.items[0].frontmatter_identity.capture_tier, "session");
    assert.ok(plan.index_rewrites.some((rewrite) => rewrite.path === "knowledge/inbox/index.md"));
    assert.ok(plan.index_rewrites.some((rewrite) => rewrite.path === "knowledge/index.md"));
    assert.match(plan.manifest_hash, /^[0-9a-f]{64}$/);
    assert.equal(plan.permanent_deletion_supported, false);
    assert.deepEqual(plan.files_changed, []);
    assert.equal(git(fixture.root, ["status", "--porcelain"]), before);
    assert.ok(existsSync(join(fixture.root, selected)));
  } finally { fixture.cleanup(); }
});

test("apply archives byte-for-byte with declared rewrites and rollback restores the original state", () => {
  const fixture = makeRepo();
  try {
    const selected = `knowledge/inbox/${fixture.names[0]}`;
    const source = join(fixture.root, selected);
    const originalSource = readFileSync(source);
    const originalInboxIndex = readFileSync(join(fixture.root, "knowledge", "inbox", "index.md"));
    const originalRootIndex = readFileSync(join(fixture.root, "knowledge", "index.md"));
    const base = common(fixture);
    const plan = buildArchivePlan({ ...base, archive_id: "fixture", selected_paths: [selected], as_of: "2026-02-02T00:00:00Z" });
    const manifestPath = savePlan(fixture, plan);
    const applied = applyArchive({ ...base, approval_ref: "fixture-approval", manifest_path: manifestPath });
    const archived = join(fixture.root, plan.items[0].destination_path);
    assert.equal(applied.outcome, "completed");
    assert.equal(applied.permanent_deletion_occurred, false);
    assert.equal(existsSync(source), false);
    assert.deepEqual(readFileSync(archived), originalSource);
    assert.ok(!readFileSync(join(fixture.root, "knowledge", "inbox", "index.md"), "utf8").includes(fixture.names[0]));
    assert.match(readFileSync(join(fixture.root, "knowledge", "index.md"), "utf8"), /\| \[Inbox\].*\| 1 \|/);
    assert.equal(existsSync(join(fixture.root, ".okf", "run.lock")), false);

    const rolledBack = rollbackArchive({ ...base, operator_request: "fixture rollback request", approval_ref: "fixture-rollback-approval", reason: "restore reviewed fixture archive", rollback_manifest_path: plan.rollback.manifest_path });
    assert.equal(rolledBack.outcome, "completed");
    assert.equal(rolledBack.rollback_result, "tested-completed");
    assert.equal(rolledBack.permanent_deletion_occurred, false);
    assert.deepEqual(readFileSync(source), originalSource);
    assert.equal(existsSync(archived), false);
    assert.deepEqual(readFileSync(join(fixture.root, "knowledge", "inbox", "index.md")), originalInboxIndex);
    assert.deepEqual(readFileSync(join(fixture.root, "knowledge", "index.md")), originalRootIndex);
    assert.ok(existsSync(join(fixture.root, plan.rollback.manifest_path)));
    assert.ok(existsSync(join(fixture.root, rolledBack.result_manifest_path)));
    assert.equal(existsSync(join(fixture.root, ".okf", "run.lock")), false);
  } finally { fixture.cleanup(); }
});

test("apply fails closed on reviewed-source drift without moving or deleting it", () => {
  const fixture = makeRepo();
  try {
    const selected = `knowledge/inbox/${fixture.names[0]}`;
    const base = common(fixture);
    const plan = buildArchivePlan({ ...base, archive_id: "drift", selected_paths: [selected], as_of: "2026-02-02T00:00:00Z" });
    const manifestPath = savePlan(fixture, plan);
    const source = join(fixture.root, selected);
    writeFileSync(source, `${readFileSync(source, "utf8")}\nchanged after review\n`);
    assert.throws(() => applyArchive({ ...base, approval_ref: "fixture-approval", manifest_path: manifestPath }), (error) => error.code === "archive-source-drift");
    assert.equal(existsSync(source), true);
    assert.equal(existsSync(join(fixture.root, plan.items[0].destination_path)), false);
    assert.equal(existsSync(join(fixture.root, ".okf", "run.lock")), false);
  } finally { fixture.cleanup(); }
});

test("retry preserves the prior terminal report and writes new attempt evidence", () => {
  const fixture = makeRepo();
  try {
    const selected = `knowledge/inbox/${fixture.names[0]}`;
    const source = join(fixture.root, selected);
    const originalSource = readFileSync(source);
    const base = common(fixture);
    const plan = buildArchivePlan({ ...base, archive_id: "retry", selected_paths: [selected], as_of: "2026-02-02T00:00:00Z" });
    const manifestPath = savePlan(fixture, plan);
    const priorReportPath = `.okf/reports/${plan.run_id}.json`;
    const priorReportFull = join(fixture.root, priorReportPath);

    writeFileSync(source, Buffer.concat([originalSource, Buffer.from("\nchanged after review\n")]));
    assert.throws(
      () => applyArchive({ ...base, approval_ref: "first-attempt", manifest_path: manifestPath }),
      (error) => error.code === "archive-source-drift",
    );
    const priorReportBytes = readFileSync(priorReportFull);
    const priorReport = JSON.parse(priorReportBytes.toString("utf8"));
    assert.equal(priorReport.outcome, "failed");
    assert.match(priorReport.lock_token, /^[0-9a-f-]{36}$/);

    writeFileSync(source, originalSource);
    const applied = applyArchive({ ...base, approval_ref: "second-attempt", manifest_path: manifestPath });
    const retryReport = JSON.parse(readFileSync(join(fixture.root, applied.run_report_path), "utf8"));
    assert.equal(applied.outcome, "completed");
    assert.equal(applied.prior_run_report_path, priorReportPath);
    assert.notEqual(applied.run_report_path, priorReportPath);
    assert.match(applied.run_report_path, /^\.okf\/reports\/archive-retry\.attempt-[0-9a-f-]{36}\.json$/);
    assert.deepEqual(readFileSync(priorReportFull), priorReportBytes);
    assert.equal(JSON.parse(readFileSync(priorReportFull, "utf8")).outcome, "failed");
    assert.equal(retryReport.outcome, "completed");
    assert.notEqual(retryReport.lock_token, priorReport.lock_token);
    assert.equal(existsSync(join(fixture.root, ".okf", "run.lock")), false);
  } finally { fixture.cleanup(); }
});

test("rollback recovers a partially restored archive without duplicating sources", () => {
  const fixture = makeRepo();
  try {
    const selected = fixture.names.map((name) => `knowledge/inbox/${name}`);
    const base = common(fixture);
    const plan = buildArchivePlan({ ...base, archive_id: "partial", selected_paths: selected, as_of: "2026-02-02T00:00:00Z" });
    const manifestPath = savePlan(fixture, plan);
    applyArchive({ ...base, approval_ref: "partial-approval", manifest_path: manifestPath });
    const first = plan.items[0];
    renameSync(join(fixture.root, first.destination_path), join(fixture.root, first.source_path));
    const result = rollbackArchive({ ...base, operator_request: "resume partial rollback", approval_ref: "partial-rollback-approval", reason: "recover partially restored fixture", rollback_manifest_path: plan.rollback.manifest_path });
    assert.equal(result.outcome, "completed");
    assert.equal(result.restored_items.find((item) => item.source_path === first.source_path).action, "already-source");
    for (const item of plan.items) {
      assert.equal(existsSync(join(fixture.root, item.source_path)), true);
      assert.equal(existsSync(join(fixture.root, item.destination_path)), false);
    }
  } finally { fixture.cleanup(); }
});

test("kill switch blocks archive planning and no permanent-delete option exists", () => {
  const fixture = makeRepo();
  try {
    writeFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), JSON.stringify({ active: true, activated_by: "operator", activated_at: "2026-02-02T00:00:00Z", reason: "pause" }));
    const selected = `knowledge/inbox/${fixture.names[0]}`;
    assert.throws(() => buildArchivePlan({ ...common(fixture), archive_id: "blocked", selected_paths: [selected], as_of: "2026-02-02T00:00:00Z" }), (error) => error.code === "kill-switch-active");
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} inbox archive test(s) failed.`);
  process.exit(1);
}
console.log("\nAll inbox archive tests passed.");
