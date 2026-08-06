import { readFileSync } from "node:fs";
import { resolveControlPath } from "./run-guard.mjs";

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
    if (value.active === true && ["activated_by", "activated_at", "reason"].every((key) => typeof value[key] === "string" && value[key].trim() !== "")) {
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
    isCancelled() { return cancellation !== null || now() >= deadlineAt; },
    reason() { return cancellation ?? (now() >= deadlineAt ? "quota-exceeded:runtime" : null); },
    checkpointDue() { return cancellation !== null || now() >= deadlineAt; },
  });
}
