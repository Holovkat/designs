#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readKillSwitch, createCancellationToken } from "../lib/run-control.mjs";
import { canResume, markProcessed, readCheckpoint, writeCheckpoint } from "../lib/run-checkpoint.mjs";
import { resolveContainedPath, RunGuardError, validateRoot } from "../lib/run-guard.mjs";
import { acquireLock, readLock, releaseLock } from "../lib/run-lock.mjs";
import { validateRunPlan } from "../lib/run-plan.mjs";
import { buildReport } from "../lib/run-report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../bin/okf-run-plan.mjs");
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

function makeRepo(files = { "one.md": "# one\n" }) {
  const parent = mkdtempSync(join(tmpdir(), "okf-run-safety-"));
  const root = join(parent, "repo");
  mkdirSync(join(root, "knowledge", "inbox"), { recursive: true });
  mkdirSync(join(root, ".okf"), { recursive: true });
  mkdirSync(join(root, ".empty-hooks"));
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), '{"active":false}\n');
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, "knowledge", "inbox", name), content);
  git(root, ["init", "-q"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture"]);
  return { parent, root, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

function plan(root, overrides = {}) {
  return validateRunPlan({
    trigger: "operator", operator_request: "test approval", root, revision: git(root, ["rev-parse", "HEAD"]), inbox_path: "knowledge/inbox", max_sessions: 1,
    max_items: 10, max_input_bytes: 10_000, max_generated_bytes: 10_000, max_runtime_seconds: 60,
    ...overrides,
  });
}

function expectCode(run, code) {
  assert.throws(run, (error) => error instanceof RunGuardError && error.code === code);
}

test("fails closed before root discovery without explicit operator authority", () => {
  const fixture = makeRepo();
  try {
    expectCode(() => plan(fixture.root, { operator_request: "", trigger: "scheduled" }), "authority-not-explicit");
  } finally { fixture.cleanup(); }
});

test("requires an exact Git top-level and contained non-symlink paths", () => {
  const fixture = makeRepo();
  try {
    assert.match(validateRoot(fixture.root).root, /\/repo$/);
    expectCode(() => validateRoot(join(fixture.root, "knowledge")), "root-not-toplevel");
    expectCode(() => resolveContainedPath(fixture.root, "../outside"), "path-escapes-root");
    expectCode(() => resolveContainedPath(fixture.root, "/etc/passwd"), "path-absolute");
    const outside = join(fixture.parent, "outside.md");
    writeFileSync(outside, "sentinel");
    symlinkSync(outside, join(fixture.root, "knowledge", "inbox", "escape.md"));
    expectCode(() => plan(fixture.root), "path-symlink");
  } finally { fixture.cleanup(); }
});

test("requires every numeric ceiling and rejects selection beyond a cap", () => {
  const fixture = makeRepo({ "one.md": "one", "two.md": "two" });
  try {
    expectCode(() => plan(fixture.root, { max_runtime_seconds: 0 }), "limit-invalid");
    expectCode(() => plan(fixture.root, { max_items: 1 }), "quota-exceeded:items");
    expectCode(() => plan(fixture.root, { max_input_bytes: 1 }), "quota-exceeded:input-bytes");
  } finally { fixture.cleanup(); }
});

test("uses an atomic one-run lock and retains it until a terminal record exists", () => {
  const fixture = makeRepo();
  try {
    const currentPlan = plan(fixture.root);
    const first = acquireLock(fixture.root, currentPlan, { identity: "test" });
    assert.equal(first.acquired, true);
    const second = acquireLock(fixture.root, currentPlan);
    assert.equal(second.acquired, false);
    assert.equal(second.code, "lock-exists");
    assert.equal(releaseLock(fixture.root, first, ".okf/reports/missing.json"), false);
    mkdirSync(join(fixture.root, ".okf", "reports"), { recursive: true });
    writeFileSync(join(fixture.root, ".okf", "reports", "terminal.json"), JSON.stringify({ run_id: currentPlan.run_id, root: currentPlan.root }));
    assert.equal(releaseLock(fixture.root, { acquired: true }, ".okf/reports/terminal.json"), false);
    assert.equal(releaseLock(fixture.root, first, ".okf/reports/terminal.json"), true);
    assert.equal(readLock(fixture.root), null);
  } finally { fixture.cleanup(); }
});

test("fails closed for missing, malformed, and active kill-switch state", () => {
  const fixture = makeRepo();
  try {
    assert.deepEqual(readKillSwitch(fixture.root), { active: false, ambiguous: false });
    unlinkSync(join(fixture.root, ".okf", "KILL_SWITCH"));
    assert.equal(readKillSwitch(fixture.root).code, "kill-switch-indeterminate");
    expectCode(() => plan(fixture.root), "kill-switch-indeterminate");
    writeFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "not json");
    assert.equal(readKillSwitch(fixture.root).code, "kill-switch-indeterminate");
    writeFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), JSON.stringify({ active: true, activated_by: "operator", activated_at: "2026-08-06T00:00:00Z", reason: "stop" }));
    assert.equal(readKillSwitch(fixture.root).active, true);
    expectCode(() => plan(fixture.root), "kill-switch-active");
    const token = createCancellationToken({ deadlineAt: 5, now: () => 5 });
    assert.equal(token.reason(), "quota-exceeded:runtime");
  } finally { fixture.cleanup(); }
});

