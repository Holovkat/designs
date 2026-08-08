import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { inboxStatus } from "./inbox-status.mjs";
import { resolveControlPath, validateRoot } from "./run-guard.mjs";

const CONTROL_PATH = ".okf/cadence.json";
const CHECKPOINTS = new Set(["sprint-checkpoint", "epic-close", "manual-review"]);
const OUTCOMES = new Set(["completed", "cancelled", "quota-exceeded", "blocked", "failed"]);
const REVISION = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SHA256 = /^[0-9a-f]{64}$/;
const RAW_CONTENT_TOKENS = new Set(["raw", "body", "content", "payload", "text", "markdown", "patch", "transcript", "stdout", "stderr", "diff"]);
// Version-1 observation artifacts are closed records. A new field must be
// reviewed here (or introduced under a new report version) so a short string
// cannot smuggle raw inbox material past the multiline/size checks below.
const EVIDENCE_FIELD_KEYS = new Set([
  "activated", "activated_at", "activated_by_sha256", "active", "actual_sha256", "age_days_ceil", "age_seconds", "all_pending", "all_processed", "all_restored",
  "automatic_execution", "automatic_retries", "backlog", "blocked_check", "bounded_executor_reports_sha256", "bounded_report", "bytes",
  "candidate_count", "check_only", "child_runtime_sessions", "code", "codes", "command_count", "concept_diagnostics",
  "concept_diagnostics_sha256", "concept_index_sha256", "concept_output_sha256", "concept_sha256", "concurrent_runs", "control_input_bytes",
  "control_manifest_restored", "control_proof", "control_request_sha256", "controls", "count", "cpu_milliseconds", "cpu_ms",
  "cpu_system_microseconds", "cpu_user_microseconds", "curation_yield", "curator_started", "date_derivations", "declared_limits", "diagnostics", "direct_inbox_manifest",
  "diagnostics_sha256", "disk_bytes_after", "disk_bytes_baseline", "disk_bytes_before", "disk_growth_bytes", "errors",
  "evidence_payload_sha256", "exact_head", "exact_revision_manifest", "executor", "executor_generated_bytes_total", "executor_invocations",
  "exit_status", "expected_sha256", "explicit_operator_identity_sha256", "explicit_operator_request_sha256", "factory_used", "failure", "filename", "files",
  "files_checked", "final_selected_retention", "finished_at", "generated_bytes", "harness", "hash_preserved", "head", "identical_request",
  "inbox_index_membership", "inbox_index_sha256", "inbox_oldest_age_days", "initial", "input_bytes", "installed", "instructions_after",
  "instructions_before", "instructions_unchanged", "integrity", "interrupt", "interrupt_output_rollback", "interrupt_retention", "invalid",
  "invalid_retention", "label", "legacy_date", "live_after", "live_before", "live_unchanged", "local_config", "lock_released", "log_sha256", "maintenance",
  "manifest_sha256", "matched_concept", "matched_rows", "matches_initial", "max_active_sessions_observed", "max_command_concurrency_observed",
  "max_concurrent_runs_observed", "max_cpu_milliseconds_per_run", "max_disk_growth_bytes", "max_executor_concurrency_observed",
  "max_generated_bytes", "max_input_bytes", "max_items", "max_report_bytes", "max_runtime_seconds", "max_sessions", "max_snapshot_bytes",
  "max_wall_seconds", "method", "metrics", "mode", "mutation", "mutation_lock_created", "name", "network_used", "newest", "newest_seconds", "normal", "observed_at",
  "oldest", "oldest_seconds", "operator_interventions", "outcome", "output_count", "packet_sha256", "path", "paths_sha256", "pending",
  "pending_after", "pending_before", "permitted", "permitted_check", "phase", "plan", "plan_hash", "polling_used", "portable",
  "portable_query_sha256", "postflight_ok", "preflight_ok", "processed", "processed_items", "processed_path", "project_root",
  "proposal_control_bytes_total", "proposal_manifest_sha256", "proposals", "query_sha256", "raw_inbox_content_recorded", "reason",
  "reason_sha256", "records", "recovered", "recovery_checkpoints", "recovery_complete", "report_hashes", "request_sha256", "restored",
  "result_sha256", "resume", "retained", "retrieval", "revision", "root", "root_index_sha256", "run_id", "runs", "runtime_seconds",
  "scenario", "scheduler_used", "selected", "selected_after", "selected_age", "selected_before", "selected_count", "selected_items",
  "selected_manifest_sha256", "selected_unchanged", "selection_mode", "semantic", "sessions_active", "sessions_max", "sha256", "snapshot",
  "snapshot_status_restored", "source", "source_path", "source_report", "source_report_sha256", "staged_diff", "staging_ok", "started_at", "status", "stderr_bytes",
  "stderr_sha256", "stdout_bytes", "stdout_sha256", "strict_and_retrievable", "strict_lint", "success", "terms_sha256",
  "timestamp", "timestamp_valid_count", "tooling", "tree", "undated", "unselected_after", "unselected_before", "unselected_unchanged", "useful_concept_changes",
  "usefulness", "validation", "version", "wall_milliseconds", "warnings", "worktree_diff",
]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) fail("observation-limit-invalid", `${name} must be a positive safe integer`);
  return value;
}

function nonNegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) fail("observation-metric-invalid", `${name} must be a non-negative safe integer`);
  return value;
}

function instant(value, name) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) fail("observation-time-invalid", `${name} must be an RFC3339 instant`);
  return Date.parse(value);
}

function nonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") fail("observation-field-invalid", `${name} must be a non-empty string`);
  return value.trim();
}

function relativeEvidencePath(value, name) {
  const path = nonEmptyString(value, name);
  if (path.startsWith("/") || path.split("/").includes("..") || path.includes("\\")) {
    fail("observation-evidence-path-invalid", `${name} must be a contained root-relative path`);
  }
  return path;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function digestSummary(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.some((key) => !["bytes", "count", "sha256"].includes(key))) return false;
  if ("bytes" in value && (!Number.isSafeInteger(value.bytes) || value.bytes < 0)) return false;
  if ("count" in value && (!Number.isSafeInteger(value.count) || value.count < 0)) return false;
  return !("sha256" in value) || SHA256.test(value.sha256 ?? "");
}

function evidenceFieldAllowed(key) {
  return EVIDENCE_FIELD_KEYS.has(key) || /^(?:error|warning):[a-z0-9-]+$/i.test(key);
}

function assertNoRawInboxContent(value, index, path = "report") {
  const invalid = (detail) => fail("observation-evidence-content-invalid", `sample ${index} ${detail}`);
  if (Array.isArray(value)) {
    value.forEach((item, itemIndex) => assertNoRawInboxContent(item, index, `${path}[${itemIndex}]`));
    return;
  }
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && (value.includes("\n") || value.includes("\r") || Buffer.byteLength(value, "utf8") > 1024)) {
      invalid(`${path} contains retained multiline or oversized text`);
    }
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    const itemPath = `${path}.${key}`;
    if (!evidenceFieldAllowed(key)) invalid(`${itemPath} is not an allowed bounded-evidence field`);
    const tokens = key.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (key === "raw_inbox_content_recorded") {
      if (item !== false) invalid(`${itemPath} does not prove the raw-content boundary`);
      continue;
    }
    if (tokens.some((token) => RAW_CONTENT_TOKENS.has(token))) {
      const digest = typeof item === "string" && key.endsWith("_sha256") && SHA256.test(item);
      const scalarSummary = typeof item === "number" || item === false || item === null;
      if (!digest && !scalarSummary && !digestSummary(item)) invalid(`${itemPath} contains a content-bearing field instead of bounded hash/size evidence`);
    }
    assertNoRawInboxContent(item, index, itemPath);
  }
}

