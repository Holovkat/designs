import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveControlPath } from "./run-guard.mjs";

function checkpointPath(plan) {
  return `.okf/checkpoints/${plan.run_id}.json`;
}

function jsonBytes(value) {
  return Buffer.byteLength(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function markProcessed(progress, itemId, { postflightOk, persistedOk }) {
  if (!postflightOk || !persistedOk) throw new Error("an item is not complete until postflight validation and persistence succeed");
  const completed = new Set(progress.completed_item_ids ?? []);
  completed.add(itemId);
  return Object.freeze({ ...progress, completed_item_ids: [...completed] });
}

export function writeCheckpoint(root, plan, progress = {}) {
  const payload = {
    run_id: plan.run_id,
    plan_hash: plan.plan_hash,
    root: plan.root,
    revision: plan.revision,
    allowlist: plan.allowlist,
    limits: plan.limits,
    item_ids: plan.items.map((item) => ({ path: item.path, sha256: item.sha256 })),
    completed_item_ids: [...new Set(progress.completed_item_ids ?? [])],
    input_bytes: plan.input_bytes,
    generated_bytes: progress.generated_bytes ?? 0,
    phase: progress.phase ?? "checkpointed",
    written_at: progress.written_at ?? new Date().toISOString(),
  };
  const bytes = jsonBytes(payload);
  if (payload.generated_bytes + bytes > plan.limits.max_generated_bytes) throw new Error("quota-exceeded:generated-bytes");
  const target = resolveControlPath(root, checkpointPath(plan));
  mkdirSync(dirname(target.full), { recursive: true });
  const temporary = `${target.full}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  renameSync(temporary, target.full);
  return Object.freeze({ path: target.path, bytes, checkpoint: Object.freeze(payload) });
}

export function readCheckpoint(root, runId) {
  const target = resolveControlPath(root, `.okf/checkpoints/${runId}.json`);
  if (!existsSync(target.full)) return null;
  return Object.freeze(JSON.parse(readFileSync(target.full, "utf8")));
}

export function canResume(checkpoint, plan) {
  if (!checkpoint) return Object.freeze({ ok: false, code: "resume-missing-checkpoint" });
  const changed = [];
  for (const field of ["plan_hash", "root", "revision"]) if (checkpoint[field] !== plan[field]) changed.push(field);
  if (JSON.stringify(checkpoint.allowlist) !== JSON.stringify(plan.allowlist)) changed.push("allowlist");
  if (JSON.stringify(checkpoint.limits) !== JSON.stringify(plan.limits)) changed.push("limits");
  const current = new Map(plan.items.map((item) => [item.path, item.sha256]));
  for (const item of checkpoint.item_ids ?? []) if (current.get(item.path) !== item.sha256) changed.push(item.path);
  return changed.length === 0 ? Object.freeze({ ok: true }) : Object.freeze({ ok: false, code: "resume-plan-drift", changed: [...new Set(changed)].sort() });
}

export function sourceHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
