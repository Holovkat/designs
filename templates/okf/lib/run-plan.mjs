import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { readCancellationRequest, readKillSwitch } from "./run-control.mjs";
import { RunGuardError, assertRevision, buildPathAllowlist, resolveContainedPath, resolveControlPath, validateRoot } from "./run-guard.mjs";
import { readLock } from "./run-lock.mjs";

function fail(code, message) {
  throw new RunGuardError(code, message);
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(value == null ? "limit-missing" : "limit-invalid", `${name} must be a positive safe integer`);
  }
  return value;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function compareNames(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function regularFile(root, path) {
  const target = resolveContainedPath(root, path);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("path-not-regular-file", `approved input must be a regular file: ${target.path}`);
  return Object.freeze({ path: target.path, full: target.full, bytes: stat.size, sha256: sha256(target.full) });
}

function collectExtraInputs(root, paths, maxBytes) {
  const unique = [...new Set(paths ?? [])].sort(compareNames);
  const inputs = unique.map((path) => regularFile(root, path));
  const bytes = inputs.reduce((total, input) => total + input.bytes, 0);
  if (bytes > maxBytes) fail("quota-exceeded:control-input-bytes", "approved control inputs exceed their max_generated_bytes size boundary");
  return Object.freeze({ inputs: Object.freeze(inputs.map(({ path, bytes, sha256: hash }) => Object.freeze({ path, bytes, sha256: hash }))), bytes });
}

function collectInbox(root, inboxPath, maxItems, maxInputBytes) {
  const inbox = resolveContainedPath(root, inboxPath);
  const entries = readdirSync(inbox.full, { withFileTypes: true }).sort((a, b) => compareNames(a.name, b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) fail("path-symlink", `inbox entry is a symlink: ${entry.name}`);
  }
  const markdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md");
  const selected = markdown.slice(0, maxItems);
  const items = [];
  let inputBytes = 0;
  for (const entry of selected) {
    const item = regularFile(root, `${inboxPath}/${entry.name}`);
    inputBytes += item.bytes;
    if (inputBytes > maxInputBytes) fail("quota-exceeded:input-bytes", "candidate inputs exceed max_input_bytes");
    items.push(Object.freeze({ path: item.path, bytes: item.bytes, sha256: item.sha256 }));
  }
  return Object.freeze({ items: Object.freeze(items), inputBytes, candidateCount: markdown.length, selectionTruncated: markdown.length > selected.length });
}

function collectSelectedInbox(root, inboxPath, selectedPaths, maxInputBytes) {
  const items = [];
  let inputBytes = 0;
  for (const path of selectedPaths) {
    const item = regularFile(root, path);
    inputBytes += item.bytes;
    if (inputBytes > maxInputBytes) fail("quota-exceeded:input-bytes", "selected inputs exceed max_input_bytes");
    items.push(Object.freeze({ path: item.path, bytes: item.bytes, sha256: item.sha256 }));
  }
  return Object.freeze({
    items: Object.freeze(items), inputBytes, candidateCount: items.length, selectionTruncated: false,
  });
}

function collectResumeItems(root, checkpoint, inboxPath, maxItems, maxInputBytes) {
  if (!checkpoint || !Array.isArray(checkpoint.item_ids)) fail("resume-missing-checkpoint", "resume requires a readable checkpoint");
  if (checkpoint.item_ids.length > maxItems) fail("quota-exceeded:items", "checkpoint item count exceeds max_items");
  const items = [];
  const locations = {};
  let inputBytes = 0;
  for (const expected of checkpoint.item_ids) {
    if (!expected || typeof expected.path !== "string" || !expected.path.startsWith(`${inboxPath}/`) || basename(expected.path) === "index.md") {
      fail("resume-checkpoint-invalid", "checkpoint contains an invalid inbox item identifier");
    }
    const finalizedPath = `knowledge/inbox/processed/${basename(expected.path)}`;
    const source = resolveContainedPath(root, expected.path, { optional: true });
    const finalized = resolveContainedPath(root, finalizedPath, { optional: true });
    if (source.exists && finalized.exists) fail("resume-source-ambiguous", `both pending and processed copies exist for ${expected.path}`);
    if (!source.exists && !finalized.exists) fail("resume-source-missing", `checkpoint source is not recoverable: ${expected.path}`);
    const actual = regularFile(root, source.exists ? expected.path : finalizedPath);
    if (actual.sha256 !== expected.sha256 || (expected.bytes != null && actual.bytes !== expected.bytes)) {
      fail("resume-source-drift", `checkpoint source hash changed: ${expected.path}`);
    }
    inputBytes += actual.bytes;
    if (inputBytes > maxInputBytes) fail("quota-exceeded:input-bytes", "checkpoint inputs exceed max_input_bytes");
    items.push(Object.freeze({ path: expected.path, bytes: actual.bytes, sha256: actual.sha256 }));
    locations[expected.path] = source.exists ? expected.path : finalizedPath;
  }
  const ordered = [...items].sort((a, b) => compareNames(a.path, b.path));
  if (ordered.some((item, index) => item.path !== items[index].path)) fail("resume-checkpoint-order", "checkpoint item order is not deterministic");
  return Object.freeze({
    items: Object.freeze(items), inputBytes, locations: Object.freeze(locations),
    candidateCount: Number.isSafeInteger(checkpoint.candidate_count) ? checkpoint.candidate_count : items.length,
    selectionTruncated: checkpoint.selection_truncated === true,
  });
}

function validateSelectedItems(paths, inboxPath, maxItems) {
  if (paths == null) return null;
  if (!Array.isArray(paths)) fail("selection-invalid", "selected_items must be an array when exact selection is requested");
  if (paths.length > maxItems) fail("quota-exceeded:items", "selected item count exceeds max_items");
  for (const path of paths) {
    if (typeof path !== "string" || path !== `${inboxPath}/${basename(path)}` || basename(path) === "index.md" || !path.endsWith(".md")) {
      fail("selection-path-invalid", "selected items must be direct root-relative Markdown files under knowledge/inbox");
    }
  }
  const sorted = [...new Set(paths)].sort(compareNames);
  if (sorted.length !== paths.length || sorted.some((path, index) => path !== paths[index])) {
    fail("selection-order-invalid", "selected_items must be unique and deterministically sorted");
  }
  return Object.freeze([...paths]);
}

function lockMatchesHandle(lock, handle) {
  return Boolean(handle?.acquired && lock && lock.root === handle.root && lock.run_id === handle.run_id && lock.lock_token === handle.lock_token);
}

export function validateRunRequest(input, { activeLock = null } = {}) {
  if (!input || input.trigger !== "operator" || typeof input.operator_request !== "string" || input.operator_request.trim() === "") {
    fail("authority-not-explicit", "an explicit operator request is required before root validation");
  }
  const operatorRequest = input.operator_request.trim();
  if (operatorRequest.length > 1_024) fail("authority-request-too-long", "operator_request must not exceed 1024 characters");
  const operatorIdentity = typeof input.operator_identity === "string" && input.operator_identity.trim() !== ""
    ? input.operator_identity.trim()
    : null;
  if (operatorIdentity && operatorIdentity.length > 128) fail("operator-identity-too-long", "operator_identity must not exceed 128 characters");
  const limits = Object.freeze({
    max_items: positiveInteger(input.max_items, "max_items"),
    max_input_bytes: positiveInteger(input.max_input_bytes, "max_input_bytes"),
    max_generated_bytes: positiveInteger(input.max_generated_bytes, "max_generated_bytes"),
    max_runtime_seconds: positiveInteger(input.max_runtime_seconds, "max_runtime_seconds"),
    max_sessions: positiveInteger(input.max_sessions, "max_sessions"),
  });
  if (limits.max_sessions !== 1) fail("sessions-not-one", "max_sessions must equal one");
  if (typeof input.inbox_path !== "string" || input.inbox_path !== "knowledge/inbox") {
    fail("inbox-not-approved", "only knowledge/inbox is an approved input path");
  }
  const selectedItems = validateSelectedItems(input.selected_items, input.inbox_path, limits.max_items);
  if (input.run_id != null && (typeof input.run_id !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(input.run_id))) {
    fail("run-id-invalid", "run_id must be a bounded filesystem-safe identifier");
  }
  const rootInfo = validateRoot(input.root);
  assertRevision(rootInfo.root, input.revision);
  const readAllowlist = buildPathAllowlist(rootInfo.root, [input.inbox_path, ...(input.allowlist ?? []), ...(input.extra_inputs ?? [])]);
  const controlCandidates = [".okf/KILL_SWITCH", ".okf/run.lock"];
  if (input.run_id) controlCandidates.push(
    `.okf/cancel/${input.run_id}.json`, `.okf/checkpoints/${input.run_id}.json`,
    `.okf/reports/${input.run_id}.json`, `.okf/staging/${input.run_id}`,
  );
  const controlAllowlist = controlCandidates.map((path) => resolveControlPath(rootInfo.root, path).path);
  const allowlist = Object.freeze([...new Set([...readAllowlist, ...controlAllowlist])].sort(compareNames));
  const killSwitch = readKillSwitch(rootInfo.root);
  if (killSwitch.active) fail(killSwitch.code ?? "kill-switch-active", "kill switch blocks enumeration");
  if (input.run_id) {
    const cancellation = readCancellationRequest(rootInfo.root, input.run_id);
    if (cancellation.active) fail(cancellation.code ?? "cancellation-active", "an operator cancellation request blocks enumeration");
  }
  const lock = readLock(rootInfo.root);
  if (lock && !lockMatchesHandle(lock, activeLock)) fail(lock.stale ? "lock-stale" : "lock-exists", "an existing lock blocks enumeration");
  return Object.freeze({
    trigger: "operator",
    operator_identity: operatorIdentity,
    operator_request: operatorRequest,
    root: rootInfo.root,
    revision: rootInfo.revision,
    inbox_path: input.inbox_path,
    run_id: input.run_id ?? null,
    selected_items: selectedItems,
    selection_mode: selectedItems === null ? "lexical-prefix" : "explicit",
    allowlist,
    limits,
    control: Object.freeze({ kill_switch: killSwitch, lock: lockMatchesHandle(lock, activeLock) ? Object.freeze({ acquired: true, run_id: lock.run_id }) : null }),
  });
}

export function validateRunPlan(input, { activeLock = null, resumeCheckpoint = null } = {}) {
  const request = validateRunRequest(input, { activeLock });
  const extra = collectExtraInputs(request.root, input.extra_inputs ?? [], request.limits.max_generated_bytes);
  if (resumeCheckpoint?.selection_mode === "explicit" && request.selection_mode !== "explicit") {
    fail("resume-selection-missing", "resume requires the same explicit selected_items dataset");
  }
  if (resumeCheckpoint && request.selected_items
    && JSON.stringify(request.selected_items) !== JSON.stringify((resumeCheckpoint.item_ids ?? []).map((item) => item.path))) {
    fail("resume-selection-drift", "resume selected_items do not match the checkpoint dataset");
  }
  const collected = resumeCheckpoint
    ? collectResumeItems(request.root, resumeCheckpoint, request.inbox_path, request.limits.max_items, request.limits.max_input_bytes)
    : request.selected_items !== null
      ? collectSelectedInbox(request.root, request.inbox_path, request.selected_items, request.limits.max_input_bytes)
      : collectInbox(request.root, request.inbox_path, request.limits.max_items, request.limits.max_input_bytes);
  const body = {
    operator_identity: request.operator_identity,
    operator_request: request.operator_request,
    root: request.root,
    revision: request.revision,
    allowlist: request.allowlist,
    items: collected.items,
    candidate_count: collected.candidateCount,
    selection_truncated: collected.selectionTruncated,
    selection_mode: request.selection_mode,
    selected_items: request.selected_items,
    extra_inputs: extra.inputs,
    control_input_bytes: extra.bytes,
    limits: request.limits,
    control: { kill_switch: request.control.kill_switch, lock: null },
  };
  const planHash = createHash("sha256").update(canonicalJson(body)).digest("hex");
  const runId = request.run_id ?? `okf-${planHash.slice(0, 16)}`;
  if (resumeCheckpoint && resumeCheckpoint.run_id !== runId) fail("resume-run-mismatch", "checkpoint run_id does not match the explicit resume request");
  return Object.freeze({
    ...body,
    run_id: runId,
    plan_hash: planHash,
    input_bytes: collected.inputBytes,
    resume_locations: collected.locations ?? Object.freeze(Object.fromEntries(collected.items.map((item) => [item.path, item.path]))),
  });
}
