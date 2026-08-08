#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const template = resolve(testDir, "..");
const runtime = resolve(template, "runtime");
const installer = resolve(template, "install-okf.sh");
const migrationGuidance = resolve(template, "../../docs/epic-26/e4-okf-core-migration-guidance.md");
const canaryGuidance = resolve(template, "tests/epic26-canary-README.md");
const installedBins = Object.freeze([
  "okf-cadence-observe.mjs",
  "okf-cadence-status.mjs",
  "okf-curate.mjs",
  "okf-inbox-archive.mjs",
  "okf-inbox-status.mjs",
  "okf-inbox-triage.mjs",
  "okf-lint.mjs",
  "okf-query.mjs",
  "okf-run-plan.mjs",
  "okf-scheduled-curate.mjs",
]);
const installedLibs = Object.freeze([
  "cadence.mjs",
  "curation-executor.mjs",
  "curation-proposal.mjs",
  "curation-validation.mjs",
  "frontmatter.mjs",
  "inbox-archive.mjs",
  "inbox-status.mjs",
  "inbox-triage.mjs",
  "lint.mjs",
  "query.mjs",
  "run-checkpoint.mjs",
  "run-control.mjs",
  "run-guard.mjs",
  "run-lock.mjs",
  "run-plan.mjs",
  "run-report.mjs",
  "scheduled-curation.mjs",
  "yaml-runtime.mjs",
]);
const installedSchema = Object.freeze([
  "okf-core-1.0.schema.json",
  "okf-core-1.0.validator.mjs",
]);
let failures = 0;

