import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { lintBundle } from "./lint.mjs";
import { resolveContainedPath } from "./run-guard.mjs";

const PREFLIGHT_BLOCKING_CODES = Object.freeze(new Set([
  "body-headings-missing",
  "frontmatter-empty",
  "frontmatter-not-mapping",
  "frontmatter-unclosed",
  "schema-const",
  "schema-enum",
  "schema-type",
  "type-directory-mismatch",
  "yaml-conversion-error",
  "yaml-duplicate-key",
  "yaml-parse-error",
  "yaml-unsafe-alias",
]));
const LEGACY_BRANCH_NOISE = Object.freeze(new Set([
  "schema-type:/commit_sha",
]));
const STABLE_ID_PATTERN = /^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function sorted(diagnostics) {
  return [...diagnostics].sort((left, right) =>
    left.path.localeCompare(right.path) || left.code.localeCompare(right.code) || (left.field ?? "").localeCompare(right.field ?? "")
  );
}

function project(result, paths) {
  const selected = new Set(paths);
  return sorted(result.diagnostics.filter((diagnostic) => selected.has(diagnostic.path)));
}

function generatedMetadataDiagnostics(root, paths) {
  const diagnostics = [];
  for (const path of paths) {
    const target = resolveContainedPath(root, path);
    const parsed = parseFrontmatter(readFileSync(target.full, "utf8"), path);
    if (parsed.diagnostics.length > 0) continue;
    if (typeof parsed.frontmatter.generated_at !== "string" || parsed.frontmatter.generated_at.trim() === "") {
      diagnostics.push({
        path, code: "curator-generated-at-missing", field: "generated_at", severity: "error",
        message: "Curator-generated concepts require generated_at provenance.",
        remediation: "Add the bounded generation timestamp to the authored proposal output.",
      });
    }
    if (typeof parsed.frontmatter.generated_by !== "string" || parsed.frontmatter.generated_by.trim() === "") {
      diagnostics.push({
        path, code: "curator-generated-by-missing", field: "generated_by", severity: "error",
        message: "Curator-generated concepts require generated_by provenance.",
        remediation: "Identify the operator-authorized curator mechanism in the proposal output.",
      });
    }
    if (parsed.frontmatter.generation_method !== "curator") {
      diagnostics.push({
        path, code: "curator-generation-method-invalid", field: "generation_method", severity: "error",
        message: "Curator-generated concepts must identify curator as the generation mechanism.",
        remediation: "Set generation_method: curator while keeping generated_by as the named producer.",
      });
    }
  }
  return diagnostics;
}

function maintenanceError(path, code, message, remediation) {
  return { path, code, field: null, severity: "error", message, remediation };
}

