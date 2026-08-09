#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../lib/frontmatter.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const okfDir = resolve(testDir, "..");
const viewerPath = join(okfDir, "viewer.html");
const viewerAppPath = join(okfDir, "viewer-assets", "okf-viewer.js");
const viewerAssetsPath = join(okfDir, "viewer-assets");
const generatorPath = join(okfDir, "generate-viz.js");
const fixtureKnowledge = join(testDir, "viewer-fixtures", "knowledge");
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

function readConcepts(directory, prefix = "") {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const filepath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...readConcepts(fullPath, filepath));
    else if (entry.name.endsWith(".md")) {
      const content = readFileSync(fullPath, "utf8");
      const parsed = parseFrontmatter(content, filepath);
      results.push({
        filepath,
        content,
        parsed: {
          parser: "okf-c7",
          frontmatter: parsed.frontmatter,
          body: parsed.body,
          diagnostics: parsed.diagnostics,
          hasFrontmatter: parsed.hasFrontmatter,
        },
      });
    }
  }
  return results;
}

function loadViewerTestApi() {
  const context = vm.createContext({ console });
  vm.runInContext(readFileSync(viewerAppPath, "utf8"), context, { filename: "okf-viewer.js" });
  assert.ok(context.__OKF_VIEWER_TEST__, "viewer test API was not exposed");
  return context.__OKF_VIEWER_TEST__;
}

const viewer = loadViewerTestApi();
const fixtureItems = readConcepts(fixtureKnowledge);
const analysis = viewer.analyseConceptItems(fixtureItems);

test("uses the accepted six-predicate vocabulary", () => {
  assert.deepEqual(
    [...viewer.relationshipPredicates],
    ["depends_on", "implements", "supersedes", "derived_from", "contradicts", "blocked_by"],
  );
  const renderedPredicates = new Set(analysis.links.filter(link => link.kind === "typed").map(link => link.relation.predicate));
  assert.deepEqual([...renderedPredicates].sort(), [...viewer.relationshipPredicates].sort());
});

test("consumes C7 block arrays while keeping stable IDs separate from file paths", () => {
  const source = analysis.concepts.find(concept => concept.filepath === "architecture/viewer-implementation.md");
  assert.equal(source.parser, "okf-c7");
  assert.equal(source.graphId, "okf-22222222-2222-4222-8222-222222222222");
  assert.equal(source.pathId, "architecture/viewer-implementation");
  assert.ok(source.typedOutbound.some(relation => relation.predicate === "implements" && relation.targetStableId === "okf-11111111-1111-4111-8111-111111111111" && relation.target));
});

test("retains Markdown citation edges and Cited by backlinks", () => {
  const contract = analysis.concepts.find(concept => concept.filepath === "decisions/viewer-contract.md");
  assert.deepEqual([...contract.backlinks], ["architecture/viewer-implementation"]);
  assert.equal(contract.status, "active");
  assert.equal(contract.assertionState, "proposed");
  assert.equal(contract.generationMethod, "human-authored");
  assert.equal(contract.sourceAuthority, "repository-contract");
  assert.equal(contract.sourceRepository, "self");
  assert.deepEqual([...contract.evidenceRefs], ["fixture:viewer-contract"]);
  assert.ok(analysis.links.some(link => link.kind === "citation" && link.sourceConcept.filepath === "architecture/viewer-implementation.md" && link.targetConcept.filepath === "decisions/viewer-contract.md"));
  assert.equal(viewer.resolveMarkdownPath("../decisions/viewer-contract.md", "architecture/viewer-implementation.md"), "decisions/viewer-contract");
});

