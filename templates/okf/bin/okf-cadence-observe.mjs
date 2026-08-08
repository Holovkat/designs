#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { observeCadence } from "../lib/cadence.mjs";
import { resolveContainedPath, validateRoot } from "../lib/run-guard.mjs";

function usage() {
  return "Usage: okf-cadence-observe.mjs --root <absolute-root> --manifest <root-relative-json> [--format text|json]";
}

function parse(argv) {
  const result = { format: "text" };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!["--root", "--manifest", "--format"].includes(key) || index + 1 >= argv.length) throw new Error("arguments-invalid");
    result[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  if (!result.root || !result.manifest || !["text", "json"].includes(result.format)) throw new Error("arguments-invalid");
  return result;
}

try {
  const args = parse(process.argv.slice(2));
  const root = validateRoot(args.root);
  const manifest = resolveContainedPath(root.root, args.manifest);
  const report = observeCadence(JSON.parse(readFileSync(manifest.full, "utf8")), { evidenceRoot: root.root });
  if (args.format === "json") console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`OKF cadence observation: ${report.passed ? "passed" : "failed"}`);
    console.log(`samples: ${report.sample_count}`);
    console.log(`violations: ${report.violations.length}`);
  }
  if (!report.passed) process.exitCode = 1;
} catch (error) {
  console.error(`${usage()}\n${error.code ?? error.message}`);
  process.exitCode = 2;
}