function validateBlockedControlEvidence(report, index) {
  const proof = report.control_proof;
  const integrity = report.integrity;
  const controls = report.controls;
  const metrics = report.metrics;
  const invalid = (message) => fail("observation-evidence-control-invalid", `sample ${index} ${message}`);

  if (report.success !== true || report.scenario !== "blocked-control" || report.outcome !== "blocked"
    || report.automatic_execution !== false || report.recovered !== true
    || report.raw_inbox_content_recorded !== false || report.failure !== null) {
    invalid("does not report a successful recovered blocked-control outcome");
  }
  if (proof?.initial?.active !== false || proof?.activated?.active !== true
    || proof?.blocked_check?.check_only !== true || proof?.blocked_check?.permitted !== false
    || proof?.blocked_check?.code !== "kill-switch-active" || proof?.blocked_check?.mutation !== false
    || proof?.restored?.active !== false || proof?.restored?.matches_initial !== true
    || proof?.permitted_check?.check_only !== true || proof?.permitted_check?.permitted !== true
    || proof?.permitted_check?.selection_mode !== "explicit"
    || proof?.permitted_check?.control_input_bytes !== 0
    || proof?.permitted_check?.max_sessions !== 1
    || proof?.permitted_check?.mutation !== false
    || proof?.identical_request !== true || proof?.recovery_complete !== true) {
    invalid("does not prove the required kill-switch block and identical-request recovery");
  }
  const blockedRequest = proof.blocked_check.request_sha256;
  const permittedRequest = proof.permitted_check.request_sha256;
  if (!SHA256.test(blockedRequest ?? "") || blockedRequest !== permittedRequest
    || proof.initial.sha256 !== proof.restored.sha256
    || proof.initial.sha256 === proof.activated.sha256) {
    invalid("does not bind the blocked and permitted checks to the same request and restored control bytes");
  }
  if (integrity?.selected_unchanged !== true || !sameJson(integrity.selected_before, integrity.selected_after)
    || integrity?.unselected_unchanged !== true || !sameJson(integrity.unselected_before, integrity.unselected_after)
    || integrity?.live_unchanged !== true || !sameJson(integrity.live_before, integrity.live_after)
    || integrity?.instructions_unchanged !== true || integrity?.snapshot_status_restored !== true
    || integrity?.control_manifest_restored !== true) {
    invalid("does not prove source, instruction, snapshot, and control integrity");
  }
  if (controls?.network_used !== false || controls?.scheduler_used !== false
    || controls?.factory_used !== false || controls?.polling_used !== false
    || controls?.child_runtime_sessions !== 0 || controls?.mutation_lock_created !== false
    || controls?.curator_started !== false || controls?.automatic_retries !== 0) {
    invalid("reports a prohibited execution or mutation path");
  }
  if (metrics?.generated_bytes !== 0 || metrics?.sessions_max !== 0 || metrics?.concurrent_runs !== 0
    || metrics?.processed_items !== 0 || metrics?.useful_concept_changes !== 0) {
    invalid("reports generated output, sessions, concurrency, or curation during the non-mutating control proof");
  }
}

function uniqueSortedStrings(value, name) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    fail("observation-coverage-invalid", `${name} must be a non-empty string array`);
  }
  const normalized = value.map((item) => item.trim());
  const sorted = [...new Set(normalized)].sort();
  if (sorted.length !== normalized.length || sorted.some((item, index) => item !== normalized[index])) {
    fail("observation-coverage-invalid", `${name} must be unique and lexically sorted`);
  }
  return Object.freeze(normalized);
}

