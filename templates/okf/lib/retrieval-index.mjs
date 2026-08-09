import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve, relative, sep } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { parseKnowledgeChangeSet } from "./knowledge-change-set.mjs";
import { resolveContainedPath, resolveControlPath, validateRoot } from "./run-guard.mjs";

const CONCEPT_DIRECTORIES = Object.freeze(["architecture", "components", "domain", "decisions", "process", "deprecation", "state"]);
const RELATIONSHIPS = Object.freeze(["depends_on", "implements", "supersedes", "derived_from", "contradicts", "blocked_by"]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function posix(root, path) {
  return relative(root, path).split(sep).join("/");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function canonicalRetrievalJson(value) {
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

function scalar(value) {
  if (Array.isArray(value)) return value.map(String);
  return value == null ? null : String(value);
}

function conceptRecords(root, knowledgeDir, diagnostics, sourceFiles) {
  const records = [];
  for (const directory of CONCEPT_DIRECTORIES) {
    const dir = resolve(knowledgeDir, directory);
    if (!existsSync(dir)) continue;
    const dirStat = lstatSync(dir);
    if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) {
      diagnostics.push({ path: posix(root, dir), code: "concept-directory-invalid" });
      continue;
    }
    for (const entry of readdirSync(dir).sort()) {
      if (!entry.endsWith(".md") || entry === "index.md") continue;
      const full = resolve(dir, entry);
      const path = posix(root, full);
      const stat = lstatSync(full);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        diagnostics.push({ path, code: "concept-path-invalid" });
        continue;
      }
      const content = readFileSync(full, "utf8");
      sourceFiles.push({ path, sha256: sha256(Buffer.from(content)) });
      const parsed = parseFrontmatter(content, path);
      for (const item of parsed.diagnostics) diagnostics.push({ path, code: item.code });
      const frontmatter = parsed.frontmatter ?? {};
      if (!frontmatter.id || !frontmatter.type || !frontmatter.title) {
        diagnostics.push({ path, code: "concept-identity-incomplete" });
      }
      const relationships = Object.fromEntries(RELATIONSHIPS.filter((field) => Array.isArray(frontmatter[field])).map((field) => [field, [...frontmatter[field]].map(String).sort()]));
      records.push(Object.freeze({
        record_kind: "concept",
        key: scalar(frontmatter.id) ?? path,
        id: scalar(frontmatter.id),
        path,
        type: scalar(frontmatter.type),
        title: scalar(frontmatter.title),
        description: scalar(frontmatter.description),
        tags: scalar(frontmatter.tags) ?? [],
        lifecycle: scalar(frontmatter.status) ?? "legacy-unspecified",
        assertion_state: scalar(frontmatter.assertion_state) ?? "legacy-unspecified",
        evidence_refs: scalar(frontmatter.evidence_refs) ?? [],
        relationships,
        source_sha256: sha256(Buffer.from(content)),
        search_text: [frontmatter.title, frontmatter.description, ...(Array.isArray(frontmatter.tags) ? frontmatter.tags : []), parsed.body].filter(Boolean).join("\n").toLowerCase(),
      }));
    }
  }
  return records;
}

function sidecarRecords(root, diagnostics, sourceFiles) {
  const records = [];
  const inbox = resolveContainedPath(root, "knowledge/inbox");
  for (const entry of readdirSync(inbox.full).sort()) {
    if (!entry.endsWith(".change.json")) continue;
    const full = resolve(inbox.full, entry);
    const path = posix(root, full);
    const stat = lstatSync(full);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      diagnostics.push({ path, code: "change-sidecar-path-invalid" });
      continue;
    }
    const content = readFileSync(full);
    sourceFiles.push({ path, sha256: sha256(content) });
    const parsed = parseKnowledgeChangeSet(content, { sourcePath: path });
    if (!parsed.ok) {
      for (const item of parsed.diagnostics) diagnostics.push({ path, code: item.code });
      continue;
    }
    const changeSet = parsed.value;
    for (const capture of changeSet.captures) {
      records.push(Object.freeze({
        record_kind: "capture-disposition",
        key: `${changeSet.change_set_id}:${capture.capture_id}`,
        id: capture.capture_id,
        path,
        type: capture.disposition.type,
        title: capture.capture_id,
        description: capture.disposition.reason ?? null,
        tags: [],
        lifecycle: capture.disposition.type === "review-required" ? "pending" : "proposed",
        assertion_state: "proposed",
        evidence_refs: [],
        relationships: { operation_ids: [...capture.disposition.operation_ids] },
        source_sha256: capture.source.sha256,
        search_text: [capture.capture_id, capture.disposition.type, capture.disposition.reason ?? "", capture.source.path].join("\n").toLowerCase(),
      }));
    }
    for (const evidence of changeSet.evidence) {
      records.push(Object.freeze({
        record_kind: "evidence",
        key: `${changeSet.change_set_id}:${evidence.evidence_id}`,
        id: evidence.evidence_id,
        path,
        type: evidence.kind,
        title: evidence.evidence_id,
        description: evidence.authority_ref,
        tags: [],
        lifecycle: "proposed",
        assertion_state: evidence.independence,
        evidence_refs: [evidence.locator],
        relationships: {},
        source_sha256: evidence.sha256,
        search_text: [evidence.evidence_id, evidence.kind, evidence.locator, evidence.authority_ref, evidence.produced_by].join("\n").toLowerCase(),
      }));
    }
  }
  return records;
}

