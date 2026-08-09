#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatText, lintBundle } from "../lib/lint.mjs";
import { resolveContainedPath, validateRoot } from "../lib/run-guard.mjs";

function usage() {
  return "Usage: okf-lint.mjs --root <physical-git-root> [--profile <root-relative-json>] [--mode legacy|warning|strict-new|strict-bundle|strict] [--baseline <git-commit>] [--strict-path <knowledge/.../record.md> ...] [--format text|json] [--fail-on error|none]";
}

const args = process.argv.slice(2);
let root = null;
let mode = null;
let profilePath = ".okf/profile.json";
let format = "text";
let failOn = "error";
let baseline = null;
const strictPaths = [];
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") {
    console.log(usage());
    process.exit(0);
  }
  if (!["--root", "--profile", "--mode", "--baseline", "--strict-path", "--format", "--fail-on"].includes(flag) || index + 1 >= args.length) {
    console.error(usage());
    process.exit(2);
  }
  const value = args[++index];
  if (flag === "--root") root = value;
  if (flag === "--profile") profilePath = value;
  if (flag === "--mode") mode = value;
  if (flag === "--baseline") baseline = value;
  if (flag === "--strict-path") strictPaths.push(value);
  if (flag === "--format") format = value;
  if (flag === "--fail-on") failOn = value;
}
const modes = new Set(["strict", "legacy", "warning", "strict-new", "strict-bundle"]);
if (!root || (mode !== null && !modes.has(mode)) || !["text", "json"].includes(format) || !["error", "none"].includes(failOn)) {
  console.error(usage());
  process.exit(2);
}

try {
  const rootInfo = validateRoot(resolve(root));
  const target = resolveContainedPath(rootInfo.root, profilePath, { optional: true });
  let profile = { profile: "okf-core/1.0", mode: "legacy", extensions: [] };
  if (existsSync(target.full)) {
    profile = JSON.parse(readFileSync(target.full, "utf8"));
    if (profile?.profile !== "okf-core/1.0" || !modes.has(profile.mode) || !Array.isArray(profile.extensions)) {
      throw new Error("profile config must declare okf-core/1.0, a supported mode, and an extensions array");
    }
  }
  const selectedMode = mode ?? profile.mode;
  const result = lintBundle(rootInfo.root, { mode: selectedMode, strictPaths, extensions: profile.extensions, baseline });
  console.log(format === "json" ? JSON.stringify(result, null, 2) : formatText(result));
  if (failOn === "error" && result.diagnostics.some(({ severity }) => severity === "error")) process.exit(1);
} catch (error) {
  console.error(`okf-lint: ${error.message}`);
  process.exit(2);
}
