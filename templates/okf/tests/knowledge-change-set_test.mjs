#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {
  canonicalKnowledgeChangeJson,
  DEFAULT_MAX_CHANGE_SET_BYTES,
  computeContentSha256,
  computeOperationIdempotencyKey,
  parseKnowledgeChangeSet,
  projectCaptureCoverage,
  renderSessionSynthesis,
  renderTier2InboxMarkdown,
  validateKnowledgeChangeSet,
} from "../lib/knowledge-change-set.mjs";
import { parseFrontmatter } from "../lib/frontmatter.mjs";
import validateCoreFrontmatter from "../schema/okf-core-1.0.validator.mjs";
import validateBundledSchema from "../schema/okf-knowledge-change-1.validator.mjs";
import { spawnSync } from "node:child_process";

const testDir = dirname(fileURLToPath(import.meta.url));
const okfRoot = resolve(testDir, "..");
const fixtureRoot = resolve(okfRoot, "schema/fixtures/knowledge-change");
const schema = JSON.parse(readFileSync(resolve(okfRoot, "schema/okf-knowledge-change-1.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validateSchema = ajv.compile(schema);
let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack ?? error.message}`);
  }
}

function fixture(kind, name) {
  return readFileSync(resolve(fixtureRoot, kind, name));
}

function pointerParts(path) {
  return path.slice(1).split("/").map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function applyFixturePatch(base, patch) {
  const value = structuredClone(base);
  for (const operation of patch) {
    const parts = pointerParts(operation.path);
    let parent = value;
    for (const part of parts.slice(0, -1)) parent = Array.isArray(parent) ? parent[Number(part)] : parent[part];
    const key = parts.at(-1);
    if (Array.isArray(parent)) {
      if (operation.op === "add" && key === "-") parent.push(structuredClone(operation.value));
      else if (operation.op === "remove") parent.splice(Number(key), 1);
      else parent[Number(key)] = structuredClone(operation.value);
    } else if (operation.op === "remove") delete parent[key];
    else parent[key] = structuredClone(operation.value);
  }
  return value;
}

const invalidCases = JSON.parse(readFileSync(resolve(fixtureRoot, "invalid-cases.json"), "utf8"));
function jsonFixture(kind, name) {
  if (kind !== "invalid") return JSON.parse(fixture(kind, name).toString("utf8"));
  const specification = invalidCases[name];
  assert.ok(specification, `missing invalid fixture ${name}`);
  const base = JSON.parse(fixture("valid", specification.base).toString("utf8"));
  return applyFixturePatch(base, specification.patch);
}

const manifest = JSON.parse(readFileSync(resolve(fixtureRoot, "manifest.json"), "utf8"));
const validNames = manifest.valid;
const invalidNames = manifest.invalid;

test("strict schema accepts all version-one valid fixtures", () => {
  for (const name of validNames) {
    const value = jsonFixture("valid", name);
    assert.equal(validateSchema(value), true, `${name}: ${JSON.stringify(validateSchema.errors)}`);
    assert.equal(validateBundledSchema(value), true, `${name}: bundled validator drift`);
  }
});

test("strict schema or semantic validator rejects every invalid fixture", () => {
  for (const name of invalidNames) {
    const value = jsonFixture("invalid", name);
    const schemaOk = validateSchema(value);
    const bundledOk = validateBundledSchema(value);
    assert.equal(bundledOk, schemaOk, `${name}: AJV/bundled schema parity`);
    const semantic = validateKnowledgeChangeSet(value);
    assert.equal(schemaOk && semantic.ok, false, name);
    assert.ok((validateSchema.errors?.length ?? 0) > 0 || semantic.diagnostics.length > 0, name);
  }
});

test("every capture has one explicit disposition and review-required stays non-terminal", () => {
  const parsed = parseKnowledgeChangeSet(fixture("valid", "many-to-many-review-required.json"), { sourcePath: "closeout.json" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.complete, false);
  assert.equal(parsed.status, "valid-review-required");
  assert.deepEqual(parsed.pending_capture_ids, ["cap-review"]);
  assert.deepEqual([...new Set(parsed.value.captures.map(({ disposition }) => disposition.type))].sort(), [
    "create", "duplicate", "merge", "no-durable-change", "review-required", "supersede", "update",
  ]);
});

test("coverage and operations preserve many-to-one and one-to-many links", () => {
  const value = jsonFixture("valid", "many-to-many-review-required.json");
  const coverage = projectCaptureCoverage(value);
  assert.equal(coverage.ok, true);
  assert.deepEqual(coverage.captures.filter(({ operation_ids }) => operation_ids.includes("op-create-core")).map(({ capture_id }) => capture_id), ["cap-create-a", "cap-create-b"]);
  assert.deepEqual(coverage.captures.find(({ capture_id }) => capture_id === "cap-update-a").operation_ids, ["op-create-process", "op-update-state"]);
});

test("exact content hashes and operation idempotency survive canonical round trip", () => {
  const value = jsonFixture("valid", "complete.json");
  for (const operation of value.operations) {
    assert.equal(operation.change.sha256, computeContentSha256(operation.change.value));
    assert.equal(operation.idempotency_key, computeOperationIdempotencyKey(operation));
  }
  const original = value.operations[0];
  const alternate = {
    ...original,
    operation_id: "op-alternate-id",
    sequence: 99,
    capture_ids: [...original.capture_ids].reverse(),
    depends_on: [...original.depends_on].reverse(),
    claims: [...original.claims].reverse().map((claim) => ({ ...claim, evidence_ids: [...claim.evidence_ids].reverse() })),
  };
  assert.equal(computeOperationIdempotencyKey(alternate), original.idempotency_key);
  const text = canonicalKnowledgeChangeJson(value);
  const reparsed = parseKnowledgeChangeSet(text, { sourcePath: "round-trip.json" });
  assert.equal(reparsed.ok, true);
  assert.equal(reparsed.complete, true);
  assert.deepEqual(reparsed.value, value);
  assert.equal(canonicalKnowledgeChangeJson(reparsed.value), text);
});

test("human Tier 2 prose is generated once with exactly four allowed sections", () => {
  const value = jsonFixture("valid", "complete.json");
  const markdown = renderSessionSynthesis(value);
  assert.deepEqual([...markdown.matchAll(/^# (.+)$/gmu)].map((match) => match[1]), [
    "Decisions Made", "What Was Deprecated", "Lessons Learned", "Current State",
  ]);
  assert.equal(markdown.includes("Capture Coverage"), false);
  assert.equal(markdown.includes("Knowledge Operations"), false);
});

test("the same source renders a complete strict Tier 2 Inbox record", () => {
  const value = jsonFixture("valid", "complete.json");
  const markdown = renderTier2InboxMarkdown(value);
  const parsed = parseFrontmatter(markdown, "rendered-session.md");
  assert.deepEqual(parsed.diagnostics, []);
  assert.equal(validateCoreFrontmatter(parsed.frontmatter), true, JSON.stringify(validateCoreFrontmatter.errors));
  assert.equal(parsed.frontmatter.capture_tier, "session");
  assert.deepEqual(parsed.frontmatter.commit_sha, value.inbox.commit_shas);
  assert.deepEqual([...parsed.body.matchAll(/^# (.+)$/gmu)].map((match) => match[1]), [
    "Decisions Made", "What Was Deprecated", "Lessons Learned", "Current State",
  ]);
});

test("the checked-in runtime validator exactly matches regeneration", () => {
  const run = spawnSync(process.execPath, ["schema/generate-knowledge-change-validator.mjs", "--check"], { cwd: okfRoot, encoding: "utf8" });
  assert.equal(run.status, 0, `${run.stdout}
${run.stderr}`);
});

test("concise supersede fixture requires reason and replacement relationship but not extended lessons", () => {
  const value = jsonFixture("valid", "complete.json");
  const operation = value.operations.find(({ kind }) => kind === "supersede");
  assert.ok(operation.deprecation.reason);
  assert.equal(operation.deprecation.replacement_concept_id, operation.target.concept_id);
  assert.equal(Object.hasOwn(operation.deprecation, "extended_lessons"), false);
  assert.equal(validateKnowledgeChangeSet(value).ok, true);
});

test("malformed, binary, oversized, secret-bearing, unknown, and unsupported inputs fail closed with identity", () => {
  const cases = [
    [Buffer.from("{bad"), {}, "malformed"],
    [Buffer.from([0, 1, 2, 3]), {}, "binary"],
    [Buffer.from("x".repeat(33)), { maxBytes: 32 }, "oversized"],
    [Buffer.from('{"password":"abcdefghijklmnop"}'), {}, "secret-bearing"],
    [Buffer.from('{"refresh_token":"abcdefghijklmnop"}'), {}, "secret-bearing"],
    [Buffer.from('{"authorization":"Bearer-abcdefghijklmnop"}'), {}, "secret-bearing"],
    [Buffer.from('{"schema_version":"future/9"}'), {}, "unknown"],
    [{ circular: null }, {}, "unknown"],
  ];
  cases.at(-1)[0].circular = cases.at(-1)[0];
  for (const [input, options, classification] of cases) {
    const result = parseKnowledgeChangeSet(input, { sourcePath: "arbitrary.input", ...options });
    assert.equal(result.ok, false);
    assert.equal(result.status, "review-required");
    assert.equal(result.source_identity.classification, classification);
    assert.match(result.source_identity.sha256, /^[0-9a-f]{64}$/u);
    assert.ok(Number.isSafeInteger(result.source_identity.size_bytes));
    assert.equal(JSON.stringify(result).includes("abcdefghijklmnop"), false);
  }
});

test("credential-shaped values nested inside exact content remain identity-only", () => {
  const value = jsonFixture("valid", "complete.json");
  const operation = value.operations[0];
  operation.change.value += "password: abcdefghijklmnop\n";
  operation.change.sha256 = computeContentSha256(operation.change.value);
  operation.idempotency_key = computeOperationIdempotencyKey(operation);
  const result = parseKnowledgeChangeSet(canonicalKnowledgeChangeJson(value), { sourcePath: "secret-nested.change.json" });
  assert.equal(result.ok, false);
  assert.equal(result.source_identity.classification, "secret-bearing");
  assert.equal(JSON.stringify(result).includes("abcdefghijklmnop"), false);
});

test("duplicate JSON keys are malformed and cannot shadow the schema version", () => {
  const text = '{"schema_version":"okf-knowledge-change/1","schema_version":"future/9"}';
  const result = parseKnowledgeChangeSet(text, { sourcePath: "duplicate-key.json" });
  assert.equal(result.ok, false);
  assert.equal(result.source_identity.classification, "malformed");
  assert.equal(result.diagnostics[0].code, "input-json-duplicate-key");
});

test("unsafe reported source paths retain only bounded hashes without echoing text", () => {
  const paths = ["../outside.json", "/absolute.json", "nested/./item.json", "nested//item.json", "nested\\item.json", "C:/outside.json", "file:/outside.json", "a\nb.json", "x".repeat(2048)];
  for (const sourcePath of paths) {
    const result = parseKnowledgeChangeSet(fixture("valid", "complete.json"), { sourcePath });
    assert.equal(result.ok, false);
    assert.equal(result.source_identity.path, "<invalid-path>");
    assert.match(result.source_identity.path_sha256, /^[0-9a-f]{64}$/u);
    assert.equal(result.source_identity.path_size_bytes, Buffer.byteLength(sourcePath));
    assert.equal(JSON.stringify(result).includes(sourcePath), false);
    assert.equal(result.diagnostics[0].code, "source-path-invalid");
  }
});

test("toxic source-path objects cannot escape the total parser", () => {
  const toxic = {};
  Object.defineProperty(toxic, Symbol.toStringTag, { get() { throw new Error("path getter"); } });
  const proxy = new Proxy({}, { get() { throw new Error("proxy getter"); } });
  for (const sourcePath of [toxic, proxy, { ordinary: true }]) {
    let result;
    assert.doesNotThrow(() => { result = parseKnowledgeChangeSet(fixture("valid", "complete.json"), { sourcePath }); });
    assert.equal(result.ok, false);
    assert.equal(result.source_identity.path, "<invalid-path>");
    assert.equal(result.diagnostics[0].code, "source-path-invalid");
  }
});

test("deep inspection failures retain the original supported input identity", () => {
  const deep = `${"[".repeat(20000)}"x"${"]".repeat(20000)}`;
  const result = parseKnowledgeChangeSet(deep, { sourcePath: "deep.json" });
  assert.equal(result.ok, false);
  assert.equal(result.status, "review-required");
  assert.equal(result.source_identity.path, "deep.json");
  assert.equal(result.source_identity.size_bytes, Buffer.byteLength(deep));
  assert.equal(result.source_identity.sha256, computeContentSha256(deep));
  assert.equal(JSON.stringify(result).includes(deep.slice(0, 100)), false);
});

test("truly uninspectable input types use only the bounded fallback identity", () => {
  const toxic = {};
  Object.defineProperty(toxic, Symbol.toStringTag, { get() { throw new Error("input getter"); } });
  const result = parseKnowledgeChangeSet(toxic, { sourcePath: "toxic.input" });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "input-description-failure");
  assert.equal(result.source_identity.path, "toxic.input");
  assert.equal(result.source_identity.size_bytes, Buffer.byteLength("uninspectable-input"));
});

test("a valid chained update binds dependency and prior output hash", () => {
  const value = jsonFixture("valid", "chained-update.json");
  const result = validateKnowledgeChangeSet(value);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  const current = value.operations.at(-1);
  const prior = value.operations.find(({ operation_id }) => operation_id === current.depends_on[0]);
  assert.equal(current.target.expected.sha256, prior.change.sha256);
});

test("input byte ceilings reject over-limit content before materialization while accepting the boundary", () => {
  const exact = Buffer.from("x".repeat(32));
  const atLimit = parseKnowledgeChangeSet(exact, { sourcePath: "limit.json", maxBytes: 32 });
  assert.equal(atLimit.source_identity.size_bytes, 32);
  assert.notEqual(atLimit.diagnostics[0]?.code, "input-oversized");
  const over = parseKnowledgeChangeSet("x".repeat(33), { sourcePath: "limit.json", maxBytes: 32 });
  assert.equal(over.diagnostics[0].code, "input-oversized");
  assert.equal(over.source_identity.size_bytes, 33);
  const cannotWiden = parseKnowledgeChangeSet("x".repeat(DEFAULT_MAX_CHANGE_SET_BYTES + 1), { sourcePath: "limit.json", maxBytes: DEFAULT_MAX_CHANGE_SET_BYTES * 2 });
  assert.equal(cannotWiden.diagnostics[0].code, "input-oversized");
});

test("legacy closeout is retained as legacy review instead of coerced", () => {
  const result = parseKnowledgeChangeSet(fixture("legacy", "tier2-summary.json"), { sourcePath: "legacy.json" });
  assert.equal(result.ok, false);
  assert.equal(result.status, "legacy");
  assert.equal(result.value, null);
  assert.equal(result.diagnostics[0].code, "schema-legacy");
});

test("broken reciprocity, duplicate IDs, stale idempotency, and unsupported verification have stable diagnostics", () => {
  const expected = new Map([
    ["missing-operation-coverage.json", "coverage-capture-not-reciprocal"],
    ["duplicate-capture-id.json", "capture-id-duplicate"],
    ["idempotency-mismatch.json", "operation-idempotency-mismatch"],
    ["verified-without-independent-evidence.json", "verified-claim-independent-evidence-missing"],
    ["capture-selection-mismatch.json", "capture-outside-selection"],
    ["content-target-id-mismatch.json", "operation-content-target-id-mismatch"],
    ["orphan-evidence.json", "evidence-unassociated"],
    ["duplicate-self.json", "duplicate-cover-cycle"],
    ["duplicate-cycle.json", "duplicate-cover-cycle"],
    ["duplicate-review-required-cover.json", "duplicate-cover-nonterminal"],
    ["verified-self-labelled-independent.json", "evidence-independence-self-asserted"],
    ["duplicate-create-operation.json", "operation-idempotency-duplicate"],
    ["conflicting-create-operation.json", "operation-target-chain-precondition-mismatch"],
    ["unchained-update.json", "operation-target-chain-dependency-missing"],
    ["concept-path-conflict.json", "operation-concept-path-conflict"],
    ["path-concept-conflict.json", "operation-path-concept-conflict"],
  ]);
  for (const [name, code] of expected) {
    const result = validateKnowledgeChangeSet(jsonFixture("invalid", name));
    assert.equal(result.ok, false, name);
    assert.ok(result.diagnostics.some((item) => item.code === code), `${name}: ${JSON.stringify(result.diagnostics)}`);
  }
});

if (failures > 0) {
  console.error(`\n${failures} knowledge-change contract test(s) failed.`);
  process.exit(1);
}
console.log("\nAll knowledge-change contract tests passed.");
