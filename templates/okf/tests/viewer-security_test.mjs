#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const okfDir = resolve(testDir, "..");
const viewerPath = join(okfDir, "viewer.html");
const viewerAppPath = join(okfDir, "viewer-assets", "okf-viewer.js");
const viewerAssetsPath = join(okfDir, "viewer-assets");
const generatorPath = join(okfDir, "generate-viz.js");
let failures = 0;

function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack || error.message}`);
  }
}

function loadViewerTestApi() {
  const context = vm.createContext({ console });
  vm.runInContext(readFileSync(viewerAppPath, "utf8"), context, { filename: "okf-viewer.js" });
  assert.ok(context.__OKF_VIEWER_TEST__);
  return context.__OKF_VIEWER_TEST__;
}

function fixture() {
  const parent = mkdtempSync(join(tmpdir(), "okf-viewer-security-"));
  const knowledge = join(parent, "knowledge");
  mkdirSync(join(knowledge, "architecture"), { recursive: true });
  mkdirSync(join(knowledge, "inbox", "processed"), { recursive: true });
  mkdirSync(join(knowledge, "inbox", "archive", "reviewed"), { recursive: true });
  cpSync(viewerPath, join(knowledge, "viewer.html"));
  cpSync(viewerAssetsPath, join(knowledge, "viewer-assets"), { recursive: true });
  writeFileSync(join(knowledge, "architecture", "reviewed.md"), [
    "---", "type: Architecture", "title: Reviewed Concept", "tags: [viewer]", "status: active", "---", "# Reviewed", "",
  ].join("\n"));
  writeFileSync(join(knowledge, "inbox", "pending.md"), "---\ntype: Inbox\ntitle: PENDING-SENTINEL\n---\npending secret\n");
  writeFileSync(join(knowledge, "inbox", "processed", "processed.md"), "---\ntype: Inbox\ntitle: PROCESSED-SENTINEL\n---\nprocessed secret\n");
  writeFileSync(join(knowledge, "inbox", "archive", "reviewed", "archived.md"), "---\ntype: Inbox\ntitle: ARCHIVED-SENTINEL\n---\narchived secret\n");
  return { parent, knowledge };
}

function generate(knowledge, ...options) {
  return spawnSync(process.execPath, [generatorPath, ...options, knowledge], { encoding: "utf8" });
}

function embeddedEnvelope(knowledge) {
  const output = readFileSync(join(knowledge, "viz.html"), "utf8");
  const match = output.match(/<script id="okf-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, "generated viewer data block missing");
  return { output, envelope: JSON.parse(match[1]) };
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const viewer = loadViewerTestApi();

test("uses a restrictive local-only CSP and no executable inline or remote scripts", () => {
  const html = readFileSync(viewerPath, "utf8");
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || "";
  for (const directive of [
    "default-src 'none'", "script-src 'self'", "connect-src 'none'", "object-src 'none'",
    "base-uri 'none'", "form-action 'none'", "frame-src 'none'", "worker-src 'none'",
  ]) assert.ok(policy.includes(directive), `missing CSP directive: ${directive}`);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  const executableScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => !/type="application\/json"/i.test(attributes));
  assert.ok(executableScripts.length > 0);
  for (const [, attributes, body] of executableScripts) {
    assert.match(attributes, /src="\.\/viewer-assets\/[^"]+"/);
    assert.equal(body.trim(), "");
  }
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  assert.match(readFileSync(viewerAppPath, "utf8"), /securityLevel: 'strict'/);
});

test("allows only HTTPS, fragments, and confined local navigation", () => {
  assert.equal(viewer.safeNavigationHref("https://example.test/path"), "https://example.test/path");
  assert.equal(viewer.safeNavigationHref("#section"), "#section");
  assert.equal(viewer.safeNavigationHref("../decisions/safe.md"), "../decisions/safe.md");
  for (const unsafe of [
    "javascript:alert(1)", " JAVASCRIPT:alert(1)", "data:text/html,boom", "file:///etc/passwd",
    "http://example.test", "mailto:test@example.test", "//example.test/path", "/etc/passwd",
    "..%2f..%2fetc/passwd", "https://example.test\\@evil.test/",
  ]) assert.equal(viewer.safeNavigationHref(unsafe), "", unsafe);
  assert.equal(
    viewer.markdownNavigationHref("../../docs/local.md", "architecture/source.md"),
    "../docs/local.md",
  );
  assert.equal(viewer.markdownNavigationHref("../../../outside.md", "architecture/source.md"), "");
  assert.deepEqual(
    { ...viewer.resourceLink("./knowledge/decisions/safe.md") },
    { href: "../knowledge/decisions/safe.md", conceptPathId: "decisions/safe" },
  );
  for (const unsafe of ["javascript:alert(1)", "http://example.test", "../outside.md", "file:///etc/passwd"]) {
    assert.deepEqual({ ...viewer.resourceLink(unsafe) }, { href: "", conceptPathId: "" }, unsafe);
  }
});

test("pins every local viewer runtime to its reviewed SHA-256", () => {
  const html = readFileSync(viewerPath, "utf8");
  const manifest = JSON.parse(readFileSync(join(viewerAssetsPath, "manifest.json"), "utf8"));
  assert.equal(manifest.schema, "okf-viewer-assets/1");
  assert.equal(manifest.offline, true);
  const sources = [...html.matchAll(/<script\b[^>]*src="\.\/viewer-assets\/([^"]+)"/gi)].map(match => match[1]);
  assert.deepEqual(sources, manifest.assets.map(asset => asset.file));
  for (const asset of manifest.assets) {
    assert.match(asset.sha256, /^[0-9a-f]{64}$/);
    assert.equal(sha256(join(viewerAssetsPath, asset.file)), asset.sha256, asset.file);
  }
  for (const license of manifest.licenses) assert.equal(lstatSync(join(viewerAssetsPath, license)).isFile(), true, license);
});

test("default generation excludes the complete inbox and reports a deterministic dataset", () => {
  const current = fixture();
  try {
    const first = generate(current.knowledge);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /inbox excluded/);
    const firstResult = embeddedEnvelope(current.knowledge);
    assert.equal(firstResult.envelope.schema, "okf-viewer-data/1");
    assert.equal(firstResult.envelope.policy.inbox, "excluded");
    assert.equal(firstResult.envelope.included_count, 1);
    assert.deepEqual(firstResult.envelope.included_paths, ["architecture/reviewed.md"]);
    assert.doesNotMatch(firstResult.output, /PENDING-SENTINEL|PROCESSED-SENTINEL|ARCHIVED-SENTINEL|secret/);
    const second = generate(current.knowledge);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(embeddedEnvelope(current.knowledge).output, firstResult.output);

    const reviewedInclusion = generate(current.knowledge, "--include-inbox");
    assert.equal(reviewedInclusion.status, 0, reviewedInclusion.stderr);
    const included = embeddedEnvelope(current.knowledge);
    assert.equal(included.envelope.policy.inbox, "included-explicitly");
    assert.deepEqual(included.envelope.included_paths, [
      "architecture/reviewed.md",
      "inbox/archive/reviewed/archived.md",
      "inbox/pending.md",
      "inbox/processed/processed.md",
    ]);
  } finally {
    rmSync(current.parent, { recursive: true, force: true });
  }
});

test("fails closed on symlinked Markdown without disclosing or replacing prior output", () => {
  const current = fixture();
  try {
    const initial = generate(current.knowledge);
    assert.equal(initial.status, 0, initial.stderr);
    const before = readFileSync(join(current.knowledge, "viz.html"));
    const outside = join(current.parent, "outside-secret.md");
    writeFileSync(outside, "OUTSIDE-SECRET-SENTINEL\n");
    symlinkSync(outside, join(current.knowledge, "architecture", "escape.md"));
    const result = generate(current.knowledge);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symbolic link/);
    assert.deepEqual(readFileSync(join(current.knowledge, "viz.html")), before);
    assert.doesNotMatch(readFileSync(join(current.knowledge, "viz.html"), "utf8"), /OUTSIDE-SECRET-SENTINEL/);
  } finally {
    rmSync(current.parent, { recursive: true, force: true });
  }
});

test("fails closed on symlinked viewer roots, templates, assets, parser inputs, and output", () => {
  // Each mutation uses a fresh fixture so a prior failure cannot hide a later boundary.
  const scenarios = [
    {
      name: "knowledge root",
      mutate(current) {
        const link = join(current.parent, "knowledge-link");
        symlinkSync(current.knowledge, link);
        return { knowledge: link, outside: null };
      },
    },
    {
      name: "viewer template",
      mutate(current) {
        const viewer = join(current.knowledge, "viewer.html");
        const outside = join(current.parent, "outside-viewer.html");
        renameSync(viewer, outside);
        symlinkSync(outside, viewer);
        return { knowledge: current.knowledge, outside };
      },
    },
    {
      name: "viewer asset",
      mutate(current) {
        const asset = join(current.knowledge, "viewer-assets", "marked-12.0.2.min.js");
        const outside = join(current.parent, "outside-asset.js");
        renameSync(asset, outside);
        symlinkSync(outside, asset);
        return { knowledge: current.knowledge, outside };
      },
    },
    {
      name: "viewer output",
      mutate(current) {
        const output = join(current.knowledge, "viz.html");
        const outside = join(current.parent, "outside-output.html");
        writeFileSync(outside, "OUTSIDE-OUTPUT-UNCHANGED\n");
        symlinkSync(outside, output);
        return { knowledge: current.knowledge, outside };
      },
    },
    {
      name: "installed parser",
      installed: true,
      mutate(current) {
        const outside = join(current.parent, "outside-parser.mjs");
        writeFileSync(outside, "export function parseFrontmatter() { throw new Error('must not load'); }\n");
        mkdirSync(join(current.parent, ".okf", "lib"), { recursive: true });
        symlinkSync(outside, join(current.parent, ".okf", "lib", "frontmatter.mjs"));
        cpSync(generatorPath, join(current.knowledge, "generate-viz.js"));
        return { knowledge: current.knowledge, outside };
      },
    },
    {
      name: "parser runtime dependency",
      installed: true,
      mutate(current) {
        const installedRoot = join(current.parent, ".okf");
        mkdirSync(join(installedRoot, "lib"), { recursive: true });
        cpSync(join(okfDir, "lib", "frontmatter.mjs"), join(installedRoot, "lib", "frontmatter.mjs"));
        cpSync(join(okfDir, "lib", "yaml-runtime.mjs"), join(installedRoot, "lib", "yaml-runtime.mjs"));
        cpSync(join(okfDir, "runtime"), join(installedRoot, "runtime"), { recursive: true });
        const dependency = join(installedRoot, "runtime", "vendor", "yaml", "dist", "index.js");
        const outside = join(current.parent, "outside-yaml-index.js");
        renameSync(dependency, outside);
        symlinkSync(outside, dependency);
        cpSync(generatorPath, join(current.knowledge, "generate-viz.js"));
        return { knowledge: current.knowledge, outside };
      },
    },
  ];
  for (const scenario of scenarios) {
    const current = fixture();
    try {
      const state = scenario.mutate(current);
      const executable = scenario.installed ? join(current.knowledge, "generate-viz.js") : generatorPath;
      const result = spawnSync(process.execPath, [executable, state.knowledge], { encoding: "utf8" });
      assert.notEqual(result.status, 0, `${scenario.name} unexpectedly succeeded`);
      assert.match(result.stderr, /symbolic link|outside its distribution root/, scenario.name);
      if (scenario.name === "viewer output") assert.equal(readFileSync(state.outside, "utf8"), "OUTSIDE-OUTPUT-UNCHANGED\n");
    } finally {
      rmSync(current.parent, { recursive: true, force: true });
    }
  }
});

test("rejects asset hash drift before writing viewer output", () => {
  const current = fixture();
  try {
    const asset = join(current.knowledge, "viewer-assets", "marked-12.0.2.min.js");
    writeFileSync(asset, `${readFileSync(asset, "utf8")}\n// tampered\n`);
    const result = generate(current.knowledge);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /asset hash mismatch/);
    assert.throws(() => lstatSync(join(current.knowledge, "viz.html")), { code: "ENOENT" });
  } finally {
    rmSync(current.parent, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\n${failures} viewer security test(s) failed.`);
  process.exit(1);
}
console.log("\nAll viewer security tests passed.");
