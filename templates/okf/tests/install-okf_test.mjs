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
  readFileSync,
  readdirSync,
  realpathSync,
  readlinkSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const template = resolve(testDir, "..");
const installer = join(template, "install-okf.sh");
const canonicalHook = readFileSync(join(template, "post-commit.sh"));
const isolatedEnv = Object.freeze({
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  LC_ALL: "C",
});
let failures = 0;

function result(cwd, executable, args, options = {}) {
  return spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env: isolatedEnv,
    ...options,
  });
}

function command(cwd, executable, args, options = {}) {
  const completed = result(cwd, executable, args, options);
  assert.equal(completed.status, 0, `${executable} ${args.join(" ")}\n${completed.stdout}\n${completed.stderr}`);
  return completed;
}

function git(cwd, args, options = {}) {
  return command(cwd, "git", args, options);
}

function install(target, args = [], env = {}) {
  return result(template, "/bin/bash", [installer, ...args, target], {
    env: { ...isolatedEnv, ...env },
  });
}

function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack ?? error.message}`);
  }
}

function physicalTemp(prefix) {
  return realpathSync(mkdtempSync(join(tmpdir(), prefix)));
}

function initRepo(parent, name = "repo") {
  const root = join(parent, name);
  mkdirSync(root);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "installer@example.test"]);
  git(root, ["config", "user.name", "Installer Fixture"]);
  git(root, ["commit", "--allow-empty", "-qm", "fixture root"]);
  return realpathSync(root);
}

function mode(path) {
  return lstatSync(path).mode & 0o777;
}

function digest(data) {
  return createHash("sha256").update(data).digest("hex");
}

function snapshot(root, current = root, output = {}) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      output[relative] = { type: "symlink", mode: stat.mode & 0o777, target: readlinkSync(path) };
    } else if (stat.isDirectory()) {
      output[`${relative}/`] = { type: "directory", mode: stat.mode & 0o777 };
      snapshot(root, path, output);
    } else if (stat.isFile()) {
      output[relative] = { type: "file", mode: stat.mode & 0o777, sha256: digest(readFileSync(path)) };
    } else {
      output[relative] = { type: "special", mode: stat.mode & 0o777 };
    }
  }
  return output;
}

function effectiveHooks(root) {
  return git(root, ["rev-parse", "--path-format=absolute", "--git-path", "hooks"]).stdout.trim();
}

function configuredValue(root) {
  const completed = result(root, "git", ["config", "--get", "core.hooksPath"]);
  assert.ok(completed.status === 0 || completed.status === 1, completed.stderr);
  return { status: completed.status, value: completed.stdout };
}

function writePriorHooks(hooks) {
  mkdirSync(hooks, { recursive: true });
  const post = join(hooks, "post-commit");
  const prior = "#!/bin/sh\nprintf 'prior-post-commit\\n' >> \"$PWD/prior-hook.log\"\n";
  writeFileSync(post, prior);
  chmodSync(post, 0o751);
  const others = new Map([
    ["pre-commit", { body: "#!/bin/sh\n# prior pre-commit\nexit 0\n", mode: 0o755 }],
    ["commit-msg", { body: "#!/bin/sh\n# prior commit-msg\nexit 0\n", mode: 0o744 }],
    ["pre-push", { body: "#!/bin/sh\n# prior pre-push\nexit 0\n", mode: 0o640 }],
  ]);
  for (const [name, fixture] of others) {
    writeFileSync(join(hooks, name), fixture.body);
    chmodSync(join(hooks, name), fixture.mode);
  }
  return { post: Buffer.from(prior), postMode: 0o751, others };
}

function assertHookScenario(label, configuredPath) {
  const parent = physicalTemp(`okf-installer-${label}-`);
  try {
    const root = initRepo(parent);
    if (configuredPath !== null) git(root, ["config", "core.hooksPath", configuredPath(root, parent)]);
    const configBefore = configuredValue(root);
    const hooks = effectiveHooks(root);
    const prior = writePriorHooks(hooks);
    const othersBefore = Object.fromEntries([...prior.others].map(([name]) => [name, {
      data: readFileSync(join(hooks, name)),
      mode: mode(join(hooks, name)),
    }]));

    const completed = install(root);
    assert.equal(completed.status, 0, `${completed.stdout}\n${completed.stderr}`);
    assert.deepEqual(configuredValue(root), configBefore, "installer changed effective core.hooksPath configuration");
    assert.deepEqual(readFileSync(join(hooks, "post-commit")), canonicalHook);
    assert.equal(mode(join(hooks, "post-commit")), 0o755);
    assert.deepEqual(readFileSync(join(hooks, "post-commit.pre-okf")), prior.post);
    assert.equal(mode(join(hooks, "post-commit.pre-okf")), prior.postMode);
    for (const [name, before] of Object.entries(othersBefore)) {
      assert.deepEqual(readFileSync(join(hooks, name)), before.data, `${name} bytes changed`);
      assert.equal(mode(join(hooks, name)), before.mode, `${name} mode changed`);
    }

    git(root, ["commit", "--allow-empty", "-m", `test: ${label} hook`, "-m", "Exercise both hook paths.\n\nImpact: fixture only"]);
    assert.equal(readFileSync(join(root, "prior-hook.log"), "utf8"), "prior-post-commit\n");
    const captures = readdirSync(join(root, "knowledge", "inbox")).filter((name) => name.endsWith(".md") && name !== "index.md");
    assert.equal(captures.length, 1, "canonical OKF hook did not capture the fixture commit");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

const capabilityRoot = physicalTemp("okf-installer-capabilities-");
let symlinkCapable = false;
try {
  const source = join(capabilityRoot, "source");
  const link = join(capabilityRoot, "link");
  mkdirSync(source);
  symlinkSync(source, link);
  symlinkCapable = lstatSync(link).isSymbolicLink();
} finally {
  rmSync(capabilityRoot, { recursive: true, force: true });
}
const bashVersion = command(template, "bash", ["--version"]).stdout.split("\n")[0];
const systemBashVersion = command(template, "/bin/bash", ["--version"]).stdout.split("\n")[0];
const gitVersion = command(template, "git", ["--version"]).stdout.trim();
const osVersionCommand = process.platform === "darwin" ? ["sw_vers", ["-productVersion"]] : ["uname", ["-srv"]];
const osVersionResult = result(template, osVersionCommand[0], osVersionCommand[1]);
assert.equal(osVersionResult.status, 0, osVersionResult.stderr);
const tempRootPhysical = realpathSync(tmpdir());
const dfResult = command(template, "df", [tempRootPhysical]);
const dfFields = dfResult.stdout.trim().split("\n").at(-1).trim().split(/\s+/);
const filesystemDevice = dfFields[0];
const filesystemMount = dfFields.at(-1);
let filesystemType;
let filesystemDetail;
if (process.platform === "darwin") {
  const diskInfo = command(template, "diskutil", ["info", filesystemMount]).stdout;
  filesystemType = diskInfo.match(/^\s*Type \(Bundle\):\s*(.+)$/m)?.[1]?.trim();
  filesystemDetail = {
    allocation_block_size: diskInfo.match(/^\s*Allocation Block Size:\s*(.+)$/m)?.[1]?.trim(),
    owners: diskInfo.match(/^\s*Owners:\s*(.+)$/m)?.[1]?.trim(),
    volume_read_only: diskInfo.match(/^\s*Volume Read-Only:\s*(.+)$/m)?.[1]?.trim(),
  };
} else {
  filesystemType = command(template, "stat", ["-f", "-c", "%T", tempRootPhysical]).stdout.trim();
  filesystemDetail = {};
}
assert.ok(filesystemType, "filesystem type prerequisite is unavailable");
const fixtureManifest = Object.freeze({
  schema: "okf-installer-fixture-manifest/1",
  platform: process.platform,
  architecture: process.arch,
  os_version: osVersionResult.stdout.trim(),
  git_version: gitVersion,
  bash_version: bashVersion,
  system_bash_version: systemBashVersion,
  installer_bash: "/bin/bash",
  filesystem: {
    type: filesystemType,
    device: filesystemDevice,
    mount_point: filesystemMount,
    temp_root_physical: tempRootPhysical,
    symlinks: symlinkCapable,
    executable_mode_bits: true,
    ...filesystemDetail,
  },
  prerequisites: {
    linked_worktrees: result(template, "git", ["help", "-a"]).stdout.includes("worktree"),
    isolated_global_git_config: true,
  },
});
console.log(`FIXTURE_MANIFEST ${JSON.stringify(fixtureManifest)}`);
assert.equal(fixtureManifest.filesystem.symlinks, true, "symlink fixtures are required");
assert.equal(fixtureManifest.prerequisites.linked_worktrees, true, "linked-worktree fixtures are required");

test("rejects wrong, parent, non-root, symlinked, and symlink-controlled targets before writes", () => {
  const parent = physicalTemp("okf-installer-roots-");
  try {
    const root = initRepo(parent);
    const child = join(root, "child");
    const wrong = join(parent, "wrong");
    const link = join(parent, "repo-link");
    mkdirSync(child);
    mkdirSync(wrong);
    symlinkSync(root, link);
    const before = snapshot(parent);
    for (const [name, target, message] of [
      ["wrong", wrong, /must contain a \.git/],
      ["parent", parent, /must contain a \.git/],
      ["non-root", child, /must contain a \.git|exact physical Git top level/],
      ["symlink", link, /must not be a symlink|exact physical path/],
    ]) {
      const completed = install(target);
      assert.notEqual(completed.status, 0, `${name} unexpectedly installed`);
      assert.match(completed.stderr, message);
    }
    assert.deepEqual(snapshot(parent), before, "a rejected root was mutated");

    const controlReal = join(parent, "git-control");
    const controlled = join(parent, "controlled");
    mkdirSync(controlled);
    git(controlled, ["init", "-q"]);
    // Replace .git with a symlink while retaining an otherwise resolvable repository.
    renameSync(join(controlled, ".git"), controlReal);
    symlinkSync(controlReal, join(controlled, ".git"));
    const controlledBefore = snapshot(parent);
    const symlinkControl = install(controlled);
    assert.notEqual(symlinkControl.status, 0);
    assert.match(symlinkControl.stderr, /control path must not be a symlink/);
    assert.deepEqual(snapshot(parent), controlledBefore);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("dry-run prints complete write, mode, backup, and hook plans without mutation", () => {
  const parent = physicalTemp("okf-installer-dry-run-");
  try {
    const root = initRepo(parent);
    git(root, ["config", "core.hooksPath", ".githooks"]);
    const hooks = effectiveHooks(root);
    writePriorHooks(hooks);
    const before = snapshot(parent);
    const completed = install(root, ["--dry-run"]);
    assert.equal(completed.status, 0, completed.stderr);
    assert.match(completed.stdout, /^OKF_INSTALL_MANIFEST_V1/m);
    assert.match(completed.stdout, /^ROOT\t.*git_dir=.*git_common_dir=/m);
    assert.match(completed.stdout, /^HOOK_CONFIG\tvalue=\.githooks\torigin=.*\taction=preserve$/m);
    assert.match(completed.stdout, /^HOOK_TARGET\t.*\/\.githooks\/post-commit\tchain=chain-byte-identical-predecessor$/m);
    assert.match(completed.stdout, /FILE\t.*post-commit\.pre-okf\taction=create\tmode=751\tbackup=remove-on-rollback/);
    assert.match(completed.stdout, /FILE\t.*post-commit\taction=replace\tmode=0755\tbackup=required/);
    assert.match(completed.stdout, /FILE\t.*\.okf\/profile\.json\taction=create\tmode=0644/);
    assert.deepEqual(snapshot(parent), before, "dry-run changed its fixture");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("refuses target-local temporary staging before any install mutation", () => {
  const parent = physicalTemp("okf-installer-local-tmp-");
  try {
    const root = initRepo(parent);
    const localTemp = join(root, "installer-tmp");
    mkdirSync(localTemp);
    const before = snapshot(parent);
    const completed = install(root, ["--dry-run"], { TMPDIR: localTemp });
    assert.notEqual(completed.status, 0);
    assert.match(completed.stderr, /temporary staging parent must be outside the target worktree/);
    assert.deepEqual(snapshot(parent), before);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("preserves default hook root and every existing hook behavior", () => {
  assertHookScenario("default", null);
});

test("preserves relative .githooks hook root and every existing hook behavior", () => {
  assertHookScenario("githooks", () => ".githooks");
});

test("preserves Husky-style hook root and every existing hook behavior", () => {
  assertHookScenario("husky", () => ".husky/_");
});

test("preserves an absolute hook root and every existing hook behavior", () => {
  assertHookScenario("absolute", (_root, parent) => join(parent, "absolute-hooks"));
});

test("installs and activates from an exact linked-worktree gitfile root", () => {
  const parent = physicalTemp("okf-installer-worktree-");
  try {
    const main = initRepo(parent, "main");
    const linked = join(parent, "linked");
    git(main, ["worktree", "add", "-q", "-b", "installer-linked", linked]);
    assert.equal(lstatSync(join(linked, ".git")).isFile(), true, "linked worktree prerequisite is missing");
    const hooks = effectiveHooks(linked);
    const prior = writePriorHooks(hooks);
    const configBefore = configuredValue(linked);
    const completed = install(realpathSync(linked));
    assert.equal(completed.status, 0, `${completed.stdout}\n${completed.stderr}`);
    assert.deepEqual(configuredValue(linked), configBefore);
    assert.deepEqual(readFileSync(join(hooks, "post-commit.pre-okf")), prior.post);
    git(linked, ["commit", "--allow-empty", "-m", "test: linked worktree", "-m", "Prove linked activation.\n\nImpact: fixture only"]);
    assert.equal(readFileSync(join(linked, "prior-hook.log"), "utf8"), "prior-post-commit\n");
    assert.ok(readdirSync(join(linked, "knowledge", "inbox")).some((name) => name.endsWith(".md") && name !== "index.md"));
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("refuses ambiguous hook chaining before mutation", () => {
  const parent = physicalTemp("okf-installer-conflict-");
  try {
    const root = initRepo(parent);
    git(root, ["config", "core.hooksPath", ".githooks"]);
    const hooks = effectiveHooks(root);
    writePriorHooks(hooks);
    writeFileSync(join(hooks, "post-commit.pre-okf"), "#!/bin/sh\n# collision\n");
    chmodSync(join(hooks, "post-commit.pre-okf"), 0o755);
    const before = snapshot(parent);
    const completed = install(root);
    assert.notEqual(completed.status, 0);
    assert.match(completed.stderr, /ambiguous hook chain/);
    assert.deepEqual(snapshot(parent), before);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});


test("refuses an empty ambiguous effective hooksPath before mutation", () => {
  const parent = physicalTemp("okf-installer-empty-hook-path-");
  try {
    const root = initRepo(parent);
    git(root, ["config", "core.hooksPath", ""]);
    const before = snapshot(parent);
    const completed = install(root);
    assert.notEqual(completed.status, 0);
    assert.match(completed.stderr, /core\.hooksPath is empty and ambiguous/);
    assert.deepEqual(snapshot(parent), before);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("rejects symlinked install targets without touching the link destination", () => {
  const parent = physicalTemp("okf-installer-target-link-");
  try {
    const root = initRepo(parent);
    const outside = join(parent, "outside-knowledge");
    mkdirSync(outside);
    writeFileSync(join(outside, "sentinel"), "outside\n");
    symlinkSync(outside, join(root, "knowledge"));
    const before = snapshot(parent);
    const completed = install(root);
    assert.notEqual(completed.status, 0);
    assert.match(completed.stderr, /symlinked knowledge directory/);
    assert.deepEqual(snapshot(parent), before);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("late injected failure restores the exact repository and absolute hook state", () => {
  const parent = physicalTemp("okf-installer-rollback-");
  try {
    const root = initRepo(parent);
    const hooks = join(parent, "absolute-hooks");
    git(root, ["config", "core.hooksPath", hooks]);
    writePriorHooks(hooks);
    mkdirSync(join(root, ".okf"));
    writeFileSync(join(root, ".okf", "profile.json"), '{"mode":"fixture"}\n');
    writeFileSync(join(root, "AGENTS.md"), "# Fixture instructions\n");
    const before = snapshot(parent);
    const completed = install(root, [], { OKF_INSTALL_TEST_FAIL_AT: "after-hook" });
    assert.notEqual(completed.status, 0, completed.stdout);
    assert.match(completed.stderr, /injected fixture failure after hook installation/);
    assert.match(completed.stderr, /Rollback complete/);
    assert.deepEqual(snapshot(parent), before, "late failure did not restore exact bytes, modes, links, and directories");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("reinstall is idempotent and preserves controls, instructions, concepts, and predecessor", () => {
  const parent = physicalTemp("okf-installer-reinstall-");
  try {
    const root = initRepo(parent);
    git(root, ["config", "core.hooksPath", ".githooks"]);
    const hooks = effectiveHooks(root);
    const prior = writePriorHooks(hooks);
    const first = install(root);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    writeFileSync(join(root, ".okf", "profile.json"), '{"profile":"fixture-local"}\n');
    writeFileSync(join(root, ".okf", "cadence.json"), '{"cadence":"fixture-local"}\n');
    writeFileSync(join(root, ".okf", "KILL_SWITCH"), '{"active":true,"reason":"fixture"}\n');
    writeFileSync(join(root, ".okf", "project-local-control.json"), '{"owner":"fixture"}\n');
    writeFileSync(join(root, "AGENTS.md"), "# Project-owned instructions\n");
    writeFileSync(join(root, "knowledge", "domain", "project-owned.md"), "# Project-owned concept\n");
    const before = snapshot(parent);
    const second = install(root);
    assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);
    assert.match(second.stdout, /applied writes: 0/);
    assert.deepEqual(snapshot(parent), before, "reinstall changed an already installed fixture");
    assert.deepEqual(readFileSync(join(hooks, "post-commit.pre-okf")), prior.post);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\n${failures} installer test(s) failed.`);
  process.exit(1);
}
console.log("\nAll installer tests passed.");
