#!/usr/bin/env node
import { formatInboxStatus, inboxStatus } from "../lib/inbox-status.mjs";

function usage() {
  return "Usage: okf-inbox-status.mjs --root <absolute-git-worktree-root> [--format text|json] [--as-of <RFC3339-UTC>]";
}

const args = process.argv.slice(2);
let root = null;
let format = "text";
let asOf = null;
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (!["--root", "--format", "--as-of"].includes(flag) || index + 1 >= args.length) {
    console.error(usage()); process.exit(2);
  }
  const value = args[++index];
  if (flag === "--root") root = value;
  if (flag === "--format") format = value;
  if (flag === "--as-of") asOf = value;
}
if (!root || !["text", "json"].includes(format)) {
  console.error(usage());
  process.exit(2);
}
try {
  const report = inboxStatus(root, { asOf });
  console.log(format === "json" ? JSON.stringify(report, null, 2) : formatInboxStatus(report));
} catch (error) {
  console.error(`okf-inbox-status: ${error.code ?? "failed"}`);
  process.exit(2);
}
