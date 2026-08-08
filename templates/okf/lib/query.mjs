import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { validateRoot } from "./run-guard.mjs";

export const RELATIONSHIP_FIELDS = Object.freeze([
  "blocked_by",
  "contradicts",
  "depends_on",
  "derived_from",
  "implements",
  "supersedes",
]);

export const ASSERTION_STATES = Object.freeze([
  "historical",
  "inferred",
  "legacy-unspecified",
  "proposed",
  "stale",
  "verified",
]);

export const LIFECYCLE_STATUSES = Object.freeze([
  "active",
  "blocked",
  "deprecated",
  "in-progress",
  "legacy-unspecified",
]);

export const VALIDATION_STATUSES = Object.freeze([
  "strict",
  "legacy-compatible",
  "retained-nonconformant",
]);

const ALL_SCOPE_DIRECTORIES = Object.freeze([
  "architecture",
  "components",
  "domain",
  "decisions",
  "process",
  "deprecation",
  "state",
]);
const DECISION_SCOPE_DIRECTORIES = Object.freeze(["decisions", "deprecation"]);
const RELATIONSHIP_SET = new Set(RELATIONSHIP_FIELDS);
const ASSERTION_SET = new Set(ASSERTION_STATES);
const LIFECYCLE_SET = new Set(LIFECYCLE_STATUSES);
const VALIDATION_ALIASES = new Map([
  ["conformant", "strict"],
  ["error", "retained-nonconformant"],
  ["invalid", "retained-nonconformant"],
  ["legacy-compatible", "legacy-compatible"],
  ["retained-nonconformant", "retained-nonconformant"],
  ["strict", "strict"],
  ["valid", "strict"],
  ["warning", "legacy-compatible"],
  ["warnings", "legacy-compatible"],
]);

export class QueryError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new QueryError(code, message);
}

function posixRelative(root, path) {
  return relative(root, path).split(sep).join("/");
}

function scalar(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `[${value.map((item) => scalar(item)).join(", ")}]`;
  if (["boolean", "number", "bigint"].includes(typeof value)) return String(value);
  return JSON.stringify(value);
}

function compilePattern(values, label) {
  if (values.length === 0) return null;
  try {
    return new RegExp(values.join("|"), "i");
  } catch (error) {
    fail("query-pattern-invalid", `${label} contains an invalid regular expression: ${error.message}`);
  }
}

function normalizeStringArray(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    fail("query-option-invalid", `${label} must be an array of non-empty strings`);
  }
  return [...new Set(value)];
}

export function parseRelationshipFilter(value) {
  if (typeof value !== "string" || value.length === 0) {
    fail("relationship-filter-invalid", "relationship filters must be non-empty");
  }
  const separator = value.indexOf("=");
  const rawPredicate = separator < 0 ? value : value.slice(0, separator);
  const target = separator < 0 ? null : value.slice(separator + 1);
  const predicate = rawPredicate === "any" ? "*" : rawPredicate;
  if (predicate !== "*" && !RELATIONSHIP_SET.has(predicate)) {
    fail("relationship-predicate-invalid", `relationship predicate must be one of: ${RELATIONSHIP_FIELDS.join(", ")}, *`);
  }
  if (separator >= 0 && target.length === 0) {
    fail("relationship-target-invalid", "relationship target after '=' must be non-empty");
  }
  if (predicate === "*" && target === null) {
    fail("relationship-target-missing", "the '*' relationship predicate requires a target");
  }
  return Object.freeze({ predicate, target });
}

function normalizeOptions(options = {}) {
  const terms = normalizeStringArray(options.terms, "terms");
  const assertionStates = normalizeStringArray(options.assertionStates, "assertionStates");
  const evidence = normalizeStringArray(options.evidence, "evidence");
  const statuses = normalizeStringArray(options.statuses, "statuses");
  const rawValidationStatuses = normalizeStringArray(options.validationStatuses, "validationStatuses");
  const relationshipValues = normalizeStringArray(options.relationships, "relationships");
  for (const value of assertionStates) {
    if (!ASSERTION_SET.has(value)) fail("assertion-state-invalid", `assertion state must be one of: ${ASSERTION_STATES.join(", ")}`);
  }
  for (const value of statuses) {
    if (!LIFECYCLE_SET.has(value)) fail("lifecycle-status-invalid", `lifecycle status must be one of: ${LIFECYCLE_STATUSES.join(", ")}`);
  }
  const validationStatuses = rawValidationStatuses.map((value) => {
    const canonical = VALIDATION_ALIASES.get(value);
    if (!canonical) fail("validation-status-invalid", `validation status must be one of: ${VALIDATION_STATUSES.join(", ")}`);
    return canonical;
  });
  const relationships = relationshipValues.map(parseRelationshipFilter);
  const hasEvidence = options.hasEvidence === true;
  const decisionsOnly = options.decisionsOnly === true;
  if (terms.length === 0 && assertionStates.length === 0 && evidence.length === 0 && statuses.length === 0 && validationStatuses.length === 0 && relationships.length === 0 && !hasEvidence) {
    fail("query-empty", "at least one text term or semantic filter is required");
  }
  return Object.freeze({
    assertionStates: Object.freeze(assertionStates),
    decisionsOnly,
    evidence: Object.freeze(evidence),
    hasEvidence,
    relationships: Object.freeze(relationships),
    statuses: Object.freeze(statuses),
    terms: Object.freeze(terms),
    validationStatuses: Object.freeze([...new Set(validationStatuses)]),
  });
}

