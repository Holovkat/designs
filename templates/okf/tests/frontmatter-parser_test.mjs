#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../lib/frontmatter.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(resolve(testDir, "fixtures/frontmatter", name), "utf8");
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

test("parses quoted scalars and preserves body bytes", () => {
  const input = fixture("quoted-flow.md");
  const result = parseFrontmatter(input, "quoted-flow.md");
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.frontmatter.description, "Decision: status evidence never starts curation");
  assert.deepEqual(result.frontmatter.tags, ["okf", "profile"]);
  assert.equal(result.body, "# Body\n\nThe body stays untouched.\n");
});

test("parses block arrays without normalizing their source", () => {
  const result = parseFrontmatter(fixture("block-array.md"), "block-array.md");
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.frontmatter.evidence_refs, ["git:0123456789abcdef0123456789abcdef01234567", "path:templates/okf/OKF-STANDARD.md"]);
  assert.match(result.rawFrontmatter, /evidence_refs:\n  - git:/);
});

test("reports duplicate YAML keys", () => {
  const result = parseFrontmatter(fixture("duplicate-key.md"), "duplicate-key.md");
  assert.equal(result.frontmatter.title, undefined);
  assert.ok(result.diagnostics.some(({ code }) => code === "yaml-duplicate-key"));
});

test("reports malformed YAML without changing the body", () => {
  const result = parseFrontmatter(fixture("malformed.md"), "malformed.md");
  assert.ok(result.diagnostics.some(({ code }) => code === "yaml-parse-error"));
  assert.equal(result.body, "# Kept Body\n");
});

test("rejects YAML aliases before materializing a mapping", () => {
  const result = parseFrontmatter(fixture("unsafe-alias.md"), "unsafe-alias.md");
  assert.equal(result.diagnostics[0].code, "yaml-unsafe-alias");
  assert.equal(result.body, "# Body\n");
});

test("handles a BOM and CRLF envelope", () => {
  const input = "\uFEFF---\r\ntype: State\r\ntitle: CRLF state\r\ndescription: BOM and CRLF parsing fixture\r\ntags: [okf, parser]\r\ntimestamp: 2026-08-06T04:20:00Z\r\nstatus: active\r\n---\r\n# State\r\n";
  const result = parseFrontmatter(input, "bom-crlf.md");
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.frontmatter.type, "State");
  assert.equal(result.body, "# State\r\n");
});

test("reports an unclosed envelope", () => {
  const result = parseFrontmatter("---\ntype: Decision\n", "unclosed.md");
  assert.equal(result.diagnostics[0].code, "frontmatter-unclosed");
});

test("leaves Markdown without frontmatter unchanged", () => {
  const input = "# Plain Markdown\n";
  const result = parseFrontmatter(input, "plain.md");
  assert.equal(result.hasFrontmatter, false);
  assert.deepEqual(result.frontmatter, {});
  assert.equal(result.body, input);
});

test("preserves a BOM when Markdown has no frontmatter", () => {
  const input = "\uFEFF# Plain Markdown\n";
  const result = parseFrontmatter(input, "bom-plain.md");
  assert.equal(result.hasFrontmatter, false);
  assert.equal(result.body, input);
});

if (failures > 0) {
  console.error(`\n${failures} parser test(s) failed.`);
  process.exit(1);
}
console.log("\nAll frontmatter parser tests passed.");
