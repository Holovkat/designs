#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lintBundle } from "../lib/lint.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const bundle = resolve(testDir, "fixtures/linter/bundle");
const cli = resolve(testDir, "../bin/okf-lint.mjs");
let failures = 0;

function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function codes(result, path) {
  return result.diagnostics.filter((item) => item.path === path).map((item) => item.code);
}

test("strict mode reports deterministic errors and warning-only retained facts", () => {
  const result = lintBundle(bundle, { mode: "strict" });
  assert.equal(result.filesChecked, 10);
  assert.ok(codes(result, "knowledge/decisions/malformed.md").includes("yaml-duplicate-key"));
  assert.ok(codes(result, "knowledge/decisions/schema-invalid.md").includes("schema-uniqueItems"));
  assert.ok(codes(result, "knowledge/process/wrong-directory.md").includes("type-directory-mismatch"));
  assert.ok(codes(result, "knowledge/decisions/warnings.md").includes("extension-unregistered"));
  assert.ok(codes(result, "knowledge/decisions/warnings.md").includes("resource-missing"));
  assert.ok(codes(result, "knowledge/decisions/resource-outside.md").includes("resource-outside-root"));
  assert.ok(!codes(result, "knowledge/decisions/valid.md").includes("resource-missing"));
  assert.ok(codes(result, "knowledge/inbox/session-missing-headings.md").includes("body-headings-missing"));
  assert.ok(codes(result, "knowledge/architecture/target.md").includes("identifier-duplicate"));
  assert.ok(codes(result, "knowledge/decisions/valid.md").includes("relationship-unresolved"));
  assert.equal(result.diagnostics.find((item) => item.code === "relationship-unresolved").severity, "warning");
  assert.ok(result.diagnostics.some((item) => item.severity === "error"));
  assert.deepEqual(result.diagnostics, [...result.diagnostics].sort((a, b) =>
    a.path.localeCompare(b.path) || a.severity.localeCompare(b.severity) || a.code.localeCompare(b.code) || (a.field ?? "").localeCompare(b.field ?? "")
  ));
});

test("legacy mode retains the same findings as warnings", () => {
  const result = lintBundle(bundle, { mode: "legacy" });
  assert.ok(result.diagnostics.length > 0);
  assert.ok(result.diagnostics.every((item) => item.severity === "warning"));
});

test("CLI emits JSON and fails only when error severity is selected", () => {
  const failing = spawnSync(process.execPath, [cli, "--root", bundle, "--mode", "strict", "--format", "json"], { encoding: "utf8" });
  assert.equal(failing.status, 1);
  const result = JSON.parse(failing.stdout);
  assert.equal(result.mode, "strict");
  const tolerated = spawnSync(process.execPath, [cli, "--root", bundle, "--mode", "strict", "--format", "json", "--fail-on", "none"], { encoding: "utf8" });
  assert.equal(tolerated.status, 0);
  assert.deepEqual(JSON.parse(tolerated.stdout), result);
});

test("skips a symlinked directory instead of reading outside the root", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-lint-"));
  const root = join(parent, "bundle");
  const outside = join(parent, "outside");
  mkdirSync(join(root, "knowledge"), { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(outside, "outside.md"), "---\ntype: Decision\n---\n# Outside\n");
  symlinkSync(outside, join(root, "knowledge", "escaped"));
  try {
    const result = lintBundle(root, { mode: "strict" });
    assert.equal(result.filesChecked, 0);
    assert.deepEqual(codes(result, "knowledge/escaped"), ["path-symlink-skipped"]);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("rejects a root without knowledge", () => {
  assert.throws(() => lintBundle(resolve(testDir, "fixtures/frontmatter")), /knowledge directory/);
});

if (failures > 0) {
  console.error(`\n${failures} linter test(s) failed.`);
  process.exit(1);
}
console.log("\nAll linter tests passed.");
