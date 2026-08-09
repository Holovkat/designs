#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { buildRetrievalIndex, canonicalRetrievalJson, loadRetrievalIndex, queryRetrievalIndex, writeRetrievalIndex } from "../lib/retrieval-index.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const completeSidecar = readFileSync(resolve(testDir, "../schema/fixtures/knowledge-change/valid/complete.json"));
let failures = 0;

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack ?? error.message}`); }
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = mkdtempSync(resolve(realpathSync(tmpdir()), "okf-retrieval-"));
  git(root, ["init", "-b", "retrieval"]);
  git(root, ["config", "user.email", "okf@example.invalid"]);
  git(root, ["config", "user.name", "OKF Fixture"]);
  for (const dir of ["architecture", "components", "domain", "decisions", "process", "deprecation", "state", "inbox"]) mkdirSync(resolve(root, `knowledge/${dir}`), { recursive: true });
  const oldId = "okf-00000000-0000-4000-8000-000000000001";
  const newId = "okf-00000000-0000-4000-8000-000000000002";
  writeFileSync(resolve(root, "knowledge/decisions/old.md"), `---\ntype: Decision\nid: ${oldId}\ntitle: Old Decision\ndescription: Historical path\ntags: [okf]\ntimestamp: 2026-08-09T00:00:00Z\nstatus: active\nassertion_state: historical\ngenerated_at: 2026-08-09T00:00:00Z\ngenerated_by: fixture\ngeneration_method: human-authored\nsource_authority: fixture\nevidence_refs: [receipt:old]\n---\n# Old Decision\n`);
  writeFileSync(resolve(root, "knowledge/decisions/new.md"), `---\ntype: Decision\nid: ${newId}\ntitle: New Decision\ndescription: Replacement path\ntags: [okf]\ntimestamp: 2026-08-09T00:00:00Z\nstatus: active\nassertion_state: proposed\ngenerated_at: 2026-08-09T00:00:00Z\ngenerated_by: fixture\ngeneration_method: human-authored\nsource_authority: fixture\nevidence_refs: [receipt:new]\nsupersedes: [${oldId}]\n---\n# New Decision\n`);
  writeFileSync(resolve(root, "knowledge/domain/malformed.md"), "# Missing frontmatter\n");
  writeFileSync(resolve(root, "knowledge/inbox/session.change.json"), completeSidecar);
  git(root, ["add", "knowledge"]);
  git(root, ["commit", "-m", "fixture: seed retrieval"]);
  return { root, oldId, newId };
}

test("projection rebuild is byte deterministic and preserves diagnostics", () => {
  const { root } = fixture();
  const first = buildRetrievalIndex(root);
  const second = buildRetrievalIndex(root);
  assert.equal(canonicalRetrievalJson(first), canonicalRetrievalJson(second));
  assert.ok(first.records.some(({ record_kind }) => record_kind === "capture-disposition"));
  assert.ok(first.records.some(({ record_kind }) => record_kind === "evidence"));
  assert.ok(first.diagnostics.some(({ path }) => path.endsWith("malformed.md")));
});

test("exact, keyword, lifecycle, evidence, and reverse relationship selectors are bounded", () => {
  const { root, oldId, newId } = fixture();
  writeRetrievalIndex(root);
  const index = loadRetrievalIndex(root);
  assert.equal(queryRetrievalIndex(index, { id: newId }).returned, 1);
  assert.equal(queryRetrievalIndex(index, { terms: ["replacement"], top_k: 1 }).returned, 1);
  assert.equal(queryRetrievalIndex(index, { lifecycle: "active" }).returned >= 2, true);
  assert.equal(queryRetrievalIndex(index, { evidence: "receipt:new" }).returned, 1);
  const reverse = queryRetrievalIndex(index, { relationships: [`reverse=${oldId}`] });
  assert.equal(reverse.results.some(({ id }) => id === newId), true);
  assert.ok(reverse.result_bytes <= 64 * 1024);
});

test("working-tree content has an explicit identity and staged, unstaged, or untracked drift is stale", () => {
  const dirtyAtBuild = fixture();
  writeFileSync(resolve(dirtyAtBuild.root, "knowledge/decisions/old.md"), `${readFileSync(resolve(dirtyAtBuild.root, "knowledge/decisions/old.md"), "utf8")}\nDirty before build.\n`);
  const dirtyIndex = buildRetrievalIndex(dirtyAtBuild.root);
  assert.equal(dirtyIndex.source_state, "working-tree");
  assert.match(dirtyIndex.revision_label, /\+working-tree:[0-9a-f]{16}$/u);

  const unstaged = fixture();
  writeRetrievalIndex(unstaged.root);
  writeFileSync(resolve(unstaged.root, "knowledge/decisions/old.md"), `${readFileSync(resolve(unstaged.root, "knowledge/decisions/old.md"), "utf8")}\nUnstaged drift.\n`);
  assert.deepEqual(loadRetrievalIndex(unstaged.root).stale_reasons, ["knowledge-tree-changed"]);

  const staged = fixture();
  writeRetrievalIndex(staged.root);
  writeFileSync(resolve(staged.root, "knowledge/decisions/old.md"), `${readFileSync(resolve(staged.root, "knowledge/decisions/old.md"), "utf8")}\nStaged drift.\n`);
  git(staged.root, ["add", "knowledge/decisions/old.md"]);
  assert.deepEqual(loadRetrievalIndex(staged.root).stale_reasons, ["knowledge-tree-changed"]);

  const untracked = fixture();
  writeRetrievalIndex(untracked.root);
  writeFileSync(resolve(untracked.root, "knowledge/state/untracked.md"), "---\ntype: State\nid: okf-00000000-0000-4000-8000-000000000099\ntitle: Untracked\n---\n# Untracked\n");
  assert.deepEqual(loadRetrievalIndex(untracked.root).stale_reasons, ["knowledge-tree-changed"]);
});

test("deleted cache rebuilds and stale revision cannot masquerade as current", () => {
  const { root } = fixture();
  writeRetrievalIndex(root);
  rmSync(resolve(root, ".okf/cache/okf-retrieval-index.json"));
  writeRetrievalIndex(root);
  writeFileSync(resolve(root, "knowledge/state/change.md"), "# revision change\n");
  git(root, ["add", "knowledge/state/change.md"]);
  git(root, ["commit", "-m", "fixture: advance revision"]);
  const stale = loadRetrievalIndex(root);
  assert.equal(stale.stale, true);
  assert.throws(() => queryRetrievalIndex(stale, { terms: ["decision"] }), (error) => error.code === "retrieval-index-stale");
});

if (failures > 0) { console.error(`\n${failures} retrieval test(s) failed.`); process.exit(1); }
console.log("\nAll retrieval tests passed.");
