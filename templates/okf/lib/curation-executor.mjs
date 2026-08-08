import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { canResume, markProcessed, measureCheckpoint, readCheckpoint, writeCheckpoint } from "./run-checkpoint.mjs";
import { createCancellationToken, observeRunCancellation } from "./run-control.mjs";
import { assertRevision, resolveContainedPath, resolveControlPath } from "./run-guard.mjs";
import { acquireLock, releaseLock, updateLock } from "./run-lock.mjs";
import { validateRunPlan, validateRunRequest } from "./run-plan.mjs";
import { formatReport, measureRunReport, writeRunReport } from "./run-report.mjs";
import { assertProposalTargets, processedPathFor, readCurationProposal, validateCurationProposal } from "./curation-proposal.mjs";
import { validateCurationPostflight, validateCurationPreflight, validateCurationStaging } from "./curation-validation.mjs";

class CurationStop extends Error {
  constructor(code, message, outcome = "failed", recovery = "Review the bounded report and submit a new explicit run or resume request.") {
    super(message);
    this.code = code;
    this.outcome = outcome;
    this.recovery = recovery;
  }
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function stateFor(root, path, { control = false } = {}) {
  const target = control ? resolveControlPath(root, path) : resolveContainedPath(root, path, { optional: true });
  if (!existsSync(target.full)) return Object.freeze({ ...target, exists: false, sha256: null });
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new CurationStop("path-not-regular-file", `Expected a regular file at ${path}.`, "blocked");
  return Object.freeze({ ...target, exists: true, bytes: stat.size, sha256: hashFile(target.full) });
}

function ensureParent(target) {
  mkdirSync(dirname(target.full), { recursive: true });
}

function shadowPath(runId, outputPath) {
  return `.okf/staging/${runId}/shadow/${outputPath}`;
}

function backupPath(runId, outputPath) {
  return `.okf/staging/${runId}/backups/${outputPath}`;
}

function failedPath(runId, outputPath) {
  return `.okf/staging/${runId}/failed/${outputPath}`;
}

function failedAttemptPath(runId, lockToken, outputPath) {
  return `.okf/staging/${runId}/failed-attempts/${lockToken}/${outputPath}`;
}

function outcomeForReason(reason) {
  if (reason?.startsWith("quota-exceeded")) return "quota-exceeded";
  if (reason?.startsWith("operator-cancelled") || reason?.startsWith("kill-switch") || reason?.startsWith("cancellation-") || reason === "signal-interrupt") return "cancelled";
  return "failed";
}

function recoveryFor(outcome, reason) {
  if (outcome === "cancelled") return "Inspect the checkpoint and retained sources, then submit an explicit --resume request after clearing the cancellation condition.";
  if (outcome === "quota-exceeded") return "Inspect the bounded report; choose a new explicit plan with reviewed ceilings. No automatic retry is permitted.";
  if (reason === "postflight-validation-failed" || reason === "staging-validation-failed") return "Review the retained staged or failed outputs and diagnostics; correct the proposal and create a new dry-run plan.";
  return "Review the bounded report, retained proposal, sources, and partial outputs before a new explicit request.";
}

function reportInput(plan, progress, state, { outcome, reason, recovery, elapsedSeconds }) {
  return {
    run_id: plan.run_id,
    operator_identity: plan.operator_identity,
    operator_request: plan.operator_request,
    root: plan.root,
    revision: plan.revision,
    allowlist: plan.allowlist,
    item_ids: plan.items.map((item) => item.path),
    limits: plan.limits,
    lock_state: outcome === "running" ? "acquired" : "terminal-recorded-release-pending",
    lock_token: state.lockToken ?? null,
    phase: progress.phase,
    elapsed_seconds: elapsedSeconds,
    input_bytes: plan.input_bytes,
    control_input_bytes: plan.control_input_bytes ?? 0,
    selection_mode: plan.selection_mode,
    candidate_count: plan.candidate_count,
    selection_truncated: plan.selection_truncated,
    generated_bytes: progress.generated_bytes ?? 0,
    sessions_active: outcome === "running" ? 1 : 0,
    sessions_max: 1,
    last_checkpoint: state.lastCheckpoint ?? null,
    outcome,
    reason,
    recovery_instruction: recovery,
    expected_outcome: state.proposal?.expected_outcome ?? null,
    proposal_recovery_plan: state.proposal?.recovery_plan ?? null,
    proposal: state.proposal ? { path: state.proposal.proposal_path, sha256: state.proposal.proposal_sha256 } : null,
    validation: {
      preflight_ok: state.preflight?.ok ?? null,
      preflight_findings: state.preflight?.diagnostics.length ?? 0,
      staging_ok: state.staging?.ok ?? null,
      staging_findings: state.staging?.diagnostics.length ?? 0,
      postflight_ok: state.postflight?.ok ?? null,
      postflight_findings: state.postflight?.diagnostics.length ?? 0,
    },
    changes: {
      proposed_outputs: state.proposal?.outputs.map(({ path, sha256 }) => ({ path, sha256 })) ?? [],
      applied_outputs: [...new Set(progress.applied_output_paths ?? [])].sort(),
      failed_outputs: [...new Set(state.failedOutputs ?? [])].sort(),
      moved_items: [...new Set(progress.moved_item_ids ?? [])].sort(),
      completed_items: [...new Set(progress.completed_item_ids ?? [])].sort(),
      untouched_items: plan.items.map((item) => item.path).filter((path) => !(progress.completed_item_ids ?? []).includes(path)),
    },
    mutated: {
      source: (progress.moved_item_ids ?? []).length > 0,
      knowledge: (progress.applied_output_paths ?? []).length > 0,
      archive: false,
      instructions: false,
    },
  };
}

function projectedBudget(plan, proposal, progress, state, elapsedSeconds) {
  let generated = progress.generated_bytes ?? 0;
  const maximum = {
    ...progress,
    generated_bytes: generated,
    output_hashes: Object.fromEntries(proposal.outputs.flatMap(({ path, sha256 }) => [
      [path, sha256], [shadowPath(plan.run_id, path), sha256],
    ])),
    applied_output_paths: proposal.outputs.map((output) => output.path),
    moved_item_ids: plan.items.map((item) => item.path),
    completed_item_ids: plan.items.map((item) => item.path),
    finalized_items: Object.fromEntries(plan.items.map((item) => [item.path, processedPathFor(item.path)])),
    phase: "completed",
  };
  const maximumFailurePaths = proposal.outputs.flatMap(({ path }) => [
    shadowPath(plan.run_id, path),
    failedPath(plan.run_id, path),
    failedAttemptPath(plan.run_id, state.lockToken ?? "00000000-0000-0000-0000-000000000000", path),
  ]);
  const terminal = reportInput(plan, maximum, { ...state, proposal, failedOutputs: maximumFailurePaths }, {
    outcome: "completed",
    reason: "bounded-curation-complete",
    recovery: "Commit only the reviewed bounded curation output with an okf-curation: subject.",
    elapsedSeconds,
  });
  generated = measureRunReport({ ...terminal, generated_bytes: generated }, { generatedBytes: generated }).generated_bytes;
  generated = measureCheckpoint(plan, { ...maximum, generated_bytes: generated, phase: "preflight" }).generated_bytes;
  for (const output of proposal.outputs) {
    const stage = stateFor(plan.root, shadowPath(plan.run_id, output.path), { control: true });
    if (!stage.exists) generated += output.bytes;
  }
  const checkpoints = proposal.outputs.length + plan.items.length + 4;
  for (let index = 0; index < checkpoints; index += 1) {
    generated = measureCheckpoint(plan, { ...maximum, generated_bytes: generated }).generated_bytes;
  }
  generated = measureRunReport({ ...terminal, generated_bytes: generated }, { generatedBytes: generated }).generated_bytes;
  if (generated > plan.limits.max_generated_bytes) {
    throw new CurationStop("quota-exceeded:generated-bytes", "The declared generated-byte ceiling cannot contain staged output, checkpoints, and terminal evidence.", "quota-exceeded");
  }
  return generated;
}

export function estimateCurationGeneratedBytes(plan, proposal, { preflight = null } = {}) {
  const progress = {
    completed_item_ids: [], moved_item_ids: [], finalized_items: {}, applied_output_paths: [], output_hashes: {}, generated_bytes: 0, phase: "preflight",
  };
  const state = { proposal, preflight, staging: null, postflight: null, lastCheckpoint: null, failedOutputs: [] };
  return projectedBudget(plan, proposal, progress, state, 0);
}

function writeProgressCheckpoint(root, plan, progress, state, phase, options) {
  const checkpoint = writeCheckpoint(root, plan, { ...progress, lock_token: options.lock?.lock_token ?? null, phase, written_at: options.nowIso() });
  progress.generated_bytes = checkpoint.generated_bytes;
  progress.phase = phase;
  state.lastCheckpoint = checkpoint.path;
  updateLock(root, options.lock, { phase, plan_hash: plan.plan_hash, checkpoint: checkpoint.path });
  return checkpoint;
}

function observeCancellation(plan, token) {
  const reason = observeRunCancellation(plan.root, plan.run_id, token);
  if (reason) throw new CurationStop(reason, `Curation stopped at a safe boundary: ${reason}.`, outcomeForReason(reason));
}

function stageOutput(plan, output, progress) {
  const path = shadowPath(plan.run_id, output.path);
  const stage = stateFor(plan.root, path, { control: true });
  if (stage.exists) {
    if (stage.sha256 !== output.sha256) throw new CurationStop("staged-output-drift", `Retained staged output changed: ${path}.`, "blocked");
    progress.output_hashes[path] = stage.sha256;
    return false;
  }
  if ((progress.generated_bytes ?? 0) + output.bytes > plan.limits.max_generated_bytes) {
    throw new CurationStop("quota-exceeded:generated-bytes", `Staging ${output.path} would exceed max_generated_bytes.`, "quota-exceeded");
  }
  const target = resolveControlPath(plan.root, path);
  ensureParent(target);
  writeFileSync(target.full, output.content, { encoding: "utf8", flag: "wx" });
  progress.generated_bytes = (progress.generated_bytes ?? 0) + output.bytes;
  progress.output_hashes[path] = output.sha256;
  return true;
}

function moveToRetained(root, sourcePath, retainedPath, expectedHash, { sourceControl = false } = {}) {
  const source = stateFor(root, sourcePath, { control: sourceControl });
  const retained = stateFor(root, retainedPath, { control: true });
  if (!source.exists) {
    if (retained.exists && retained.sha256 === expectedHash) return false;
    throw new CurationStop("mutation-source-missing", `Neither source nor retained recovery file matches ${sourcePath}.`, "blocked");
  }
  if (source.sha256 !== expectedHash) throw new CurationStop("mutation-source-drift", `Source changed before mutation: ${sourcePath}.`, "blocked");
  if (retained.exists) throw new CurationStop("recovery-path-exists", `Recovery path already exists: ${retainedPath}.`, "blocked");
  const target = resolveControlPath(root, retainedPath);
  ensureParent(target);
  renameSync(source.full, target.full);
  return true;
}

function applyOutput(plan, output, progress) {
  const current = stateFor(plan.root, output.path);
  const replacementBackup = output.replaces_path
    ? stateFor(plan.root, backupPath(plan.run_id, output.replaces_path), { control: true })
    : null;
  if (current.exists && current.sha256 === output.sha256 && !output.replaces_path) {
    if (output.expected_sha256 !== output.sha256) {
      progress.applied_output_paths = [...new Set([...(progress.applied_output_paths ?? []), output.path])].sort();
      progress.output_hashes[output.path] = output.sha256;
    }
    return false;
  }
  progress.applied_output_paths = [...new Set([...(progress.applied_output_paths ?? []), output.path])].sort();
  if (output.replaces_path) {
    moveToRetained(plan.root, output.replaces_path, backupPath(plan.run_id, output.replaces_path), output.expected_replaces_sha256);
  }
  if (current.exists && current.sha256 === output.sha256) {
    if (!replacementBackup?.exists) progress.output_hashes[output.path] = output.sha256;
    return replacementBackup?.exists ?? false;
  }
  if (current.exists) {
    moveToRetained(plan.root, output.path, backupPath(plan.run_id, output.path), output.expected_sha256);
  } else if (output.expected_sha256 !== null) {
    const backup = stateFor(plan.root, backupPath(plan.run_id, output.path), { control: true });
    if (!backup.exists || backup.sha256 !== output.expected_sha256) {
      throw new CurationStop("proposal-target-drift", `Expected target recovery state is absent: ${output.path}.`, "blocked");
    }
  }
  const stage = stateFor(plan.root, shadowPath(plan.run_id, output.path), { control: true });
  if (!stage.exists || stage.sha256 !== output.sha256) throw new CurationStop("staged-output-missing", `Validated staged output is unavailable: ${output.path}.`, "blocked");
  const target = resolveContainedPath(plan.root, output.path, { optional: true });
  ensureParent(target);
  renameSync(stage.full, target.full);
  progress.output_hashes[output.path] = output.sha256;
  return true;
}

function retainFailedOutput(plan, output, progress, state) {
  if (!(progress.applied_output_paths ?? []).includes(output.path)) return;
  const current = stateFor(plan.root, output.path);
  const targetChanged = output.expected_sha256 !== output.sha256;
  if (current.exists && current.sha256 === output.sha256 && targetChanged) {
    const failed = stateFor(plan.root, failedPath(plan.run_id, output.path), { control: true });
    if (!failed.exists) {
      const target = resolveControlPath(plan.root, failedPath(plan.run_id, output.path));
      ensureParent(target);
      renameSync(current.full, target.full);
      state.failedOutputs.push(target.path);
    } else if (failed.sha256 !== output.sha256) {
      throw new CurationStop("failed-output-collision", `Failed-output recovery path differs: ${failed.path}.`, "blocked");
    } else {
      const attempt = resolveControlPath(plan.root, failedAttemptPath(plan.run_id, state.lockToken, output.path));
      ensureParent(attempt);
      if (existsSync(attempt.full)) throw new CurationStop("failed-output-collision", `Failed-attempt recovery path already exists: ${attempt.path}.`, "blocked");
      renameSync(current.full, attempt.full);
      state.failedOutputs.push(attempt.path);
    }
  } else if (current.exists && current.sha256 !== output.expected_sha256) {
    throw new CurationStop("rollback-target-drift", `Cannot restore a target that changed during rollback: ${output.path}.`, "blocked");
  }
  const backup = stateFor(plan.root, backupPath(plan.run_id, output.path), { control: true });
  const restored = stateFor(plan.root, output.path);
  if (backup.exists && restored.exists) throw new CurationStop("rollback-target-ambiguous", `Both target and recovery backup exist: ${output.path}.`, "blocked");
  if (backup.exists && !restored.exists) renameSync(backup.full, restored.full);
  if (output.replaces_path) {
    const replacementBackup = stateFor(plan.root, backupPath(plan.run_id, output.replaces_path), { control: true });
    const replacement = stateFor(plan.root, output.replaces_path);
    if (replacementBackup.exists && replacement.exists) throw new CurationStop("rollback-replacement-ambiguous", `Both replacement source and recovery backup exist: ${output.replaces_path}.`, "blocked");
    if (replacementBackup.exists && !replacement.exists) renameSync(replacementBackup.full, replacement.full);
  }
  progress.applied_output_paths = (progress.applied_output_paths ?? []).filter((path) => path !== output.path);
}

function rollbackOutputs(plan, outputs, progress, state) {
  for (const output of [...outputs].reverse()) retainFailedOutput(plan, output, progress, state);
  for (const output of outputs) {
    const shadow = stateFor(plan.root, shadowPath(plan.run_id, output.path), { control: true });
    if (shadow.exists && shadow.sha256 === output.sha256) state.failedOutputs.push(shadow.path);
  }
  state.failedOutputs = [...new Set(state.failedOutputs)].sort();
}

function moveInboxSource(plan, item, progress) {
  const source = stateFor(plan.root, item.path);
  const destinationPath = processedPathFor(item.path);
  const destination = stateFor(plan.root, destinationPath);
  if (source.exists && destination.exists) throw new CurationStop("inbox-finalization-ambiguous", `Both pending and processed source exist: ${item.path}.`, "blocked");
  if (destination.exists) {
    if (destination.sha256 !== item.sha256) throw new CurationStop("processed-source-drift", `Processed source hash changed: ${destinationPath}.`, "blocked");
  } else {
    if (!source.exists || source.sha256 !== item.sha256) throw new CurationStop("inbox-source-drift", `Inbox source changed before finalization: ${item.path}.`, "blocked");
    const target = resolveContainedPath(plan.root, destinationPath, { optional: true });
    ensureParent(target);
    renameSync(source.full, target.full);
  }
  progress.moved_item_ids = [...new Set([...(progress.moved_item_ids ?? []), item.path])].sort();
  progress.finalized_items[item.path] = destinationPath;
}

function restoreInboxSources(plan, progress) {
  for (const item of [...plan.items].reverse()) {
    if (!(progress.moved_item_ids ?? []).includes(item.path)) continue;
    const source = stateFor(plan.root, item.path);
    const destinationPath = processedPathFor(item.path);
    const destination = stateFor(plan.root, destinationPath);
    if (source.exists && destination.exists) {
      throw new CurationStop("inbox-rollback-ambiguous", `Both pending and processed source exist during rollback: ${item.path}.`, "blocked");
    }
    if (!source.exists) {
      if (!destination.exists || destination.sha256 !== item.sha256) {
        throw new CurationStop("inbox-rollback-source-drift", `Processed source cannot be restored safely: ${destinationPath}.`, "blocked");
      }
      const target = resolveContainedPath(plan.root, item.path, { optional: true });
      ensureParent(target);
      renameSync(destination.full, target.full);
    } else if (source.sha256 !== item.sha256) {
      throw new CurationStop("inbox-rollback-source-drift", `Pending source changed during rollback: ${item.path}.`, "blocked");
    }
    progress.moved_item_ids = (progress.moved_item_ids ?? []).filter((path) => path !== item.path);
    progress.completed_item_ids = (progress.completed_item_ids ?? []).filter((path) => path !== item.path);
    delete progress.finalized_items[item.path];
  }
}

function normalizeRequest(input) {
  return {
    trigger: "operator",
    operator_identity: input.operator_identity,
    operator_request: input.operator_request,
    root: input.root,
    revision: input.revision,
    run_id: input.run_id,
    selected_items: input.selected_items,
    inbox_path: "knowledge/inbox",
    allowlist: ["knowledge"],
    extra_inputs: [input.proposal_path],
    max_items: input.max_items,
    max_input_bytes: input.max_input_bytes,
    max_generated_bytes: input.max_generated_bytes,
    max_runtime_seconds: input.max_runtime_seconds,
    max_sessions: input.max_sessions,
  };
}

export function assertFreshCurationRun(root, runId) {
  for (const path of [`.okf/checkpoints/${runId}.json`, `.okf/reports/${runId}.json`, `.okf/staging/${runId}`]) {
    const target = resolveControlPath(root, path);
    if (existsSync(target.full)) throw new CurationStop("run-artifacts-exist", `Run identifier already has retained artifacts: ${path}.`, "blocked", "Use an explicit verified resume or choose a new run identifier; never overwrite recovery evidence.");
  }
  return true;
}

/**
 * Execute one explicit, bounded, proposal-driven curation batch. This function
 * never generates semantic content, starts another session, retries, accesses
 * a network, deletes a source, or writes AGENTS.md. The operator-authored
 * proposal is the only mutation manifest.
 */
export function executeCuration(input, overrides = {}) {
  if (typeof input?.operator_identity !== "string" || input.operator_identity.trim() === "") {
    throw new CurationStop("operator-identity-missing", "An explicit operator identity is required for mutation.", "blocked");
  }
  if (!Array.isArray(input.selected_items)) {
    throw new CurationStop("selection-required", "Mutation requires an explicit selected_items dataset; use an empty array only for a reviewed audit-only proposal.", "blocked");
  }
  const options = {
    now: overrides.now ?? (() => Date.now()),
    nowIso: overrides.nowIso ?? (() => new Date().toISOString()),
    validatePreflight: overrides.validatePreflight ?? validateCurationPreflight,
    validateStaging: overrides.validateStaging ?? validateCurationStaging,
    validatePostflight: overrides.validatePostflight ?? validateCurationPostflight,
    fault: overrides.fault ?? (() => {}),
  };
  const requestInput = normalizeRequest(input);
  const request = validateRunRequest(requestInput);
  if (!request.run_id) throw new CurationStop("run-id-required", "An explicit run_id is required for mutation.", "blocked");
  if (!input.resume) {
    try { assertFreshCurationRun(request.root, request.run_id); }
    catch (error) { return Object.freeze({ outcome: error.outcome ?? "blocked", reason: error.code ?? error.message, report: null, lock_released: null }); }
  }
  let requestedResumeCheckpoint = null;
  if (input.resume) {
    requestedResumeCheckpoint = readCheckpoint(request.root, request.run_id);
    if (!requestedResumeCheckpoint || requestedResumeCheckpoint.malformed) {
      return Object.freeze({ outcome: "blocked", reason: "resume-missing-checkpoint", report: null, lock_released: null });
    }
    if (requestedResumeCheckpoint.outcome === "completed") {
      return Object.freeze({ outcome: "blocked", reason: "resume-already-complete", report: null, lock_released: null });
    }
  }
  const preliminary = { ...request, plan_hash: null };
  const lock = acquireLock(request.root, preliminary, { identity: input.operator_identity, now: options.nowIso });
  if (!lock.acquired) return Object.freeze({ outcome: "blocked", reason: lock.code, lock: lock.existing ?? null, report: null });
  options.lock = lock;
  const startedAt = options.now();
  const token = overrides.cancellationToken ?? createCancellationToken({ deadlineAt: startedAt + request.limits.max_runtime_seconds * 1000, now: options.now });
  const signal = () => token.requestCancel("signal-interrupt");
  process.once("SIGINT", signal);
  process.once("SIGTERM", signal);
  let plan = { ...preliminary, items: Object.freeze([]), extra_inputs: Object.freeze([]), input_bytes: 0, control_input_bytes: 0, plan_hash: null };
  const progress = {
    completed_item_ids: [], moved_item_ids: [], finalized_items: {}, applied_output_paths: [], output_hashes: {}, generated_bytes: 0, phase: "preflight",
  };
  const state = { proposal: null, preflight: null, staging: null, postflight: null, lastCheckpoint: null, failedOutputs: [], lockToken: lock.lock_token };
  let resumeAccepted = false;
  let freshAccepted = Boolean(input.resume);

  const elapsed = () => Math.max(0, Math.floor((options.now() - startedAt) / 1000));
  const terminal = (outcome, reason, recovery = recoveryFor(outcome, reason)) => {
    progress.phase = outcome;
    progress.outcome = outcome;
    progress.reason = reason;
    if ((input.resume && !resumeAccepted) || (!input.resume && !freshAccepted)) {
      const attemptKind = input.resume ? "resume-blocked" : "fresh-blocked";
      const attemptPath = `.okf/reports/${plan.run_id}.${attemptKind}-${lock.lock_token.slice(0, 12)}.json`;
      const reportData = reportInput(plan, progress, state, { outcome, reason, recovery, elapsedSeconds: elapsed() });
      try {
        const written = writeRunReport(plan.root, plan, reportData, { generatedBytes: progress.generated_bytes, reportPath: attemptPath });
        const released = releaseLock(plan.root, lock, written.path);
        return Object.freeze({ outcome, reason, report: written.report, report_path: written.path, checkpoint: state.lastCheckpoint, lock_released: released });
      } catch (reportError) {
        updateLock(plan.root, lock, { phase: "resume-block-report-failed" });
        return Object.freeze({ outcome: "failed", reason: reportError.message, report: null, checkpoint: state.lastCheckpoint, lock_released: false });
      }
    }
    let checkpoint;
    try {
      checkpoint = writeProgressCheckpoint(plan.root, plan, progress, state, outcome, options);
    } catch (checkpointError) {
      updateLock(plan.root, lock, { phase: "terminal-record-failed" });
      return Object.freeze({ outcome: "failed", reason: checkpointError.message, report: null, lock_released: false });
    }
    const reportData = reportInput(plan, progress, state, { outcome, reason, recovery, elapsedSeconds: elapsed() });
    let written;
    try {
      written = writeRunReport(plan.root, plan, reportData, { generatedBytes: progress.generated_bytes });
      progress.generated_bytes = written.generated_bytes;
    } catch (reportError) {
      updateLock(plan.root, lock, { phase: "terminal-report-failed", checkpoint: checkpoint.path });
      return Object.freeze({ outcome: "failed", reason: reportError.message, report: null, checkpoint: checkpoint.path, lock_released: false });
    }
    const released = releaseLock(plan.root, lock, written.path);
    return Object.freeze({ outcome, reason, report: written.report, report_path: written.path, checkpoint: checkpoint.path, lock_released: released });
  };

  try {
    if (!input.resume) {
      assertFreshCurationRun(request.root, request.run_id);
      freshAccepted = true;
    }
    let resumeCheckpoint = requestedResumeCheckpoint;
    if (resumeCheckpoint) {
      const priorReport = stateFor(request.root, `.okf/reports/${request.run_id}.json`, { control: true });
      if (priorReport.exists) {
        try {
          const recorded = JSON.parse(readFileSync(priorReport.full, "utf8"));
          if (Number.isSafeInteger(recorded.generated_bytes) && recorded.generated_bytes >= resumeCheckpoint.generated_bytes) {
            resumeCheckpoint = Object.freeze({ ...resumeCheckpoint, generated_bytes: recorded.generated_bytes });
          }
        } catch {
          throw new CurationStop("resume-report-invalid", "Explicit resume requires the prior bounded report to remain readable.", "blocked");
        }
      }
      progress.generated_bytes = resumeCheckpoint.generated_bytes;
      state.lastCheckpoint = `.okf/checkpoints/${request.run_id}.json`;
    }
    plan = validateRunPlan(requestInput, { activeLock: lock, resumeCheckpoint });
    updateLock(plan.root, lock, { phase: "planned", plan_hash: plan.plan_hash });
    if (resumeCheckpoint) {
      const resume = canResume(resumeCheckpoint, plan);
      if (!resume.ok) throw new CurationStop(resume.code, `Resume blocked by plan drift: ${(resume.changed ?? []).join(", ")}.`, "blocked");
      Object.assign(progress, {
        completed_item_ids: [...(resumeCheckpoint.completed_item_ids ?? [])],
        moved_item_ids: [...(resumeCheckpoint.moved_item_ids ?? [])],
        finalized_items: { ...(resumeCheckpoint.finalized_items ?? {}) },
        applied_output_paths: [...(resumeCheckpoint.applied_output_paths ?? [])],
        output_hashes: { ...(resumeCheckpoint.output_hashes ?? {}) },
        generated_bytes: resumeCheckpoint.generated_bytes,
        phase: "resumed",
      });
      state.lastCheckpoint = `.okf/checkpoints/${plan.run_id}.json`;
    }
    const proposalInput = readCurationProposal(plan.root, input.proposal_path);
    state.proposal = validateCurationProposal(plan, proposalInput, { allowApplied: Boolean(resumeCheckpoint) });
    assertProposalTargets(plan.root, state.proposal, { allowApplied: Boolean(resumeCheckpoint) });
    state.preflight = options.validatePreflight(plan.root, Object.values(plan.resume_locations));
    if (!state.preflight.ok) throw new CurationStop("preflight-validation-failed", "Selected inbox input failed C2-compatible preflight validation.", "blocked");
    observeCancellation(plan, token);
    projectedBudget(plan, state.proposal, progress, state, elapsed());
    observeCancellation(plan, token);
    resumeAccepted = Boolean(resumeCheckpoint);
    writeProgressCheckpoint(plan.root, plan, progress, state, "preflight-validated", options);
    const running = reportInput(plan, progress, state, {
      outcome: "running", reason: "bounded-run-in-progress", recovery: "If interrupted, retain the lock and resume only from the verified checkpoint.", elapsedSeconds: elapsed(),
    });
    const progressReport = writeRunReport(plan.root, plan, running, { generatedBytes: progress.generated_bytes });
    progress.generated_bytes = progressReport.generated_bytes;
    observeCancellation(plan, token);

    for (const output of state.proposal.outputs) {
      assertRevision(plan.root, plan.revision);
      observeCancellation(plan, token);
      stageOutput(plan, output, progress);
    }
    writeProgressCheckpoint(plan.root, plan, progress, state, "outputs-staged", options);
    options.fault("after-staging", { plan, progress, state });
    const shadowRoot = resolveControlPath(plan.root, `.okf/staging/${plan.run_id}/shadow`).full;
    const concepts = state.proposal.outputs.filter(({ kind }) => kind === "concept");
    const maintenance = state.proposal.outputs.filter(({ kind }) => kind === "maintenance");
    const conceptPaths = concepts.map(({ path }) => path);
    const maintenancePaths = maintenance.map(({ path }) => path);
    const validationContext = { itemPaths: plan.items.map(({ path }) => path), revision: plan.revision };
    state.staging = options.validateStaging(shadowRoot, conceptPaths, maintenancePaths, validationContext);
    if (!state.staging.ok) {
      state.failedOutputs = state.proposal.outputs.map(({ path }) => shadowPath(plan.run_id, path));
      throw new CurationStop("staging-validation-failed", "Generated concept or maintenance output failed strict validation before upsert.", "failed");
    }
    observeCancellation(plan, token);

    try {
      for (const output of state.proposal.outputs) {
        assertRevision(plan.root, plan.revision);
        observeCancellation(plan, token);
        applyOutput(plan, output, progress);
        const phase = output.kind === "concept" ? "concept" : "maintenance";
        writeProgressCheckpoint(plan.root, plan, progress, state, `${phase}-upsert:${output.path}`, options);
        options.fault(`after-${phase}-upsert`, { output, plan, progress, state });
      }
      state.postflight = options.validatePostflight(plan.root, conceptPaths, maintenancePaths, validationContext);
      if (!state.postflight.ok) throw new CurationStop("postflight-validation-failed", "Changed concept or maintenance output failed strict postflight validation; inbox finalization was not advanced.", "failed");
      observeCancellation(plan, token);
      writeProgressCheckpoint(plan.root, plan, progress, state, "postflight-validated", options);
      for (const item of plan.items) {
        assertRevision(plan.root, plan.revision);
        observeCancellation(plan, token);
        moveInboxSource(plan, item, progress);
        writeProgressCheckpoint(plan.root, plan, progress, state, `source-retained:${item.path}`, options);
        options.fault("after-source-move", { item, plan, progress, state });
      }
      observeCancellation(plan, token);
      for (const item of plan.items) {
        const next = markProcessed(progress, item.path, { postflightOk: state.postflight.ok, persistedOk: true, finalizedTo: processedPathFor(item.path) });
        Object.assign(progress, next);
      }
      writeProgressCheckpoint(plan.root, plan, progress, state, "persistence-complete", options);
    } catch (error) {
      restoreInboxSources(plan, progress);
      rollbackOutputs(plan, state.proposal.outputs, progress, state);
      throw error;
    }
    return terminal("completed", "bounded-curation-complete", "Review and commit only this bounded output with an okf-curation: subject; no scheduler or retry was created.");
  } catch (error) {
    const reason = error.code ?? error.message ?? "curation-failed";
    const outcome = error.outcome ?? outcomeForReason(reason);
    return terminal(outcome, reason, error.recovery ?? recoveryFor(outcome, reason));
  } finally {
    process.removeListener("SIGINT", signal);
    process.removeListener("SIGTERM", signal);
  }
}

export function formatCurationResult(result, format = "text") {
  if (format === "json") return JSON.stringify(result, null, 2);
  if (result.report) return formatReport(result.report, "text", { reportPath: result.report_path });
  return `OKF curation ${result.outcome}: ${result.reason}`;
}
