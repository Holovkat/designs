#!/usr/bin/env node
import { formatQueryText, QueryError, queryBundle } from "../lib/query.mjs";

function usage() {
  return [
    "Usage: okf-query.mjs --root <absolute-repository-root> [selectors] [term ...]",
    "",
    "Selectors:",
    "  --decisions                         Search decisions/ and deprecation/ only",
    "  --relationship <predicate[=id]>     Match a typed predicate, optionally to one target",
    "  --related-to <id>                   Match any typed predicate to one target",
    "  --assertion-state <state>            Match assertion state (or legacy-unspecified)",
    "  --evidence <pattern>                 Match evidence_refs with a case-insensitive regex",
    "  --has-evidence                       Require at least one evidence reference",
    "  --status <status>                    Match lifecycle status (or legacy-unspecified)",
    "  --lifecycle <status>                 Alias for --status",
    "  --validation-status <status>         strict, legacy-compatible, retained-nonconformant",
    "  --format <text|json>                 Output format (default: text)",
    "",
    "Multiple values in one selector category are ORed; relationship selectors are ANDed.",
    "Positional terms retain the portable search path's case-insensitive extended-regex OR semantics.",
  ].join("\n");
}

function usageError(message) {
  console.error(`okf-query: ${message}`);
  console.error(usage());
  process.exit(2);
}

const args = process.argv.slice(2);
let root = null;
let format = "text";
let decisionsOnly = false;
let hasEvidence = false;
let positionalOnly = false;
const assertionStates = [];
const evidence = [];
const relationships = [];
const statuses = [];
const terms = [];
const validationStatuses = [];

const valueFlags = new Set([
  "--assertion-state",
  "--evidence",
  "--format",
  "--lifecycle",
  "--related-to",
  "--relationship",
  "--root",
  "--status",
  "--validation-status",
]);

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (positionalOnly) {
    terms.push(argument);
    continue;
  }
  if (argument === "--") {
    positionalOnly = true;
    continue;
  }
  if (argument === "--help") {
    console.log(usage());
    process.exit(0);
  }
  if (argument === "--decisions") {
    decisionsOnly = true;
    continue;
  }
  if (argument === "--has-evidence") {
    hasEvidence = true;
    continue;
  }
  if (valueFlags.has(argument)) {
    if (index + 1 >= args.length) usageError(`${argument} requires a value`);
    const value = args[++index];
    if (argument === "--root") {
      if (root !== null) usageError("--root may be supplied only once");
      root = value;
    } else if (argument === "--format") {
      format = value;
    } else if (argument === "--relationship") {
      relationships.push(value);
    } else if (argument === "--related-to") {
      relationships.push(`*=${value}`);
    } else if (argument === "--assertion-state") {
      assertionStates.push(value);
    } else if (argument === "--evidence") {
      evidence.push(value);
    } else if (argument === "--status" || argument === "--lifecycle") {
      statuses.push(value);
    } else if (argument === "--validation-status") {
      validationStatuses.push(value);
    }
    continue;
  }
  if (argument.startsWith("-")) usageError(`unknown option: ${argument}`);
  terms.push(argument);
}

if (root === null) usageError("--root is required for semantic queries");
if (!root.startsWith("/")) usageError("--root must be an absolute path");
if (!["json", "text"].includes(format)) usageError("--format must be text or json");

try {
  const result = await queryBundle(root, {
    assertionStates,
    decisionsOnly,
    evidence,
    hasEvidence,
    relationships,
    statuses,
    terms,
    validationStatuses,
  });
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.count === 0) {
    console.log("No concepts match the selected query.");
    console.log("Check knowledge/index.md for available groups, or broaden the selectors.");
  } else {
    console.log(formatQueryText(result));
  }
  if (result.count === 0) process.exit(1);
} catch (error) {
  if (error instanceof QueryError || typeof error.code === "string") {
    console.error(`okf-query: ${error.code ?? "query-failed"}: ${error.message}`);
  } else {
    console.error(`okf-query: query-failed: ${error.message}`);
  }
  process.exit(2);
}
