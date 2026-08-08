import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname } from "node:path";
import { createCancellationToken, observeRunCancellation } from "./run-control.mjs";
import { RunGuardError, resolveContainedPath, resolveControlPath, validateRoot } from "./run-guard.mjs";
import { acquireLock, releaseLock, updateLock } from "./run-lock.mjs";
import { canonicalJson, validateRunRequest } from "./run-plan.mjs";
import { measureRunReport, writeRunReport } from "./run-report.mjs";
import { triageSelectedInbox } from "./inbox-triage.mjs";

const PLAN_VERSION = "okf-inbox-archive-plan/1";
const ROLLBACK_VERSION = "okf-inbox-archive-rollback/1";
const RECEIPT_VERSION = "okf-inbox-archive-receipt/1";
const ROLLBACK_RESULT_VERSION = "okf-inbox-archive-rollback-result/1";

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function hashManifest(value) {
  const { manifest_hash: _ignored, ...body } = value;
  return sha256(canonicalJson(body));
}

function withManifestHash(value) {
  return Object.freeze({ ...value, manifest_hash: hashManifest(value) });
}

function requireText(value, code, message) {
  if (typeof value !== "string" || value.trim() === "") fail(code, message);
  return value.trim();
}

function archiveIdentifier(value) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value)) {
    fail("archive-id-invalid", "archive_id must be a bounded filesystem-safe identifier");
  }
  return value;
}

function directInboxPath(value) {
  if (typeof value !== "string" || !/^knowledge\/inbox\/[^/]+\.md$/.test(value) || basename(value) === "index.md") {
    fail("selection-not-direct-inbox", "archive selections must be direct pending knowledge/inbox Markdown paths");
  }
  return value;
}

function planManifestPath(value) {
  if (typeof value !== "string" || !/^\.okf\/archive\/plans\/[a-z0-9][a-z0-9._-]{0,95}\.json$/i.test(value)) {
    fail("archive-plan-path-invalid", "plan manifest must be a repository-relative .okf/archive/plans/<name>.json path");
  }
  return value;
}

function rollbackManifestPath(value) {
  if (typeof value !== "string" || !/^\.okf\/archive\/rollbacks\/[a-z0-9][a-z0-9._-]{0,95}\.json$/i.test(value)) {
    fail("rollback-manifest-path-invalid", "rollback manifest must be a repository-relative .okf/archive/rollbacks/<name>.json path");
  }
  return value;
}

function limitsFrom(input) {
  return Object.freeze({
    max_items: input.max_items,
    max_input_bytes: input.max_input_bytes,
    max_generated_bytes: input.max_generated_bytes,
    max_runtime_seconds: input.max_runtime_seconds,
    max_sessions: input.max_sessions,
  });
}

function sameLimits(left, right) {
  return ["max_items", "max_input_bytes", "max_generated_bytes", "max_runtime_seconds", "max_sessions"]
    .every((field) => left?.[field] === right?.[field]);
}

function requestInput(input, { runId, allowlist }) {
  return {
    trigger: "operator",
    operator_identity: input.operator,
    operator_request: input.operator_request,
    root: input.root,
    revision: input.revision,
    inbox_path: "knowledge/inbox",
    run_id: runId,
    allowlist,
    ...limitsFrom(input),
  };
}

function destinationPath(archiveId, sourcePath) {
  return `knowledge/inbox/archive/${archiveId}/${basename(sourcePath)}`;
}

function snapshotPath(archiveId, path) {
  const name = path === "knowledge/inbox/index.md" ? "knowledge-inbox-index.md" : "knowledge-index.md";
  return `.okf/archive/snapshots/${archiveId}/${name}`;
}

function directPendingPaths(root) {
  const inbox = resolveContainedPath(root, "knowledge/inbox");
  const entries = readdirSync(inbox.full, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) if (entry.isSymbolicLink()) fail("path-symlink", `inbox contains a symlink: ${entry.name}`);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => `knowledge/inbox/${entry.name}`);
}

function removeSelectedIndexRows(content, selectedPaths) {
  const selectedNames = new Set(selectedPaths.map((path) => basename(path)));
  const trailingNewline = content.endsWith("\n");
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  if (trailingNewline) lines.pop();
  const retained = lines.filter((line) => ![...selectedNames].some((name) => line.includes(`](./${name})`)));
  return `${retained.join(newline)}${trailingNewline ? newline : ""}`;
}

function updateRootInboxCount(content, count) {
  return content.replace(
    /^(\| \[Inbox\]\(\.\/inbox\/index\.md\) \| )\d+( \|.*)$/m,
    (_match, prefix, suffix) => `${prefix}${count}${suffix}`,
  );
}

function plannedRewrite(root, archiveId, path, transform) {
  const target = resolveContainedPath(root, path);
  const before = readFileSync(target.full);
  const after = Buffer.from(transform(before.toString("utf8")), "utf8");
  if (before.equals(after)) return null;
  return Object.freeze({
    path,
    before_bytes: before.length,
    before_sha256: sha256(before),
    after_bytes: after.length,
    after_sha256: sha256(after),
    snapshot_path: snapshotPath(archiveId, path),
  });
}

function plannedRewrites(root, archiveId, selectedPaths, pendingAfter) {
  return Object.freeze([
    plannedRewrite(root, archiveId, "knowledge/inbox/index.md", (content) => removeSelectedIndexRows(content, selectedPaths)),
    plannedRewrite(root, archiveId, "knowledge/index.md", (content) => updateRootInboxCount(content, pendingAfter)),
  ].filter(Boolean));
}

