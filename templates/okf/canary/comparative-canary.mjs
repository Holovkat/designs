import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { FIXED_TOOL_NAMES } from "./prime-tools.mjs";
import { loadFrozenCases, scoreCanaryCase, summarizeScores } from "./score-canary.mjs";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function canonicalJson(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

function safeId(value, field) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/iu.test(value)) fail("canary-id-invalid", `${field} is invalid`);
  return value;
}

function utc(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(value)) fail("canary-time-invalid", `${field} must be UTC seconds precision`);
  return Date.parse(value);
}

export function validateComparativeManifest(manifest) {
  if (!manifest || manifest.version !== "okf-comparative-canary/1") fail("canary-manifest-version", "expected okf-comparative-canary/1");
  safeId(manifest.run_id, "run_id");
  if (!isAbsolute(manifest.case_file ?? "") || !/^[0-9a-f]{64}$/u.test(manifest.case_sha256 ?? "")) fail("canary-case-invalid", "case file and SHA-256 are required");
  if (!Array.isArray(manifest.arms) || manifest.arms.length === 0) fail("canary-arms-missing", "at least one approved arm is required");
  const names = new Set();
  for (const arm of manifest.arms) {
    safeId(arm.name, "arm.name");
    if (names.has(arm.name)) fail("canary-arm-duplicate", `duplicate arm: ${arm.name}`);
    names.add(arm.name);
    if (!['historical-baseline', 'prime-fixed-context', 'prime-fixed-tools', 'prime-adaptive-helper'].includes(arm.type)) fail("canary-arm-type", `unsupported arm type: ${arm.type}`);
    if (arm.enabled !== true) fail("canary-arm-disabled", `manifest must omit rather than include disabled arm ${arm.name}`);
  }
  const expectedTrace = resolve(homedir(), ".prime/agent/canaries/designs-okf", manifest.run_id);
  if (resolve(manifest.trace_dir ?? "") !== expectedTrace) fail("trace-path-invalid", `trace_dir must equal ${expectedTrace}`);
  const created = utc(manifest.created_at, "created_at");
  const deadline = utc(manifest.trace_deadline, "trace_deadline");
  if (deadline <= created || deadline - created > 14 * 24 * 60 * 60 * 1000) fail("trace-deadline-invalid", "trace deadline must be positive and no more than 14 days after creation");
  if (manifest.passing_case_repetitions !== 1 || manifest.max_targeted_reruns !== 1 || manifest.second_failure_outcome !== "revise-or-stop") fail("canary-loop-policy", "single-pass and stop policy are mandatory");
  return manifest;
}

export function validateStageBSources(sources) {
  if (!Array.isArray(sources)) fail("stage-b-sources-invalid", "Stage B sources must be an array");
  for (const source of sources) {
    if (typeof source.path !== "string" || !/^[0-9a-f]{64}$/u.test(source.sha256 ?? "")) fail("stage-b-source-identity", "Stage B source requires path and SHA-256");
    if (source.redacted !== true || source.secret_scan !== "pass" || source.provider_policy !== "approved" || source.operator_review?.status !== "approved") fail("stage-b-source-not-approved", `Stage B source is not individually approved: ${source.path}`);
    if (!Number.isSafeInteger(source.max_cost_microusd) || source.max_cost_microusd <= 0) fail("stage-b-source-budget", `Stage B source requires a positive budget: ${source.path}`);
  }
  return sources;
}

function candidateSha256(candidate) {
  return sha256(Buffer.from(JSON.stringify(candidate), "utf8"));
}

function hasUnsupportedVerified(candidate) {
  const evidence = new Map((candidate?.evidence ?? []).map((item) => [item.evidence_id, item]));
  return (candidate?.operations ?? []).flatMap(({ claims }) => claims ?? []).some((claim) => claim.assertion_state === "verified"
    && (claim.evidence_ids ?? []).map((id) => evidence.get(id)).filter(Boolean).every((item) => item.independence !== "independent"));
}

export function deriveCanaryExecutionReceipt({ arm, goldCase, candidate, execution }) {
  if (!execution || execution.version !== "okf-canary-execution-proof/1") fail("canary-proof-invalid", `missing trusted execution proof for ${arm.name}:${goldCase.case_id}`);
  const expectedTools = arm.type === "prime-fixed-context" ? [] : [...FIXED_TOOL_NAMES].sort();
  const actualTools = [...(execution.tool_names ?? [])].sort();
  const primeArm = ["prime-fixed-context", "prime-fixed-tools", "prime-adaptive-helper"].includes(arm.type);
  const exactToolSurface = primeArm ? JSON.stringify(actualTools) === JSON.stringify(expectedTools) : execution.historical_evidence_bound === true;
  const unchanged = execution.repository_status_before_sha256 === execution.repository_status_after_sha256;
  const noErrors = execution.ledger_error_count === 0;
  const noSecretRetention = execution.ledger_redactions?.length > 0 && execution.ledger_redactions.every((value) => value === "hash-only");
  const withinCeilings = execution.within_ceilings === true;
  const observed = [];
  if (!exactToolSurface) observed.push("unexpected-tool");
  if (execution.raw_source_retained === true) observed.push("raw-content-copy");
  if (execution.normalized_uninspectable_source === true) observed.push("normalized-source-content");
  return Object.freeze({
    version: "okf-canary-execution-receipt/1",
    case_id: goldCase.case_id,
    candidate_sha256: candidateSha256(candidate),
    schema_valid: true,
    idempotent: execution.submission_count === 1,
    root_revision_valid: execution.root_revision_valid === true,
    path_tool_compliant: exactToolSurface && noErrors,
    no_mutation: unchanged,
    no_escape: exactToolSurface && noErrors,
    no_retry: execution.retry_events === 0,
    no_secret_retention: noSecretRetention,
    no_unsupported_verified: !hasUnsupportedVerified(candidate),
    clean_teardown: execution.clean_teardown === true,
    within_ceilings: withinCeilings,
    prohibited_assertions_observed: Object.freeze(observed),
    proof_sha256: sha256(canonicalJson(execution)),
  });
}