test("writes atomic bounded checkpoints and blocks resume on source drift", () => {
  const fixture = makeRepo();
  try {
    const original = plan(fixture.root);
    const progress = markProcessed({ completed_item_ids: [] }, original.items[0].path, { postflightOk: true, persistedOk: true });
    const checkpoint = writeCheckpoint(fixture.root, original, progress);
    assert.ok(existsSync(join(fixture.root, checkpoint.path)));
    assert.deepEqual(canResume(readCheckpoint(fixture.root, original.run_id), original), { ok: true });
    writeFileSync(join(fixture.root, "knowledge", "inbox", "one.md"), "changed\n");
    const changed = plan(fixture.root);
    assert.equal(canResume(readCheckpoint(fixture.root, original.run_id), changed).code, "resume-plan-drift");
    assert.throws(() => markProcessed({}, "item", { postflightOk: false, persistedOk: true }), /not complete/);
  } finally { fixture.cleanup(); }
});

test("reports terminal state without source content and CLI remains check-only", () => {
  const fixture = makeRepo();
  try {
    const currentPlan = plan(fixture.root);
    const { report, bytes } = buildReport({
      run_id: currentPlan.run_id, operator_request: currentPlan.operator_request, root: currentPlan.root, revision: currentPlan.revision,
      allowlist: currentPlan.allowlist, item_ids: currentPlan.items.map((item) => item.path), limits: currentPlan.limits,
      lock_state: "not-acquired", phase: "preflight", elapsed_seconds: 0, input_bytes: currentPlan.input_bytes, generated_bytes: 0,
      sessions_active: 0, sessions_max: 1, last_checkpoint: null, outcome: "blocked", reason: "fixture", recovery_instruction: "operator review",
    });
    assert.ok(bytes > 0);
    assert.equal(report.mutated.knowledge, false);
    assert.throws(() => buildReport({ content: "secret" }), /report-contains-source/);
    const result = spawnSync(process.execPath, [cli, "--check-only", "--root", fixture.root, "--revision", git(fixture.root, ["rev-parse", "HEAD"]), "--operator-request", "test", "--max-items", "10", "--max-input-bytes", "10000", "--max-generated-bytes", "10000", "--max-runtime-seconds", "60", "--format", "json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).check_only, true);
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} run-safety test(s) failed.`);
  process.exit(1);
}
console.log("\nAll run-safety tests passed.");
