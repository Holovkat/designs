#!/usr/bin/env node
/**
 * Fixture-only validator for the OKF Core Application Profile 1.0 schema.
 * It never reads or writes a live knowledge bundle.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemaDir = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(resolve(schemaDir, "okf-core-1.0.schema.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(schemaDir, "fixtures/manifest.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: true });
addFormats(ajv);
const validate = ajv.compile(schema);
let failures = 0;

function diagnostics(errors) {
  return (errors ?? [])
    .map(({ instancePath, keyword, message, params }) => ({
      instancePath,
      keyword,
      message,
      params,
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function runFixture({ file, expected, expectedKeywords = [] }) {
  const fixture = JSON.parse(readFileSync(resolve(schemaDir, "fixtures", file), "utf8"));
  const valid = validate(fixture);
  const errors = diagnostics(validate.errors);
  const actual = valid ? "valid" : "invalid";
  const keywordSet = new Set(errors.map(({ keyword }) => keyword));
  const keywordMatch = expectedKeywords.every((keyword) => keywordSet.has(keyword));
  const passed = actual === expected && keywordMatch;
  const status = passed ? "PASS" : "FAIL";
  const suffix = valid ? "" : ` ${JSON.stringify(errors)}`;
  console.log(`${status} strict ${file}: ${actual}${suffix}`);
  if (!passed) {
    failures += 1;
    console.error(`Expected ${expected} with keywords ${JSON.stringify(expectedKeywords)}.`);
  }
  return { valid, errors };
}

for (const fixture of manifest.strictValid) {
  runFixture({ ...fixture, expected: "valid" });
}
for (const fixture of manifest.strictInvalid) {
  runFixture({ ...fixture, expected: "invalid" });
}
function legacyWarningCode(errors) {
  if (errors.some(({ keyword, params }) => keyword === "required" && params?.missingProperty === "capture_tier")) {
    return "legacy-unspecified-capture-tier";
  }
  if (errors.some(({ keyword, instancePath }) => keyword === "uniqueItems" && instancePath === "/tags")) {
    return "quality-warning-duplicate-tags";
  }
  if (errors.some(({ keyword, instancePath }) => keyword === "pattern" && instancePath === "/commit_sha")) {
    return "provenance-unresolved-short-sha";
  }
  if (errors.some(({ keyword, instancePath }) => keyword === "pattern" && instancePath === "/supersedes/0")) {
    return "legacy-replaced-by-ambiguous";
  }
  return null;
}

for (const fixture of manifest.legacyCompatible) {
  const result = runFixture({ ...fixture, expected: "invalid" });
  const code = legacyWarningCode(result.errors);
  const passed = code === fixture.warningCode;
  console.log(`${passed ? "WARN" : "FAIL"} legacy ${fixture.file}: ${code ?? "unclassified"} (retained fixture; no rewrite)`);
  if (result.valid || !passed) {
    failures += 1;
    console.error(`Legacy fixture ${fixture.file} must map its strict diagnostics to ${fixture.warningCode}.`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} schema fixture expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll OKF schema fixtures passed.");