function readEvidence(root, path, expectedHash, sample, index) {
  const target = resolveControlPath(root, path);
  if (!existsSync(target.full)) fail("observation-evidence-missing", `sample ${index} source report is missing`);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("observation-evidence-invalid", `sample ${index} source report must be a regular file`);
  const bytes = readFileSync(target.full);
  if (sha256(bytes) !== expectedHash) fail("observation-evidence-hash-mismatch", `sample ${index} source report hash does not match`);
  let report;
  try { report = JSON.parse(bytes.toString("utf8")); }
  catch { fail("observation-evidence-invalid", `sample ${index} source report is not valid JSON`); }
  if (!report || typeof report !== "object" || Array.isArray(report)) fail("observation-evidence-invalid", `sample ${index} source report must be an object`);
  assertNoRawInboxContent(report, index);

  if (report.version === "okf-epic26-canary-evidence/1") {
    const pendingBefore = report.backlog?.pending_before;
    const ageCoverageComplete = Number.isSafeInteger(pendingBefore?.selected_count)
      && pendingBefore.selected_count > 0
      && pendingBefore.timestamp_valid_count === pendingBefore.selected_count;
    const evidence = {
      scenario: report.scenario,
      project_root: report.source?.root,
      revision: report.source?.revision,
      snapshot_root: report.snapshot?.root,
      outcome: report.success === true ? "completed" : "failed",
      runtime_seconds: Math.ceil((report.metrics?.wall_milliseconds ?? -1) / 1000),
      cpu_ms: report.metrics?.cpu_milliseconds,
      disk_growth_bytes: report.snapshot?.disk_growth_bytes,
      generated_bytes: report.metrics?.executor_generated_bytes_total,
      sessions_max: report.metrics?.max_active_sessions_observed,
      concurrent_runs: report.metrics?.max_concurrent_runs_observed,
      inbox_oldest_age_days: ageCoverageComplete ? Math.ceil((pendingBefore.oldest_seconds ?? 0) / 86_400) : null,
      inbox_age_coverage_complete: ageCoverageComplete,
      inbox_item_count: pendingBefore?.selected_count,
      processed_items: report.usefulness?.processed_items,
      useful_concept_changes: report.usefulness?.useful_concept_changes,
      operator_interventions: report.metrics?.executor_invocations,
      recovered: report.success === true,
      automatic_execution: false,
      raw_inbox_content_recorded: report.raw_inbox_content_recorded,
    };
    if (report.controls?.network_used !== false || report.controls?.scheduler_used !== false
      || report.controls?.factory_used !== false || report.controls?.child_runtime_sessions !== 0
      || report.controls?.automatic_retries !== 0 || report.controls?.max_sessions !== 1
      || report.declared_limits?.executor?.max_sessions !== 1
      || !Number.isSafeInteger(report.controls?.max_executor_concurrency_observed)
      || report.controls.max_executor_concurrency_observed < 0 || report.controls.max_executor_concurrency_observed > 1
      || !Number.isSafeInteger(report.controls?.max_command_concurrency_observed)
      || report.controls.max_command_concurrency_observed < 0 || report.controls.max_command_concurrency_observed > 1) {
      fail("observation-evidence-control-invalid", `sample ${index} canary evidence reports a prohibited execution path`);
    }
    return Object.freeze(evidence);
  }

  if (report.version === "okf-cadence-control-evidence/1") {
    validateBlockedControlEvidence(report, index);
    return Object.freeze({
      scenario: report.scenario,
      project_root: report.project_root,
      revision: report.revision,
      snapshot_root: report.snapshot?.root,
      outcome: report.outcome,
      runtime_seconds: report.metrics?.runtime_seconds,
      cpu_ms: report.metrics?.cpu_ms,
      disk_growth_bytes: report.metrics?.disk_growth_bytes,
      generated_bytes: report.metrics?.generated_bytes,
      sessions_max: report.metrics?.sessions_max,
      concurrent_runs: report.metrics?.concurrent_runs,
      inbox_oldest_age_days: report.metrics?.inbox_oldest_age_days,
      processed_items: report.metrics?.processed_items,
      useful_concept_changes: report.metrics?.useful_concept_changes,
      operator_interventions: report.metrics?.operator_interventions,
      recovered: report.recovered,
      automatic_execution: report.automatic_execution,
      raw_inbox_content_recorded: report.raw_inbox_content_recorded,
      inbox_age_coverage_complete: true,
    });
  }
  fail("observation-evidence-version-invalid", `sample ${index} source report has an unsupported version`);
}

function readRawContentEvidence(root, path, expectedHash, sample, sourceReport, index) {
  const target = resolveControlPath(root, path);
  if (!existsSync(target.full)) fail("observation-raw-content-evidence-missing", `sample ${index} raw-content evidence is missing`);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("observation-raw-content-evidence-invalid", `sample ${index} raw-content evidence must be a regular file`);
  }
  const bytes = readFileSync(target.full);
  if (sha256(bytes) !== expectedHash) {
    fail("observation-raw-content-evidence-hash-mismatch", `sample ${index} raw-content evidence hash does not match`);
  }
  let report;
  try { report = JSON.parse(bytes.toString("utf8")); }
  catch { fail("observation-raw-content-evidence-invalid", `sample ${index} raw-content evidence is not valid JSON`); }
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    fail("observation-raw-content-evidence-invalid", `sample ${index} raw-content evidence must be an object`);
  }
  const expectedFields = [
    "project_root", "raw_inbox_content_recorded", "revision", "source_report", "source_report_sha256", "version",
  ];
  const actualFields = Object.keys(report).sort();
  if (!sameJson(actualFields, expectedFields)
    || report.version !== "okf-raw-content-evidence/1"
    || report.project_root !== sample.project_root
    || report.revision !== sample.revision
    || report.source_report !== sourceReport
    || report.source_report_sha256 !== sample.source_report_sha256
    || report.raw_inbox_content_recorded !== false) {
    fail("observation-raw-content-evidence-invalid", `sample ${index} raw-content evidence is incomplete or not bound to its source report`);
  }
  assertNoRawInboxContent(report, index, "raw_content_evidence");
  return false;
}