function reviewedIndexInputs(root) {
  return Object.freeze(["knowledge/inbox/index.md", "knowledge/index.md"].map((path) => {
    const target = resolveContainedPath(root, path);
    const content = readFileSync(target.full);
    return Object.freeze({ path, bytes: content.length, sha256: sha256(content) });
  }));
}

function sourceSnapshot(root, selectedPaths) {
  const pendingPaths = directPendingPaths(root);
  for (const path of selectedPaths) if (!pendingPaths.includes(path)) fail("selection-not-pending", `selected path is not a direct pending item: ${path}`);
  return Object.freeze({
    count: pendingPaths.length,
    paths_sha256: sha256(canonicalJson(pendingPaths)),
    paths: Object.freeze(pendingPaths),
  });
}

function readJson(root, path) {
  const target = resolveContainedPath(root, path);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("manifest-not-regular-file", `manifest is not a regular file: ${path}`);
  try {
    return Object.freeze({ value: JSON.parse(readFileSync(target.full, "utf8")), bytes: stat.size, sha256: sha256(readFileSync(target.full)) });
  } catch {
    fail("manifest-malformed", `manifest is not valid JSON: ${path}`);
  }
}

function verifyManifest(value, expectedVersion) {
  if (!value || value.version !== expectedVersion || !/^[0-9a-f]{64}$/i.test(value.manifest_hash ?? "")) {
    fail("manifest-invalid", `expected ${expectedVersion} manifest`);
  }
  if (hashManifest(value) !== value.manifest_hash) fail("manifest-hash-mismatch", "manifest content does not match its recorded hash");
  return value;
}

function writeOnce(root, path, content) {
  const target = resolveControlPath(root, path);
  mkdirSync(dirname(target.full), { recursive: true });
  try {
    writeFileSync(target.full, content, { flag: "wx" });
  } catch (error) {
    if (error.code === "EEXIST") fail("archive-output-exists", `archive output already exists: ${path}`);
    throw error;
  }
  return Object.freeze({ path, bytes: content.length, sha256: sha256(content) });
}

function atomicRewrite(root, path, content) {
  const target = resolveContainedPath(root, path);
  const temporary = resolveControlPath(root, `.okf/archive/tmp/${process.pid}-${basename(path)}`);
  mkdirSync(dirname(temporary.full), { recursive: true });
  writeFileSync(temporary.full, content, { flag: "wx" });
  renameSync(temporary.full, target.full);
  return Object.freeze({ path, bytes: content.length, sha256: sha256(content) });
}

function recomputeRewrite(root, rewrite, selectedPaths, pendingAfter) {
  const target = resolveContainedPath(root, rewrite.path);
  const before = readFileSync(target.full);
  if (sha256(before) !== rewrite.before_sha256 || before.length !== rewrite.before_bytes) {
    fail("archive-index-drift", `reviewed index input changed: ${rewrite.path}`);
  }
  const afterText = rewrite.path === "knowledge/inbox/index.md"
    ? removeSelectedIndexRows(before.toString("utf8"), selectedPaths)
    : updateRootInboxCount(before.toString("utf8"), pendingAfter);
  const after = Buffer.from(afterText, "utf8");
  if (sha256(after) !== rewrite.after_sha256 || after.length !== rewrite.after_bytes) {
    fail("archive-index-plan-mismatch", `reviewed index output cannot be reproduced: ${rewrite.path}`);
  }
  return Object.freeze({ before, after });
}

