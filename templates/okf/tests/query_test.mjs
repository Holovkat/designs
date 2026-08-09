#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const templateRoot = resolve(testDir, "..");
const cli = resolve(templateRoot, "bin/okf-query.mjs");
const shell = resolve(templateRoot, "okf-query.sh");
const fixture = resolve(testDir, "fixtures/query/bundle");
const temporary = mkdtempSync(join(tmpdir(), "okf-query-"));
const rootPath = join(temporary, "repository");
let root = rootPath;
const outside = join(temporary, "outside");
let failures = 0;

function command(commandPath, args, options = {}) {
  return spawnSync(commandPath, args, { encoding: "utf8", ...options });
}

function nodeQuery(...args) {
  return command(process.execPath, [cli, "--root", root, ...args]);
}

function jsonQuery(...args) {
  const result = nodeQuery(...args, "--format", "json");
  assert.equal(result.status, 0, result.stderr);
  return { output: result.stdout, value: JSON.parse(result.stdout) };
}

function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

function paths(result) {
  return result.results.map(({ path }) => path);
}

function prepareRepository() {
  cpSync(fixture, rootPath, { recursive: true });
  root = realpathSync(rootPath);
  cpSync(shell, join(root, "knowledge/okf-query.sh"));
  mkdirSync(outside);
  writeFileSync(join(outside, "outside.md"), [
    "---",
    "type: Decision",
    "title: Outside Secret",
    "description: Repository containment sentinel",
    "tags: [okf, query]",
    "timestamp: 2026-08-08T00:08:00Z",
    "status: active",
    "---",
    "",
    "OutsideContainmentNeedle",
    "",
  ].join("\n"));
  symlinkSync(join(outside, "outside.md"), join(root, "knowledge/decisions/outside-link.md"));
  execFileSync("git", ["init", "-q", root]);
  execFileSync("git", ["-C", root, "config", "user.name", "OKF Query Fixture"]);
  execFileSync("git", ["-C", root, "config", "user.email", "query-fixture@example.invalid"]);
  execFileSync("git", ["-C", root, "add", "."]);
  execFileSync("git", ["-C", root, "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", "test: seed query fixture"]);
}

prepareRepository();
const beforeStatus = execFileSync("git", ["-C", root, "status", "--porcelain=v1"], { encoding: "utf8" });
const malformedBefore = readFileSync(join(root, "knowledge/decisions/malformed.md"), "utf8");

test("typed relationship query supports predicate, target, and reverse target search", () => {
  const target = "okf-11111111-1111-4111-8111-111111111111";
  const byPredicate = jsonQuery("--relationship", "depends_on").value;
  assert.deepEqual(paths(byPredicate), ["knowledge/decisions/verified-source.md"]);
  assert.deepEqual(byPredicate.results[0].relationships.depends_on, [target]);
  const byTarget = jsonQuery("--relationship", `depends_on=${target}`).value;
  assert.deepEqual(paths(byTarget), ["knowledge/decisions/verified-source.md"]);
  const reverse = jsonQuery("--related-to", target).value;
  assert.deepEqual(paths(reverse), [
    "knowledge/decisions/verified-source.md",
    "knowledge/deprecation/historical-replacement.md",
  ]);
});

test("assertion, evidence, and lifecycle selectors use separate controlled fields", () => {
  const verified = jsonQuery("--assertion-state", "verified").value;
  assert.deepEqual(paths(verified), ["knowledge/decisions/verified-source.md"]);
  assert.equal(verified.results[0].id, "okf-22222222-2222-4222-8222-222222222222");
  assert.equal(verified.results[0].generation_method, "human-authored");
  assert.equal(verified.results[0].source_authority, "repository-git");
  assert.equal(verified.results[0].source_repository, "self");
  assert.equal(verified.results[0].verified_at, "2026-08-08T00:02:00Z");
  assert.equal(verified.results[0].verified_by, "query-fixture-reviewer");
  assert.equal(verified.results[0].verification_method, "fixture-review");
  assert.equal(verified.results[0].validity_basis, "immutable-fixture");
  assert.deepEqual(paths(jsonQuery("--evidence", "^git:").value), ["knowledge/decisions/verified-source.md"]);
  assert.deepEqual(paths(jsonQuery("--has-evidence", "--assertion-state", "inferred").value), ["knowledge/decisions/legacy-warning.md"]);
  assert.deepEqual(paths(jsonQuery("--lifecycle", "blocked").value), ["knowledge/state/blocked-state.md"]);
  const unspecified = paths(jsonQuery("--assertion-state", "legacy-unspecified").value);
  assert.ok(unspecified.includes("knowledge/process/body-search.md"));
  assert.ok(!unspecified.includes("knowledge/architecture/alpha-target.md"));
  assert.ok(!unspecified.includes("knowledge/decisions/verified-source.md"));
});