function readInboxAgeEvidence(root, path, expectedHash, sample, expectedCount, index) {
  const target = resolveControlPath(root, path);
  if (!existsSync(target.full)) fail("observation-age-evidence-missing", `sample ${index} inbox-age evidence is missing`);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("observation-age-evidence-invalid", `sample ${index} inbox-age evidence must be a regular file`);
  const bytes = readFileSync(target.full);
  if (sha256(bytes) !== expectedHash) fail("observation-age-evidence-hash-mismatch", `sample ${index} inbox-age evidence hash does not match`);
  let report;
  try { report = JSON.parse(bytes.toString("utf8")); }
  catch { fail("observation-age-evidence-invalid", `sample ${index} inbox-age evidence is not valid JSON`); }
  assertNoRawInboxContent(report, index, "inbox_age_evidence");
  const derivations = report?.date_derivations;
  const manifest = report?.direct_inbox_manifest;
  const oldest = report?.oldest;
  const newest = report?.newest;
  const counts = [derivations?.timestamp, derivations?.legacy_date, derivations?.filename, derivations?.undated];
  const observedAt = instant(report?.observed_at, `samples[${index}].inbox_age_evidence.observed_at`);
  const oldestAt = instant(oldest?.timestamp, `samples[${index}].inbox_age_evidence.oldest.timestamp`);
  const newestAt = instant(newest?.timestamp, `samples[${index}].inbox_age_evidence.newest.timestamp`);
  const derivedOldestSeconds = Math.max(0, Math.floor((observedAt - oldestAt) / 1000));
  if (report?.version !== "okf-inbox-age-evidence/1" || report.project_root !== sample.project_root
    || report.revision !== sample.revision || report.observed_at !== sample.observed_at
    || !Number.isSafeInteger(manifest?.count) || manifest.count <= 0
    || manifest.count !== expectedCount
    || !Number.isSafeInteger(manifest?.bytes) || manifest.bytes <= 0 || !SHA256.test(manifest?.sha256 ?? "")
    || counts.some((count) => !Number.isSafeInteger(count) || count < 0)
    || counts.reduce((sum, count) => sum + count, 0) !== manifest.count || derivations.undated !== 0
    || !relativeEvidencePath(oldest?.path, `samples[${index}].inbox_age_evidence.oldest.path`).startsWith("knowledge/inbox/")
    || !relativeEvidencePath(newest?.path, `samples[${index}].inbox_age_evidence.newest.path`).startsWith("knowledge/inbox/")
    || !["timestamp", "legacy_date", "filename"].includes(oldest?.method)
    || !["timestamp", "legacy_date", "filename"].includes(newest?.method)
    || newestAt < oldestAt || oldest?.age_seconds !== derivedOldestSeconds
    || oldest?.age_days_ceil !== Math.ceil(derivedOldestSeconds / 86_400)
    || report.raw_inbox_content_recorded !== false) {
    fail("observation-age-evidence-invalid", `sample ${index} inbox-age evidence is incomplete or inconsistent`);
  }
  return oldest.age_days_ceil;
}

function evidenceMatchesSample(evidence, sample, index) {
  const fields = [
    "scenario", "project_root", "revision", "snapshot_root", "outcome", "runtime_seconds", "cpu_ms", "disk_growth_bytes",
    "generated_bytes", "sessions_max", "concurrent_runs", "inbox_oldest_age_days", "processed_items",
    "useful_concept_changes", "operator_interventions", "recovered", "automatic_execution",
  ];
  for (const field of fields) {
    if (evidence[field] !== sample[field]) fail("observation-evidence-mismatch", `sample ${index} ${field} does not match its hashed source report`);
  }
  if (evidence.raw_inbox_content_recorded !== false) fail("observation-evidence-content-invalid", `sample ${index} evidence does not prove the raw-content boundary`);
}

export function readCadenceControl(root) {
  const target = resolveControlPath(root, CONTROL_PATH);
  if (!existsSync(target.full)) {
    return Object.freeze({ enabled: false, mode: "manual-explicit", state: "indeterminate", code: "cadence-control-missing", path: target.path });
  }
  let value;
  try {
    value = JSON.parse(readFileSync(target.full, "utf8"));
  } catch {
    return Object.freeze({ enabled: false, mode: "manual-explicit", state: "indeterminate", code: "cadence-control-malformed", path: target.path });
  }
  if (value?.mode !== "manual-explicit" || typeof value.enabled !== "boolean" || Object.keys(value).some((key) => !["mode", "enabled"].includes(key))) {
    return Object.freeze({ enabled: false, mode: "manual-explicit", state: "indeterminate", code: "cadence-control-malformed", path: target.path });
  }
  return Object.freeze({ enabled: value.enabled, mode: value.mode, state: value.enabled ? "enabled" : "disabled", path: target.path });
}

