import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { RunGuardError, resolveContainedPath } from "./run-guard.mjs";

const CONCEPT_DIRECTORIES = Object.freeze(["architecture", "components", "domain", "decisions", "deprecation", "process", "state"]);
const CONCEPT_PATH = new RegExp(`^knowledge/(?:${CONCEPT_DIRECTORIES.join("|")})/[a-z0-9][a-z0-9._-]*\\.md$`);
const INDEX_PATH = new RegExp(`^knowledge/(?:inbox|${CONCEPT_DIRECTORIES.join("|")})/index\\.md$`);

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hashBytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hashFile(path) {
  return hashBytes(readFileSync(path));
}

function outputKind(path) {
  if (CONCEPT_PATH.test(path) && !path.endsWith("/index.md")) return "concept";
  if (path === "knowledge/index.md" || path === "knowledge/log.md" || INDEX_PATH.test(path)) return "maintenance";
  return null;
}

function requireSortedUnique(values, code, label) {
  if (!Array.isArray(values)) fail(code, `${label} must be an array`);
  const sorted = [...new Set(values)].sort(compare);
  if (sorted.length !== values.length || sorted.some((value, index) => value !== values[index])) {
    fail(code, `${label} must be unique and deterministically sorted`);
  }
}

function currentTarget(root, path) {
  const target = resolveContainedPath(root, path, { optional: true });
  if (!target.exists) return Object.freeze({ ...target, sha256: null });
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("proposal-target-not-file", `proposal target must be a regular file: ${path}`);
  return Object.freeze({ ...target, sha256: hashFile(target.full) });
}

function validateExpectedTarget(root, output, { allowApplied = false, runId = null, proposedHash = output.sha256 } = {}) {
  const current = currentTarget(root, output.path);
  let retainedTarget = null;
  if (!current.exists && allowApplied && runId && output.expected_sha256 !== null) {
    retainedTarget = currentTarget(root, `.okf/staging/${runId}/backups/${output.path}`);
  }
  const alreadyApplied = allowApplied && current.exists && current.sha256 === proposedHash;
  if (current.exists && output.expected_sha256 !== current.sha256 && !alreadyApplied) {
    fail("proposal-target-drift", `expected hash does not match current target: ${output.path}`);
  }
  if (!current.exists && output.expected_sha256 !== null && (!retainedTarget?.exists || retainedTarget.sha256 !== output.expected_sha256)) {
    fail("proposal-target-drift", `new target must declare expected_sha256 as null: ${output.path}`);
  }
  if (output.replaces_path) {
    if (!CONCEPT_PATH.test(output.replaces_path) || output.replaces_path.endsWith("/index.md") || output.replaces_path === output.path) {
      fail("proposal-replacement-invalid", `replacement source is not an approved concept path: ${output.replaces_path}`);
    }
    const replacement = currentTarget(root, output.replaces_path);
    let retainedReplacement = null;
    if (!replacement.exists && allowApplied && runId) {
      retainedReplacement = currentTarget(root, `.okf/staging/${runId}/backups/${output.replaces_path}`);
    }
    if ((!replacement.exists || replacement.sha256 !== output.expected_replaces_sha256)
      && (!retainedReplacement?.exists || retainedReplacement.sha256 !== output.expected_replaces_sha256)) {
      fail("proposal-replacement-drift", `replacement source hash does not match: ${output.replaces_path}`);
    }
  }
}

export function processedPathFor(sourcePath) {
  return `knowledge/inbox/processed/${basename(sourcePath)}`;
}

export function readCurationProposal(root, proposalPath) {
  const target = resolveContainedPath(root, proposalPath);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("proposal-not-regular-file", "proposal must be one repository-local regular JSON file");
  const raw = readFileSync(target.full);
  let proposal;
  try {
    proposal = JSON.parse(raw.toString("utf8"));
  } catch {
    fail("proposal-json-invalid", "proposal must contain valid JSON");
  }
  return Object.freeze({ path: target.path, bytes: stat.size, sha256: hashBytes(raw), proposal });
}