test("validation status distinguishes strict, retained warnings, and structural nonconformance", () => {
  const strict = paths(jsonQuery("--validation-status", "strict").value);
  assert.ok(strict.includes("knowledge/architecture/alpha-target.md"));
  assert.ok(strict.includes("knowledge/decisions/verified-source.md"));
  const compatible = paths(jsonQuery("--validation-status", "legacy-compatible").value);
  assert.ok(compatible.includes("knowledge/decisions/legacy-warning.md"));
  assert.ok(compatible.includes("knowledge/state/blocked-state.md"));
  const retained = jsonQuery("--validation-status", "retained-nonconformant").value;
  assert.deepEqual(paths(retained), ["knowledge/decisions/malformed.md"]);
  assert.ok(retained.results[0].validation_codes.includes("yaml-duplicate-key"));
});

test("free text and decisions scope retain frontmatter/body search semantics", () => {
  const all = jsonQuery("SharedScopeNeedle").value;
  assert.deepEqual(paths(all), [
    "knowledge/decisions/verified-source.md",
    "knowledge/process/body-search.md",
  ]);
  assert.ok(all.results.every(({ matched }) => matched === "body"));
  const decisions = jsonQuery("--decisions", "SharedScopeNeedle").value;
  assert.deepEqual(paths(decisions), ["knowledge/decisions/verified-source.md"]);
});

test("semantic JSON output is byte-deterministic", () => {
  const first = jsonQuery("--status", "active").output;
  const second = jsonQuery("--status", "active").output;
  assert.equal(first, second);
});

test("semantic command requires an explicit absolute Git worktree root", () => {
  const missing = command(process.execPath, [cli, "--status", "active"]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /--root is required/);
  const relativeRoot = command(process.execPath, [cli, "--root", relative(process.cwd(), root), "--status", "active"]);
  assert.equal(relativeRoot.status, 2);
  assert.match(relativeRoot.stderr, /--root must be an absolute path/);
  const nestedRoot = command(process.execPath, [cli, "--root", join(root, "knowledge"), "--status", "active"]);
  assert.equal(nestedRoot.status, 2);
  assert.match(nestedRoot.stderr, /top level|knowledge directory/i);
});

test("query skips a symlinked concept instead of reading outside the repository", () => {
  const result = nodeQuery("OutsideContainmentNeedle", "--format", "json");
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).results, []);
  assert.doesNotMatch(result.stdout, /Outside Secret/);
});

test("semantic query remains offline with only the packaged local runtime", () => {
  const result = command(process.execPath, [
    cli,
    "--root", root,
    "--relationship", "depends_on",
    "--format", "json",
  ], {
    env: {
      ...process.env,
      HTTP_PROXY: "http://127.0.0.1:1",
      HTTPS_PROXY: "http://127.0.0.1:1",
      npm_config_offline: "true",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).count, 1);
});

test("portable shell fallback works without parser runtime and preserves decisions search", () => {
  const installedShell = join(root, "knowledge/okf-query.sh");
  const basic = command("/bin/bash", [installedShell, "--root", root, "LegacyNeedle"]);
  assert.equal(basic.status, 0, basic.stderr);
  assert.match(basic.stdout, /Verified Source LegacyNeedle/);
  assert.match(basic.stdout, /knowledge\/decisions\/verified-source\.md/);
  const decisions = command("/bin/bash", [installedShell, "--root", root, "--decisions", "SharedScopeNeedle"]);
  assert.equal(decisions.status, 0, decisions.stderr);
  assert.match(decisions.stdout, /verified-source\.md/);
  assert.doesNotMatch(decisions.stdout, /body-search\.md/);
  const historicalInvocation = command("/bin/bash", [installedShell, "LegacyNeedle"], { cwd: root });
  assert.equal(historicalInvocation.status, 0, historicalInvocation.stderr);
});

test("portable fallback fails closed when semantic selectors cannot load the parser", () => {
  const installedShell = join(root, "knowledge/okf-query.sh");
  const result = command("/bin/bash", [installedShell, "--root", root, "--assertion-state", "verified"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /semantic query unavailable/);
  assert.match(result.stderr, /selectors were not ignored/);
});

test("all query paths are read-only", () => {
  assert.equal(readFileSync(join(root, "knowledge/decisions/malformed.md"), "utf8"), malformedBefore);
  assert.equal(execFileSync("git", ["-C", root, "status", "--porcelain=v1"], { encoding: "utf8" }), beforeStatus);
});

rmSync(temporary, { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n${failures} query test(s) failed.`);
  process.exit(1);
}
console.log("\nAll query tests passed.");
