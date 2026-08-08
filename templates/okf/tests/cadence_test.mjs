import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cadenceStatus, observeCadence } from "../lib/cadence.mjs";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "okf-cadence-")));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.name", "OKF Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "okf@example.invalid"], { cwd: root });
  mkdirSync(join(root, "knowledge/inbox"), { recursive: true });
  mkdirSync(join(root, ".okf/evidence"), { recursive: true });
  writeFileSync(join(root, "knowledge/inbox/index.md"), "# Inbox\n");
  writeFileSync(join(root, ".okf/KILL_SWITCH"), '{"active":false}\n');
  writeFileSync(join(root, ".okf/cadence.json"), '{"mode":"manual-explicit","enabled":true}\n');
  execFileSync("git", ["add", "knowledge", ".okf"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  return root;
}

function evidence(root, name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  const path = `.okf/evidence/${name}.json`;
  writeFileSync(join(root, path), text);
  return { path, sha256: sha256(text) };
}

function sample({ id, scenario, root, revision, snapshotRoot, report, outcome = "completed", runtime = 2, cpu = 20, disk = 128, generated = 128, sessions = 1, concurrent = 1, age = 2, processed = 1, concepts = 1, interventions = 1, recovered = true }) {
  return { sample_id: id, scenario, observed_at: id === "small" ? "2026-08-08T00:01:00Z" : "2026-08-08T00:02:00Z", project_root: root, revision, snapshot_root: snapshotRoot, source_report: report.path, source_report_sha256: report.sha256, trigger: "manual-explicit", automatic_execution: false, outcome, runtime_seconds: runtime, cpu_ms: cpu, disk_growth_bytes: disk, generated_bytes: generated, sessions_max: sessions, concurrent_runs: concurrent, inbox_oldest_age_days: age, processed_items: processed, useful_concept_changes: concepts, operator_interventions: interventions, recovered };
}

const root = fixture();
const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const status = cadenceStatus(root, { checkpoint: "epic-close", operatorRequest: "Epic #26 D7 fixture", asOf: "2026-08-08T00:00:00Z" });
assert.equal(status.automatic_execution, false);
assert.equal(status.execution_authority, false);
assert.equal(status.control.state, "enabled");

const canaryReport = evidence(root, "small", {
  version: "okf-epic26-canary-evidence/1", success: true, raw_inbox_content_recorded: false, scenario: "normal",
  source: { root: "/tmp/small", revision },
  snapshot: { root: "/tmp/small-snapshot", disk_growth_bytes: 128 },
  controls: { network_used: false, scheduler_used: false, factory_used: false, child_runtime_sessions: 0, automatic_retries: 0, max_sessions: 1, max_executor_concurrency_observed: 1, max_command_concurrency_observed: 1 },
  backlog: { pending_before: { selected_count: 1, timestamp_valid_count: 1, oldest_seconds: 2 * 86400 } },
  usefulness: { processed_items: 1, useful_concept_changes: 1 },
  metrics: { wall_milliseconds: 2000, cpu_milliseconds: 20, executor_generated_bytes_total: 128, max_active_sessions_observed: 1, max_concurrent_runs_observed: 1, executor_invocations: 1 },
  declared_limits: { executor: { max_sessions: 1 } },
});
const blockedReport = evidence(root, "blocked", {
  version: "okf-cadence-control-evidence/1", success: true, scenario: "blocked-control", project_root: "/tmp/small", revision,
  outcome: "blocked", automatic_execution: false, recovered: true, raw_inbox_content_recorded: false, failure: null,
  control_proof: {
    initial: { active: false, sha256: "a".repeat(64) },
    activated: { active: true, sha256: "b".repeat(64) },
    blocked_check: { check_only: true, permitted: false, code: "kill-switch-active", request_sha256: "c".repeat(64), mutation: false },
    restored: { active: false, sha256: "a".repeat(64), matches_initial: true },
    permitted_check: { check_only: true, permitted: true, selection_mode: "explicit", control_input_bytes: 0, max_sessions: 1, request_sha256: "c".repeat(64), mutation: false },
    identical_request: true, recovery_complete: true,
  },
  integrity: {
    selected_before: [{ path: "knowledge/inbox/item.md", sha256: "d".repeat(64) }],
    selected_after: [{ path: "knowledge/inbox/item.md", sha256: "d".repeat(64) }],
    selected_unchanged: true,
    unselected_before: { count: 0, sha256: "e".repeat(64) },
    unselected_after: { count: 0, sha256: "e".repeat(64) },
    unselected_unchanged: true,
    live_before: { head: revision, tree: "f".repeat(40) },
    live_after: { head: revision, tree: "f".repeat(40) },
    live_unchanged: true, instructions_unchanged: true, snapshot_status_restored: true, control_manifest_restored: true,
  },
  controls: { network_used: false, scheduler_used: false, factory_used: false, polling_used: false, child_runtime_sessions: 0, mutation_lock_created: false, curator_started: false, automatic_retries: 0 },
  metrics: { runtime_seconds: 1, cpu_ms: 10, disk_growth_bytes: 0, generated_bytes: 0, sessions_max: 0, concurrent_runs: 0, inbox_oldest_age_days: 2, processed_items: 0, useful_concept_changes: 0, operator_interventions: 2 },
  snapshot: { root: "/tmp/small-control-snapshot" },
});

const manifest = {
  version: "okf-cadence-observation/1", mode: "manual-explicit", automatic_execution: false,
  started_at: "2026-08-08T00:00:00Z", ended_at: "2026-08-08T00:05:00Z",
  required_projects: ["/tmp/small"], required_scenarios: ["blocked-control", "normal"],
  limits: { min_samples: 2, max_runtime_seconds: 60, max_cpu_ms: 1000, max_disk_growth_bytes: 4096, max_generated_bytes: 4096, max_sessions: 1, max_concurrent_runs: 1, max_inbox_age_days: 30 },
  samples: [
    sample({ id: "small", scenario: "normal", root: "/tmp/small", revision, snapshotRoot: "/tmp/small-snapshot", report: canaryReport }),
    sample({ id: "blocked-recovery", scenario: "blocked-control", root: "/tmp/small", revision, snapshotRoot: "/tmp/small-control-snapshot", report: blockedReport, outcome: "blocked", runtime: 1, cpu: 10, disk: 0, generated: 0, sessions: 0, concurrent: 0, processed: 0, concepts: 0, interventions: 2 }),
  ],
};
const observed = observeCadence(manifest, { evidenceRoot: root });
assert.equal(observed.passed, true);
assert.equal(observed.curation_yield, 1);

const tampered = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, cpu_ms: 21 } : item) };
assert.throws(() => observeCadence(tampered, { evidenceRoot: root }), (error) => error.code === "observation-evidence-mismatch");
const missingCoverage = { ...manifest, required_scenarios: ["blocked-control", "interrupt-resume", "normal"] };
assert.equal(observeCadence(missingCoverage, { evidenceRoot: root }).passed, false);
const snapshotMismatch = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, snapshot_root: "/tmp/wrong-snapshot" } : item) };
assert.throws(() => observeCadence(snapshotMismatch, { evidenceRoot: root }), (error) => error.code === "observation-evidence-mismatch");