function validatePlanShape(plan, root, revision) {
  verifyManifest(plan, PLAN_VERSION);
  archiveIdentifier(plan.archive_id);
  if (plan.operation !== "archive-direct-pending-inbox" || plan.dry_run !== true) fail("archive-plan-operation-invalid", "archive plan must be an unmodified dry-run manifest");
  if (plan.permanent_deletion_supported !== false || plan.source_content_rewrite !== false) fail("archive-plan-destructive", "archive plan must prohibit permanent deletion and source-content rewrite");
  if (plan.root !== root) fail("archive-root-mismatch", "archive plan belongs to another repository root");
  if (plan.revision !== revision) fail("archive-revision-mismatch", "archive plan belongs to another Git revision");
  if (!Array.isArray(plan.items) || plan.items.length === 0) fail("archive-plan-empty", "archive plan has no selected items");
  const paths = plan.items.map((item) => directInboxPath(item.source_path));
  if (new Set(paths).size !== paths.length || [...paths].sort().some((path, index) => path !== paths[index])) {
    fail("archive-selection-order", "archive plan selection must be unique and lexicographically ordered");
  }
  for (const item of plan.items) {
    if (item.destination_path !== destinationPath(plan.archive_id, item.source_path)) fail("archive-destination-invalid", "archive destination is not deterministic");
    if (!/^[0-9a-f]{64}$/i.test(item.sha256 ?? "") || !Number.isSafeInteger(item.bytes) || item.bytes < 0) fail("archive-item-invalid", "archive item identity is incomplete");
  }
  if (!Array.isArray(plan.index_rewrites)) fail("archive-rewrites-invalid", "archive plan index rewrites must be an array");
  const rewritePaths = plan.index_rewrites.map((rewrite) => rewrite.path);
  if (new Set(rewritePaths).size !== rewritePaths.length || rewritePaths.some((path) => !["knowledge/inbox/index.md", "knowledge/index.md"].includes(path))) {
    fail("archive-rewrites-invalid", "archive plan may rewrite only the two reviewed inbox indexes once each");
  }
  for (const rewrite of plan.index_rewrites) {
    if (rewrite.snapshot_path !== snapshotPath(plan.archive_id, rewrite.path)) fail("archive-snapshot-path-invalid", "archive index snapshot path is not deterministic");
    for (const field of ["before_sha256", "after_sha256"]) if (!/^[0-9a-f]{64}$/i.test(rewrite[field] ?? "")) fail("archive-rewrite-hash-invalid", "archive index rewrite hashes are incomplete");
    for (const field of ["before_bytes", "after_bytes"]) if (!Number.isSafeInteger(rewrite[field]) || rewrite[field] < 0) fail("archive-rewrite-bytes-invalid", "archive index rewrite byte counts are incomplete");
  }
  if (!Array.isArray(plan.index_inputs) || plan.index_inputs.length !== 2 || plan.index_inputs.map((item) => item.path).join("|") !== "knowledge/inbox/index.md|knowledge/index.md") {
    fail("archive-index-inputs-invalid", "archive plan must identify both reviewed inbox indexes");
  }
  for (const item of plan.index_inputs) {
    if (!Number.isSafeInteger(item.bytes) || item.bytes < 0 || !/^[0-9a-f]{64}$/i.test(item.sha256 ?? "")) fail("archive-index-inputs-invalid", "archive index input identity is incomplete");
  }
  if (!plan.rollback || rollbackManifestPath(plan.rollback.manifest_path) !== `.okf/archive/rollbacks/${plan.archive_id}.json`) fail("archive-rollback-path-invalid", "archive plan rollback path is not deterministic");
  if (plan.rollback.result_path !== `.okf/archive/receipts/${plan.archive_id}-rollback.json`) fail("archive-rollback-result-path-invalid", "archive plan rollback result path is not deterministic");
  if (!plan.pending_snapshot || !Number.isSafeInteger(plan.pending_snapshot.count) || !Number.isSafeInteger(plan.pending_snapshot.count_after) || !/^[0-9a-f]{64}$/i.test(plan.pending_snapshot.paths_sha256 ?? "")) {
    fail("archive-pending-snapshot-invalid", "archive plan pending snapshot is incomplete");
  }
  if (plan.pending_snapshot.count_after !== plan.pending_snapshot.count - plan.items.length || plan.pending_snapshot.count_after < 0) fail("archive-pending-snapshot-invalid", "archive plan pending counts do not match its selection");
  return plan;
}

function validateRollbackShape(rollback, root, revision) {
  verifyManifest(rollback, ROLLBACK_VERSION);
  const archiveId = archiveIdentifier(rollback.archive_id);
  if (rollback.root !== root || rollback.revision !== revision) fail("rollback-root-revision-mismatch", "rollback manifest belongs to another root or revision");
  planManifestPath(rollback.source_plan_path);
  if (!/^[0-9a-f]{64}$/i.test(rollback.source_plan_sha256 ?? "") || !/^[0-9a-f]{64}$/i.test(rollback.source_plan_manifest_hash ?? "")) fail("rollback-source-plan-invalid", "rollback source-plan identity is incomplete");
  if (![rollback.prepared_by, rollback.approval_ref, rollback.reason, rollback.prepared_at].every((value) => typeof value === "string" && value.trim() !== "")) fail("rollback-approval-invalid", "rollback manifest is missing operator approval provenance");
  if (rollback.rollback_result !== "pending-operator-action") fail("rollback-result-state-invalid", "rollback manifest must await an explicit operator action");
  if (!Array.isArray(rollback.moves) || rollback.moves.length === 0) fail("rollback-moves-invalid", "rollback manifest has no moves");
  const sources = rollback.moves.map((move) => directInboxPath(move.source_path));
  if (new Set(sources).size !== sources.length || [...sources].sort().some((path, index) => path !== sources[index])) fail("rollback-moves-invalid", "rollback moves must be unique and ordered");
  for (const move of rollback.moves) {
    if (move.archive_path !== destinationPath(archiveId, move.source_path)) fail("rollback-archive-path-invalid", "rollback archive path is not deterministic");
    if (!Number.isSafeInteger(move.bytes) || move.bytes < 0 || !/^[0-9a-f]{64}$/i.test(move.sha256 ?? "")) fail("rollback-move-identity-invalid", "rollback move identity is incomplete");
  }
  if (!Array.isArray(rollback.rewrites)) fail("rollback-rewrites-invalid", "rollback rewrites must be an array");
  const rewritePaths = rollback.rewrites.map((rewrite) => rewrite.path);
  if (new Set(rewritePaths).size !== rewritePaths.length || rewritePaths.some((path) => !["knowledge/inbox/index.md", "knowledge/index.md"].includes(path))) fail("rollback-rewrites-invalid", "rollback may restore only the two reviewed inbox indexes once each");
  for (const rewrite of rollback.rewrites) {
    if (rewrite.snapshot_path !== snapshotPath(archiveId, rewrite.path)) fail("rollback-snapshot-path-invalid", "rollback snapshot path is not deterministic");
    if (!["archived_sha256", "restored_sha256"].every((field) => /^[0-9a-f]{64}$/i.test(rewrite[field] ?? ""))) fail("rollback-rewrite-hash-invalid", "rollback rewrite hashes are incomplete");
    if (!Number.isSafeInteger(rewrite.snapshot_bytes) || rewrite.snapshot_bytes < 0) fail("rollback-rewrite-bytes-invalid", "rollback snapshot byte count is incomplete");
  }
  if (rollback.result_manifest_path !== `.okf/archive/receipts/${archiveId}-rollback.json`) fail("rollback-result-path-invalid", "rollback result path is not deterministic");
  if (rollback.permanent_deletion_occurred !== false) fail("rollback-deletion-state-invalid", "rollback manifest must prove that no permanent deletion occurred");
  return rollback;
}

