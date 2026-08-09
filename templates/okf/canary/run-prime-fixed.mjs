#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { runPrimeFixedCanary, validatePrimeRunManifest } from "./prime-broker.mjs";

function usage() {
  return "Usage: run-prime-fixed.mjs --manifest <absolute.json> --prompt <absolute.txt> [--check-only]";
}

const args = process.argv.slice(2);
let manifestPath = null;
let promptPath = null;
let checkOnly = false;
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (flag === "--check-only") { checkOnly = true; continue; }
  if (!["--manifest", "--prompt"].includes(flag) || index + 1 >= args.length) { console.error(usage()); process.exit(2); }
  const value = args[++index];
  if (flag === "--manifest") manifestPath = value;
  if (flag === "--prompt") promptPath = value;
}
if (!manifestPath || !promptPath) { console.error(usage()); process.exit(2); }

try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const prompt = readFileSync(promptPath, "utf8");
  const checked = validatePrimeRunManifest(manifest, { requireRealApproval: true });
  if (checkOnly) {
    console.log(JSON.stringify({ status: "checked", run_id: checked.run_id, mode: checked.mode }, null, 2));
  } else {
    const result = await runPrimeFixedCanary({ manifest, prompt });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(`okf-prime-fixed: ${error.code ?? "failed"}: ${error.message}`);
  process.exit(2);
}
