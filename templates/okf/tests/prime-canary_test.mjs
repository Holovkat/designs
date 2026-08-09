#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { runAdaptiveHelper } from "../canary/adaptive-sandbox.mjs";
import { deleteCanaryTraces, deriveCanaryExecutionReceipt, runComparativeStageA } from "../canary/comparative-canary.mjs";
import { validatePrimeRunManifest } from "../canary/prime-broker.mjs";
import { FIXED_TOOL_NAMES, createFixedToolBroker } from "../canary/prime-tools.mjs";
import { ReceiptLedger } from "../canary/receipt-ledger.mjs";
import { scoreCanaryCase } from "../canary/score-canary.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const okfRoot = resolve(testDir, "..");
const complete = JSON.parse(readFileSync(resolve(okfRoot, "schema/fixtures/knowledge-change/valid/complete.json"), "utf8"));
let failures = 0;
const pending = [];

function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => console.log(`PASS ${name}`)).catch((error) => {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack ?? error.message}`);
  }));
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }

function fixtureRoot() {
  const root = mkdtempSync(resolve(realpathSync(tmpdir()), "okf-prime-canary-"));
  git(root, ["init", "-b", "canary"]);
  git(root, ["config", "user.email", "okf@example.invalid"]);
  git(root, ["config", "user.name", "OKF Fixture"]);
  for (const dir of ["architecture", "components", "domain", "decisions", "process", "deprecation", "state", "inbox", "evidence"]) mkdirSync(resolve(root, `knowledge/${dir}`), { recursive: true });
  writeFileSync(resolve(root, "knowledge/decisions/one.md"), "---\ntype: Decision\nid: okf-00000000-0000-4000-8000-000000000001\ntitle: Fixed Tool Decision\ndescription: Bounded navigation\ntags: [okf]\ntimestamp: 2026-08-09T00:00:00Z\nstatus: active\nassertion_state: proposed\ngenerated_at: 2026-08-09T00:00:00Z\ngenerated_by: fixture\ngeneration_method: human-authored\nsource_authority: fixture\nevidence_refs: [knowledge/evidence/receipt.json]\n---\n# Decision\n\nFixed tools only.\n");
  writeFileSync(resolve(root, "knowledge/inbox/session.change.json"), `${JSON.stringify(complete, null, 2)}\n`);
  writeFileSync(resolve(root, "knowledge/evidence/receipt.json"), "{\"status\":\"pass\"}\n");
  writeFileSync(resolve(root, "knowledge/evidence/decision.md"), "# Owner Decision\n\nProceed with synthetic checks only.\n");
  writeFileSync(resolve(root, "knowledge/evidence/resource.md"), "# Frozen Resource\n");
  git(root, ["add", "knowledge"]);
  git(root, ["commit", "-m", "fixture: seed canary"]);
  return { root, revision: git(root, ["rev-parse", "HEAD"]) };
}

function executionProof(overrides = {}) {
  const status = "a".repeat(64);
  return {
    version: "okf-canary-execution-proof/1", tool_names: FIXED_TOOL_NAMES,
    root_revision_valid: true, repository_status_before_sha256: status,
    repository_status_after_sha256: status, submission_count: 1, retry_events: 0,
    ledger_error_count: 0, ledger_redactions: ["hash-only"], within_ceilings: true,
    clean_teardown: true, raw_source_retained: false, normalized_uninspectable_source: false,
    ...overrides,
  };
}

function scoredReceipt(goldCase, candidate, overrides = {}) {
  return deriveCanaryExecutionReceipt({
    arm: { name: "fake-fixed", type: "prime-fixed-tools" }, goldCase, candidate,
    execution: executionProof(overrides),
  });
}

function matchingGold(candidate, id = "fixture-case") {
  return {
    case_id: id,
    risk: "normal",
    expected: {
      coverage: Object.fromEntries(candidate.captures.map(({ capture_id, disposition }) => [capture_id, disposition.type])),
      operations: candidate.operations.map(({ kind, target, capture_ids, deprecation }) => ({ kind, path: target.path, capture_ids, ...(deprecation ? { supersedes: deprecation.superseded_concept_ids } : {}) })),
      review_required: candidate.captures.some(({ disposition }) => disposition.type === "review-required"),
      prohibited_assertions: [],
      permitted_paths: candidate.operations.map(({ target }) => target.path),
    },
  };
}

test("fixed broker exposes exactly the reviewed tools and emits hash-only receipts", async () => {
  const { root, revision } = fixtureRoot();
  const ledger = new ReceiptLedger({ runId: "fixed-tools", maxBytes: 128 * 1024 });
  const broker = createFixedToolBroker({
    root, revision, selectedCloseout: "knowledge/inbox/session.change.json",
    receiptPaths: ["knowledge/evidence/receipt.json"],
    decisionPaths: ["knowledge/evidence/decision.md"],
    resourcePaths: ["knowledge/evidence/resource.md"],
    limits: { max_tool_calls: 10, max_tool_bytes: 512 * 1024, max_top_k: 5 }, ledger,
  });
  assert.deepEqual(broker.toolNames, FIXED_TOOL_NAMES);
  await broker.handlers.read_session_summary({});
  await broker.handlers.list_capture_dispositions({});
  const search = await broker.handlers.search_concepts({ terms: ["bounded"], top_k: 2 });
  assert.match(search.text, /Fixed Tool Decision/u);
  await broker.handlers.get_delivery_receipt({ path: "knowledge/evidence/receipt.json" });
  await broker.handlers.get_owner_decision({ path: "knowledge/evidence/decision.md" });
  await broker.handlers.get_resource_at_revision({ path: "knowledge/evidence/resource.md", reason: "Need the exact frozen contract" });
  await broker.handlers.submit_knowledge_change_set({ change_set: complete });
  assert.equal(broker.metrics().submitted, true);
  assert.equal(JSON.stringify(ledger.document()).includes("Fixed Tool Decision"), false);
  assert.equal(ledger.entries.every(({ redaction }) => redaction === "hash-only"), true);
});

test("package pins and separate real-provider approval fail closed", () => {
  const packageRoot = resolve(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "prime-agent");
  const pin = JSON.parse(readFileSync(resolve(okfRoot, "canary/prime-agent-0.7.1.pin.json"), "utf8"));
  const fixture = fixtureRoot();
  const base = {
    version: "okf-prime-run-manifest/1", run_id: "fake-pin", mode: "fake-provider",
    root: fixture.root, revision: fixture.revision, selected_closeout: "knowledge/inbox/session.change.json",
    prime: { version: "0.7.1", package_root: packageRoot, files: pin.files },
    model: { provider: "fake", id: "fake" }, network: { broker_endpoint: "none", tools: "none", helpers: "none" },
    credential_source: { kind: "prime-login", reference: "test-login" },
    prompt_sha256: "a".repeat(64), tool_contract_sha256: "b".repeat(64), case_sha256: "c".repeat(64),
    receipt_path: resolve(realpathSync(tmpdir()), "fake-pin-receipt.json"), retry_ceiling: 0,
    approval: { status: "not-required-fake", reference: "synthetic" },
    limits: { max_sessions: 1, max_provider_requests: 1, max_tool_calls: 8, max_tool_bytes: 65536, max_top_k: 5, max_input_tokens: 1000, max_output_tokens: 1000, max_total_tokens: 2000, max_wall_ms: 10000, max_model_ms: 10000, max_processes: 1, max_disk_bytes: 65536, max_cost_microusd: 1, max_receipt_bytes: 65536 },
  };
  assert.equal(validatePrimeRunManifest(base).mode, "fake-provider");
  const real = { ...base, mode: "real-provider", approval: { status: "rejected", reference: "not approved" } };
  assert.throws(() => validatePrimeRunManifest(real), (error) => error.code === "real-provider-not-approved");
});

test("adaptive helper is confined, hash-bound, and torn down", async () => {
  const root = mkdtempSync(resolve(realpathSync(tmpdir()), "okf-adaptive-input-"));
  const input = resolve(root, "input.json");
  writeFileSync(input, "{\"value\":1}\n");
  const manifest = {
    version: "okf-adaptive-helper-manifest/1", run_id: "adaptive-test", helper_id: "helper-one",
    sandbox_executable: "/usr/bin/sandbox-exec", node_path: process.execPath,
    network: "none", package_install: "denied", promotion: "denied",
    inputs: [{ name: "input.json", path: input, sha256: sha256(readFileSync(input)) }],
    limits: { max_runtime_ms: 10000, max_output_bytes: 8192, max_disk_bytes: 65536, max_source_bytes: 8192, max_processes: 1 },
  };
  const source = 'import { readFileSync, writeFileSync } from "node:fs"; const value = JSON.parse(readFileSync("inputs/input.json", "utf8")); writeFileSync("output.json", JSON.stringify({ doubled: value.value * 2 })); console.log("done");';
  const run = await runAdaptiveHelper({ manifest, source });
  assert.equal(run.result.exit_code, 0);
  assert.equal(run.result.teardown, "completed");
  assert.equal(run.result.network, "denied");
  await assert.rejects(() => runAdaptiveHelper({ manifest, source: 'import "node:child_process";' }), (error) => error.code === "helper-source-prohibited-import");
});

test("scorer separates hard safety from semantic correctness", () => {
  const gold = matchingGold(complete);
  const score = scoreCanaryCase({ goldCase: gold, candidate: complete, receipt: scoredReceipt(gold, complete), reviewer: { status: "accept", correction_required: false } });
  assert.equal(score.pass, true);
  const unsafeGold = matchingGold(complete, "unsafe");
  const unsafe = scoreCanaryCase({ goldCase: unsafeGold, candidate: complete, receipt: scoredReceipt(unsafeGold, complete, { retry_events: 1 }), reviewer: { status: "accept", correction_required: false } });
  assert.equal(unsafe.pass, false);
  assert.ok(unsafe.hard_failures.includes("no_retry"));

  const narrow = matchingGold(complete, "over-broad");
  delete narrow.expected.coverage[complete.captures.at(-1).capture_id];
  narrow.expected.operations.pop();
  const broad = scoreCanaryCase({ goldCase: narrow, candidate: complete, receipt: scoredReceipt(narrow, complete), reviewer: { status: "accept", correction_required: false } });
  assert.equal(broad.pass, false);
  assert.ok(broad.unexpected_capture_ids.length > 0);
  assert.ok(broad.hard_failures.includes("unexpected-operation"));

  const prohibited = matchingGold(complete, "prohibited");
  prohibited.expected.prohibited_assertions = ["verified"];
  const prohibitedScore = scoreCanaryCase({ goldCase: prohibited, candidate: complete, receipt: scoredReceipt(prohibited, complete), reviewer: { status: "accept", correction_required: false } });
  assert.equal(prohibitedScore.pass, false);
  assert.ok(prohibitedScore.hard_failures.includes("prohibited:verified"));
});

test("comparative runner uses one attempt and produces a redacted deletion receipt", async () => {
  const runId = `test-${randomUUID()}`;
  const root = mkdtempSync(resolve(realpathSync(tmpdir()), "okf-comparative-"));
  const gold = matchingGold(complete, "single-case");
  const caseFile = resolve(root, "cases.json");
  writeFileSync(caseFile, `${JSON.stringify({ version: "okf-gold-cases/1", cases: [gold] }, null, 2)}\n`);
  const now = new Date();
  const traceDir = resolve(homedir(), ".prime/agent/canaries/designs-okf", runId);
  const manifest = {
    version: "okf-comparative-canary/1", run_id: runId, created_at: now.toISOString().replace(/\.\d{3}Z$/u, "Z"),
    case_file: caseFile, case_sha256: sha256(readFileSync(caseFile)),
    arms: [{ name: "fake-fixed", type: "prime-fixed-tools", enabled: true }],
    trace_dir: traceDir, trace_deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/u, "Z"),
    passing_case_repetitions: 1, max_targeted_reruns: 1, second_failure_outcome: "revise-or-stop",
  };
  const report = await runComparativeStageA({ manifest, armRunners: { "fake-fixed": async () => ({ candidate: complete, execution: executionProof(), reviewer: { status: "accept", correction_required: false } }) } });
  assert.equal(report.attempts, 1);
  assert.equal(report.decision, "approve");
  const deletionPath = resolve(root, "deletion.json");
  const receipt = deleteCanaryTraces({ traceDir, manifestSha256: report.manifest_sha256, receiptPath: deletionPath, actor: "test", decisionAt: manifest.created_at, deadline: manifest.trace_deadline });
  assert.equal(receipt.success, true);
  assert.equal(existsSync(traceDir), false);
});

await Promise.all(pending);
if (failures > 0) { console.error(`\n${failures} Prime canary test(s) failed.`); process.exit(1); }
console.log("\nAll Prime canary tests passed.");