function authority(input, { approval = false } = {}) {
  const operator = requireText(input.operator, "operator-missing", "operator identity is required");
  const operatorRequest = requireText(input.operator_request, "authority-not-explicit", "an explicit operator request is required");
  if (!approval) return Object.freeze({ operator, operatorRequest });
  return Object.freeze({
    operator,
    operatorRequest,
    approvalRef: requireText(input.approval_ref, "approval-ref-missing", "explicit approval_ref is required"),
    reason: requireText(input.reason, "archive-reason-missing", "an operator-reviewed reason is required"),
  });
}

function reportInput({ request, lockToken, itemIds, startedAt, inputBytes = 0, generatedBytes, outcome, reason, recovery, checkpoint, mutated }) {
  return {
    run_id: request.run_id,
    lock_token: lockToken,
    operator_request: request.operator_request,
    root: request.root,
    revision: request.revision,
    allowlist: request.allowlist,
    item_ids: itemIds,
    limits: request.limits,
    lock_state: "acquired",
    phase: "archive",
    elapsed_seconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
    input_bytes: inputBytes,
    generated_bytes: generatedBytes,
    sessions_active: 1,
    sessions_max: 1,
    last_checkpoint: checkpoint,
    outcome,
    reason,
    recovery_instruction: recovery,
    mutated,
  };
}

function terminalOutcome(error) {
  const code = error.code ?? error.message ?? "archive-failed";
  if (String(code).startsWith("quota-exceeded")) return "quota-exceeded";
  if (String(code).includes("cancel")) return "cancelled";
  return "failed";
}

/**
 * Build a read-only, deterministic plan for an explicitly selected archive.
 * The returned JSON is the review artifact; callers save it under the
 * recommended repository-relative path before invoking applyArchive.
 */
export function buildArchivePlan(input) {
  const approved = authority(input);
  const reason = requireText(input.reason, "archive-reason-missing", "archive planning reason is required");
  const archiveId = archiveIdentifier(input.archive_id);
  if (!Array.isArray(input.selected_paths) || input.selected_paths.length === 0) fail("selection-missing", "at least one archive path must be selected explicitly");
  const requestedPaths = input.selected_paths.map(directInboxPath);
  if (new Set(requestedPaths).size !== requestedPaths.length) fail("selection-duplicate", "each explicitly selected archive path must appear exactly once");
  const selectedPaths = [...requestedPaths].sort();
  const allowlist = [...selectedPaths, "knowledge/inbox/index.md", "knowledge/index.md"];
  const request = validateRunRequest(requestInput(input, { runId: `archive-${archiveId}`, allowlist }));
  if (selectedPaths.length > request.limits.max_items) fail("quota-exceeded:items", "selected archive paths exceed max_items");

  const triage = triageSelectedInbox(request.root, selectedPaths, { asOf: input.as_of });
  const pending = sourceSnapshot(request.root, selectedPaths);
  const pendingAfter = pending.count - selectedPaths.length;
  const indexInputs = reviewedIndexInputs(request.root);
  const rewrites = plannedRewrites(request.root, archiveId, selectedPaths, pendingAfter);
  const inputBytes = triage.summary.bytes + indexInputs.reduce((total, item) => total + item.bytes, 0);
  if (inputBytes > request.limits.max_input_bytes) fail("quota-exceeded:input-bytes", "selected sources and indexes exceed max_input_bytes");

  const items = triage.items.map((item) => Object.freeze({
    source_path: item.path,
    destination_path: destinationPath(archiveId, item.path),
    bytes: item.bytes,
    sha256: item.sha256,
    frontmatter_identity: item.identity,
    classification: item.classifications,
    classification_signals: item.signals,
  }));
  const rollbackPath = `.okf/archive/rollbacks/${archiveId}.json`;
  const plan = withManifestHash({
    version: PLAN_VERSION,
    operation: "archive-direct-pending-inbox",
    dry_run: true,
    archive_id: archiveId,
    run_id: request.run_id,
    root: request.root,
    revision: request.revision,
    planned_at: triage.measured_at,
    planned_by: approved.operator,
    operator_request: approved.operatorRequest,
    reason,
    selection_rule: "explicit unique direct paths, sorted lexicographically",
    duplicate_scope: "selected paths only; use okf-inbox-triage for whole-backlog duplicate evidence",
    compaction_mode: "reduce the direct pending set by byte-preserving archive moves; never coalesce or delete duplicate source records",
    limits: request.limits,
    input_bytes: inputBytes,
    pending_snapshot: Object.freeze({ count: pending.count, paths_sha256: pending.paths_sha256, count_after: pendingAfter }),
    items: Object.freeze(items),
    index_inputs: indexInputs,
    index_rewrites: rewrites,
    recommended_manifest_path: `.okf/archive/plans/${archiveId}.json`,
    rollback: Object.freeze({
      manifest_path: rollbackPath,
      result_path: `.okf/archive/receipts/${archiveId}-rollback.json`,
      command_template: Object.freeze([
        "node", ".okf/bin/okf-inbox-archive.mjs", "rollback",
        "--root", request.root, "--revision", request.revision,
        "--operator", "<operator>", "--operator-request", "<explicit rollback request>",
        "--approval-ref", "<approval ref>", "--reason", "<rollback reason>",
        "--rollback-manifest", rollbackPath,
        "--max-items", String(request.limits.max_items),
        "--max-input-bytes", String(request.limits.max_input_bytes),
        "--max-generated-bytes", String(request.limits.max_generated_bytes),
        "--max-runtime-seconds", String(request.limits.max_runtime_seconds),
        "--max-sessions", "1",
      ]),
    }),
    permanent_deletion_supported: false,
    source_content_rewrite: false,
    files_changed: Object.freeze([]),
  });
  return plan;
}