function reverseRelationships(records) {
  const inverse = new Map();
  for (const record of records.filter(({ record_kind }) => record_kind === "concept")) {
    for (const [predicate, targets] of Object.entries(record.relationships)) {
      for (const target of targets) {
        const entries = inverse.get(target) ?? [];
        entries.push({ predicate, source: record.id ?? record.path });
        inverse.set(target, entries);
      }
    }
  }
  return Object.fromEntries([...inverse.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([target, entries]) => [target, entries.sort((left, right) => left.predicate.localeCompare(right.predicate) || left.source.localeCompare(right.source))]));
}

export function buildRetrievalIndex(rootCandidate) {
  const guarded = validateRoot(rootCandidate);
  const diagnostics = [];
  const sourceFiles = [];
  const records = [...conceptRecords(guarded.root, guarded.knowledgeDir, diagnostics, sourceFiles), ...sidecarRecords(guarded.root, diagnostics, sourceFiles)]
    .sort((left, right) => left.record_kind.localeCompare(right.record_kind) || left.key.localeCompare(right.key));
  diagnostics.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
  sourceFiles.sort((left, right) => left.path.localeCompare(right.path));
  const knowledgeTreeSha256 = sha256(canonicalRetrievalJson(sourceFiles));
  const dirty = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", "knowledge"], { cwd: guarded.root }).length > 0;
  return Object.freeze({
    version: "okf-retrieval-index/1",
    repository_root: guarded.root,
    revision: guarded.revision,
    revision_label: dirty ? `${guarded.revision}+working-tree:${knowledgeTreeSha256.slice(0, 16)}` : guarded.revision,
    source_state: dirty ? "working-tree" : "committed",
    knowledge_tree_sha256: knowledgeTreeSha256,
    source_files: Object.freeze(sourceFiles),
    record_count: records.length,
    records: Object.freeze(records),
    reverse_relationships: Object.freeze(reverseRelationships(records)),
    diagnostics: Object.freeze(diagnostics),
  });
}

export function writeRetrievalIndex(rootCandidate, outputPath = ".okf/cache/okf-retrieval-index.json") {
  const index = buildRetrievalIndex(rootCandidate);
  const output = resolveControlPath(index.repository_root, outputPath);
  mkdirSync(dirname(output.full), { recursive: true });
  const content = canonicalRetrievalJson(index);
  const temporary = `${output.full}.${process.pid}.tmp`;
  writeFileSync(temporary, content, { flag: "wx", mode: 0o600 });
  renameSync(temporary, output.full);
  return Object.freeze({ path: outputPath, bytes: Buffer.byteLength(content), sha256: sha256(content), revision: index.revision, record_count: index.record_count, diagnostic_count: index.diagnostics.length });
}

