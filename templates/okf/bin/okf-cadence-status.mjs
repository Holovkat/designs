#!/usr/bin/env node
import { cadenceStatus } from "../lib/cadence.mjs";

function usage() {
  return "Usage: okf-cadence-status.mjs --root <absolute-root> --checkpoint <sprint-checkpoint|epic-close|manual-review> --operator-request <text> [--as-of <RFC3339>] [--format text|json]";
}

function parse(argv) {
  const result = { format: "text" };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!["--root", "--checkpoint", "--operator-request", "--as-of", "--format"].includes(key) || index + 1 >= argv.length) throw new Error("arguments-invalid");
    result[key.slice(2).replaceAll("-", "_")] = argv[index + 1];
    index += 1;
  }
  if (!result.root || !result.checkpoint || !result.operator_request || !["text", "json"].includes(result.format)) throw new Error("arguments-invalid");
  return result;
}

try {
  const args = parse(process.argv.slice(2));
  const report = cadenceStatus(args.root, { checkpoint: args.checkpoint, operatorRequest: args.operator_request, asOf: args.as_of });
  if (args.format === "json") console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`OKF cadence checkpoint: ${report.checkpoint}`);
    console.log(`recommendation: ${report.recommendation}`);
    console.log(`pending: ${report.status.pending.count}`);
    console.log("automatic execution: no");
  }
} catch (error) {
  console.error(`${usage()}\n${error.code ?? error.message}`);
  process.exitCode = 2;
}