function conceptFiles(root, knowledgeDir, decisionsOnly) {
  const directories = decisionsOnly ? DECISION_SCOPE_DIRECTORIES : ALL_SCOPE_DIRECTORIES;
  const files = [];
  for (const directory of directories) {
    const fullDirectory = resolve(knowledgeDir, directory);
    let directoryStat;
    try {
      directoryStat = lstatSync(fullDirectory);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) continue;
    for (const entry of readdirSync(fullDirectory).sort()) {
      if (!entry.endsWith(".md") || entry === "index.md") continue;
      const file = resolve(fullDirectory, entry);
      const stat = lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) continue;
      files.push(Object.freeze({ file, path: posixRelative(root, file) }));
    }
  }
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function relationshipMap(frontmatter) {
  return Object.fromEntries(RELATIONSHIP_FIELDS
    .filter((field) => Array.isArray(frontmatter[field]))
    .map((field) => [field, [...frontmatter[field]]]));
}

function relationshipMatches(frontmatter, filter) {
  const predicates = filter.predicate === "*" ? RELATIONSHIP_FIELDS : [filter.predicate];
  return predicates.some((predicate) => {
    const targets = frontmatter[predicate];
    if (!Array.isArray(targets) || targets.length === 0) return false;
    return filter.target === null || targets.some((target) => String(target) === filter.target);
  });
}

function stateValue(frontmatter, field) {
  return typeof frontmatter[field] === "string" && frontmatter[field].length > 0
    ? frontmatter[field]
    : "legacy-unspecified";
}

function isRetainedNonconformant(diagnostic) {
  if (diagnostic.code.startsWith("yaml-") || diagnostic.code.startsWith("frontmatter-")) return true;
  if (["body-headings-missing", "type-directory-mismatch"].includes(diagnostic.code)) return true;
  if (["type", "/type"].includes(diagnostic.field) && ["schema-enum", "schema-required", "schema-type"].includes(diagnostic.code)) return true;
  return false;
}

function classifyValidation(record, diagnostics) {
  if (record.parseDiagnostics.length > 0 || diagnostics.some(isRetainedNonconformant)) return "retained-nonconformant";
  return diagnostics.length > 0 ? "legacy-compatible" : "strict";
}

async function validationByPath(root, records) {
  let lintBundle;
  try {
    ({ lintBundle } = await import("./lint.mjs"));
  } catch (error) {
    fail("validation-unavailable", `validation status is unavailable from the packaged local runtime: ${error.message}`);
  }
  let lintResult;
  try {
    lintResult = lintBundle(root, { mode: "strict" });
  } catch (error) {
    fail("validation-unavailable", `validation status could not be computed locally: ${error.message}`);
  }
  const diagnosticsByPath = new Map();
  for (const diagnostic of lintResult.diagnostics) {
    const items = diagnosticsByPath.get(diagnostic.path) ?? [];
    items.push(diagnostic);
    diagnosticsByPath.set(diagnostic.path, items);
  }
  return new Map(records.map((record) => {
    const diagnostics = diagnosticsByPath.get(record.path) ?? [];
    return [record.path, Object.freeze({
      codes: Object.freeze([...new Set(diagnostics.map(({ code }) => code))].sort()),
      status: classifyValidation(record, diagnostics),
    })];
  }));
}