/** Apply an operator-reviewed plan. Source bytes are renamed, never deleted. */
export function applyArchive(input) {
  const approved = authority(input, { approval: true });
  const manifestPath = planManifestPath(input.manifest_path);
  const rootInfo = validateRoot(input.root);
  const firstRead = readJson(rootInfo.root, manifestPath);
  const plan = validatePlanShape(firstRead.value, rootInfo.root, input.revision);
  if (!sameLimits(plan.limits, limitsFrom(input))) fail("archive-limits-mismatch", "apply limits must exactly match the reviewed plan");
  const itemIds = plan.items.map((item) => item.source_path);
  const allowlist = [manifestPath, ...itemIds, "knowledge/inbox/index.md", "knowledge/index.md"];
  const request = validateRunRequest(requestInput(input, { runId: plan.run_id, allowlist }));
  const handle = acquireLock(request.root, request, { identity: approved.operator });
  if (!handle.acquired) fail(handle.code ?? "lock-exists", "archive mutation lock could not be acquired");
  const startedAt = Date.now();
  let generatedBytes = 0;
  let movedCount = 0;
  let rewriteCount = 0;
  let rollbackPath = null;
  let inputBytes = firstRead.bytes;
  try {
    validateRunRequest(requestInput(input, { runId: plan.run_id, allowlist }), { activeLock: handle });
    const secondRead = readJson(request.root, manifestPath);
    const reviewed = validatePlanShape(secondRead.value, request.root, request.revision);
    if (secondRead.sha256 !== firstRead.sha256 || reviewed.manifest_hash !== plan.manifest_hash) fail("manifest-drift", "archive plan changed while acquiring the lock");
    updateLock(request.root, handle, { phase: "archive-preflight", plan_hash: plan.manifest_hash });

    const pending = sourceSnapshot(request.root, itemIds);
    if (pending.count !== plan.pending_snapshot.count || pending.paths_sha256 !== plan.pending_snapshot.paths_sha256) {
      fail("archive-pending-drift", "direct pending inbox membership changed after plan review");
    }
    const triage = triageSelectedInbox(request.root, itemIds, { asOf: plan.planned_at });
    for (const planned of plan.items) {
      const current = triage.items.find((item) => item.path === planned.source_path);
      if (!current || current.sha256 !== planned.sha256 || current.bytes !== planned.bytes) fail("archive-source-drift", `selected source changed: ${planned.source_path}`);
      const destination = resolveControlPath(request.root, planned.destination_path);
      if (existsSync(destination.full)) fail("archive-destination-exists", `archive destination already exists: ${planned.destination_path}`);
    }
    for (const reviewedIndex of plan.index_inputs) {
      const target = resolveContainedPath(request.root, reviewedIndex.path);
      const current = readFileSync(target.full);
      if (current.length !== reviewedIndex.bytes || sha256(current) !== reviewedIndex.sha256) fail("archive-index-drift", `reviewed index input changed: ${reviewedIndex.path}`);
    }
    const currentRewrites = new Map(plan.index_rewrites.map((rewrite) => [rewrite.path, recomputeRewrite(request.root, rewrite, itemIds, plan.pending_snapshot.count_after)]));
    inputBytes = secondRead.bytes + plan.items.reduce((total, item) => total + item.bytes, 0) + plan.index_inputs.reduce((total, item) => total + item.bytes, 0);
    if (inputBytes > request.limits.max_input_bytes) fail("quota-exceeded:input-bytes", "reviewed archive inputs exceed max_input_bytes");

    rollbackPath = plan.rollback.manifest_path;
    const rollback = withManifestHash({
      version: ROLLBACK_VERSION,
      archive_id: plan.archive_id,
      source_plan_path: manifestPath,
      source_plan_sha256: secondRead.sha256,
      source_plan_manifest_hash: plan.manifest_hash,
      root: request.root,
      revision: request.revision,
      prepared_at: new Date().toISOString(),
      prepared_by: approved.operator,
      approval_ref: approved.approvalRef,
      reason: approved.reason,
      limits: request.limits,
      moves: plan.items.map((item) => ({ source_path: item.source_path, archive_path: item.destination_path, bytes: item.bytes, sha256: item.sha256 })),
      rewrites: plan.index_rewrites.map((rewrite) => ({
        path: rewrite.path,
        archived_sha256: rewrite.after_sha256,
        restored_sha256: rewrite.before_sha256,
        snapshot_path: rewrite.snapshot_path,
        snapshot_bytes: rewrite.before_bytes,
      })),
      result_manifest_path: plan.rollback.result_path,
      rollback_command_template: plan.rollback.command_template,
      rollback_result: "pending-operator-action",
      permanent_deletion_occurred: false,
    });
    const rollbackBuffer = Buffer.from(jsonText(rollback), "utf8");
    const snapshotBytes = plan.index_rewrites.reduce((total, rewrite) => total + rewrite.before_bytes, 0);
    const rewriteOutputBytes = plan.index_rewrites.reduce((total, rewrite) => total + rewrite.after_bytes, 0);
    const receiptPath = `.okf/archive/receipts/${plan.archive_id}.json`;
    const receipt = {
      version: RECEIPT_VERSION,
      outcome: "completed",
      archive_id: plan.archive_id,
      run_id: request.run_id,
      root: request.root,
      revision: request.revision,
      applied_at: new Date().toISOString(),
      applied_by: approved.operator,
      approval_ref: approved.approvalRef,
      reason: approved.reason,
      plan_manifest_path: manifestPath,
      plan_manifest_hash: plan.manifest_hash,
      plan_file_sha256: secondRead.sha256,
      rollback_manifest_path: rollbackPath,
      rollback_manifest_hash: rollback.manifest_hash,
      archived_items: plan.items.map((item) => ({ source_path: item.source_path, destination_path: item.destination_path, bytes: item.bytes, sha256: item.sha256 })),
      index_rewrites: plan.index_rewrites.map((rewrite) => ({ path: rewrite.path, before_sha256: rewrite.before_sha256, after_sha256: rewrite.after_sha256, snapshot_path: rewrite.snapshot_path })),
      created_or_updated_paths: [
        ...plan.items.map((item) => ({ path: item.destination_path, sha256: item.sha256, provenance: item.source_path })),
        ...plan.index_rewrites.map((rewrite) => ({ path: rewrite.path, sha256: rewrite.after_sha256, provenance: rewrite.snapshot_path })),
        ...plan.index_rewrites.map((rewrite) => ({ path: rewrite.snapshot_path, sha256: rewrite.before_sha256, provenance: rewrite.path })),
        { path: rollbackPath, sha256: sha256(rollbackBuffer), provenance: manifestPath },
      ],
      permanent_deletion_occurred: false,
      source_content_rewritten: false,
    };
    const receiptBuffer = Buffer.from(jsonText(receipt), "utf8");
    const reportBase = reportInput({ request, lockToken: handle.lock_token, itemIds, startedAt, inputBytes, generatedBytes: 0, outcome: "completed", reason: "operator-reviewed archive completed", recovery: `Run rollback with ${rollbackPath}`, checkpoint: rollbackPath, mutated: { source: true, knowledge: plan.index_rewrites.length > 0, archive: true } });
    const estimatedBase = rollbackBuffer.length + snapshotBytes + rewriteOutputBytes + receiptBuffer.length;
    const estimatedReport = measureRunReport(reportBase, { generatedBytes: estimatedBase });
    if (estimatedReport.generated_bytes > request.limits.max_generated_bytes) fail("quota-exceeded:generated-bytes", "archive evidence and snapshots exceed max_generated_bytes");

    generatedBytes += writeOnce(request.root, rollbackPath, rollbackBuffer).bytes;
    for (const rewrite of plan.index_rewrites) {
      const content = currentRewrites.get(rewrite.path).before;
      generatedBytes += writeOnce(request.root, rewrite.snapshot_path, content).bytes;
    }
    updateLock(request.root, handle, { phase: "archive-moving", checkpoint: rollbackPath });
    const token = createCancellationToken({ deadlineAt: startedAt + request.limits.max_runtime_seconds * 1000 });
    for (const item of plan.items) {
      observeRunCancellation(request.root, request.run_id, token);
      if (token.isCancelled()) fail(token.reason(), "archive cancelled before the next atomic move");
      const source = resolveContainedPath(request.root, item.source_path);
      const destination = resolveControlPath(request.root, item.destination_path);
      mkdirSync(dirname(destination.full), { recursive: true });
      renameSync(source.full, destination.full);
      movedCount += 1;
    }
    updateLock(request.root, handle, { phase: "archive-indexes", checkpoint: rollbackPath });
    for (const rewrite of plan.index_rewrites) {
      observeRunCancellation(request.root, request.run_id, token);
      if (token.isCancelled()) fail(token.reason(), "archive cancelled before the next index rewrite");
      generatedBytes += atomicRewrite(request.root, rewrite.path, currentRewrites.get(rewrite.path).after).bytes;
      rewriteCount += 1;
    }
    generatedBytes += writeOnce(request.root, receiptPath, receiptBuffer).bytes;
    const report = writeRunReport(request.root, request, reportInput({ request, lockToken: handle.lock_token, itemIds, startedAt, inputBytes, generatedBytes, outcome: "completed", reason: "operator-reviewed archive completed", recovery: `Run rollback with ${rollbackPath}`, checkpoint: rollbackPath, mutated: { source: true, knowledge: rewriteCount > 0, archive: true } }), { generatedBytes });
    generatedBytes = report.generated_bytes;
    if (!releaseLock(request.root, handle, report.path)) fail("lock-release-failed", "terminal archive report was written but the mutation lock could not be released");
    return Object.freeze({
      ...receipt,
      receipt_path: receiptPath,
      run_report_path: report.path,
      prior_run_report_path: report.prior_path,
      generated_bytes: generatedBytes,
    });
  } catch (error) {
    const outcome = terminalOutcome(error);
    try {
      const recovery = rollbackPath ? `Review and run ${rollbackPath}; ${movedCount} item move(s) completed before failure.` : "Review the retained lock and source paths; no rollback manifest was durable.";
      const report = writeRunReport(request.root, request, reportInput({ request, lockToken: handle.lock_token, itemIds, startedAt, inputBytes, generatedBytes, outcome, reason: error.code ?? error.message ?? "archive-failed", recovery, checkpoint: rollbackPath, mutated: { source: movedCount > 0, knowledge: rewriteCount > 0, archive: movedCount > 0 } }), { generatedBytes });
      releaseLock(request.root, handle, report.path);
    } catch {
      // Fail closed: an unreportable terminal state intentionally retains lock.
    }
    throw error;
  }
}

