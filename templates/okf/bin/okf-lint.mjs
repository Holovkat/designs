#!/usr/bin/env node
import { resolve } from "node:path";
import { formatText, lintBundle } from "../lib/lint.mjs";

function usage() {
  return "Usage: okf-lint.mjs --root <repository-root> [--mode strict|legacy] [--format text|json] [--fail-on error|none]";
}

const args = process.argv.slice(2);
let root = null;
let mode = "legacy";
let format = "text";
let failOn = "error";
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") {
    console.log(usage());
    process.exit(0);
  }
  if (!["--root", "--mode", "--format", "--fail-on"].includes(flag) || index + 1 >= args.length) {
    console.error(usage());
    process.exit(2);
  }
  const value = args[++index];
  if (flag === "--root") root = value;
  if (flag === "--mode") mode = value;
  if (flag === "--format") format = value;
  if (flag === "--fail-on") failOn = value;
}
if (!root || !["strict", "legacy"].includes(mode) || !["text", "json"].includes(format) || !["error", "none"].includes(failOn)) {
  console.error(usage());
  process.exit(2);
}

try {
  const result = lintBundle(resolve(root), { mode });
  console.log(format === "json" ? JSON.stringify(result, null, 2) : formatText(result));
  if (failOn === "error" && result.diagnostics.some(({ severity }) => severity === "error")) process.exit(1);
} catch (error) {
  console.error(`okf-lint: ${error.message}`);
  process.exit(2);
}
