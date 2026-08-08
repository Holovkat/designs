#!/usr/bin/env node
import { formatScheduledResult, runScheduledCuration } from "../lib/scheduled-curation.mjs";

function usage() {
  return "Usage: okf-scheduled-curate.mjs --run --root <absolute-physical-git-worktree-root> --config <root-relative-json> [--format text|json]";
}

const args = process.argv.slice(2);
const values = {};
let run = false;
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") {
    console.log(usage());
    process.exit(0);
  }
  if (flag === "--run") {
    if (run) {
      console.error(usage());
      process.exit(2);
    }
    run = true;
    continue;
  }
  if (!["--root", "--config", "--format"].includes(flag) || index + 1 >= args.length || values[flag] != null) {
    console.error(usage());
    process.exit(2);
  }
  values[flag] = args[++index];
}

const format = values["--format"] ?? "text";
if (!run || !values["--root"] || !values["--config"] || !["text", "json"].includes(format)) {
  console.error(usage());
  process.exit(2);
}

const result = await runScheduledCuration({ root: values["--root"], configPath: values["--config"] });
console.log(formatScheduledResult(result, format));
process.exit(["completed", "disabled", "no-action"].includes(result.outcome) ? 0 : 1);
