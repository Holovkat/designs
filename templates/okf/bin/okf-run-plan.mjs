#!/usr/bin/env node
import { validateRunPlan } from "../lib/run-plan.mjs";

function usage() {
  return "Usage: okf-run-plan.mjs --check-only --root <physical-repository-root> --revision <full-git-sha> --operator-request <text> [--select <knowledge/inbox/item.md> ...] --max-items <n> --max-input-bytes <n> --max-generated-bytes <n> --max-runtime-seconds <n> --max-sessions 1 [--format text|json]";
}

const args = process.argv.slice(2);
const values = {};
let checkOnly = false;
const selections = [];
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (flag === "--check-only") { checkOnly = true; continue; }
  if (flag === "--select") {
    if (index + 1 >= args.length) { console.error(usage()); process.exit(2); }
    selections.push(args[++index]);
    continue;
  }
  if (!["--root", "--revision", "--operator-request", "--max-items", "--max-input-bytes", "--max-generated-bytes", "--max-runtime-seconds", "--max-sessions", "--format"].includes(flag) || index + 1 >= args.length) {
    console.error(usage()); process.exit(2);
  }
  values[flag] = args[++index];
}
if (!checkOnly || !values["--root"] || !values["--revision"] || !values["--operator-request"] || !values["--max-items"] || !values["--max-input-bytes"] || !values["--max-generated-bytes"] || !values["--max-runtime-seconds"] || !values["--max-sessions"] || ![undefined, "text", "json"].includes(values["--format"])) {
  console.error(usage()); process.exit(2);
}
const format = values["--format"] ?? "text";
const number = (flag) => Number(values[flag]);
try {
  const plan = validateRunPlan({
    trigger: "operator", operator_request: values["--operator-request"], root: values["--root"], revision: values["--revision"], inbox_path: "knowledge/inbox", selected_items: selections.length > 0 ? selections : undefined, max_sessions: number("--max-sessions"),
    max_items: number("--max-items"), max_input_bytes: number("--max-input-bytes"), max_generated_bytes: number("--max-generated-bytes"), max_runtime_seconds: number("--max-runtime-seconds"),
  });
  const result = { version: "okf-run-plan/1", check_only: true, permitted: true, code: null, plan, kill_switch: plan.control.kill_switch, lock: plan.control.lock };
  console.log(format === "json" ? JSON.stringify(result, null, 2) : "permitted");
} catch (error) {
  const result = { version: "okf-run-plan/1", check_only: true, permitted: false, code: error.code ?? "preflight-failed", message: error.message };
  console.log(format === "json" ? JSON.stringify(result, null, 2) : `blocked: ${result.code}`);
  process.exit(1);
}