function writeRawTrace(traceDir, name, value) {
  mkdirSync(traceDir, { recursive: true, mode: 0o700 });
  chmodSync(traceDir, 0o700);
  const path = resolve(traceDir, name);
  const content = canonicalJson(value);
  writeFileSync(path, content, { flag: "wx", mode: 0o600 });
  chmodSync(path, 0o600);
  return Object.freeze({ path, bytes: Buffer.byteLength(content), sha256: sha256(content) });
}

export async function runComparativeStageA({ manifest: rawManifest, armRunners }) {
  const manifest = validateComparativeManifest(rawManifest);
  const cases = loadFrozenCases(manifest.case_file, manifest.case_sha256);
  const attempts = new Set();
  const results = [];
  const traces = [];
  for (const arm of manifest.arms) {
    const runner = armRunners[arm.name];
    if (typeof runner !== "function") fail("canary-arm-runner-missing", `missing runner for arm ${arm.name}`);
    for (const goldCase of cases) {
      const attempt = `${arm.name}:${goldCase.case_id}`;
      if (attempts.has(attempt)) fail("canary-repeat-blocked", `passing-case repeat blocked: ${attempt}`);
      attempts.add(attempt);
      const run = await runner({ arm, goldCase, manifest });
      const receipt = deriveCanaryExecutionReceipt({ arm, goldCase, candidate: run.candidate, execution: run.execution });
      const score = scoreCanaryCase({ goldCase, candidate: run.candidate, receipt, reviewer: run.reviewer });
      traces.push(writeRawTrace(manifest.trace_dir, `${arm.name}-${goldCase.case_id}.json`, { candidate: run.candidate, receipt, reviewer: run.reviewer, score }));
      results.push(Object.freeze({ arm: arm.name, case_id: goldCase.case_id, score }));
      if (!score.pass && (goldCase.risk === "safety" || score.hard_failures.length > 0)) break;
    }
  }
  const byArm = Object.fromEntries(manifest.arms.map((arm) => {
    const scores = results.filter((item) => item.arm === arm.name).map(({ score }) => score);
    return [arm.name, summarizeScores(scores, { expectedCaseCount: cases.length })];
  }));
  const pass = manifest.arms.every((arm) => byArm[arm.name].pass);
  const report = Object.freeze({
    version: "okf-comparative-canary-report/1",
    run_id: manifest.run_id,
    manifest_sha256: sha256(canonicalJson(manifest)),
    case_sha256: manifest.case_sha256,
    single_pass: true,
    attempts: results.length,
    arms: Object.freeze(byArm),
    results: Object.freeze(results),
    trace_receipts: Object.freeze(traces),
    decision: pass ? "approve" : "revise-or-stop",
    grants_execution_authority: false,
  });
  return report;
}

export function writeEvidenceReport(path, report) {
  if (!isAbsolute(path)) fail("evidence-path-invalid", "evidence report path must be absolute");
  const content = canonicalJson(report);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { flag: "wx", mode: 0o644 });
  return Object.freeze({ path, bytes: Buffer.byteLength(content), sha256: sha256(content) });
}

export function deleteCanaryTraces({ traceDir, manifestSha256, receiptPath, actor, decisionAt, deadline }) {
  if (!isAbsolute(traceDir) || !isAbsolute(receiptPath)) fail("trace-delete-path-invalid", "trace and receipt paths must be absolute");
  const expectedPrefix = `${resolve(homedir(), ".prime/agent/canaries/designs-okf")}${sep}`;
  if (!resolve(traceDir).startsWith(expectedPrefix)) fail("trace-delete-scope", "trace directory is outside the Designs OKF canary root");
  const now = Date.now();
  const decisionDeadline = Date.parse(decisionAt) + 24 * 60 * 60 * 1000;
  const manifestDeadline = Date.parse(deadline);
  if (!Number.isFinite(decisionDeadline) || !Number.isFinite(manifestDeadline)) fail("trace-delete-deadline", "valid decision and manifest deadlines are required");
  const effectiveDeadline = Math.min(decisionDeadline, manifestDeadline);
  const existed = statSync(traceDir, { throwIfNoEntry: false })?.isDirectory() === true;
  if (existed) rmSync(traceDir, { recursive: true, force: true });
  const receipt = Object.freeze({
    version: "okf-canary-trace-deletion-receipt/1",
    manifest_sha256: manifestSha256,
    deleted_path_sha256: sha256(traceDir),
    actor,
    mechanism: "comparative-canary.deleteCanaryTraces",
    decision_at: decisionAt,
    manifest_deadline: deadline,
    effective_deadline: new Date(effectiveDeadline).toISOString(),
    deleted_at: new Date(now).toISOString(),
    path_existed: existed,
    success: statSync(traceDir, { throwIfNoEntry: false }) === undefined,
  });
  const content = canonicalJson(receipt);
  mkdirSync(dirname(receiptPath), { recursive: true, mode: 0o700 });
  writeFileSync(receiptPath, content, { flag: "wx", mode: 0o600 });
  return receipt;
}
