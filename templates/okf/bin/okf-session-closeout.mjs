#!/usr/bin/env node
import { publicSessionCloseoutPlan, writeSessionCloseout } from "../lib/session-closeout.mjs";

function usage() {
  return "Usage: okf-session-closeout.mjs --root <absolute-git-worktree-root> --change-set <repository-relative.change.json> [--write]";
}

const args = process.argv.slice(2);
let root = null;
let changeSet = null;
let write = false;
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") {
    console.log(usage());
    process.exit(0);
  }
  if (flag === "--write") {
    write = true;
    continue;
  }
  if (!["--root", "--change-set"].includes(flag) || index + 1 >= args.length) {
    console.error(usage());
    process.exit(2);
  }
  const value = args[++index];
  if (flag === "--root") root = value;
  if (flag === "--change-set") changeSet = value;
}

if (!root || !changeSet) {
  console.error(usage());
  process.exit(2);
}

try {
  const result = write ? writeSessionCloseout(root, changeSet) : publicSessionCloseoutPlan(root, changeSet);
  console.log(JSON.stringify(result, null, 2));
  if (result.pending_capture_ids.length > 0) process.exitCode = 3;
} catch (error) {
  console.error(`okf-session-closeout: ${error.code ?? "failed"}: ${error.message}`);
  process.exit(2);
}
