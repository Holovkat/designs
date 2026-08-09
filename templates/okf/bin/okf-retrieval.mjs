#!/usr/bin/env node
import { buildRetrievalIndex, loadRetrievalIndex, queryRetrievalIndex, writeRetrievalIndex } from "../lib/retrieval-index.mjs";

function usage() {
  return "Usage: okf-retrieval.mjs build --root <absolute-root> [--index <relative.json>] [--check-only] | query --root <absolute-root> [--index <relative.json>] [--id <id>] [--term <text>] [--kind <kind>] [--type <type>] [--lifecycle <status>] [--assertion <state>] [--evidence <text>] [--relationship <predicate[=target]>] [--top-k <n>] [--max-bytes <n>]";
}

const args = process.argv.slice(2);
const command = args.shift();
let root = null;
let indexPath = ".okf/cache/okf-retrieval-index.json";
let checkOnly = false;
const selectors = { terms: [], relationships: [] };
for (let position = 0; position < args.length; position += 1) {
  const flag = args[position];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (flag === "--check-only") { checkOnly = true; continue; }
  if (position + 1 >= args.length) { console.error(usage()); process.exit(2); }
  const value = args[++position];
  if (flag === "--root") root = value;
  else if (flag === "--index") indexPath = value;
  else if (flag === "--id") selectors.id = value;
  else if (flag === "--term") selectors.terms.push(value);
  else if (flag === "--kind") selectors.record_kind = value;
  else if (flag === "--type") selectors.type = value;
  else if (flag === "--lifecycle") selectors.lifecycle = value;
  else if (flag === "--assertion") selectors.assertion_state = value;
  else if (flag === "--evidence") selectors.evidence = value;
  else if (flag === "--relationship") selectors.relationships.push(value);
  else if (flag === "--top-k") selectors.top_k = Number(value);
  else if (flag === "--max-bytes") selectors.max_bytes = Number(value);
  else { console.error(usage()); process.exit(2); }
}
if (!root || !["build", "query"].includes(command)) { console.error(usage()); process.exit(2); }

try {
  if (command === "build") {
    const result = checkOnly ? buildRetrievalIndex(root) : writeRetrievalIndex(root, indexPath);
    console.log(JSON.stringify(result, null, 2));
  } else {
    const index = loadRetrievalIndex(root, indexPath);
    console.log(JSON.stringify(queryRetrievalIndex(index, selectors), null, 2));
  }
} catch (error) {
  console.error(`okf-retrieval: ${error.code ?? "failed"}: ${error.message}`);
  process.exit(2);
}
