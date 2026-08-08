#!/usr/bin/env node
import { formatInboxTriage, triageInbox } from "../lib/inbox-triage.mjs";

function usage() {
  return "Usage: okf-inbox-triage.mjs --root <absolute-physical-git-worktree-root> [--as-of <RFC3339-UTC>] [--format text|json]";
}

const args = process.argv.slice(2);
let root = null;
let asOf = null;
let format = "text";
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (!["--root", "--as-of", "--format"].includes(flag) || index + 1 >= args.length) {
    console.error(usage());
    process.exit(2);
  }
  const value = args[++index];
  if (flag === "--root") root = value;
  if (flag === "--as-of") asOf = value;
  if (flag === "--format") format = value;
}

if (!root || !["text", "json"].includes(format)) {
  console.error(usage());
  process.exit(2);
}

try {
  const report = triageInbox(root, { asOf });
  console.log(format === "json" ? JSON.stringify(report, null, 2) : formatInboxTriage(report));
} catch (error) {
  console.error(`okf-inbox-triage: ${error.code ?? "failed"}`);
  process.exit(1);
}