export function loadRetrievalIndex(rootCandidate, inputPath = ".okf/cache/okf-retrieval-index.json") {
  const guarded = validateRoot(rootCandidate);
  const input = resolveContainedPath(guarded.root, inputPath);
  const index = JSON.parse(readFileSync(input.full, "utf8"));
  if (index.version !== "okf-retrieval-index/1" || !Array.isArray(index.records) || !Array.isArray(index.diagnostics)) fail("retrieval-index-invalid", "retrieval index has an unsupported shape");
  if (index.repository_root !== guarded.root || !/^[0-9a-f]{64}$/u.test(index.knowledge_tree_sha256 ?? "")) fail("retrieval-index-binding-invalid", "retrieval index is not bound to this repository and knowledge tree");
  const current = buildRetrievalIndex(guarded.root);
  const staleReasons = [];
  if (index.revision !== current.revision) staleReasons.push("revision-changed");
  if (index.knowledge_tree_sha256 !== current.knowledge_tree_sha256) staleReasons.push("knowledge-tree-changed");
  return Object.freeze({
    ...index,
    stale: staleReasons.length > 0,
    stale_reasons: Object.freeze(staleReasons),
    current_revision: current.revision,
    current_revision_label: current.revision_label,
    current_knowledge_tree_sha256: current.knowledge_tree_sha256,
  });
}

function relationshipMatch(record, value, reverseRelationships) {
  const [predicate, target = null] = value.split("=", 2);
  if (predicate === "reverse") return target != null && (reverseRelationships[target] ?? []).some(({ source }) => source === record.id || source === record.path);
  const targets = record.relationships[predicate] ?? [];
  return target == null ? targets.length > 0 : targets.includes(target);
}

export function queryRetrievalIndex(index, selectors = {}) {
  if (index.stale && selectors.allow_stale !== true) fail("retrieval-index-stale", `index revision ${index.revision} differs from current ${index.current_revision}`);
  const topK = selectors.top_k ?? 20;
  const maxBytes = selectors.max_bytes ?? 64 * 1024;
  if (!Number.isSafeInteger(topK) || topK <= 0 || topK > 100) fail("retrieval-top-k-invalid", "top_k must be between 1 and 100");
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > 16 * 1024 * 1024) fail("retrieval-byte-limit-invalid", "max_bytes must be positive and bounded");
  const terms = Array.isArray(selectors.terms) ? selectors.terms.map((term) => String(term).toLowerCase()) : [];
  const relationships = Array.isArray(selectors.relationships) ? selectors.relationships : [];
  let results = index.records.filter((record) => {
    if (selectors.id && record.id !== selectors.id) return false;
    if (selectors.record_kind && record.record_kind !== selectors.record_kind) return false;
    if (selectors.type && record.type !== selectors.type) return false;
    if (selectors.lifecycle && record.lifecycle !== selectors.lifecycle) return false;
    if (selectors.assertion_state && record.assertion_state !== selectors.assertion_state) return false;
    if (selectors.evidence && !record.evidence_refs.some((item) => String(item).includes(selectors.evidence))) return false;
    if (terms.length > 0 && !terms.every((term) => record.search_text.includes(term))) return false;
    if (relationships.length > 0 && !relationships.every((value) => relationshipMatch(record, value, index.reverse_relationships))) return false;
    return true;
  });
  results = results.sort((left, right) => left.record_kind.localeCompare(right.record_kind) || left.key.localeCompare(right.key));
  const selected = [];
  let bytes = 0;
  for (const record of results.slice(0, topK)) {
    const publicRecord = { ...record };
    delete publicRecord.search_text;
    const encoded = Buffer.byteLength(JSON.stringify(publicRecord));
    if (bytes + encoded > maxBytes) break;
    bytes += encoded;
    selected.push(Object.freeze(publicRecord));
  }
  return Object.freeze({
    version: "okf-retrieval-query/1",
    revision: index.revision,
    revision_label: index.revision_label,
    source_state: index.source_state,
    knowledge_tree_sha256: index.knowledge_tree_sha256,
    stale: index.stale,
    stale_reasons: index.stale_reasons,
    total_matches: results.length,
    returned: selected.length,
    result_bytes: bytes,
    diagnostics: index.diagnostics,
    results: Object.freeze(selected),
  });
}
