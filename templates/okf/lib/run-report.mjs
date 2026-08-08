import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolveControlPath } from "./run-guard.mjs";

const OUTCOMES = new Set(["running", "completed", "cancelled", "quota-exceeded", "blocked", "failed"]);
const REQUIRED = [
  "run_id", "operator_request", "root", "revision", "allowlist", "item_ids", "limits", "lock_state",
  "phase", "elapsed_seconds", "input_bytes", "generated_bytes", "sessions_active", "sessions_max",
  "last_checkpoint", "outcome", "reason", "recovery_instruction",
];

function hasRawContent(value) {
  if (Array.isArray(value)) return value.some(hasRawContent);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => key === "content" || key === "body" || hasRawContent(nested));
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parsedExisting(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function sameAttempt(existing, input) {
  return existing?.run_id === input.run_id
    && typeof input.lock_token === "string"
    && input.lock_token !== ""
    && existing.lock_token === input.lock_token;
}

function attemptReportPath(reportPath, input) {
  if (typeof input.lock_token !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(input.lock_token)) {
    throw new Error("report-existing-without-attempt-identity");
  }
  return reportPath.replace(/\.json$/, `.attempt-${input.lock_token}.json`);
}

function selectTarget(root, reportPath, input) {
  const requested = resolveControlPath(root, reportPath);
  if (!existsSync(requested.full)) return Object.freeze({ target: requested, mode: "create", priorPath: null });
  const existing = parsedExisting(requested.full);
  if (existing?.outcome === "running" && sameAttempt(existing, input)) {
    return Object.freeze({ target: requested, mode: "finalize-running", priorPath: null });
  }

  const attemptPath = attemptReportPath(reportPath, input);
  const attempt = resolveControlPath(root, attemptPath);
  if (!existsSync(attempt.full)) return Object.freeze({ target: attempt, mode: "create", priorPath: requested.path });
  const existingAttempt = parsedExisting(attempt.full);
  if (existingAttempt?.outcome === "running" && sameAttempt(existingAttempt, input)) {
    return Object.freeze({ target: attempt, mode: "finalize-running", priorPath: requested.path });
  }
  throw new Error("report-attempt-already-recorded");
}

function finalizeRunning(target, text, input) {
  const before = readFileSync(target.full);
  const existing = parsedExisting(target.full);
  if (existing?.outcome !== "running" || !sameAttempt(existing, input)) throw new Error("report-running-owner-changed");
  const temporary = `${target.full}.${input.lock_token}.tmp`;
  writeFileSync(temporary, text, { encoding: "utf8", flag: "wx" });
  try {
    const latest = readFileSync(target.full);
    if (!latest.equals(before)) throw new Error("report-running-changed");
    renameSync(temporary, target.full);
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
}

export function buildReport(input) {
  if (hasRawContent(input)) throw new Error("report-contains-source");
  for (const key of REQUIRED) if (!(key in input)) throw new Error(`report-missing-${key}`);
  if (!OUTCOMES.has(input.outcome)) throw new Error("report-invalid-outcome");
  if (!Array.isArray(input.item_ids)) throw new Error("report-invalid-item-ids");
  const report = {
    version: "okf-run-report/1",
    ...input,
    item_count: input.item_ids.length,
    mutated: {
      source: false,
      knowledge: false,
      archive: false,
      instructions: false,
      ...(input.mutated ?? {}),
    },
  };
  return Object.freeze({ report: Object.freeze(report), bytes: Buffer.byteLength(jsonText(report), "utf8") });
}

export function measureRunReport(input, { generatedBytes = input.generated_bytes ?? 0 } = {}) {
  let total = generatedBytes;
  let built;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    built = buildReport({ ...input, generated_bytes: total });
    const next = generatedBytes + built.bytes;
    if (next === total) break;
    total = next;
  }
  built = buildReport({ ...input, generated_bytes: total });
  return Object.freeze({ ...built, generated_bytes: total });
}

export function writeRunReport(root, plan, input, { generatedBytes = input.generated_bytes ?? 0, reportPath = `.okf/reports/${plan.run_id}.json` } = {}) {
  if (!/^\.okf\/reports\/[a-z0-9][a-z0-9._-]{0,190}\.json$/i.test(reportPath)) throw new Error("report-path-invalid");
  const selected = selectTarget(root, reportPath, input);
  const measured = measureRunReport(input, { generatedBytes });
  const { report, bytes, generated_bytes: total } = measured;
  if (total > plan.limits.max_generated_bytes) throw new Error("quota-exceeded:generated-bytes");
  mkdirSync(dirname(selected.target.full), { recursive: true });
  const text = jsonText(report);
  if (selected.mode === "finalize-running") finalizeRunning(selected.target, text, input);
  else writeFileSync(selected.target.full, text, { encoding: "utf8", flag: "wx" });
  return Object.freeze({ path: selected.target.path, prior_path: selected.priorPath, bytes, generated_bytes: total, report });
}

export function formatReport(report, format = "text", { reportPath = `.okf/reports/${report.run_id}.json` } = {}) {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format !== "text") throw new Error("report-invalid-format");
  return [
    `OKF run ${report.run_id}: ${report.outcome}`,
    `root: ${report.root}`,
    `revision: ${report.revision}`,
    `items: ${report.item_count}`,
    `reason: ${report.reason}`,
    `report: ${reportPath}`,
  ].join("\n");
}
