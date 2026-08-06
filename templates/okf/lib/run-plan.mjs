import { createHash } from "node:crypto";
import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { readKillSwitch } from "./run-control.mjs";
import { RunGuardError, buildPathAllowlist, validateRoot } from "./run-guard.mjs";
import { readLock } from "./run-lock.mjs";

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) fail(value == null ? "limit-missing" : "limit-invalid", `${name} must be a positive safe integer`);
  return value;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function collectInbox(root, inboxPath, maxItems, maxBytes) {
  const inbox = join(root, inboxPath);
  const entries = readdirSync(inbox, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) if (entry.isSymbolicLink()) fail("path-symlink", `inbox item is a symlink: ${entry.name}`);
  const markdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  if (markdown.length > maxItems) fail("quota-exceeded:items", "candidate inbox exceeds max_items");
  const items = [];
  let inputBytes = 0;
  for (const entry of markdown) {
    const full = join(inbox, entry.name);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) fail("path-symlink", `inbox item is a symlink: ${entry.name}`);
    inputBytes += stat.size;
    if (inputBytes > maxBytes) fail("quota-exceeded:input-bytes", "candidate inbox exceeds max_input_bytes");
    items.push(Object.freeze({ path: `${inboxPath}/${entry.name}`, bytes: stat.size, sha256: sha256(full) }));
  }
  return Object.freeze({ items: Object.freeze(items), inputBytes });
}

export function validateRunPlan(input) {
  if (!input || input.trigger !== "operator" || typeof input.operator_request !== "string" || input.operator_request.trim() === "") {
    fail("authority-not-explicit", "an explicit operator request is required before root validation");
  }
  const limits = Object.freeze({
    max_items: positiveInteger(input.max_items, "max_items"),
    max_input_bytes: positiveInteger(input.max_input_bytes, "max_input_bytes"),
    max_generated_bytes: positiveInteger(input.max_generated_bytes, "max_generated_bytes"),
    max_runtime_seconds: positiveInteger(input.max_runtime_seconds, "max_runtime_seconds"),
    max_sessions: input.max_sessions,
  });
  if (limits.max_sessions !== 1) fail("sessions-not-one", "max_sessions must equal one");
  if (typeof input.inbox_path !== "string" || input.inbox_path !== "knowledge/inbox") fail("inbox-not-approved", "only knowledge/inbox is an approved input path");

  if (typeof input.revision !== "string" || !/^[0-9a-f]{40}$/i.test(input.revision)) fail("revision-invalid", "an explicit full Git revision is required");
  const rootInfo = validateRoot(input.root);
  if (rootInfo.revision !== input.revision.toLowerCase()) fail("revision-mismatch", "root does not match the approved Git revision");
  const allowlist = buildPathAllowlist(rootInfo.root, [input.inbox_path, ...(input.allowlist ?? [])]);
  const killSwitch = readKillSwitch(rootInfo.root);
  if (killSwitch.active) fail(killSwitch.code ?? "kill-switch-active", "kill switch blocks enumeration");
  const lock = readLock(rootInfo.root);
  if (lock) fail(lock.stale ? "lock-stale" : "lock-exists", "an existing lock blocks enumeration");
  const { items, inputBytes } = collectInbox(rootInfo.root, input.inbox_path, limits.max_items, limits.max_input_bytes);
  const body = {
    operator_request: input.operator_request.trim(),
    root: rootInfo.root,
    revision: rootInfo.revision,
    allowlist,
    items,
    limits,
    control: { kill_switch: killSwitch, lock: null },
  };
  const planHash = createHash("sha256").update(canonical(body)).digest("hex");
  return Object.freeze({ ...body, run_id: input.run_id ?? `okf-${planHash.slice(0, 16)}`, plan_hash: planHash, input_bytes: inputBytes });
}