const canaryReportBody = JSON.parse(readFileSync(join(root, canaryReport.path), "utf8"));
const forgedScheduler = evidence(root, "forged-scheduler", {
  ...canaryReportBody,
  controls: { ...canaryReportBody.controls, scheduler_used: true },
});
const forgedSchedulerManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedScheduler.path, source_report_sha256: forgedScheduler.sha256 } : item) };
assert.throws(() => observeCadence(forgedSchedulerManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");
const forgedRetry = evidence(root, "forged-retry", {
  ...canaryReportBody,
  controls: { ...canaryReportBody.controls, automatic_retries: 1 },
});
const forgedRetryManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedRetry.path, source_report_sha256: forgedRetry.sha256 } : item) };
assert.throws(() => observeCadence(forgedRetryManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");
const forgedMaxSessions = evidence(root, "forged-max-sessions", {
  ...canaryReportBody,
  controls: { ...canaryReportBody.controls, max_sessions: 2 },
});
const forgedMaxSessionsManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedMaxSessions.path, source_report_sha256: forgedMaxSessions.sha256 } : item) };
assert.throws(() => observeCadence(forgedMaxSessionsManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");
const forgedExecutorConcurrency = evidence(root, "forged-executor-concurrency", {
  ...canaryReportBody,
  controls: { ...canaryReportBody.controls, max_executor_concurrency_observed: 2 },
});
const forgedExecutorConcurrencyManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedExecutorConcurrency.path, source_report_sha256: forgedExecutorConcurrency.sha256 } : item) };
assert.throws(() => observeCadence(forgedExecutorConcurrencyManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");
const forgedCommandConcurrency = evidence(root, "forged-command-concurrency", {
  ...canaryReportBody,
  controls: { ...canaryReportBody.controls, max_command_concurrency_observed: 2 },
});
const forgedCommandConcurrencyManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedCommandConcurrency.path, source_report_sha256: forgedCommandConcurrency.sha256 } : item) };
assert.throws(() => observeCadence(forgedCommandConcurrencyManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");

const forgedRawContent = evidence(root, "forged-raw-content", {
  ...canaryReportBody,
  raw_inbox_body: "---\ntype: Inbox\n---\n# copied source body",
});
const forgedRawManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedRawContent.path, source_report_sha256: forgedRawContent.sha256 } : item) };
assert.throws(() => observeCadence(forgedRawManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-content-invalid");

const forgedShortUnexpected = evidence(root, "forged-short-unexpected", {
  ...canaryReportBody,
  memo: "secret",
});
const forgedShortUnexpectedManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedShortUnexpected.path, source_report_sha256: forgedShortUnexpected.sha256 } : item) };
assert.throws(() => observeCadence(forgedShortUnexpectedManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-content-invalid");

const forgedNestedUnexpected = evidence(root, "forged-nested-unexpected", {
  ...canaryReportBody,
  metadata: { reason: "secret" },
});
const forgedNestedUnexpectedManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 0 ? { ...item, source_report: forgedNestedUnexpected.path, source_report_sha256: forgedNestedUnexpected.sha256 } : item) };
assert.throws(() => observeCadence(forgedNestedUnexpectedManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-content-invalid");

const canaryWithoutRawBody = { ...canaryReportBody };
delete canaryWithoutRawBody.raw_inbox_content_recorded;
const canaryWithoutRaw = evidence(root, "missing-raw-assertion", canaryWithoutRawBody);
const missingRawAssertionManifest = {
  ...manifest,
  samples: manifest.samples.map((item, index) => index === 0 ? {
    ...item,
    source_report: canaryWithoutRaw.path,
    source_report_sha256: canaryWithoutRaw.sha256,
  } : item),
};
assert.throws(
  () => observeCadence(missingRawAssertionManifest, { evidenceRoot: root }),
  (error) => error.code === "observation-raw-content-evidence-missing",
);

const rawContentAttestationBody = {
  version: "okf-raw-content-evidence/1",
  project_root: "/tmp/small",
  revision,
  source_report: canaryWithoutRaw.path,
  source_report_sha256: canaryWithoutRaw.sha256,
  raw_inbox_content_recorded: false,
};
const rawContentAttestation = evidence(root, "raw-content-attestation", rawContentAttestationBody);
const secondaryRawAssertionManifest = {
  ...manifest,
  samples: manifest.samples.map((item, index) => index === 0 ? {
    ...item,
    source_report: canaryWithoutRaw.path,
    source_report_sha256: canaryWithoutRaw.sha256,
    raw_content_evidence: rawContentAttestation.path,
    raw_content_evidence_sha256: rawContentAttestation.sha256,
  } : item),
};
assert.equal(observeCadence(secondaryRawAssertionManifest, { evidenceRoot: root }).passed, true);

const trueRawContentAttestation = evidence(root, "true-raw-content-attestation", {
  ...rawContentAttestationBody,
  raw_inbox_content_recorded: true,
});
const trueRawAssertionManifest = {
  ...secondaryRawAssertionManifest,
  samples: secondaryRawAssertionManifest.samples.map((item, index) => index === 0 ? {
    ...item,
    raw_content_evidence: trueRawContentAttestation.path,
    raw_content_evidence_sha256: trueRawContentAttestation.sha256,
  } : item),
};
assert.throws(
  () => observeCadence(trueRawAssertionManifest, { evidenceRoot: root }),
  (error) => error.code === "observation-raw-content-evidence-invalid",
);

const forgedRawAssertionManifest = {
  ...secondaryRawAssertionManifest,
  samples: secondaryRawAssertionManifest.samples.map((item, index) => index === 0 ? {
    ...item,
    raw_content_evidence_sha256: "0".repeat(64),
  } : item),
};
assert.throws(
  () => observeCadence(forgedRawAssertionManifest, { evidenceRoot: root }),
  (error) => error.code === "observation-raw-content-evidence-hash-mismatch",
);

for (const [name, mismatch] of [
  ["project", { project_root: "/tmp/not-small" }],
  ["revision", { revision: "f".repeat(40) }],
  ["source-hash", { source_report_sha256: "f".repeat(64) }],
]) {
  const mismatchedAttestation = evidence(root, `mismatched-raw-content-${name}`, {
    ...rawContentAttestationBody,
    ...mismatch,
  });
  const mismatchedRawAssertionManifest = {
    ...secondaryRawAssertionManifest,
    samples: secondaryRawAssertionManifest.samples.map((item, index) => index === 0 ? {
      ...item,
      raw_content_evidence: mismatchedAttestation.path,
      raw_content_evidence_sha256: mismatchedAttestation.sha256,
    } : item),
  };
  assert.throws(
    () => observeCadence(mismatchedRawAssertionManifest, { evidenceRoot: root }),
    (error) => error.code === "observation-raw-content-evidence-invalid",
  );
}

const partialAgeReport = evidence(root, "partial-age-source", {
  ...canaryReportBody,
  backlog: { pending_before: { selected_count: 2, timestamp_valid_count: 1, oldest_seconds: 86400 } },
  snapshot: { ...canaryReportBody.snapshot, root: "/tmp/partial-age-snapshot" },
});
const partialAgeSample = sample({ id: "small", scenario: "normal", root: "/tmp/small", revision, snapshotRoot: "/tmp/partial-age-snapshot", report: partialAgeReport });
const missingAgeManifest = { ...manifest, samples: [partialAgeSample, manifest.samples[1]] };
assert.throws(() => observeCadence(missingAgeManifest, { evidenceRoot: root }), (error) => error.code === "observation-age-evidence-missing");
const ageReport = evidence(root, "complete-age", {
  version: "okf-inbox-age-evidence/1",
  project_root: "/tmp/small",
  revision,
  observed_at: "2026-08-08T00:01:00Z",
  direct_inbox_manifest: { count: 2, bytes: 128, sha256: "a".repeat(64) },
  date_derivations: { timestamp: 1, legacy_date: 1, filename: 0, undated: 0 },
  oldest: { path: "knowledge/inbox/oldest.md", timestamp: "2026-08-06T00:01:00Z", method: "legacy_date", age_seconds: 172800, age_days_ceil: 2 },
  newest: { path: "knowledge/inbox/newest.md", timestamp: "2026-08-07T00:01:00Z", method: "timestamp", age_seconds: 86400 },
  raw_inbox_content_recorded: false,
});
const completeAgeManifest = {
  ...manifest,
  samples: [{ ...partialAgeSample, inbox_age_evidence: ageReport.path, inbox_age_evidence_sha256: ageReport.sha256 }, manifest.samples[1]],
};
assert.equal(observeCadence(completeAgeManifest, { evidenceRoot: root }).passed, true);

const partialAgeWithoutRawBody = JSON.parse(readFileSync(join(root, partialAgeReport.path), "utf8"));
delete partialAgeWithoutRawBody.raw_inbox_content_recorded;
const partialAgeWithoutRaw = evidence(root, "partial-age-without-raw-assertion", partialAgeWithoutRawBody);
const partialAgeRawAttestation = evidence(root, "partial-age-raw-content-attestation", {
  ...rawContentAttestationBody,
  source_report: partialAgeWithoutRaw.path,
  source_report_sha256: partialAgeWithoutRaw.sha256,
});
const completeAgeAndRawManifest = {
  ...manifest,
  samples: [{
    ...partialAgeSample,
    source_report: partialAgeWithoutRaw.path,
    source_report_sha256: partialAgeWithoutRaw.sha256,
    raw_content_evidence: partialAgeRawAttestation.path,
    raw_content_evidence_sha256: partialAgeRawAttestation.sha256,
    inbox_age_evidence: ageReport.path,
    inbox_age_evidence_sha256: ageReport.sha256,
  }, manifest.samples[1]],
};
assert.equal(observeCadence(completeAgeAndRawManifest, { evidenceRoot: root }).passed, true);

const blockedReportBody = JSON.parse(readFileSync(join(root, blockedReport.path), "utf8"));
const forgedBlocked = evidence(root, "forged-blocked", {
  ...blockedReportBody,
  control_proof: {
    ...blockedReportBody.control_proof,
    permitted_check: {
      ...blockedReportBody.control_proof.permitted_check,
      request_sha256: "9".repeat(64),
    },
  },
});
const forgedManifest = { ...manifest, samples: manifest.samples.map((item, index) => index === 1 ? { ...item, source_report: forgedBlocked.path, source_report_sha256: forgedBlocked.sha256 } : item) };
assert.throws(() => observeCadence(forgedManifest, { evidenceRoot: root }), (error) => error.code === "observation-evidence-control-invalid");

console.log("All cadence tests passed.");
