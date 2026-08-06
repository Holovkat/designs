import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
    plan_hash: plan.plan_hash,
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

export function releaseLock(root, handle, terminalPath) {
  if (!handle?.acquired || typeof terminalPath !== "string" || !/^\.okf\/(reports|checkpoints)\//.test(terminalPath)) return false;
  const terminal = resolveControlPath(root, terminalPath);
  const target = resolveControlPath(root, LOCK_PATH);
  if (!existsSync(terminal.full) || !existsSync(target.full)) return false;
  const active = parseLock(target.full);
  if (active.root !== handle.root || active.run_id !== handle.run_id || active.lock_token !== handle.lock_token) return false;
  try {
    const record = JSON.parse(readFileSync(terminal.full, "utf8"));
    if (record.root !== active.root || record.run_id !== active.run_id) return false;
  } catch {
    return false;
  }
  unlinkSync(target.full);
  return true;
}

export const CONTROL_PATHS = Object.freeze({ lock: LOCK_PATH });
