import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolveControlPath } from "./run-guard.mjs";

const LOCK_PATH = ".okf/run.lock";

function parseLock(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { malformed: true };
  }
}

export function readLock(root) {
  const target = resolveControlPath(root, LOCK_PATH);
  if (!existsSync(target.full)) return null;
  const value = parseLock(target.full);
  let stale = false;
  if (Number.isInteger(value.pid) && value.pid > 0) {
    try { process.kill(value.pid, 0); } catch { stale = true; }
  }
  return Object.freeze({ ...value, stale, path: target.path });
}

export function acquireLock(root, plan, { identity = "operator", now = () => new Date().toISOString() } = {}) {
  const target = resolveControlPath(root, LOCK_PATH);
  mkdirSync(dirname(target.full), { recursive: true });
  const body = {
    lock_token: randomUUID(),
    run_id: plan.run_id,
    root: plan.root,
    revision: plan.revision,
    pid: process.pid,
    identity,
    started_at: now(),
    limits: plan.limits,
    phase: "preflight",
    plan_hash: plan.plan_hash ?? null,
    operator_request: plan.operator_request,
    cancellation: Object.freeze({ signals: ["SIGINT", "SIGTERM"], kill_switch: ".okf/KILL_SWITCH" }),
  };
  try {
    writeFileSync(target.full, `${JSON.stringify(body, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    return Object.freeze({ acquired: true, path: target.full, run_id: plan.run_id, root: plan.root, lock_token: body.lock_token, metadata: Object.freeze(body) });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = readLock(root);
    return Object.freeze({ acquired: false, code: existing?.stale ? "lock-stale" : "lock-exists", existing });
  }
}

export function updateLock(root, handle, changes = {}) {
  if (!handle?.acquired) return false;
  const target = resolveControlPath(root, LOCK_PATH);
  if (!existsSync(target.full)) return false;
  const active = parseLock(target.full);
  if (active.root !== handle.root || active.run_id !== handle.run_id || active.lock_token !== handle.lock_token) return false;
  const allowed = {};
  if (typeof changes.phase === "string" && changes.phase.length > 0) allowed.phase = changes.phase;
  if (typeof changes.plan_hash === "string" && /^[0-9a-f]{64}$/i.test(changes.plan_hash)) allowed.plan_hash = changes.plan_hash.toLowerCase();
  if (typeof changes.checkpoint === "string" && changes.checkpoint.length > 0) allowed.checkpoint = changes.checkpoint;
  const next = { ...active, ...allowed };
  const temporary = `${target.full}.${handle.lock_token}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(temporary, target.full);
  return true;
}

export function releaseLock(root, handle, terminalPath) {
  if (!handle?.acquired || typeof terminalPath !== "string" || !/^\.okf\/(?:reports|checkpoints)\/[a-z0-9][a-z0-9._-]{0,190}\.json$/i.test(terminalPath)) return false;
  const terminal = resolveControlPath(root, terminalPath);
  const target = resolveControlPath(root, LOCK_PATH);
  if (!existsSync(terminal.full) || !existsSync(target.full)) return false;
  const active = parseLock(target.full);
  if (active.root !== handle.root || active.run_id !== handle.run_id || active.lock_token !== handle.lock_token) return false;
  try {
    const record = JSON.parse(readFileSync(terminal.full, "utf8"));
    if (record.root !== active.root || record.run_id !== active.run_id) return false;
    if (record.lock_token !== active.lock_token) return false;
    if (terminalPath.includes("/reports/") && !["completed", "cancelled", "quota-exceeded", "blocked", "failed"].includes(record.outcome)) return false;
    if (terminalPath.includes("/checkpoints/") && !["completed", "cancelled", "quota-exceeded", "blocked", "failed"].includes(record.outcome)) return false;
  } catch {
    return false;
  }
  unlinkSync(target.full);
  return true;
}

export const CONTROL_PATHS = Object.freeze({ lock: LOCK_PATH });