function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack ?? error.message}`); }
}

function command(cwd, executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8", ...options });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

function names(path) {
  return readdirSync(path).sort();
}

function filesBelow(root, directory = root) {
  const result = [];
  for (const entry of readdirSync(directory).sort()) {
    const full = join(directory, entry);
    const relative = full.slice(root.length + 1);
    const stat = lstatSync(full);
    if (stat.isDirectory()) result.push(...filesBelow(root, full));
    else result.push(relative);
  }
  return result;
}

function assertCopiedTree(source, destination) {
  const sourceFiles = filesBelow(source);
  assert.deepEqual(filesBelow(destination), sourceFiles);
  for (const path of sourceFiles) {
    assert.deepEqual(readFileSync(join(destination, path)), readFileSync(join(source, path)), path);
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function assertDocumentation(target) {
  const pairs = [
    [resolve(template, "OKF-STANDARD.md"), join(target, ".okf", "docs", "OKF-STANDARD.md")],
    [resolve(template, "DEPLOYMENT-RUNBOOK.md"), join(target, ".okf", "docs", "DEPLOYMENT-RUNBOOK.md")],
    [migrationGuidance, join(target, ".okf", "docs", "epic-26", "OKF-CORE-MIGRATION-GUIDANCE.md")],
    [canaryGuidance, join(target, ".okf", "docs", "epic-26", "CANARY-HARNESS.md")],
  ];
  for (const [source, destination] of pairs) {
    assert.equal(sha256File(destination), sha256File(source), `${destination} hash drifted from its canonical source`);
    assert.equal(lstatSync(destination).mode & 0o777, 0o444, `${destination} must use stable read-only/non-executable documentation mode 0444`);
  }
}

function installGuards(parent) {
  const bin = join(parent, "install-guards");
  const log = join(parent, "install-guards.log");
  mkdirSync(bin);
  writeFileSync(log, "");
  for (const executable of ["node", "npm", "npx", "curl", "wget", "droid"]) {
    const path = join(bin, executable);
    writeFileSync(path, "#!/bin/sh\nprintf '%s\\n' \"$0\" >> \"$OKF_INSTALL_GUARD_LOG\"\nexit 97\n");
    chmodSync(path, 0o755);
  }
  return Object.freeze({
    env: { ...process.env, OKF_INSTALL_GUARD_LOG: log, PATH: `${bin}:${process.env.PATH}` },
    log,
  });
}

test("pins the complete yaml artifact in a lockfile and local vendor directory", () => {
  const lock = JSON.parse(readFileSync(join(runtime, "package-lock.json"), "utf8"));
  const vendor = JSON.parse(readFileSync(join(runtime, "vendor", "yaml", "package.json"), "utf8"));
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages["node_modules/yaml"].version, "2.8.3");
  assert.equal(lock.packages["node_modules/yaml"].integrity, "sha512-AvbaCLOO2Otw/lW5bmh9d/WEdcDFdQp2Z2ZUH3pX9U2ihyUY0nvLv7J6TrWowklRGPYbB/IuIMfYgxaCPg5Bpg==");
  assert.equal(vendor.version, "2.8.3");
  assert.equal(vendor.license, "ISC");
  assert.match(readFileSync(join(runtime, "README.md"), "utf8"), /9539805d7447def2bed5c5b4acacc283362c5e80abc5d93472b2f35f0cbf85ad/);
});

test("the shared parser imports the repository-local runtime", () => {
  const parser = resolve(template, "lib", "frontmatter.mjs");
  const result = command(template, process.execPath, ["--input-type=module", "-e", `import { parseFrontmatter } from ${JSON.stringify(pathToFileURL(parser).href)}; const value = parseFrontmatter('---\\ntitle: "quoted: value"\\ntags: [okf]\\n---\\n# body\\n'); if (value.frontmatter.title !== 'quoted: value' || value.diagnostics.length) process.exit(1);`]);
  assert.equal(result.stderr, "");
});

test("installer distributes the complete offline surface and preserves local controls", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-runtime-install-"));
  const targetPath = join(parent, "target");
  mkdirSync(targetPath);
  const target = realpathSync(targetPath);
  try {
    command(target, "git", ["init", "-q"]);
    command(target, "git", ["config", "user.email", "okf@example.test"]);
    command(target, "git", ["config", "user.name", "OKF test"]);
    command(target, "git", ["commit", "--allow-empty", "-qm", "fixture"]);
    mkdirSync(join(target, ".claude"));
    writeFileSync(join(target, ".claude", "sentinel.txt"), "harness-owned\n");
    const guards = installGuards(parent);
    const result = command(template, "bash", [installer, target], { env: guards.env });
    assert.match(result.stdout, /Installed complete pinned OKF runtime and command surface \(offline; not executed\)/);
    assert.match(result.stdout, /Apply any AGENTS\.md change only after explicit operator approval/);
    assert.equal(readFileSync(guards.log, "utf8"), "", "installer invoked a guarded runtime/network executable");

    assert.deepEqual(names(join(target, ".okf", "bin")), installedBins);
    assert.deepEqual(names(join(target, ".okf", "lib")), installedLibs);
    assert.deepEqual(names(join(target, ".okf", "schema")), installedSchema);
    assert.deepEqual(names(join(target, ".okf", "templates")), ["curation-prompt.md", "scheduled-curation-prompt.md", "scheduled-curation.example.json"]);
    assert.deepEqual(names(join(target, ".okf", "agents")), ["okf-curator.md"]);
    assert.deepEqual(names(join(target, ".okf", "review")), ["AGENTS-OKF-SECTION.md"]);
    assert.deepEqual(names(join(target, ".okf", "docs")), ["DEPLOYMENT-RUNBOOK.md", "OKF-STANDARD.md", "epic-26"]);
    assert.deepEqual(names(join(target, ".okf", "docs", "epic-26")), ["CANARY-HARNESS.md", "OKF-CORE-MIGRATION-GUIDANCE.md"]);
    assert.deepEqual(names(join(target, ".okf")), [
      "KILL_SWITCH", "agents", "bin", "cadence.json", "docs", "lib", "profile.json", "review", "runtime", "schema", "templates",
    ]);
    for (const bin of installedBins) {
      assert.notEqual(lstatSync(join(target, ".okf", "bin", bin)).mode & 0o111, 0, `${bin} is not executable`);
    }
    assert.notEqual(lstatSync(join(target, "knowledge", "okf-query.sh")).mode & 0o111, 0);
    assert.notEqual(lstatSync(join(target, ".githooks", "post-commit")).mode & 0o111, 0);

    assertCopiedTree(runtime, join(target, ".okf", "runtime"));
    for (const file of installedLibs) {
      assert.deepEqual(readFileSync(join(target, ".okf", "lib", file)), readFileSync(join(template, "lib", file)));
    }
    for (const file of installedBins) {
      assert.deepEqual(readFileSync(join(target, ".okf", "bin", file)), readFileSync(join(template, "bin", file)));
    }
    for (const file of installedSchema) {
      assert.deepEqual(readFileSync(join(target, ".okf", "schema", file)), readFileSync(join(template, "schema", file)));
    }
    assert.deepEqual(readFileSync(join(target, ".okf", "templates", "curation-prompt.md")), readFileSync(join(template, "templates", "curation-prompt.md")));
    assert.deepEqual(readFileSync(join(target, ".okf", "templates", "scheduled-curation-prompt.md")), readFileSync(join(template, "templates", "scheduled-curation-prompt.md")));
    assert.deepEqual(readFileSync(join(target, ".okf", "templates", "scheduled-curation.example.json")), readFileSync(join(template, "config", "scheduled-curation.example.json")));
    assert.deepEqual(readFileSync(join(target, ".okf", "agents", "okf-curator.md")), readFileSync(join(template, "agents", "okf-curator.md")));
    assert.deepEqual(readFileSync(join(target, ".okf", "review", "AGENTS-OKF-SECTION.md")), readFileSync(join(template, "AGENTS-OKF-SECTION.md")));
    assertDocumentation(target);
    assert.equal(existsSync(join(target, ".okf", "tests", "epic26-canary-harness.mjs")), false);
    assert.equal(existsSync(join(target, ".okf", "bin", "epic26-canary-harness.mjs")), false);
    assert.deepEqual(readFileSync(join(target, "knowledge", "viewer.html")), readFileSync(join(template, "viewer.html")));
    assert.deepEqual(readFileSync(join(target, "knowledge", "generate-viz.js")), readFileSync(join(template, "generate-viz.js")));
    assert.deepEqual(readFileSync(join(target, "knowledge", "okf-query.sh")), readFileSync(join(template, "okf-query.sh")));
    assert.deepEqual(readFileSync(join(target, ".githooks", "post-commit")), readFileSync(join(template, "post-commit.sh")));
    assert.equal(existsSync(join(target, "AGENTS.md")), false, "installer created AGENTS.md without operator approval");
    assert.equal(existsSync(join(target, ".factory")), false, "installer created Factory state");
    assert.deepEqual(names(join(target, ".claude")), ["sentinel.txt"], "installer mutated an existing harness directory");
    for (const path of [
      join(target, ".okf", "agents", "okf-curator.md"),
      join(target, ".okf", "review", "AGENTS-OKF-SECTION.md"),
      join(target, ".okf", "templates", "curation-prompt.md"),
      join(target, ".okf", "templates", "scheduled-curation-prompt.md"),
      join(target, ".okf", "templates", "scheduled-curation.example.json"),
    ]) assert.equal(lstatSync(path).mode & 0o111, 0, `${path} must remain a non-executable review artifact`);
    assert.deepEqual(JSON.parse(readFileSync(join(target, ".okf", "profile.json"), "utf8")), JSON.parse(readFileSync(join(template, "config", "profile.json"), "utf8")));
    assert.deepEqual(JSON.parse(readFileSync(join(target, ".okf", "cadence.json"), "utf8")), JSON.parse(readFileSync(join(template, "config", "cadence.json"), "utf8")));
    assert.deepEqual(JSON.parse(readFileSync(join(target, ".okf", "KILL_SWITCH"), "utf8")), JSON.parse(readFileSync(join(template, "config", "kill-switch.json"), "utf8")));

    const installedParser = join(target, ".okf", "lib", "frontmatter.mjs");
    const installedVendor = join(target, ".okf", "runtime", "vendor", "yaml", "package.json");
    assert.equal(JSON.parse(readFileSync(installedVendor, "utf8")).version, "2.8.3");
    command(target, process.execPath, ["--input-type=module", "-e", `import { parseFrontmatter } from ${JSON.stringify(pathToFileURL(installedParser).href)}; const value = parseFrontmatter('---\\ntags: [offline]\\n---\\nbody'); if (value.frontmatter.tags[0] !== 'offline') process.exit(1);`]);
    assert.equal(readFileSync(join(target, ".okf", "runtime", "package-lock.json"), "utf8"), readFileSync(join(runtime, "package-lock.json"), "utf8"));
    const status = command(target, process.execPath, [join(target, ".okf", "bin", "okf-inbox-status.mjs"), "--root", target, "--format", "json"]);
    assert.equal(JSON.parse(status.stdout).read_only, true);

    writeFileSync(join(target, "knowledge", "decisions", "distribution-fixture.md"), [
      "---",
      "type: Decision",
      "title: Distribution Fixture",
      "description: Semantic distribution load fixture",
      "tags: [okf, distribution]",
      "timestamp: 2026-08-08T00:00:00Z",
      "status: active",
      "assertion_state: verified",
      "---",
      "# Distribution Fixture",
      "",
    ].join("\n"));
    const semantic = command(target, process.execPath, [join(target, ".okf", "bin", "okf-query.mjs"), "--root", target, "--assertion-state", "verified", "--format", "json"]);
    assert.equal(JSON.parse(semantic.stdout).count, 1);
    const lint = command(target, process.execPath, [join(target, ".okf", "bin", "okf-lint.mjs"), "--root", target, "--mode", "legacy", "--format", "json"]);
    assert.equal(JSON.parse(lint.stdout).mode, "legacy");

    const localControls = Object.freeze({
      KILL_SWITCH: '{"active":true,"activated_by":"fixture","activated_at":"2026-08-08T00:00:00Z","reason":"preservation proof"}\n',
      "cadence.json": '{"mode":"manual-explicit","enabled":false}\n',
      "profile.json": '{"profile":"okf-core/1.0","mode":"strict-new","extensions":["x_fixture_value"]}\n',
    });
    for (const [name, content] of Object.entries(localControls)) writeFileSync(join(target, ".okf", name), content);
    writeFileSync(join(target, ".okf", "project-local-control.json"), '{"owner":"fixture"}\n');
    writeFileSync(join(target, "AGENTS.md"), "# Harness Contract\n\noperator-owned\n");
    chmodSync(join(target, ".okf", "docs", "OKF-STANDARD.md"), 0o755);
    writeFileSync(join(target, ".okf", "docs", "OKF-STANDARD.md"), "stale installed documentation\n");
    command(template, "bash", [installer, target], { env: guards.env });
    assert.equal(readFileSync(guards.log, "utf8"), "", "reinstall invoked a guarded runtime/network executable");
    for (const [name, content] of Object.entries(localControls)) assert.equal(readFileSync(join(target, ".okf", name), "utf8"), content);
    assert.equal(readFileSync(join(target, ".okf", "project-local-control.json"), "utf8"), '{"owner":"fixture"}\n');
    assert.equal(readFileSync(join(target, "AGENTS.md"), "utf8"), "# Harness Contract\n\noperator-owned\n");
    assert.equal(existsSync(join(target, ".factory")), false);
    assert.deepEqual(names(join(target, ".claude")), ["sentinel.txt"]);
    assertDocumentation(target);
    assert.equal(existsSync(join(target, ".okf", "tests", "epic26-canary-harness.mjs")), false);

    const unavailable = join(target, ".okf-unavailable");
    renameSync(join(target, ".okf"), unavailable);
    const fallback = command(target, join(target, "knowledge", "okf-query.sh"), ["--root", target, "distribution"]);
    assert.match(fallback.stdout, /knowledge\/decisions\/distribution-fixture\.md/);
    const unavailableSemantic = spawnSync(join(target, "knowledge", "okf-query.sh"), ["--root", target, "--assertion-state", "verified"], { cwd: target, encoding: "utf8" });
    assert.equal(unavailableSemantic.status, 2);
    assert.match(unavailableSemantic.stderr, /packaged local parser runtime is missing/);
    renameSync(unavailable, join(target, ".okf"));

    for (const name of ["cron", "crontab", "factory", "launchd", "launch-agent", "queue-consumer"]) {
      assert.equal(filesBelow(target).some((path) => path.toLowerCase().includes(name)), false, `installer emitted autonomous artifact: ${name}`);
    }
    assert.equal(existsSync(join(target, ".okf", "scheduled-curation.json")), false, "installer activated a scheduled-curation profile");
    assert.equal(existsSync(join(target, ".okf", "scheduled.lock")), false, "installer created a scheduler lease");
    assert.equal(existsSync(join(target, ".okf", "node_modules")), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\n${failures} runtime vendor test(s) failed.`);
  process.exit(1);
}
console.log("\nAll runtime vendor tests passed.");