test("preserves every invalid or unresolved declaration with visible diagnostic data", () => {
  const codes = new Set(analysis.warnings.map(warning => warning.code));
  for (const code of [
    "self-relationship",
    "invalid-relationship-target",
    "unresolved-relationship-target",
    "duplicate-relationship-target",
    "duplicate-stable-id",
    "invalid-cycle",
    "blocked-by-cycle",
    "redundant-symmetric-relationship",
    "legacy-supersedes-ambiguous",
    "missing-stable-id",
  ]) assert.ok(codes.has(code), `missing warning ${code}`);

  const unresolved = analysis.typedRelationships.find(relation => relation.targetStableId === "okf-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(unresolved.state, "invalid");
  assert.equal(unresolved.resolution, "unresolved-relationship-target");
  assert.equal(unresolved.sourcePath, "architecture/viewer-implementation.md");
  assert.equal(unresolved.targetLiteral, "okf-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  const warning = analysis.warnings.find(item => item.code === "unresolved-relationship-target");
  assert.equal(warning.sourceId, "okf-22222222-2222-4222-8222-222222222222");
  assert.equal(warning.predicate, "supersedes");
  assert.ok(warning.message.length > 0);
});

test("renders symmetric contradicts once and marks predicate-specific cycles", () => {
  const contradictions = analysis.links.filter(link => link.kind === "typed" && link.relation.predicate === "contradicts");
  assert.equal(contradictions.length, 1);
  assert.ok(analysis.links.some(link => link.kind === "typed" && link.relation.predicate === "depends_on" && link.relation.state === "invalid"));
  assert.ok(analysis.links.some(link => link.kind === "typed" && link.relation.predicate === "blocked_by" && link.relation.state === "warning"));
});

test("keeps root-relative resources distinct from concept-relative Markdown", () => {
  assert.deepEqual(
    { ...viewer.resourceLink("./docs/epic-26/b2-semantic-identifiers-and-typed-relationships.md") },
    { href: "../docs/epic-26/b2-semantic-identifiers-and-typed-relationships.md", conceptPathId: "" },
  );
  assert.deepEqual(
    { ...viewer.resourceLink("./knowledge/decisions/viewer-contract.md") },
    { href: "../knowledge/decisions/viewer-contract.md", conceptPathId: "decisions/viewer-contract" },
  );
});

test("retains legacy read-only flow-array behavior without packaged parser data", () => {
  const fallback = viewer.analyseConceptItems([
    {
      filepath: "decisions/viewer-fallback-target.md",
      content: "---\ntype: Decision\nid: okf-99999999-9999-4999-8999-999999999999\ntitle: Viewer fallback target\n---\n# Target\n",
    },
    {
      filepath: "architecture/viewer-fallback-source.md",
      content: "---\ntype: Architecture\nid: okf-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\ntitle: Viewer fallback source\nimplements: [okf-99999999-9999-4999-8999-999999999999]\n---\n# Source\n\n[Target](../decisions/viewer-fallback-target.md)\n",
    },
  ]);
  assert.ok(fallback.concepts.every(concept => concept.parser === "legacy"));
  assert.ok(fallback.links.some(link => link.kind === "typed" && link.relation.predicate === "implements"));
  assert.ok(fallback.links.some(link => link.kind === "citation"));
});

test("generator embeds C7 results deterministically without acquiring a runtime", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "okf-viewer-test-"));
  try {
    const knowledgeDir = join(tempRoot, "knowledge");
    cpSync(fixtureKnowledge, knowledgeDir, { recursive: true });
    copyFileSync(viewerPath, join(knowledgeDir, "viewer.html"));
    cpSync(viewerAssetsPath, join(knowledgeDir, "viewer-assets"), { recursive: true });

    const first = spawnSync(process.execPath, [generatorPath, knowledgeDir], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    const firstOutput = readFileSync(join(knowledgeDir, "viz.html"), "utf8");
    assert.match(firstOutput, /"parser":"okf-c7"/);
    assert.match(firstOutput, /"implements":\["okf-11111111-1111-4111-8111-111111111111","not-an-okf-id"\]/);

    const second = spawnSync(process.execPath, [generatorPath, knowledgeDir], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(join(knowledgeDir, "viz.html"), "utf8"), firstOutput);

    const installedGenerator = join(knowledgeDir, "generate-viz.js");
    copyFileSync(generatorPath, installedGenerator);
    const withoutRuntime = spawnSync(process.execPath, [installedGenerator, knowledgeDir], { encoding: "utf8" });
    assert.equal(withoutRuntime.status, 0, withoutRuntime.stderr);
    assert.match(withoutRuntime.stderr, /packaged C7 parser runtime unavailable/);
    const fallbackOutput = readFileSync(join(knowledgeDir, "viz.html"), "utf8");
    assert.doesNotMatch(fallbackOutput, /"parser":"okf-c7"/);
    assert.match(fallbackOutput, /Viewer Relationship Implementation/);

    const generatorSource = readFileSync(generatorPath, "utf8");
    assert.doesNotMatch(generatorSource, /npm\s+(?:install|ci)|https?:\/\/|\bfetch\s*\(/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

if (failures > 0) {
  console.error(`\n${failures} viewer relationship test(s) failed.`);
  process.exit(1);
}
console.log("\nAll viewer relationship tests passed.");