export function cadenceStatus(rootInput, { checkpoint, operatorRequest, asOf } = {}) {
  if (!CHECKPOINTS.has(checkpoint)) fail("checkpoint-invalid", "checkpoint must be sprint-checkpoint, epic-close, or manual-review");
  if (typeof operatorRequest !== "string" || operatorRequest.trim() === "") fail("authority-not-explicit", "an explicit operator request is required");
  const rootInfo = validateRoot(rootInput);
  const control = readCadenceControl(rootInfo.root);
  const status = inboxStatus(rootInfo.root, { asOf });
  const reviewSignals = Object.entries(status.advisory)
    .filter(([key, value]) => key !== "advisory_only" && key !== "execution_authority" && value === true)
    .map(([key]) => key)
    .sort();
  return Object.freeze({
    version: "okf-cadence-status/1",
    root: rootInfo.root,
    revision: rootInfo.revision,
    checkpoint,
    operator_request: operatorRequest.trim(),
    control,
    status,
    review_signals: reviewSignals,
    recommendation: control.enabled && reviewSignals.length > 0 ? "operator-review-required" : control.enabled ? "no-curation-indicated" : "cadence-disabled",
    automatic_execution: false,
    execution_authority: false,
    curator_started: false,
    schedule_created: false,
  });
}