export function validateCurationProposal(plan, proposalInput, { allowApplied = false } = {}) {
  const approvedInput = (plan.extra_inputs ?? []).find((item) => item.path === proposalInput.path);
  if (!approvedInput || approvedInput.sha256 !== proposalInput.sha256 || approvedInput.bytes !== proposalInput.bytes) {
    fail("proposal-not-in-plan", "proposal hash and size must be part of the approved run plan");
  }
  const proposal = proposalInput.proposal;
  if (!proposal || Array.isArray(proposal) || proposal.version !== "okf-curation-proposal/1") {
    fail("proposal-version-invalid", "proposal version must be okf-curation-proposal/1");
  }
  if (proposal.run_id !== plan.run_id || proposal.revision !== plan.revision) {
    fail("proposal-identity-mismatch", "proposal run_id and revision must match the approved plan");
  }
  if (typeof proposal.expected_outcome !== "string" || proposal.expected_outcome.trim() === "" || typeof proposal.recovery_plan !== "string" || proposal.recovery_plan.trim() === "") {
    fail("proposal-recovery-missing", "proposal must state an expected outcome and recovery plan");
  }
  if (proposal.expected_outcome.trim().length > 1_024 || proposal.recovery_plan.trim().length > 2_048) {
    fail("proposal-recovery-too-long", "proposal expected_outcome and recovery_plan must fit their bounded report fields");
  }
  if (!Array.isArray(proposal.items)) fail("proposal-items-invalid", "proposal items must be an array");
  requireSortedUnique(proposal.items.map((item) => item?.path), "proposal-items-order", "proposal item paths");
  const plannedItems = plan.items.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 }));
  if (JSON.stringify(proposal.items) !== JSON.stringify(plannedItems)) {
    fail("proposal-items-mismatch", "proposal items must exactly match the deterministic run plan");
  }
  if (!Array.isArray(proposal.outputs) || proposal.outputs.length === 0) fail("proposal-outputs-missing", "proposal must contain at least one output");
  requireSortedUnique(proposal.outputs.map((output) => output?.path), "proposal-outputs-order", "proposal output paths");
  const itemPaths = new Set(plannedItems.map((item) => item.path));
  const conceptCoverage = new Set();
  const replacementPaths = new Set();
  let outputBytes = 0;
  const outputs = proposal.outputs.map((output) => {
    const kind = outputKind(output?.path);
    if (!kind) fail("proposal-output-path", `output path is not approved for curation: ${output?.path ?? "<missing>"}`);
    if (typeof output.content !== "string" || output.content.length === 0) fail("proposal-output-content", `output content must be non-empty: ${output.path}`);
    if (!(output.expected_sha256 === null || (typeof output.expected_sha256 === "string" && /^[0-9a-f]{64}$/i.test(output.expected_sha256)))) {
      fail("proposal-expected-hash", `output must declare a full expected hash or null: ${output.path}`);
    }
    requireSortedUnique(output.source_items, "proposal-source-items-order", `source_items for ${output.path}`);
    if ((itemPaths.size > 0 && output.source_items.length === 0)
      || (itemPaths.size === 0 && output.source_items.length !== 0)
      || output.source_items.some((item) => !itemPaths.has(item))) {
      fail("proposal-source-items-invalid", `output source_items must reference only the selected inbox batch: ${output.path}`);
    }
    if (kind === "concept") for (const item of output.source_items) conceptCoverage.add(item);
    if (output.replaces_path != null) {
      if (replacementPaths.has(output.replaces_path)) fail("proposal-replacement-duplicate", `replacement source appears twice: ${output.replaces_path}`);
      replacementPaths.add(output.replaces_path);
      if (typeof output.expected_replaces_sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(output.expected_replaces_sha256)) {
        fail("proposal-replacement-hash", `replacement source requires a full expected hash: ${output.path}`);
      }
    } else if ("expected_replaces_sha256" in output) {
      fail("proposal-replacement-hash", `unexpected replacement hash without replaces_path: ${output.path}`);
    }
    const bytes = Buffer.byteLength(output.content, "utf8");
    const proposedHash = hashBytes(Buffer.from(output.content, "utf8"));
    validateExpectedTarget(plan.root, output, { allowApplied, runId: plan.run_id, proposedHash });
    outputBytes += bytes;
    return Object.freeze({ ...output, kind, bytes, sha256: proposedHash });
  });
  for (const item of itemPaths) if (!conceptCoverage.has(item)) fail("proposal-item-uncovered", `selected item has no concept output: ${item}`);
  for (const output of outputs) if (replacementPaths.has(output.path)) fail("proposal-path-conflict", `output path is also a replacement source: ${output.path}`);

  const requiredMaintenance = new Set(["knowledge/index.md", "knowledge/inbox/index.md", "knowledge/log.md"]);
  for (const output of outputs.filter(({ kind }) => kind === "concept")) {
    requiredMaintenance.add(`${output.path.slice(0, output.path.lastIndexOf("/"))}/index.md`);
    if (output.replaces_path) requiredMaintenance.add(`${output.replaces_path.slice(0, output.replaces_path.lastIndexOf("/"))}/index.md`);
  }
  const outputPaths = new Set(outputs.map((output) => output.path));
  for (const path of requiredMaintenance) if (!outputPaths.has(path)) fail("proposal-maintenance-missing", `proposal must update ${path}`);

  return Object.freeze({
    version: proposal.version,
    run_id: proposal.run_id,
    revision: proposal.revision,
    expected_outcome: proposal.expected_outcome.trim(),
    recovery_plan: proposal.recovery_plan.trim(),
    items: Object.freeze(plannedItems.map(Object.freeze)),
    outputs: Object.freeze(outputs),
    output_bytes: outputBytes,
    proposal_path: proposalInput.path,
    proposal_sha256: proposalInput.sha256,
  });
}

export function assertProposalTargets(root, proposal, { allowApplied = false } = {}) {
  for (const output of proposal.outputs) validateExpectedTarget(root, output, { allowApplied, runId: proposal.run_id });
  return true;
}

export function isConceptOutput(path) {
  return outputKind(path) === "concept";
}
