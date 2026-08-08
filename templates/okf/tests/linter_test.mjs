#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

function decisionFixture({ id, title, resource }) {
  return `---
type: Decision
id: ${id}
title: ${title}
description: A focused local resource confinement fixture
resource: ${resource}
tags: [fixture, okf]
timestamp: 2026-08-08T00:00:00Z
status: active
---
# Decision

Exercise resource confinement.
`;
}

test("strict mode reports deterministic errors and warning-only retained facts", () => {
  const result = lintBundle(bundle, { mode: "strict" });
  assert.equal(result.filesChecked, 11);
  assert.ok(codes(result, "knowledge/decisions/malformed.md").includes("yaml-duplicate-key"));
  assert.ok(codes(result, "knowledge/decisions/schema-invalid.md").includes("schema-uniqueItems"));
  assert.ok(codes(result, "knowledge/process/wrong-directory.md").includes("type-directory-mismatch"));
  assert.ok(codes(result, "knowledge/decisions/warnings.md").includes("extension-unregistered"));
  assert.ok(codes(result, "knowledge/decisions/warnings.md").includes("resource-missing"));
  assert.ok(codes(result, "knowledge/decisions/resource-outside.md").includes("resource-outside-root"));
  assert.ok(!codes(result, "knowledge/decisions/valid.md").includes("resource-missing"));
  assert.ok(codes(result, "knowledge/inbox/session-missing-headings.md").includes("body-headings-missing"));
  assert.ok(codes(result, "knowledge/deprecation/missing-sections.md").includes("body-headings-missing"));
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

test("warning and strict-new modes apply the installed compatibility contract", () => {
  const warning = lintBundle(bundle, { mode: "warning" });
  assert.ok(warning.diagnostics.every((item) => item.severity === "warning"));
  const strictPath = "knowledge/decisions/schema-invalid.md";
  const selective = lintBundle(bundle, { mode: "strict-new", strictPaths: [strictPath] });
  assert.ok(selective.diagnostics.filter((item) => item.path === strictPath).some((item) => item.severity === "error"));
  assert.ok(selective.diagnostics.filter((item) => item.path !== strictPath).every((item) => item.severity === "warning"));
  assert.throws(() => lintBundle(bundle, { mode: "strict-new" }), /requires at least one explicit strict path/);
  assert.throws(() => lintBundle(bundle, { mode: "strict-new", strictPaths: ["knowledge/decisions/absent.md"] }), /were not scanned/);
});

test("CLI emits JSON and fails only when error severity is selected", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-lint-cli-"));
  const rootPath = join(parent, "repo");
  try {
    mkdirSync(rootPath, { recursive: true });
    const root = realpathSync(rootPath);
    cpSync(join(bundle, "knowledge"), join(root, "knowledge"), { recursive: true });
    mkdirSync(join(root, ".okf"), { recursive: true });
    writeFileSync(join(root, ".okf", "profile.json"), '{"profile":"okf-core/1.0","mode":"warning","extensions":[]}\n');
    const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(git(["init", "-q"]).status, 0);
    assert.equal(git(["config", "user.name", "OKF Test"]).status, 0);
    assert.equal(git(["config", "user.email", "okf@example.invalid"]).status, 0);
    assert.equal(git(["add", "."]).status, 0);
    assert.equal(git(["commit", "-qm", "fixture"]).status, 0);
    const warning = spawnSync(process.execPath, [cli, "--root", root, "--format", "json"], { encoding: "utf8" });
    assert.equal(warning.status, 0, warning.stderr);
    assert.equal(JSON.parse(warning.stdout).mode, "warning");
    const failing = spawnSync(process.execPath, [cli, "--root", root, "--mode", "strict-bundle", "--format", "json"], { encoding: "utf8" });
    assert.equal(failing.status, 1, failing.stderr);
    const result = JSON.parse(failing.stdout);
    assert.equal(result.mode, "strict-bundle");
    const tolerated = spawnSync(process.execPath, [cli, "--root", root, "--mode", "strict-bundle", "--format", "json", "--fail-on", "none"], { encoding: "utf8" });
    assert.equal(tolerated.status, 0);
    assert.deepEqual(JSON.parse(tolerated.stdout), result);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
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

test("rejects a symlinked top-level knowledge directory without reading its target", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-lint-root-symlink-"));
  const root = join(parent, "bundle");
  const outside = join(parent, "outside");
  mkdirSync(root);
  mkdirSync(outside);
  writeFileSync(join(outside, "must-not-read.md"), "not valid OKF frontmatter\n");
  symlinkSync(outside, join(root, "knowledge"));
  try {
    assert.throws(
      () => lintBundle(root, { mode: "strict" }),
      /knowledge must be a physical directory inside the selected root/,
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("rejects resources escaping through symlinked files and directories while retaining missing-path warnings", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-lint-resource-symlink-"));
  const root = join(parent, "bundle");
  const outside = join(parent, "outside");
  const decisions = join(root, "knowledge", "decisions");
  mkdirSync(decisions, { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(outside, "outside.md"), "outside resource must remain outside\n");
  symlinkSync(join(outside, "outside.md"), join(root, "linked-file.md"));
  symlinkSync(outside, join(root, "linked-directory"));
  writeFileSync(join(root, "inside.md"), "contained resource\n");
  symlinkSync(join(root, "inside.md"), join(root, "contained-link.md"));
  writeFileSync(join(decisions, "linked-file.md"), decisionFixture({
    id: "okf-11111111-1111-4111-8111-111111111111",
    title: "Linked File Resource",
    resource: "linked-file.md",
  }));
  writeFileSync(join(decisions, "linked-directory.md"), decisionFixture({
    id: "okf-22222222-2222-4222-8222-222222222222",
    title: "Linked Directory Resource",
    resource: "linked-directory/outside.md",
  }));
  writeFileSync(join(decisions, "contained-link.md"), decisionFixture({
    id: "okf-33333333-3333-4333-8333-333333333333",
    title: "Contained Linked Resource",
    resource: "contained-link.md",
  }));
  writeFileSync(join(decisions, "missing.md"), decisionFixture({
    id: "okf-44444444-4444-4444-8444-444444444444",
    title: "Missing Resource",
    resource: "missing.md",
  }));
  try {
    const strict = lintBundle(root, { mode: "strict" });
    for (const path of ["knowledge/decisions/linked-file.md", "knowledge/decisions/linked-directory.md"]) {
      assert.deepEqual(codes(strict, path), ["resource-outside-root"]);
      assert.equal(strict.diagnostics.find((item) => item.path === path && item.code === "resource-outside-root").severity, "error");
    }
    assert.deepEqual(codes(strict, "knowledge/decisions/contained-link.md"), []);
    assert.deepEqual(codes(strict, "knowledge/decisions/missing.md"), ["resource-missing"]);
    assert.equal(strict.diagnostics.find((item) => item.path === "knowledge/decisions/missing.md" && item.code === "resource-missing").severity, "warning");

    const warning = lintBundle(root, { mode: "warning" });
    assert.ok(warning.diagnostics.every((item) => item.severity === "warning"));
    assert.deepEqual(codes(warning, "knowledge/decisions/linked-file.md"), ["resource-outside-root"]);
    assert.deepEqual(codes(warning, "knowledge/decisions/linked-directory.md"), ["resource-outside-root"]);
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
