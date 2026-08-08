import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolveControlPath } from "./run-guard.mjs";

function checkpointPath(plan) {
  return `.okf/checkpoints/${plan.run_id}.json`;
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function payloadWithTotal(payload, alreadyGenerated) {
  let total = alreadyGenerated;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = { ...payload, generated_bytes: total };
    const next = alreadyGenerated + Buffer.byteLength(jsonText(candidate), "utf8");
    if (next === total) return Object.freeze(candidate);
    total = next;
  }
  return Object.freeze({ ...payload, generated_bytes: total });
}

export function markProcessed(progress, itemId, { postflightOk, persistedOk, finalizedTo = null }) {
  if (!postflightOk || !persistedOk) throw new Error("an item is not complete until postflight validation and persistence succeed");
  const completed = new Set(progress.completed_item_ids ?? []);
  completed.add(itemId);
  const finalized = { ...(progress.finalized_items ?? {}) };
  if (finalizedTo) finalized[itemId] = finalizedTo;
  return Object.freeze({ ...progress, completed_item_ids: [...completed].sort(), finalized_items: Object.freeze(finalized) });
}

export function measureCheckpoint(plan, progress = {}) {
  const base = progress.generated_bytes ?? 0;
  const payload = payloadWithTotal({
    version: "okf-run-checkpoint/1",
    run_id: plan.run_id,
    lock_token: typeof progress.lock_token === "string" ? progress.lock_token : null,
    plan_hash: plan.plan_hash,
    root: plan.root,
    revision: plan.revision,
    allowlist: plan.allowlist,
    limits: plan.limits,
    item_ids: plan.items.map((item) => ({ path: item.path, bytes: item.bytes, sha256: item.sha256 })),
    candidate_count: plan.candidate_count,
    selection_truncated: plan.selection_truncated,
    selection_mode: plan.selection_mode,
    selected_items: plan.selected_items,
    extra_inputs: (plan.extra_inputs ?? []).map((item) => ({ path: item.path, bytes: item.bytes, sha256: item.sha256 })),
    completed_item_ids: [...new Set(progress.completed_item_ids ?? [])].sort(),
    moved_item_ids: [...new Set(progress.moved_item_ids ?? [])].sort(),
    applied_output_paths: [...new Set(progress.applied_output_paths ?? [])].sort(),
    finalized_items: Object.fromEntries(Object.entries(progress.finalized_items ?? {}).sort(([left], [right]) => compare(left, right))),
    output_hashes: Object.fromEntries(Object.entries(progress.output_hashes ?? {}).sort(([left], [right]) => compare(left, right))),
    input_bytes: plan.input_bytes,
    control_input_bytes: plan.control_input_bytes ?? 0,
    phase: progress.phase ?? "checkpointed",
    outcome: progress.outcome ?? null,
    reason: progress.reason ?? null,
    written_at: progress.written_at ?? new Date().toISOString(),
  }, base);
  const text = jsonText(payload);
  const bytes = Buffer.byteLength(text, "utf8");
  return Object.freeze({ payload, text, bytes, generated_bytes: payload.generated_bytes });
}

export function writeCheckpoint(root, plan, progress = {}) {
  const measured = measureCheckpoint(plan, progress);
  const { payload, text, bytes } = measured;
  if (payload.generated_bytes > plan.limits.max_generated_bytes) throw new Error("quota-exceeded:generated-bytes");
  const target = resolveControlPath(root, checkpointPath(plan));
  mkdirSync(dirname(target.full), { recursive: true });
  const temporary = `${target.full}.${process.pid}.tmp`;
  writeFileSync(temporary, text, { encoding: "utf8", flag: "wx" });
  renameSync(temporary, target.full);
  return Object.freeze({ path: target.path, bytes, generated_bytes: payload.generated_bytes, checkpoint: payload });
}

export function readCheckpoint(root, runId) {
  const target = resolveControlPath(root, `.okf/checkpoints/${runId}.json`);
  if (!existsSync(target.full)) return null;
  try {
    return Object.freeze(JSON.parse(readFileSync(target.full, "utf8")));
  } catch {
    return Object.freeze({ malformed: true, run_id: runId });
  }
}

export function canResume(checkpoint, plan) {
  if (!checkpoint || checkpoint.malformed) return Object.freeze({ ok: false, code: "resume-missing-checkpoint" });
  const changed = [];
  for (const field of ["plan_hash", "root", "revision", "run_id"]) if (checkpoint[field] !== plan[field]) changed.push(field);
  if (JSON.stringify(checkpoint.allowlist) !== JSON.stringify(plan.allowlist)) changed.push("allowlist");
  if (JSON.stringify(checkpoint.limits) !== JSON.stringify(plan.limits)) changed.push("limits");
  if (checkpoint.selection_mode !== plan.selection_mode) changed.push("selection_mode");
  if (JSON.stringify(checkpoint.selected_items) !== JSON.stringify(plan.selected_items)) changed.push("selected_items");
  if (checkpoint.control_input_bytes !== (plan.control_input_bytes ?? 0)) changed.push("control_input_bytes");
  const current = new Map(plan.items.map((item) => [item.path, item.sha256]));
  for (const item of checkpoint.item_ids ?? []) if (current.get(item.path) !== item.sha256) changed.push(item.path);
  const extra = new Map((plan.extra_inputs ?? []).map((item) => [item.path, item.sha256]));
  for (const item of checkpoint.extra_inputs ?? []) if (extra.get(item.path) !== item.sha256) changed.push(item.path);
  for (const itemId of checkpoint.completed_item_ids ?? []) if (!current.has(itemId)) changed.push(itemId);
  for (const itemId of checkpoint.moved_item_ids ?? []) if (!current.has(itemId)) changed.push(itemId);
  if (!Number.isSafeInteger(checkpoint.generated_bytes) || checkpoint.generated_bytes < 0 || checkpoint.generated_bytes > plan.limits.max_generated_bytes) {
    changed.push("generated_bytes");
  }
  return changed.length === 0
    ? Object.freeze({ ok: true })
    : Object.freeze({ ok: false, code: "resume-plan-drift", changed: [...new Set(changed)].sort() });
}

export function sourceHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