function markdownLink(content, target) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\]\\(${escaped}(?:[#?][^)]*)?\\)`, "u").test(content);
}

/**
 * Validate the non-concept half of a curator proposal. Indexes and log.md are
 * intentionally outside the concept linter, so the executor must bind their
 * minimum navigability and audit invariants separately before source
 * finalization.
 */
export function validateCurationMaintenance(root, maintenancePaths, {
  conceptPaths = [], itemPaths = [], revision = null,
} = {}) {
  const diagnostics = [];
  const documents = new Map();
  for (const path of maintenancePaths) {
    const target = resolveContainedPath(root, path);
    const content = readFileSync(target.full, "utf8");
    documents.set(path, content);
    const headings = [...content.matchAll(/^# ([^\r\n]+)\r?$/gmu)];
    if (path.endsWith("/index.md")
      && (headings.length !== 1 || content.slice(0, headings[0]?.index ?? 0).trim() !== "")) {
      diagnostics.push(maintenanceError(
        path,
        "maintenance-h1-invalid",
        "Maintenance Markdown must start with exactly one non-empty level-one heading.",
        "Restore the canonical index or log heading before submitting the bounded proposal.",
      ));
    }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(content)) {
      diagnostics.push(maintenanceError(
        path,
        "maintenance-control-character",
        "Maintenance Markdown contains a disallowed control character.",
        "Remove non-text control bytes from the proposed index or log output.",
      ));
    }
  }

  const rootIndex = documents.get("knowledge/index.md");
  if (rootIndex != null) {
    const requiredIndexes = new Set(["knowledge/inbox/index.md", ...conceptPaths.map((path) => `${dirname(path)}/index.md`)]);
    for (const indexPath of [...requiredIndexes].sort()) {
      const relativeTarget = `./${indexPath.slice("knowledge/".length)}`;
      if (!markdownLink(rootIndex, relativeTarget)) {
        diagnostics.push(maintenanceError(
          "knowledge/index.md",
          "root-index-link-missing",
          `Root index must retain a Markdown link to ${relativeTarget}.`,
          "Include every affected type index and the inbox index in the root navigation table.",
        ));
      }
    }
  }

  for (const conceptPath of conceptPaths) {
    const indexPath = `${dirname(conceptPath)}/index.md`;
    const index = documents.get(indexPath);
    const relativeTarget = `./${basename(conceptPath)}`;
    if (index != null && !markdownLink(index, relativeTarget)) {
      diagnostics.push(maintenanceError(
        indexPath,
        "concept-index-link-missing",
        `Affected type index must link to ${relativeTarget}.`,
        "Add the curated concept to its type index using a root-contained relative Markdown link.",
      ));
    }
  }

  const inboxIndex = documents.get("knowledge/inbox/index.md");
  if (inboxIndex != null) {
    for (const itemPath of itemPaths) {
      const relativeTarget = `./${basename(itemPath)}`;
      if (markdownLink(inboxIndex, relativeTarget)) {
        diagnostics.push(maintenanceError(
          "knowledge/inbox/index.md",
          "inbox-index-finalized-link-retained",
          `Inbox index still links to the selected source ${relativeTarget}.`,
          "Remove only the exact selected source row from the pending inbox index.",
        ));
      }
    }
  }

  const log = documents.get("knowledge/log.md");
  if (log != null) {
    if (!/^## [^\r\n]+\r?$/mu.test(log)) {
      diagnostics.push(maintenanceError(
        "knowledge/log.md",
        "curation-log-entry-missing",
        "Curation log output must contain a level-two audit entry.",
        "Add one reverse-chronological bounded-curation entry below the log heading.",
      ));
    }
    if (revision && !log.includes(revision)) {
      diagnostics.push(maintenanceError(
        "knowledge/log.md",
        "curation-log-revision-missing",
        "Curation log output must bind the exact approved Git revision.",
        "Record the full approved revision in the bounded curation log entry.",
      ));
    }
    for (const conceptPath of conceptPaths) {
      if (!log.includes(conceptPath)) {
        diagnostics.push(maintenanceError(
          "knowledge/log.md",
          "curation-log-output-missing",
          `Curation log output must name ${conceptPath}.`,
          "List every curated concept path in the bounded curation log entry.",
        ));
      }
    }
  }

  return Object.freeze({
    mode: "strict",
    files_checked: maintenancePaths.length,
    diagnostics: Object.freeze(sorted(diagnostics)),
    ok: diagnostics.length === 0,
  });
}

function combinedValidation(primary, maintenance) {
  const diagnostics = sorted([...primary.diagnostics, ...maintenance.diagnostics]);
  return Object.freeze({
    mode: "strict",
    files_checked: primary.files_checked + maintenance.files_checked,
    diagnostics: Object.freeze(diagnostics),
    ok: primary.ok && maintenance.ok,
  });
}

function preflightBlocking(diagnostic, frontmatter) {
  const legacyInbox = typeof frontmatter?.type === "string" && frontmatter.type.toLowerCase() === "inbox";
  if (LEGACY_BRANCH_NOISE.has(`${diagnostic.code}:${diagnostic.field ?? ""}`)) return false;
  if (legacyInbox && diagnostic.code === "schema-enum" && diagnostic.field === "/type") return false;
  if (PREFLIGHT_BLOCKING_CODES.has(diagnostic.code)) return true;
  if (diagnostic.code === "schema-required") {
    const compatibleMissing = legacyInbox
      ? new Set(["assertion_state", "capture_tier", "description", "evidence_refs", "generated_at", "generated_by", "generation_method", "id", "source_authority", "status", "timestamp"])
      : new Set(["capture_tier", "generated_at", "generated_by"]);
    return !compatibleMissing.has(diagnostic.field);
  }
  return false;
}

/**
 * C2-compatible warning-first validation of selected retained inbox inputs.
 * Legacy capture/generation provenance absence remains compatible; malformed
 * structure blocks only that bounded batch and never rewrites or removes the
 * source.
 */
export function validateCurationPreflight(root, itemPaths) {
  const result = lintBundle(root, { mode: "legacy" });
  const frontmatter = new Map(itemPaths.map((path) => {
    const target = resolveContainedPath(root, path);
    return [path, parseFrontmatter(readFileSync(target.full, "utf8"), path).frontmatter];
  }));
  const diagnostics = project(result, itemPaths).map((diagnostic) => Object.freeze({
    ...diagnostic,
    blocking: preflightBlocking(diagnostic, frontmatter.get(diagnostic.path)),
  }));
  return Object.freeze({
    mode: "legacy",
    files_checked: itemPaths.length,
    diagnostics: Object.freeze(diagnostics),
    ok: diagnostics.every((diagnostic) => !diagnostic.blocking),
  });
}

/** Preserve semantic identity and replacement direction across curator moves and updates. */
export function validateCurationIdentity(root, conceptOutputs) {
  const diagnostics = [];
  const proposed = conceptOutputs.map((output) => ({
    output,
    parsed: parseFrontmatter(output.content, output.path),
  }));
  for (const item of proposed) {
    if (item.parsed.diagnostics.length > 0) continue;
    const sourcePath = item.output.replaces_path ?? (item.output.expected_sha256 ? item.output.path : null);
    if (!sourcePath) continue;
    const source = resolveContainedPath(root, sourcePath);
    const prior = parseFrontmatter(readFileSync(source.full, "utf8"), sourcePath);
    if (prior.diagnostics.length > 0) continue;
    const previousId = prior.frontmatter.id;
    if (STABLE_ID_PATTERN.test(previousId ?? "") && item.parsed.frontmatter.id !== previousId) {
      diagnostics.push({
        path: item.output.path, code: "curator-identifier-changed", field: "id", severity: "error",
        message: `Curator output changed stable identity ${previousId} during an update or move.`,
        remediation: "Keep the original ID while changing paths, lifecycle state, or body content.",
      });
    }
    if (prior.frontmatter.type !== "Deprecation" && item.parsed.frontmatter.type === "Deprecation") {
      const oldId = item.parsed.frontmatter.id;
      const replacement = proposed.some((candidate) => candidate !== item
        && candidate.parsed.diagnostics.length === 0
        && candidate.parsed.frontmatter.type !== "Deprecation"
        && Array.isArray(candidate.parsed.frontmatter.supersedes)
        && candidate.parsed.frontmatter.supersedes.includes(oldId));
      if (!replacement) {
        diagnostics.push({
          path: item.output.path, code: "curator-deprecation-replacement-missing", field: "supersedes", severity: "error",
          message: `Deprecated concept ${oldId ?? "<missing-id>"} has no replacement-to-old supersedes relationship in the bounded output set.`,
          remediation: "Include the active replacement with supersedes: [<old-id>] in the same proposal.",
        });
      }
    }
  }
  return Object.freeze({
    mode: "strict",
    files_checked: conceptOutputs.length,
    diagnostics: Object.freeze(sorted(diagnostics)),
    ok: diagnostics.length === 0,
  });
}

/** Validate generated concept files in an isolated repository-local shadow. */
export function validateCurationStaging(shadowRoot, conceptPaths, maintenancePaths = [], context = {}) {
  const result = lintBundle(shadowRoot, { mode: "strict" });
  const identity = context.sourceRoot && Array.isArray(context.conceptOutputs)
    ? validateCurationIdentity(context.sourceRoot, context.conceptOutputs)
    : { diagnostics: [] };
  const diagnostics = sorted([...project(result, conceptPaths), ...generatedMetadataDiagnostics(shadowRoot, conceptPaths), ...identity.diagnostics]);
  const concepts = Object.freeze({
    mode: "strict",
    files_checked: conceptPaths.length,
    diagnostics: Object.freeze(diagnostics),
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
  });
  return combinedValidation(concepts, validateCurationMaintenance(shadowRoot, maintenancePaths, { ...context, conceptPaths }));
}

/**
 * Postflight validation runs against the real bundle after atomic upsert and
 * before any inbox source is finalized. Existing unrelated legacy findings do
 * not mask or excuse errors on the bounded changed paths.
 */
export function validateCurationPostflight(root, conceptPaths, maintenancePaths = [], context = {}) {
  const result = lintBundle(root, { mode: "strict" });
  const diagnostics = sorted([...project(result, conceptPaths), ...generatedMetadataDiagnostics(root, conceptPaths)]);
  const concepts = Object.freeze({
    mode: "strict",
    files_checked: conceptPaths.length,
    diagnostics: Object.freeze(diagnostics),
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
  });
  return combinedValidation(concepts, validateCurationMaintenance(root, maintenancePaths, { ...context, conceptPaths }));
}