/** Restore every archived item and snapshotted index without deleting evidence. */
export function rollbackArchive(input) {
  const approved = authority(input, { approval: true });
  const manifestPath = rollbackManifestPath(input.rollback_manifest_path);
  const rootInfo = validateRoot(input.root);
  const firstRead = readJson(rootInfo.root, manifestPath);
  const rollback = validateRollbackShape(firstRead.value, rootInfo.root, input.revision);
  const archiveId = archiveIdentifier(rollback.archive_id);
  if (!Array.isArray(rollback.moves) || rollback.moves.length === 0 || rollback.moves.length > input.max_items) fail("quota-exceeded:items", "rollback moves are empty or exceed max_items");
  const runId = `rollback-${archiveId}-${sha256(`${approved.operatorRequest}\0${approved.approvalRef}`).slice(0, 12)}`;
  const moveAllowlist = rollback.moves.map((move) => {
    const source = resolveContainedPath(rootInfo.root, move.source_path, { optional: true });
    const archived = resolveContainedPath(rootInfo.root, move.archive_path, { optional: true });
    if (source.exists && archived.exists) fail("rollback-source-state-ambiguous", `both source and archive exist for ${move.source_path}`);
    if (!source.exists && !archived.exists) fail("rollback-source-state-missing", `neither source nor archive exists for ${move.source_path}`);
    return source.exists ? move.source_path : move.archive_path;
  });
  const allowlist = [manifestPath, ...moveAllowlist, ...rollback.rewrites.flatMap((rewrite) => [rewrite.path, rewrite.snapshot_path])];
  const request = validateRunRequest(requestInput(input, { runId, allowlist }));
  const handle = acquireLock(request.root, request, { identity: approved.operator });
  if (!handle.acquired) fail(handle.code ?? "lock-exists", "rollback mutation lock could not be acquired");
  const startedAt = Date.now();
  let movedCount = 0;
  let rewriteCount = 0;
  let generatedBytes = 0;
  let inputBytes = firstRead.bytes;
  try {
    validateRunRequest(requestInput(input, { runId, allowlist }), { activeLock: handle });
    const secondRead = readJson(request.root, manifestPath);
    const reviewed = validateRollbackShape(secondRead.value, request.root, request.revision);
    if (secondRead.sha256 !== firstRead.sha256 || reviewed.manifest_hash !== rollback.manifest_hash) fail("manifest-drift", "rollback manifest changed while acquiring the lock");
    updateLock(request.root, handle, { phase: "archive-rollback-preflight", plan_hash: rollback.manifest_hash });
    inputBytes = secondRead.bytes;
    const moveStates = new Map();
    for (const move of rollback.moves) {
      directInboxPath(move.source_path);
      const source = resolveContainedPath(request.root, move.source_path, { optional: true });
      const archived = resolveContainedPath(request.root, move.archive_path, { optional: true });
      if (source.exists && archived.exists) fail("rollback-source-state-ambiguous", `both source and archive exist for ${move.source_path}`);
      if (!source.exists && !archived.exists) fail("rollback-source-state-missing", `neither source nor archive exists for ${move.source_path}`);
      const current = source.exists ? source : archived;
      const stat = lstatSync(current.full);
      const content = readFileSync(current.full);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== move.bytes || sha256(content) !== move.sha256) fail("rollback-archive-drift", `recoverable source changed: ${current.path}`);
      inputBytes += stat.size;
      moveStates.set(move.source_path, source.exists ? "already-source" : "restore-from-archive");
    }
    const restores = new Map();
    for (const rewrite of rollback.rewrites) {
      const target = resolveContainedPath(request.root, rewrite.path);
      const snapshot = resolveContainedPath(request.root, rewrite.snapshot_path);
      const current = readFileSync(target.full);
      const original = readFileSync(snapshot.full);
      const currentHash = sha256(current);
      if (![rewrite.archived_sha256, rewrite.restored_sha256].includes(currentHash) || sha256(original) !== rewrite.restored_sha256 || original.length !== rewrite.snapshot_bytes) {
        fail("rollback-index-drift", `rollback index or snapshot changed: ${rewrite.path}`);
      }
      inputBytes += current.length + original.length;
      restores.set(rewrite.path, Object.freeze({ content: original, required: currentHash !== rewrite.restored_sha256 }));
    }
    if (inputBytes > request.limits.max_input_bytes) fail("quota-exceeded:input-bytes", "rollback inputs exceed max_input_bytes");
    const resultPath = rollback.result_manifest_path;
    const result = {
      version: ROLLBACK_RESULT_VERSION,
      outcome: "completed",
      archive_id: archiveId,
      run_id: runId,
      root: request.root,
      revision: request.revision,
      rolled_back_at: new Date().toISOString(),
      rolled_back_by: approved.operator,
      approval_ref: approved.approvalRef,
      reason: approved.reason,
      rollback_manifest_path: manifestPath,
      rollback_manifest_hash: rollback.manifest_hash,
      restored_items: rollback.moves.map((move) => ({ source_path: move.source_path, from_archive_path: move.archive_path, bytes: move.bytes, sha256: move.sha256, action: moveStates.get(move.source_path) })),
      restored_indexes: rollback.rewrites.map((rewrite) => ({ path: rewrite.path, restored_sha256: rewrite.restored_sha256, snapshot_path: rewrite.snapshot_path, action: restores.get(rewrite.path).required ? "restored-from-snapshot" : "already-restored" })),
      rollback_result: "tested-completed",
      permanent_deletion_occurred: false,
      retained_evidence: [manifestPath, rollback.source_plan_path, ...rollback.rewrites.map((rewrite) => rewrite.snapshot_path)],
    };
    const resultBuffer = Buffer.from(jsonText(result), "utf8");
    const plannedRestoreMoves = [...moveStates.values()].filter((state) => state === "restore-from-archive").length;
    const plannedIndexRestores = [...restores.values()].filter((state) => state.required).length;
    const reportBase = reportInput({ request, lockToken: handle.lock_token, itemIds: rollback.moves.map((move) => move.source_path), startedAt, inputBytes, generatedBytes: 0, outcome: "completed", reason: "operator-reviewed archive rollback completed", recovery: "No recovery required; archive manifests and snapshots remain retained.", checkpoint: manifestPath, mutated: { source: plannedRestoreMoves > 0, knowledge: plannedIndexRestores > 0, archive: plannedRestoreMoves > 0 } });
    const restoreOutputBytes = rollback.rewrites.filter((rewrite) => restores.get(rewrite.path).required).reduce((total, rewrite) => total + rewrite.snapshot_bytes, 0);
    const estimated = measureRunReport(reportBase, { generatedBytes: resultBuffer.length + restoreOutputBytes });
    if (estimated.generated_bytes > request.limits.max_generated_bytes) fail("quota-exceeded:generated-bytes", "rollback result evidence exceeds max_generated_bytes");

    const token = createCancellationToken({ deadlineAt: startedAt + request.limits.max_runtime_seconds * 1000 });
    updateLock(request.root, handle, { phase: "archive-rollback-moving", checkpoint: manifestPath });
    for (const move of rollback.moves) {
      if (moveStates.get(move.source_path) === "already-source") continue;
      observeRunCancellation(request.root, request.run_id, token);
      if (token.isCancelled()) fail(token.reason(), "rollback cancelled before the next atomic move");
      const archived = resolveContainedPath(request.root, move.archive_path);
      const source = resolveControlPath(request.root, move.source_path);
      renameSync(archived.full, source.full);
      movedCount += 1;
    }
    updateLock(request.root, handle, { phase: "archive-rollback-indexes", checkpoint: manifestPath });
    for (const rewrite of rollback.rewrites) {
      if (!restores.get(rewrite.path).required) continue;
      observeRunCancellation(request.root, request.run_id, token);
      if (token.isCancelled()) fail(token.reason(), "rollback cancelled before the next index restore");
      generatedBytes += atomicRewrite(request.root, rewrite.path, restores.get(rewrite.path).content).bytes;
      rewriteCount += 1;
    }
    generatedBytes += writeOnce(request.root, resultPath, resultBuffer).bytes;
    const report = writeRunReport(request.root, request, reportInput({ request, lockToken: handle.lock_token, itemIds: rollback.moves.map((move) => move.source_path), startedAt, inputBytes, generatedBytes, outcome: "completed", reason: "operator-reviewed archive rollback completed", recovery: "No recovery required; archive manifests and snapshots remain retained.", checkpoint: manifestPath, mutated: { source: movedCount > 0, knowledge: rewriteCount > 0, archive: movedCount > 0 } }), { generatedBytes });
    generatedBytes = report.generated_bytes;
    if (!releaseLock(request.root, handle, report.path)) fail("lock-release-failed", "terminal rollback report was written but the mutation lock could not be released");
    return Object.freeze({
      ...result,
      result_manifest_path: resultPath,
      run_report_path: report.path,
      prior_run_report_path: report.prior_path,
      generated_bytes: generatedBytes,
    });
  } catch (error) {
    const outcome = terminalOutcome(error);
    try {
      const report = writeRunReport(request.root, request, reportInput({ request, lockToken: handle.lock_token, itemIds: rollback.moves.map((move) => move.source_path), startedAt, inputBytes, generatedBytes, outcome, reason: error.code ?? error.message ?? "rollback-failed", recovery: `Review ${manifestPath}; ${movedCount} restore move(s) completed before failure.`, checkpoint: manifestPath, mutated: { source: movedCount > 0, knowledge: rewriteCount > 0, archive: movedCount > 0 } }), { generatedBytes });
      releaseLock(request.root, handle, report.path);
    } catch {
      // Fail closed: an unreportable terminal state intentionally retains lock.
    }
    throw error;
  }
}

export function formatArchivePlan(plan) {
  return [
    `OKF inbox archive dry run: ${plan.items.length} selected item(s)`,
    `root: ${plan.root}`,
    `revision: ${plan.revision}`,
    `archive id: ${plan.archive_id}`,
    `save reviewed JSON as: ${plan.recommended_manifest_path}`,
    "source changes: none",
    "permanent deletion: unsupported",
  ].join("\n");
}

export function formatArchiveResult(result) {
  return [
    `OKF inbox archive ${result.outcome}: ${result.archive_id}`,
    `root: ${result.root}`,
    `revision: ${result.revision}`,
    `report: ${result.run_report_path}`,
    `permanent deletion: no`,
  ].join("\n");
}