export function observeCadence(input, { evidenceRoot } = {}) {
  if (!input || input.version !== "okf-cadence-observation/1") fail("observation-version-invalid", "unsupported observation manifest version");
  if (input.mode !== "manual-explicit" || input.automatic_execution !== false) {
    fail("observation-cadence-invalid", "the observed cadence must be manual-explicit with automatic_execution false");
  }
  const startedAt = instant(input.started_at, "started_at");
  const endedAt = instant(input.ended_at, "ended_at");
  if (endedAt < startedAt) fail("observation-time-invalid", "ended_at precedes started_at");
  const limits = Object.freeze({
    min_samples: positiveInteger(input.limits?.min_samples, "min_samples"),
    max_runtime_seconds: positiveInteger(input.limits?.max_runtime_seconds, "max_runtime_seconds"),
    max_cpu_ms: positiveInteger(input.limits?.max_cpu_ms, "max_cpu_ms"),
    max_disk_growth_bytes: positiveInteger(input.limits?.max_disk_growth_bytes, "max_disk_growth_bytes"),
    max_generated_bytes: positiveInteger(input.limits?.max_generated_bytes, "max_generated_bytes"),
    max_sessions: input.limits?.max_sessions,
    max_concurrent_runs: input.limits?.max_concurrent_runs,
    max_inbox_age_days: positiveInteger(input.limits?.max_inbox_age_days, "max_inbox_age_days"),
  });
  if (limits.max_sessions !== 1) fail("sessions-not-one", "max_sessions must equal one");
  if (limits.max_concurrent_runs !== 1) fail("concurrency-not-one", "max_concurrent_runs must equal one");
  if (!Array.isArray(input.samples) || input.samples.length < limits.min_samples) fail("observation-samples-insufficient", "observation window has too few samples");
  if (typeof evidenceRoot !== "string" || evidenceRoot.length === 0) fail("observation-evidence-root-missing", "an explicit evidence root is required");
  const rootInfo = validateRoot(evidenceRoot);
  const requiredProjects = uniqueSortedStrings(input.required_projects, "required_projects");
  const requiredScenarios = uniqueSortedStrings(input.required_scenarios, "required_scenarios");

  const violations = [];
  let totalCpuMs = 0;
  let totalGeneratedBytes = 0;
  let maximumSessions = 0;
  let maximumRuntimeSeconds = 0;
  let maximumDiskGrowthBytes = 0;
  let maximumConcurrentRuns = 0;
  let maximumInboxAgeDays = 0;
  let processedItems = 0;
  let usefulConceptChanges = 0;
  let operatorInterventions = 0;
  let recoveredFailures = 0;
  const outcomes = Object.fromEntries([...OUTCOMES].sort().map((outcome) => [outcome, 0]));
  const sampleIds = new Set();
  const projects = new Set();
  const snapshotRoots = new Set();
  let previousObservedAt = startedAt;

  input.samples.forEach((sample, index) => {
    if (!sample || !OUTCOMES.has(sample.outcome)) fail("observation-outcome-invalid", `sample ${index} has an invalid outcome`);
    const sampleId = nonEmptyString(sample.sample_id, `samples[${index}].sample_id`);
    if (sampleIds.has(sampleId)) fail("observation-sample-duplicate", `sample_id ${sampleId} is duplicated`);
    sampleIds.add(sampleId);
    const observedAt = instant(sample.observed_at, `samples[${index}].observed_at`);
    if (observedAt < startedAt || observedAt > endedAt || observedAt < previousObservedAt) {
      fail("observation-sample-time-invalid", `sample ${index} is outside the ordered observation window`);
    }
    previousObservedAt = observedAt;
    const projectRoot = nonEmptyString(sample.project_root, `samples[${index}].project_root`);
    if (!projectRoot.startsWith("/") || projectRoot === "/") fail("observation-project-invalid", `sample ${index} must name an absolute non-root project`);
    projects.add(projectRoot);
    const snapshotRoot = nonEmptyString(sample.snapshot_root, `samples[${index}].snapshot_root`);
    if (!snapshotRoot.startsWith("/") || snapshotRoot === "/") fail("observation-snapshot-invalid", `sample ${index} must name an absolute non-root snapshot`);
    snapshotRoots.add(snapshotRoot);
    const scenario = nonEmptyString(sample.scenario, `samples[${index}].scenario`);
    if (!REVISION.test(sample.revision ?? "")) fail("observation-revision-invalid", `sample ${index} must name a full Git revision`);
    const sourceReport = relativeEvidencePath(sample.source_report, `samples[${index}].source_report`);
    if (!SHA256.test(sample.source_report_sha256 ?? "")) fail("observation-evidence-hash-invalid", `sample ${index} must name the SHA-256 of its bounded source report`);
    if (sample.trigger !== "manual-explicit" || sample.automatic_execution !== false) {
      fail("observation-trigger-invalid", `sample ${index} was not an explicit manual observation`);
    }
    const runtime = nonNegativeInteger(sample.runtime_seconds, `samples[${index}].runtime_seconds`);
    const cpu = nonNegativeInteger(sample.cpu_ms, `samples[${index}].cpu_ms`);
    const disk = nonNegativeInteger(sample.disk_growth_bytes, `samples[${index}].disk_growth_bytes`);
    const generated = nonNegativeInteger(sample.generated_bytes, `samples[${index}].generated_bytes`);
    const sessions = nonNegativeInteger(sample.sessions_max, `samples[${index}].sessions_max`);
    const processed = nonNegativeInteger(sample.processed_items, `samples[${index}].processed_items`);
    const concepts = nonNegativeInteger(sample.useful_concept_changes, `samples[${index}].useful_concept_changes`);
    const concurrent = nonNegativeInteger(sample.concurrent_runs, `samples[${index}].concurrent_runs`);
    const inboxAge = nonNegativeInteger(sample.inbox_oldest_age_days, `samples[${index}].inbox_oldest_age_days`);
    const interventions = nonNegativeInteger(sample.operator_interventions, `samples[${index}].operator_interventions`);
    const sourceEvidence = readEvidence(rootInfo.root, sourceReport, sample.source_report_sha256, sample, index);
    let boundEvidence = sourceEvidence;
    const declaresRawContentEvidencePath = Object.prototype.hasOwnProperty.call(sample, "raw_content_evidence");
    const declaresRawContentEvidenceHash = Object.prototype.hasOwnProperty.call(sample, "raw_content_evidence_sha256");
    const hasRawContentEvidencePath = typeof sample.raw_content_evidence === "string" && sample.raw_content_evidence.trim() !== "";
    if (sourceEvidence.raw_inbox_content_recorded !== false || declaresRawContentEvidencePath || declaresRawContentEvidenceHash) {
      if (!hasRawContentEvidencePath) {
        fail("observation-raw-content-evidence-missing", `sample ${index} source report requires explicit hashed raw-content evidence`);
      }
      const rawContentReport = relativeEvidencePath(sample.raw_content_evidence, `samples[${index}].raw_content_evidence`);
      if (!SHA256.test(sample.raw_content_evidence_sha256 ?? "")) {
        fail("observation-raw-content-evidence-hash-invalid", `sample ${index} must name the SHA-256 of its raw-content evidence`);
      }
      boundEvidence = {
        ...sourceEvidence,
        raw_inbox_content_recorded: readRawContentEvidence(
          rootInfo.root,
          rawContentReport,
          sample.raw_content_evidence_sha256,
          sample,
          sourceReport,
          index,
        ),
      };
    }
    if (sourceEvidence.inbox_age_coverage_complete === false) {
      if (typeof sample.inbox_age_evidence !== "string" || sample.inbox_age_evidence.trim() === "") {
        fail("observation-age-evidence-missing", `sample ${index} requires complete hashed inbox-age evidence`);
      }
      const ageReport = relativeEvidencePath(sample.inbox_age_evidence, `samples[${index}].inbox_age_evidence`);
      if (!SHA256.test(sample.inbox_age_evidence_sha256 ?? "")) fail("observation-age-evidence-hash-invalid", `sample ${index} must name the SHA-256 of its inbox-age evidence`);
      boundEvidence = {
        ...boundEvidence,
        inbox_oldest_age_days: readInboxAgeEvidence(rootInfo.root, ageReport, sample.inbox_age_evidence_sha256, sample, sourceEvidence.inbox_item_count, index),
      };
    }
    evidenceMatchesSample(boundEvidence, { ...sample, scenario }, index);
    if (sample.recovered !== true && sample.outcome !== "completed") violations.push({ sample: index, code: "failure-not-recovered" });
    if (runtime > limits.max_runtime_seconds) violations.push({ sample: index, code: "runtime-ceiling-exceeded" });
    if (cpu > limits.max_cpu_ms) violations.push({ sample: index, code: "cpu-ceiling-exceeded" });
    if (disk > limits.max_disk_growth_bytes) violations.push({ sample: index, code: "disk-ceiling-exceeded" });
    if (generated > limits.max_generated_bytes) violations.push({ sample: index, code: "generated-byte-ceiling-exceeded" });
    if (sessions > limits.max_sessions) violations.push({ sample: index, code: "session-ceiling-exceeded" });
    if (concurrent > limits.max_concurrent_runs) violations.push({ sample: index, code: "concurrency-ceiling-exceeded" });
    if (inboxAge > limits.max_inbox_age_days) violations.push({ sample: index, code: "inbox-age-ceiling-exceeded" });
    outcomes[sample.outcome] += 1;
    totalCpuMs += cpu;
    totalGeneratedBytes += generated;
    maximumSessions = Math.max(maximumSessions, sessions);
    maximumRuntimeSeconds = Math.max(maximumRuntimeSeconds, runtime);
    maximumDiskGrowthBytes = Math.max(maximumDiskGrowthBytes, disk);
    maximumConcurrentRuns = Math.max(maximumConcurrentRuns, concurrent);
    maximumInboxAgeDays = Math.max(maximumInboxAgeDays, inboxAge);
    processedItems += processed;
    usefulConceptChanges += concepts;
    operatorInterventions += interventions;
    if (sample.outcome !== "completed" && sample.recovered === true) recoveredFailures += 1;
  });

  const observedProjects = [...projects].sort();
  const observedScenarios = [...new Set(input.samples.map((sample) => sample.scenario))].sort();
  for (const project of requiredProjects) if (!projects.has(project)) violations.push({ sample: -1, code: `required-project-missing:${project}` });
  for (const scenario of requiredScenarios) if (!observedScenarios.includes(scenario)) violations.push({ sample: -1, code: `required-scenario-missing:${scenario}` });

  return Object.freeze({
    version: "okf-cadence-observation-report/1",
    started_at: input.started_at,
    ended_at: input.ended_at,
    sample_count: input.samples.length,
    projects: observedProjects,
    snapshot_roots: [...snapshotRoots].sort(),
    scenarios: observedScenarios,
    required_projects: requiredProjects,
    required_scenarios: requiredScenarios,
    limits,
    totals: {
      cpu_ms: totalCpuMs,
      generated_bytes: totalGeneratedBytes,
      processed_items: processedItems,
      useful_concept_changes: usefulConceptChanges,
      operator_interventions: operatorInterventions,
      recovered_failures: recoveredFailures,
    },
    maxima: {
      runtime_seconds: maximumRuntimeSeconds,
      disk_growth_bytes: maximumDiskGrowthBytes,
      sessions: maximumSessions,
      concurrent_runs: maximumConcurrentRuns,
      inbox_oldest_age_days: maximumInboxAgeDays,
    },
    outcomes,
    curation_yield: processedItems === 0 ? null : usefulConceptChanges / processedItems,
    violations: violations.sort((a, b) => a.sample - b.sample || a.code.localeCompare(b.code)),
    passed: violations.length === 0,
    automatic_execution_observed: false,
    concurrency_bounded: maximumConcurrentRuns <= 1,
    failures_recovered: violations.every(({ code }) => code !== "failure-not-recovered"),
    raw_inbox_content_recorded: false,
  });
}

export const CADENCE_CONTROL_PATH = CONTROL_PATH;
