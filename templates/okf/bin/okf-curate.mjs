#!/usr/bin/env node
import { requestCancellation } from "../lib/run-control.mjs";
import { assertFreshCurationRun, estimateCurationGeneratedBytes, executeCuration, formatCurationResult } from "../lib/curation-executor.mjs";
import { readCurationProposal, validateCurationProposal } from "../lib/curation-proposal.mjs";
import { validateCurationPreflight } from "../lib/curation-validation.mjs";
import { assertRevision, validateRoot } from "../lib/run-guard.mjs";
import { readLock } from "../lib/run-lock.mjs";
import { validateRunPlan } from "../lib/run-plan.mjs";

function usage() {
  return [
    "Usage:",
    "  okf-curate.mjs --check-only --root <physical-root> --revision <sha> --operator-identity <id> --operator-request <text> --run-id <id> --proposal <root-relative-json> (--select <knowledge/inbox/item.md> [--select ...] | --select-none) --max-items <n> --max-input-bytes <n> --max-generated-bytes <n> --max-runtime-seconds <n> --max-sessions 1 [--format text|json]",
    "  okf-curate.mjs --execute [same arguments] [--resume] [--format text|json]",
    "  okf-curate.mjs --cancel --root <physical-root> --revision <sha> --run-id <id> --operator-identity <id> --reason <text> [--format text|json]",
  ].join("\n");
}

const args = process.argv.slice(2);
const values = {};
let mode = null;
let resume = false;
const selections = [];
let selectNone = false;
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (["--check-only", "--execute", "--cancel"].includes(flag)) {
    if (mode) { console.error(usage()); process.exit(2); }
    mode = flag.slice(2);
    continue;
  }
  if (flag === "--resume") { resume = true; continue; }
  if (flag === "--select") {
    if (selectNone || index + 1 >= args.length) { console.error(usage()); process.exit(2); }
    selections.push(args[++index]);
    continue;
  }
  if (flag === "--select-none") {
    if (selectNone || selections.length > 0) { console.error(usage()); process.exit(2); }
    selectNone = true;
    continue;
  }
  if (!["--root", "--revision", "--operator-identity", "--operator-request", "--run-id", "--proposal", "--max-items", "--max-input-bytes", "--max-generated-bytes", "--max-runtime-seconds", "--max-sessions", "--reason", "--format"].includes(flag) || index + 1 >= args.length) {
    console.error(usage()); process.exit(2);
  }
  values[flag] = args[++index];
}

const format = values["--format"] ?? "text";
if (!mode || !["text", "json"].includes(format) || (resume && mode !== "execute")) {
  console.error(usage()); process.exit(2);
}

function required(...flags) {
  return flags.every((flag) => typeof values[flag] === "string" && values[flag].length > 0);
}

function integer(flag) {
  return Number(values[flag]);
}

try {
  if (mode === "cancel") {
    if (!required("--root", "--revision", "--run-id", "--operator-identity", "--reason")) { console.error(usage()); process.exit(2); }
    const root = validateRoot(values["--root"]);
    assertRevision(root.root, values["--revision"]);
    const lock = readLock(root.root);
    if (!lock || lock.run_id !== values["--run-id"]) throw Object.assign(new Error("no matching active run lock"), { code: "cancel-run-not-active" });
    const result = requestCancellation(root.root, values["--run-id"], { requestedBy: values["--operator-identity"], reason: values["--reason"] });
    console.log(format === "json" ? JSON.stringify({ outcome: "cancellation-requested", ...result }, null, 2) : `Cancellation requested: ${result.path}`);
    process.exit(0);
  }

  const executionFlags = ["--root", "--revision", "--operator-identity", "--operator-request", "--run-id", "--proposal", "--max-items", "--max-input-bytes", "--max-generated-bytes", "--max-runtime-seconds", "--max-sessions"];
  if (!required(...executionFlags) || (selections.length === 0 && !selectNone)) { console.error(usage()); process.exit(2); }
  const input = {
    root: values["--root"], revision: values["--revision"], operator_identity: values["--operator-identity"], operator_request: values["--operator-request"],
    run_id: values["--run-id"], proposal_path: values["--proposal"], resume,
    selected_items: selections,
    max_items: integer("--max-items"), max_input_bytes: integer("--max-input-bytes"), max_generated_bytes: integer("--max-generated-bytes"),
    max_runtime_seconds: integer("--max-runtime-seconds"), max_sessions: integer("--max-sessions"),
  };
  if (mode === "check-only") {
    const plan = validateRunPlan({
      trigger: "operator", operator_identity: input.operator_identity, operator_request: input.operator_request, root: input.root, revision: input.revision, run_id: input.run_id,
      inbox_path: "knowledge/inbox", selected_items: input.selected_items, allowlist: ["knowledge"], extra_inputs: [input.proposal_path],
      max_items: input.max_items, max_input_bytes: input.max_input_bytes, max_generated_bytes: input.max_generated_bytes,
      max_runtime_seconds: input.max_runtime_seconds, max_sessions: input.max_sessions,
    });
    assertFreshCurationRun(plan.root, plan.run_id);
    const proposal = validateCurationProposal(plan, readCurationProposal(plan.root, input.proposal_path));
    const preflight = validateCurationPreflight(plan.root, plan.items.map((item) => item.path));
    const projectedGeneratedBytes = estimateCurationGeneratedBytes(plan, proposal, { preflight });
    const result = {
      version: "okf-curation-dry-run/1", check_only: true, permitted: preflight.ok,
      plan: { run_id: plan.run_id, root: plan.root, revision: plan.revision, plan_hash: plan.plan_hash, limits: plan.limits, selection_mode: plan.selection_mode, input_bytes: plan.input_bytes, control_input_bytes: plan.control_input_bytes, candidate_count: plan.candidate_count, selection_truncated: plan.selection_truncated, items: plan.items },
      proposal: { path: proposal.proposal_path, sha256: proposal.proposal_sha256, output_count: proposal.outputs.length, output_bytes: proposal.output_bytes, projected_generated_bytes: projectedGeneratedBytes },
      validation: { preflight, generated_strict_validation: "required-during-repository-local-staging-before-upsert" },
      mutation: false,
    };
    console.log(format === "json" ? JSON.stringify(result, null, 2) : `${result.permitted ? "permitted" : "blocked"}: ${plan.items.length} item(s), ${proposal.outputs.length} output(s)`);
    process.exit(result.permitted ? 0 : 1);
  }

  const result = executeCuration(input);
  console.log(formatCurationResult(result, format));
  process.exit(result.outcome === "completed" ? 0 : 1);
} catch (error) {
  const result = { outcome: "blocked", code: error.code ?? "curation-failed", message: error.message };
  console.log(format === "json" ? JSON.stringify(result, null, 2) : `blocked: ${result.code}: ${result.message}`);
  process.exit(1);
}
