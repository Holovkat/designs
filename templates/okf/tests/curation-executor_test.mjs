#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { executeCuration } from "../lib/curation-executor.mjs";
import { validateCurationPreflight } from "../lib/curation-validation.mjs";
import { readLock } from "../lib/run-lock.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, "fixtures/curation");
const cli = resolve(here, "../bin/okf-curate.mjs");
const directories = ["architecture", "components", "domain", "decisions", "deprecation", "process", "state"];
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

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixtureText(name) {
  return readFileSync(join(fixtures, name), "utf8");
}

function makeRepo({ concept = fixtureText("valid-concept.md"), runId = "fixture-curation" } = {}) {
  const parent = mkdtempSync(join(tmpdir(), "okf-curation-executor-"));
  const createdRoot = join(parent, "repo");
  mkdirSync(createdRoot, { recursive: true });
  const root = realpathSync(createdRoot);
  mkdirSync(join(root, "knowledge", "inbox", "processed"), { recursive: true });
  for (const directory of directories) mkdirSync(join(root, "knowledge", directory), { recursive: true });
  mkdirSync(join(root, ".okf", "proposals"), { recursive: true });
  mkdirSync(join(root, ".empty-hooks"));
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), '{"active":false}\n');
  const sourcePath = "knowledge/inbox/2026-08-08T00-00-00Z-bounded-curation.md";
  const source = fixtureText("valid-inbox.md");
  writeFileSync(join(root, sourcePath), source);
  const base = {
    "knowledge/index.md": "# Knowledge\n\n| Group | Count |\n|---|---|\n| Inbox | 1 |\n",
    "knowledge/inbox/index.md": "# Inbox\n\n- bounded curation\n",
    "knowledge/decisions/index.md": "# Decisions\n",
    "knowledge/log.md": "# Log\n",
  };
  for (const [path, content] of Object.entries(base)) writeFileSync(join(root, path), content);
  for (const directory of directories.filter((name) => name !== "decisions")) writeFileSync(join(root, "knowledge", directory, "index.md"), `# ${directory}\n`);
  git(root, ["init", "-q"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture"]);
  const revision = git(root, ["rev-parse", "HEAD"]);
  const item = { path: sourcePath, bytes: Buffer.byteLength(source), sha256: sha(source) };
  const outputs = [
    {
      path: "knowledge/decisions/bounded-manual-curation.md", expected_sha256: null, source_items: [sourcePath], content: concept,
    },
    {
      path: "knowledge/decisions/index.md", expected_sha256: sha(base["knowledge/decisions/index.md"]), source_items: [sourcePath], content: "# Decisions\n\n- [Bounded Manual Curation](./bounded-manual-curation.md)\n",
    },
    {
      path: "knowledge/inbox/index.md", expected_sha256: sha(base["knowledge/inbox/index.md"]), source_items: [sourcePath], content: "# Inbox\n",
    },
    {
      path: "knowledge/index.md", expected_sha256: sha(base["knowledge/index.md"]), source_items: [sourcePath], content: "# Knowledge\n\n- [Decisions](./decisions/index.md)\n- [Inbox](./inbox/index.md)\n",
    },
    {
      path: "knowledge/log.md", expected_sha256: sha(base["knowledge/log.md"]), source_items: [sourcePath], content: `# Log\n\n## 2026-08-08 - Bounded curation\n\nRevision: ${revision}\n\nOutput: knowledge/decisions/bounded-manual-curation.md\n`,
    },
  ];
  const proposal = {
    version: "okf-curation-proposal/1", run_id: runId, revision,
    expected_outcome: "Create one validated decision and retain the processed capture.",
    recovery_plan: "Use retained .okf staging, checkpoint, report, and Git to inspect or restore every path.",
    items: [item], outputs,
  };
  const proposalPath = `.okf/proposals/${runId}.json`;
  writeFileSync(join(root, proposalPath), `${JSON.stringify(proposal, null, 2)}\n`);
  const input = {
    root, revision, operator_identity: "fixture-operator", operator_request: "fixture approval", run_id: runId,
    proposal_path: proposalPath, selected_items: [sourcePath], max_items: 1, max_input_bytes: 1_000_000, max_generated_bytes: 2_000_000,
    max_runtime_seconds: 60, max_sessions: 1,
  };
  return { parent, root, sourcePath, proposalPath, input, cleanup: () => rmSync(parent, { recursive: true, force: true }) };
}

test("check-only builds a deterministic plan without lock or mutation", () => {
  const fixture = makeRepo({ runId: "fixture-dry-run" });
  try {
    const result = spawnSync(process.execPath, [cli, "--check-only", "--root", fixture.root, "--revision", fixture.input.revision,
      "--operator-identity", "fixture-operator", "--operator-request", "fixture approval", "--run-id", fixture.input.run_id,
      "--proposal", fixture.proposalPath, "--select", fixture.sourcePath, "--max-items", "1", "--max-input-bytes", "1000000", "--max-generated-bytes", "2000000",
      "--max-runtime-seconds", "60", "--max-sessions", "1", "--format", "json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(result.stdout).check_only, true);
    assert.equal(readLock(fixture.root), null);
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
  } finally { fixture.cleanup(); }
});

test("check-only supports an explicit empty audit dataset without inferred selection", () => {
  const fixture = makeRepo({ runId: "fixture-audit-only" });
  try {
    const proposalFile = join(fixture.root, fixture.proposalPath);
    const proposal = JSON.parse(readFileSync(proposalFile, "utf8"));
    proposal.items = [];
    proposal.outputs = proposal.outputs
      .filter(({ path }) => ["knowledge/inbox/index.md", "knowledge/index.md", "knowledge/log.md"].includes(path))
      .map((output) => ({ ...output, source_items: [] }));
    writeFileSync(proposalFile, `${JSON.stringify(proposal, null, 2)}\n`);
    const result = spawnSync(process.execPath, [cli, "--check-only", "--root", fixture.root, "--revision", fixture.input.revision,
      "--operator-identity", "fixture-operator", "--operator-request", "fixture audit approval", "--run-id", fixture.input.run_id,
      "--proposal", fixture.proposalPath, "--select-none", "--max-items", "1", "--max-input-bytes", "1", "--max-generated-bytes", "2000000",
      "--max-runtime-seconds", "60", "--max-sessions", "1", "--format", "json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.plan.selection_mode, "explicit");
    assert.equal(parsed.plan.input_bytes, 0);
    assert.deepEqual(parsed.plan.items, []);
    assert.equal(readLock(fixture.root), null);
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
  } finally { fixture.cleanup(); }
});

test("executor has no scheduler, Factory, child-session, or automatic retry path", () => {
  const source = readFileSync(resolve(here, "../lib/curation-executor.mjs"), "utf8");
  assert.doesNotMatch(source, /node:child_process|\bspawn(?:Sync)?\s*\(|\bexecFile(?:Sync)?\s*\(/);
  assert.doesNotMatch(source, /setInterval\s*\(|setTimeout\s*\(|Factory|launchd|crontab/);
});

test("mutation refuses inferred lexical selection", () => {
  const fixture = makeRepo({ runId: "fixture-selection-required" });
  try {
    assert.throws(() => executeCuration({ ...fixture.input, selected_items: undefined }), (error) => error.code === "selection-required");
    assert.equal(readLock(fixture.root), null);
  } finally { fixture.cleanup(); }
});

test("proposal cannot target AGENTS.md", () => {
  const fixture = makeRepo({ runId: "fixture-agents-rejected" });
  try {
    const proposalFile = join(fixture.root, fixture.proposalPath);
    const proposal = JSON.parse(readFileSync(proposalFile, "utf8"));
    proposal.outputs[0].path = "AGENTS.md";
    writeFileSync(proposalFile, `${JSON.stringify(proposal, null, 2)}\n`);
    const result = executeCuration(fixture.input);
    assert.equal(result.reason, "proposal-output-path");
    assert.equal(existsSync(join(fixture.root, "AGENTS.md")), false);
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(readLock(fixture.root), null);
  } finally { fixture.cleanup(); }
});

test("executes one locked bounded batch and finalizes only after validation", () => {
  const fixture = makeRepo();
  try {
    const result = executeCuration(fixture.input);
    assert.equal(result.outcome, "completed", JSON.stringify(result));
    assert.equal(result.lock_released, true);
    assert.equal(readLock(fixture.root), null);
    assert.ok(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")));
    assert.equal(existsSync(join(fixture.root, fixture.sourcePath)), false);
    assert.ok(existsSync(join(fixture.root, "knowledge/inbox/processed", fixture.sourcePath.split("/").at(-1))));
    assert.ok(existsSync(join(fixture.root, result.report_path)));
    assert.equal(result.report.selection_mode, "explicit");
    assert.ok(result.report.control_input_bytes > 0);
  } finally { fixture.cleanup(); }
});

test("retains invalid generated output and never advances the inbox source", () => {
  const fixture = makeRepo({ concept: fixtureText("invalid-concept.md"), runId: "fixture-invalid" });
  try {
    const result = executeCuration(fixture.input);
    assert.equal(result.outcome, "failed", JSON.stringify(result));
    assert.equal(result.reason, "staging-validation-failed");
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
    assert.ok(existsSync(join(fixture.root, `.okf/staging/${fixture.input.run_id}/shadow/knowledge/decisions/bounded-manual-curation.md`)));
    assert.equal(readLock(fixture.root), null);
  } finally { fixture.cleanup(); }
});

test("requires generated_at and generated_by on curator concept outputs", () => {
  const fixture = makeRepo({ concept: fixtureText("missing-generation-provenance.md"), runId: "fixture-provenance" });
  try {
    const result = executeCuration(fixture.input);
    assert.equal(result.reason, "staging-validation-failed");
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(result.report.validation.staging_ok, false);
  } finally { fixture.cleanup(); }
});

test("malformed maintenance output fails staging before any live mutation", () => {
  const fixture = makeRepo({ runId: "fixture-invalid-maintenance" });
  try {
    const proposalFile = join(fixture.root, fixture.proposalPath);
    const proposal = JSON.parse(readFileSync(proposalFile, "utf8"));
    proposal.outputs.find(({ path }) => path === "knowledge/log.md").content = "not a curation log\n";
    writeFileSync(proposalFile, `${JSON.stringify(proposal, null, 2)}\n`);
    const result = executeCuration(fixture.input);
    assert.equal(result.reason, "staging-validation-failed", JSON.stringify(result));
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
    assert.equal(readFileSync(join(fixture.root, "knowledge/log.md"), "utf8"), "# Log\n");
    assert.ok(result.report.changes.failed_outputs.some((path) => path.endsWith("/shadow/knowledge/log.md")));
  } finally { fixture.cleanup(); }
});

test("legacy scalar commit_sha branch noise stays warning-only while other structural types block", () => {
  const fixture = makeRepo({ runId: "fixture-legacy-commit-sha" });
  try {
    const legacy = fixtureText("legacy-short-commit-sha.md");
    writeFileSync(join(fixture.root, fixture.sourcePath), legacy);
    const compatible = validateCurationPreflight(fixture.root, [fixture.sourcePath]);
    const alternateBranch = compatible.diagnostics.find(({ code, field }) => code === "schema-type" && field === "/commit_sha");
    assert.ok(alternateBranch, JSON.stringify(compatible.diagnostics));
    assert.equal(alternateBranch.blocking, false);
    assert.equal(compatible.ok, true, JSON.stringify(compatible.diagnostics));

    writeFileSync(join(fixture.root, fixture.sourcePath), legacy.replace("tags: [okf, work-requests]", "tags: malformed-scalar"));
    const malformed = validateCurationPreflight(fixture.root, [fixture.sourcePath]);
    const structuralType = malformed.diagnostics.find(({ code, field }) => code === "schema-type" && field === "/tags");
    assert.ok(structuralType, JSON.stringify(malformed.diagnostics));
    assert.equal(structuralType.blocking, true);
    assert.equal(malformed.ok, false);
  } finally { fixture.cleanup(); }
});

test("legacy lowercase inbox metadata remains warning-only but an unknown type blocks", () => {
  const fixture = makeRepo({ runId: "fixture-legacy-lowercase-inbox" });
  try {
    const legacy = fixtureText("legacy-lowercase-inbox.md");
    writeFileSync(join(fixture.root, fixture.sourcePath), legacy);
    const compatible = validateCurationPreflight(fixture.root, [fixture.sourcePath]);
    assert.equal(compatible.ok, true, JSON.stringify(compatible.diagnostics));
    assert.ok(compatible.diagnostics.some(({ code, field, blocking }) => code === "schema-enum" && field === "/type" && blocking === false));
    for (const field of ["description", "status", "timestamp"]) {
      assert.ok(compatible.diagnostics.some((diagnostic) => diagnostic.code === "schema-required" && diagnostic.field === field && diagnostic.blocking === false));
    }

    writeFileSync(join(fixture.root, fixture.sourcePath), legacy.replace("type: inbox", "type: artifact"));
    const unknown = validateCurationPreflight(fixture.root, [fixture.sourcePath]);
    assert.equal(unknown.ok, false);
    assert.ok(unknown.diagnostics.some(({ code, field, blocking }) => code === "schema-enum" && field === "/type" && blocking === true));
  } finally { fixture.cleanup(); }
});

test("postflight failure rolls back the concept and reports recoverable partial output", () => {
  const fixture = makeRepo({ runId: "fixture-postflight" });
  try {
    const result = executeCuration(fixture.input, {
      validatePostflight: () => ({ ok: false, mode: "strict", files_checked: 1, diagnostics: [{ path: "knowledge/decisions/bounded-manual-curation.md", code: "fixture-postflight", severity: "error" }] }),
    });
    assert.equal(result.reason, "postflight-validation-failed");
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
    assert.ok(existsSync(join(fixture.root, `.okf/staging/${fixture.input.run_id}/failed/knowledge/decisions/bounded-manual-curation.md`)));
    assert.ok(result.report.changes.failed_outputs.length > 0);
  } finally { fixture.cleanup(); }
});

test("maintenance write failure rolls back every output before source finalization", () => {
  const fixture = makeRepo({ runId: "fixture-maintenance-rollback" });
  try {
    const originals = new Map([
      "knowledge/decisions/index.md", "knowledge/inbox/index.md", "knowledge/index.md", "knowledge/log.md",
    ].map((path) => [path, readFileSync(join(fixture.root, path), "utf8")]));
    let interrupted = false;
    const result = executeCuration(fixture.input, {
      fault: (phase) => {
        if (phase === "after-maintenance-upsert" && !interrupted) {
          interrupted = true;
          throw new Error("fixture-maintenance-write-failure");
        }
      },
    });
    assert.equal(result.reason, "fixture-maintenance-write-failure", JSON.stringify(result));
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
    for (const [path, content] of originals) assert.equal(readFileSync(join(fixture.root, path), "utf8"), content, path);
    assert.ok(result.report.changes.failed_outputs.some((path) => path.includes("/failed/knowledge/decisions/index.md")));
  } finally { fixture.cleanup(); }
});

test("a repeated explicit resume keeps rejected output retained and restores the live target", () => {
  const fixture = makeRepo({ runId: "fixture-repeat-postflight" });
  const reject = {
    validatePostflight: () => ({ ok: false, mode: "strict", files_checked: 1, diagnostics: [{ path: "knowledge/decisions/bounded-manual-curation.md", code: "fixture-postflight", severity: "error" }] }),
  };
  try {
    const first = executeCuration(fixture.input, reject);
    assert.equal(first.reason, "postflight-validation-failed");
    const second = executeCuration({ ...fixture.input, resume: true }, reject);
    assert.equal(second.reason, "postflight-validation-failed");
    assert.equal(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")), false);
    assert.ok(existsSync(join(fixture.root, `.okf/staging/${fixture.input.run_id}/failed/knowledge/decisions/bounded-manual-curation.md`)));
    assert.ok(second.report.changes.failed_outputs.some((path) => path.includes("/failed-attempts/")));
    assert.ok(existsSync(join(fixture.root, fixture.sourcePath)));
  } finally { fixture.cleanup(); }
});

test("explicit resume verifies hashes and completes without duplicating output", () => {
  const fixture = makeRepo({ runId: "fixture-resume" });
  try {
    let interrupted = false;
    const first = executeCuration(fixture.input, {
      fault: (phase) => {
        if (phase === "after-source-move" && !interrupted) { interrupted = true; throw new Error("fixture-interrupt"); }
      },
    });
    assert.equal(first.outcome, "failed");
    assert.equal(existsSync(join(fixture.root, fixture.sourcePath)), true);
    assert.equal(existsSync(join(fixture.root, "knowledge/inbox/processed", fixture.sourcePath.split("/").at(-1))), false);
    const resumed = executeCuration({ ...fixture.input, resume: true });
    assert.equal(resumed.outcome, "completed", JSON.stringify(resumed));
    assert.ok(existsSync(join(fixture.root, "knowledge/decisions/bounded-manual-curation.md")));
    assert.equal(resumed.report.changes.proposed_outputs.filter(({ path }) => path === "knowledge/decisions/bounded-manual-curation.md").length, 1);
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} curation-executor test(s) failed.`);
  process.exit(1);
}
console.log("\nAll curation-executor tests passed.");
