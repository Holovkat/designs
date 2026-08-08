#!/usr/bin/env node
import {
  applyArchive,
  buildArchivePlan,
  formatArchivePlan,
  formatArchiveResult,
  rollbackArchive,
} from "../lib/inbox-archive.mjs";

function usage() {
  return [
    "Usage:",
    "  okf-inbox-archive.mjs plan --root <absolute-physical-root> --revision <full-sha> --operator <identity> --operator-request <text> --reason <text> --archive-id <id> --select <knowledge/inbox/item.md> [--select ...] <limits> [--as-of <RFC3339-UTC>] [--format text|json]",
    "  okf-inbox-archive.mjs apply --root <absolute-physical-root> --revision <full-sha> --operator <identity> --operator-request <text> --approval-ref <ref> --reason <text> --manifest <.okf/archive/plans/id.json> <limits> [--format text|json]",
    "  okf-inbox-archive.mjs rollback --root <absolute-physical-root> --revision <full-sha> --operator <identity> --operator-request <text> --approval-ref <ref> --reason <text> --rollback-manifest <.okf/archive/rollbacks/id.json> <limits> [--format text|json]",
    "  <limits> = --max-items <n> --max-input-bytes <n> --max-generated-bytes <n> --max-runtime-seconds <n> --max-sessions 1",
    "",
    "The plan subcommand is read-only and emits the dry-run manifest. Save the reviewed JSON at its recommended path before apply. Permanent deletion is not implemented.",
  ].join("\n");
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(usage());
  process.exit(args.length === 0 ? 2 : 0);
}

const command = args.shift();
if (!["plan", "apply", "rollback"].includes(command)) {
  console.error(usage());
  process.exit(2);
}

const repeated = new Map([["--select", []]]);
const values = {};
const allowed = new Set([
  "--root", "--revision", "--operator", "--operator-request", "--reason", "--archive-id", "--select",
  "--as-of", "--approval-ref", "--manifest", "--rollback-manifest", "--max-items", "--max-input-bytes",
  "--max-generated-bytes", "--max-runtime-seconds", "--max-sessions", "--format",
]);
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (!allowed.has(flag) || index + 1 >= args.length) {
    console.error(usage());
    process.exit(2);
  }
  const value = args[++index];
  if (repeated.has(flag)) repeated.get(flag).push(value);
  else if (flag in values) {
    console.error(usage());
    process.exit(2);
  } else values[flag] = value;
}

const requiredCommon = [
  "--root", "--revision", "--operator", "--operator-request", "--reason", "--max-items", "--max-input-bytes",
  "--max-generated-bytes", "--max-runtime-seconds", "--max-sessions",
];
const requiredByCommand = {
  plan: ["--archive-id"],
  apply: ["--approval-ref", "--manifest"],
  rollback: ["--approval-ref", "--rollback-manifest"],
};
const format = values["--format"] ?? (command === "plan" ? "json" : "text");
if (
  requiredCommon.some((flag) => !values[flag])
  || requiredByCommand[command].some((flag) => !values[flag])
  || (command === "plan" && repeated.get("--select").length === 0)
  || !["text", "json"].includes(format)
) {
  console.error(usage());
  process.exit(2);
}

function integer(flag) {
  const value = Number(values[flag]);
  return Number.isSafeInteger(value) ? value : Number.NaN;
}

const input = {
  root: values["--root"],
  revision: values["--revision"],
  operator: values["--operator"],
  operator_request: values["--operator-request"],
  reason: values["--reason"],
  approval_ref: values["--approval-ref"],
  archive_id: values["--archive-id"],
  selected_paths: repeated.get("--select"),
  as_of: values["--as-of"],
  manifest_path: values["--manifest"],
  rollback_manifest_path: values["--rollback-manifest"],
  max_items: integer("--max-items"),
  max_input_bytes: integer("--max-input-bytes"),
  max_generated_bytes: integer("--max-generated-bytes"),
  max_runtime_seconds: integer("--max-runtime-seconds"),
  max_sessions: integer("--max-sessions"),
};

try {
  const result = command === "plan" ? buildArchivePlan(input) : command === "apply" ? applyArchive(input) : rollbackArchive(input);
  const text = command === "plan" ? formatArchivePlan(result) : formatArchiveResult(result);
  console.log(format === "json" ? JSON.stringify(result, null, 2) : text);
} catch (error) {
  console.error(`okf-inbox-archive: ${error.code ?? "failed"}`);
  process.exit(1);
}
