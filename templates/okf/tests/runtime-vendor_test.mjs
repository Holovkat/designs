#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const template = resolve(testDir, "..");
const runtime = resolve(template, "runtime");
const installer = resolve(template, "install-okf.sh");
let failures = 0;

function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack ?? error.message}`); }
}

function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
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

test("installer copies the parser runtime and parser without executing either", () => {
  const parent = mkdtempSync(join(tmpdir(), "okf-runtime-install-"));
  const target = join(parent, "target");
  mkdirSync(target);
  try {
    command(target, "git", ["init", "-q"]);
    command(target, "git", ["config", "user.email", "okf@example.test"]);
    command(target, "git", ["config", "user.name", "OKF test"]);
    command(target, "git", ["commit", "--allow-empty", "-qm", "fixture"]);
    const result = command(template, "bash", [installer, target]);
    assert.match(result.stdout, /Installed pinned local OKF parser runtime and read-only inbox status command/);
    const installedParser = join(target, ".okf", "lib", "frontmatter.mjs");
    const installedVendor = join(target, ".okf", "runtime", "vendor", "yaml", "package.json");
    assert.equal(JSON.parse(readFileSync(installedVendor, "utf8")).version, "2.8.3");
    command(target, process.execPath, ["--input-type=module", "-e", `import { parseFrontmatter } from ${JSON.stringify(pathToFileURL(installedParser).href)}; const value = parseFrontmatter('---\\ntags: [offline]\\n---\\nbody'); if (value.frontmatter.tags[0] !== 'offline') process.exit(1);`]);
    assert.equal(readFileSync(join(target, ".okf", "runtime", "package-lock.json"), "utf8"), readFileSync(join(runtime, "package-lock.json"), "utf8"));
    const status = command(target, process.execPath, [join(target, ".okf", "bin", "okf-inbox-status.mjs"), "--root", target, "--format", "json"]);
    assert.equal(JSON.parse(status.stdout).read_only, true);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\n${failures} runtime vendor test(s) failed.`);
  process.exit(1);
}
console.log("\nAll runtime vendor tests passed.");