function matchesSemanticFilters(record, options, validation, evidencePattern) {
  const { frontmatter } = record;
  if (options.relationships.length > 0 && !options.relationships.every((filter) => relationshipMatches(frontmatter, filter))) return false;
  if (options.assertionStates.length > 0 && !options.assertionStates.includes(stateValue(frontmatter, "assertion_state"))) return false;
  if (options.statuses.length > 0 && !options.statuses.includes(stateValue(frontmatter, "status"))) return false;
  const evidenceRefs = Array.isArray(frontmatter.evidence_refs) ? frontmatter.evidence_refs.map((item) => String(item)) : [];
  if (options.hasEvidence && evidenceRefs.length === 0) return false;
  if (evidencePattern && !evidenceRefs.some((item) => evidencePattern.test(item))) return false;
  if (options.validationStatuses.length > 0 && !options.validationStatuses.includes(validation?.status)) return false;
  return true;
}

function outputRecord(record, matched, validation) {
  const { frontmatter } = record;
  return Object.freeze({
    assertion_state: stateValue(frontmatter, "assertion_state"),
    description: scalar(frontmatter.description),
    evidence_refs: Object.freeze(Array.isArray(frontmatter.evidence_refs) ? frontmatter.evidence_refs.map((item) => String(item)) : []),
    matched,
    path: record.path,
    relationships: Object.freeze(relationshipMap(frontmatter)),
    status: stateValue(frontmatter, "status"),
    tags: scalar(frontmatter.tags),
    title: scalar(frontmatter.title),
    type: scalar(frontmatter.type),
    validation_codes: Object.freeze(validation?.codes ?? []),
    validation_status: validation?.status ?? null,
  });
}

/**
 * Query one explicitly selected Git repository. The implementation reads only
 * direct concept files, never follows symlinks, and never mutates the bundle.
 */
export async function queryBundle(bundleRoot, rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  const guarded = validateRoot(bundleRoot);
  const textPattern = compilePattern(options.terms, "text query");
  const evidencePattern = compilePattern(options.evidence, "evidence filter");
  const files = conceptFiles(guarded.root, guarded.knowledgeDir, options.decisionsOnly);
  const records = files.map(({ file, path }) => {
    const content = readFileSync(file, "utf8");
    const parsed = parseFrontmatter(content, path);
    return Object.freeze({
      body: parsed.body,
      frontmatter: parsed.frontmatter,
      parseDiagnostics: Object.freeze(parsed.diagnostics),
      path,
      rawFrontmatter: parsed.rawFrontmatter,
    });
  });
  const validations = options.validationStatuses.length > 0
    ? await validationByPath(guarded.root, records)
    : new Map();
  const results = [];
  for (const record of records) {
    const frontmatterMatch = textPattern ? textPattern.test(record.rawFrontmatter) : false;
    const bodyMatch = textPattern ? textPattern.test(record.body) : false;
    if (textPattern && !frontmatterMatch && !bodyMatch) continue;
    const validation = validations.get(record.path) ?? null;
    if (!matchesSemanticFilters(record, options, validation, evidencePattern)) continue;
    const matched = textPattern ? (frontmatterMatch ? "frontmatter" : "body") : "filter";
    results.push(outputRecord(record, matched, validation));
  }
  results.sort((left, right) => {
    const rank = { frontmatter: 0, body: 1, filter: 0 };
    return rank[left.matched] - rank[right.matched] || left.path.localeCompare(right.path);
  });
  return Object.freeze({
    count: results.length,
    query: Object.freeze({
      assertion_states: options.assertionStates,
      decisions_only: options.decisionsOnly,
      evidence: options.evidence,
      has_evidence: options.hasEvidence,
      relationships: Object.freeze(options.relationships.map(({ predicate, target }) => target === null ? predicate : `${predicate}=${target}`)),
      statuses: options.statuses,
      terms: options.terms,
      validation_statuses: options.validationStatuses,
    }),
    results: Object.freeze(results),
    root: guarded.root,
  });
}

export function formatQueryText(result) {
  const lines = [];
  for (const item of result.results) {
    lines.push("----------------------------------------");
    lines.push(`title:  ${item.title}`);
    lines.push(`type:   ${item.type}   status: ${item.status}`);
    lines.push(`desc:   ${item.description}`);
    lines.push(`tags:   ${item.tags}`);
    lines.push(`assertion: ${item.assertion_state}${item.validation_status ? `   validation: ${item.validation_status}` : ""}`);
    if (item.evidence_refs.length > 0) lines.push(`evidence: [${item.evidence_refs.join(", ")}]`);
    const relationships = Object.entries(item.relationships)
      .map(([predicate, targets]) => `${predicate}=[${targets.join(", ")}]`)
      .join(" ");
    if (relationships.length > 0) lines.push(`relationships: ${relationships}`);
    lines.push(`path:   ${item.path}   (matched: ${item.matched})`);
  }
  return lines.join("\n");
}
