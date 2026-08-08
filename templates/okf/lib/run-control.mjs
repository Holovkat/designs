import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolveControlPath } from "./run-guard.mjs";

function validRunId(runId) {
  return typeof runId === "string" && /^[a-z0-9][a-z0-9._-]{0,95}$/i.test(runId);
}

export function readKillSwitch(root, path = ".okf/KILL_SWITCH") {
  const target = resolveControlPath(root, path);
  let raw;
  try {
    raw = readFileSync(target.full, "utf8");
  } catch {
    return Object.freeze({ active: true, ambiguous: true, code: "kill-switch-indeterminate" });
  }
  try {
    const value = JSON.parse(raw);
    if (value.active === false && Object.keys(value).length === 1) return Object.freeze({ active: false, ambiguous: false });
    if (value.active === true
      && Object.keys(value).sort().join(",") === "activated_at,activated_by,active,reason"
      && ["activated_by", "activated_at", "reason"].every((key) => typeof value[key] === "string" && value[key].trim() !== "")) {
      return Object.freeze({ active: true, ambiguous: false, activated_by: value.activated_by, activated_at: value.activated_at, reason: value.reason });
    }
  } catch {
    // Fail closed below.
  }
  return Object.freeze({ active: true, ambiguous: true, code: "kill-switch-indeterminate" });
}

export function createCancellationToken({ deadlineAt, now = () => Date.now() }) {
  let cancellation = null;
  return Object.freeze({
    requestCancel(reason = "operator-cancelled") { cancellation ??= reason; },
    observe(reason) { if (reason) cancellation ??= reason; },
    isCancelled() { return cancellation !== null || now() >= deadlineAt; },
    reason() { return cancellation ?? (now() >= deadlineAt ? "quota-exceeded:runtime" : null); },
    checkpointDue() { return cancellation !== null || now() >= deadlineAt; },
  });
}

export function cancellationPath(runId) {
  if (!validRunId(runId)) throw new Error("run-id-invalid");
  return `.okf/cancel/${runId}.json`;
}

export function readCancellationRequest(root, runId) {
  const target = resolveControlPath(root, cancellationPath(runId));
  if (!existsSync(target.full)) return Object.freeze({ active: false, ambiguous: false, path: target.path });
  try {
    const value = JSON.parse(readFileSync(target.full, "utf8"));
    if (value.requested === true
      && Object.keys(value).sort().join(",") === "reason,requested,requested_at,requested_by"
      && typeof value.requested_by === "string" && value.requested_by.trim() !== "" && value.requested_by.length <= 128
      && typeof value.requested_at === "string" && value.requested_at.trim() !== "" && value.requested_at.length <= 64
      && typeof value.reason === "string" && value.reason.trim() !== "" && value.reason.length <= 1_024) {
      return Object.freeze({ ...value, active: true, ambiguous: false, path: target.path });
    }
  } catch {
    // Fail closed below.
  }
  return Object.freeze({ active: true, ambiguous: true, path: target.path, code: "cancellation-indeterminate" });
}

export function requestCancellation(root, runId, { requestedBy, requestedAt = new Date().toISOString(), reason }) {
  if (typeof requestedBy !== "string" || requestedBy.trim() === "" || typeof reason !== "string" || reason.trim() === "") {
    throw new Error("cancellation-request-invalid");
  }
  if (requestedBy.trim().length > 128 || reason.trim().length > 1_024 || typeof requestedAt !== "string" || requestedAt.length > 64) {
    throw new Error("cancellation-request-too-long");
  }
  const target = resolveControlPath(root, cancellationPath(runId));
  mkdirSync(dirname(target.full), { recursive: true });
  const payload = {
    requested: true,
    requested_by: requestedBy.trim(),
    requested_at: requestedAt,
    reason: reason.trim(),
  };
  writeFileSync(target.full, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  return Object.freeze({ path: target.path, payload: Object.freeze(payload) });
}

export function observeRunCancellation(root, runId, token) {
  const killSwitch = readKillSwitch(root);
  if (killSwitch.active) token.observe(killSwitch.ambiguous ? "kill-switch-indeterminate" : "kill-switch-active");
  const request = readCancellationRequest(root, runId);
  if (request.active) token.observe(request.ambiguous ? "cancellation-indeterminate" : "operator-cancelled");
  return token.reason();
}
