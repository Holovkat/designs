import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import validateSchema from "../schema/okf-core-1.0.validator.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";

const TYPE_DIRECTORIES = new Map([
  ["Architecture", "architecture"], ["Component", "components"], ["Domain", "domain"],
  ["Decision", "decisions"], ["Process", "process"], ["Deprecation", "deprecation"],
  ["State", "state"], ["Inbox", "inbox"],
]);
const RELATION_FIELDS = ["depends_on", "implements", "supersedes", "derived_from", "contradicts", "blocked_by"];
const KNOWN_FIELDS = new Set([
  "type", "title", "description", "resource", "tags", "timestamp", "status", "issue_refs", "epic_refs",
  "id", ...RELATION_FIELDS, "decision_status", "deprecated_reason", "deprecated_date", "capture_tier",
  "commit_sha", "branch", "session_id", "rationale_missing", "impact_missing", "assertion_state",
  "generated_at", "generated_by", "source_authority", "evidence_refs", "verified_at", "verification_method",
  "validity_basis", "valid_from", "valid_until", "stale_reason", "source_repository", "approval_required", "approval_ref",
]);
const SESSION_HEADINGS = ["Decisions Made", "What Was Deprecated", "Lessons Learned", "Current State"];
const DEPRECATION_HEADINGS = ["What Was the Issue", "Why It Was Deprecated", "Lessons Learned", "When This Might Be Relevant Again", "What to Watch Out For"];

function sortDiagnostics(items) {
  return items.sort((a, b) =>
    a.path.localeCompare(b.path) || a.severity.localeCompare(b.severity) || a.code.localeCompare(b.code) || (a.field ?? "").localeCompare(b.field ?? "")
  );
}

function severity(mode, strictSeverity = "error") {
  return mode === "strict" || mode === "strict-bundle" ? strictSeverity : "warning";
}

function add(diagnostics, { path, code, message, field = null, mode, strictSeverity = "error", remediation }) {
  diagnostics.push({
    path,
    code,
    severity: severity(mode, strictSeverity),
    field,
    message,
    remediation,
  });
}

function markdownFiles(directory, root, files = [], skippedSymlinks = []) {
  if (!existsSync(directory)) return { files, skippedSymlinks };
  for (const entry of readdirSync(directory).sort()) {
    const full = resolve(directory, entry);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) {
      skippedSymlinks.push(relative(root, full).split(sep).join("/"));
    } else if (stat.isDirectory()) {
      markdownFiles(full, root, files, skippedSymlinks);
    } else if (entry.endsWith(".md") && entry !== "index.md" && entry !== "log.md") {
      files.push(full);
    }
  }
  return { files, skippedSymlinks };
}

function headings(body) {
  return [...body.matchAll(/^# ([^\r\n]+)\r?$/gm)].map((match) => match[1]);
}

function hasHeadings(actual, required) {
  let cursor = 0;
  for (const heading of required) {
    const found = actual.indexOf(heading, cursor);
    if (found < 0) return false;
    cursor = found + 1;
  }
  return true;
}

function insideRoot(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

function isMissingPathError(error) {
  return error?.code === "ENOENT" || error?.code === "ENOTDIR";
}

function resourceDiagnostic(root, record, diagnostics, mode) {
  const resource = record.frontmatter.resource;
  if (typeof resource !== "string" || resource.length === 0 || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(resource)) return;
  const physicalRoot = realpathSync(root);
  const target = resolve(physicalRoot, resource);
  if (!insideRoot(physicalRoot, target)) {
    add(diagnostics, {
      path: record.path, code: "resource-outside-root", field: "resource", mode,
      message: "Repository-local resource resolves outside the selected bundle root.",
      remediation: "Use a repository-root-relative resource or an explicit external URI.",
    });
    return;
  }

  let physicalTarget;
  try {
    // lstat observes a final symlink instead of following it; realpath then
    // resolves both that link and any linked parent directory for confinement.
    lstatSync(target);
    physicalTarget = realpathSync(target);
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
    add(diagnostics, {
      path: record.path, code: "resource-missing", field: "resource", mode, strictSeverity: "warning",
      message: "Repository-local resource does not exist at the selected root.",
      remediation: "Correct the root-relative path or omit the optional resource until a source exists.",
    });
    return;
  }

  if (!insideRoot(physicalRoot, physicalTarget)) {
    add(diagnostics, {
      path: record.path, code: "resource-outside-root", field: "resource", mode,
      message: "Repository-local resource resolves outside the selected bundle root.",
      remediation: "Use a repository-root-relative resource or an explicit external URI.",
    });
  }
}

function bodyDiagnostics(record, diagnostics, mode) {
  const tier = record.frontmatter.capture_tier;
  const required = tier === "commit"
    ? ["Why And How", "Impact"]
    : tier === "session"
      ? SESSION_HEADINGS
      : record.frontmatter.type === "Deprecation"
        ? DEPRECATION_HEADINGS
        : null;
  if (!required) return;
  const actual = headings(record.body);
  if (!hasHeadings(actual, required)) {
    add(diagnostics, {
      path: record.path, code: "body-headings-missing", field: "body", mode,
      message: `${tier ? `Capture tier ${tier}` : `Concept type ${record.frontmatter.type}`} is missing or reordering required body headings: ${required.join(", ")}.`,
      remediation: "Retain the source and add the canonical headings only in a future approved authoring or curation change.",
    });
    return;
  }
  const repeated = required.filter((heading) => actual.filter((value) => value === heading).length !== 1);
  if (repeated.length > 0) {
    add(diagnostics, {
      path: record.path, code: "body-headings-cardinality", field: "body", mode,
      message: `Required body headings must appear exactly once: ${repeated.join(", ")}.`,
      remediation: "Retain history in compatibility mode; correct duplicate canonical sections only in an approved authoring or curation change.",
    });
  }
}

function schemaDiagnostics(record, diagnostics, mode) {
  if (!record.parseable) return;
  const valid = validateSchema(record.frontmatter);
  if (valid) return;
  for (const error of validateSchema.errors ?? []) {
    add(diagnostics, {
      path: record.path,
      code: `schema-${error.keyword}`,
      field: error.instancePath || error.params?.missingProperty || null,
      mode,
      message: error.message ?? "Schema validation failed.",
      remediation: "For new or materially updated records, satisfy the profile field contract; retain historical records unchanged in compatibility mode.",
    });
  }
}

function localDiagnostics(root, record, diagnostics, mode, registeredExtensions) {
  if (!record.parseable) return;
  const expectedDirectory = TYPE_DIRECTORIES.get(record.frontmatter.type);
  const directory = record.relative.split("/")[1];
  if (expectedDirectory && directory !== expectedDirectory && !(record.frontmatter.type === "Inbox" && directory === "inbox")) {
    add(diagnostics, {
      path: record.path, code: "type-directory-mismatch", field: "type", mode,
      message: `Type ${record.frontmatter.type} belongs in knowledge/${expectedDirectory}/, not knowledge/${directory ?? ""}/.`,
      remediation: "Report the mismatch; do not move a retained record automatically.",
    });
  }
  for (const field of Object.keys(record.frontmatter).sort()) {
    if (!KNOWN_FIELDS.has(field) && !registeredExtensions.has(field) && !field.startsWith("x_")) {
      add(diagnostics, {
        path: record.path, code: "extension-unregistered", field, mode, strictSeverity: "warning",
        message: "Unregistered extension key is preserved but outside the portable profile convention.",
        remediation: "Use x_<owner>_<name> for a new portable extension or register the field in a later profile revision.",
      });
    }
  }
  resourceDiagnostic(root, record, diagnostics, mode);
  bodyDiagnostics(record, diagnostics, mode);
}

/**
 * Read-only lint of one explicit repository root. The caller owns root selection
 * and no result changes source files, indexes, hooks, or process state.
 */
export function lintBundle(bundleRoot, { mode = "legacy", strictPaths = [], extensions = [] } = {}) {
  const acceptedModes = new Set(["strict", "legacy", "warning", "strict-new", "strict-bundle"]);
  if (!acceptedModes.has(mode)) throw new Error("mode must be legacy, warning, strict-new, strict-bundle, or strict");
  if (!Array.isArray(strictPaths) || strictPaths.some((path) => typeof path !== "string" || !/^knowledge\/(?:architecture|components|domain|decisions|process|deprecation|state|inbox)\/[^/]+\.md$/.test(path))) {
    throw new Error("strictPaths must contain direct root-relative OKF Markdown records");
  }
  if (mode === "strict-new" && strictPaths.length === 0) throw new Error("strict-new mode requires at least one explicit strict path");
  if (new Set(strictPaths).size !== strictPaths.length) throw new Error("strictPaths must be unique");
  if (!Array.isArray(extensions) || extensions.some((field) => typeof field !== "string" || !/^[a-z][a-z0-9_]*$/.test(field))) {
    throw new Error("extensions must be registered lowercase field names");
  }
  const registeredExtensions = new Set(extensions);
  const strictPathSet = new Set(strictPaths);
  const effectiveMode = (path) => {
    if (mode === "strict" || mode === "strict-bundle") return "strict";
    if (mode === "strict-new" && strictPathSet.has(path)) return "strict";
    return "legacy";
  };
  const root = realpathSync(bundleRoot);
  const knowledge = resolve(root, "knowledge");
  if (!existsSync(knowledge)) throw new Error(`knowledge directory not found under ${root}`);
  const knowledgeStat = lstatSync(knowledge);
  if (knowledgeStat.isSymbolicLink() || !knowledgeStat.isDirectory() || realpathSync(knowledge) !== knowledge) {
    throw new Error(`knowledge must be a physical directory inside the selected root: ${root}`);
  }

  const diagnostics = [];
  const records = [];
  const { files, skippedSymlinks } = markdownFiles(knowledge, root);
  for (const path of skippedSymlinks.sort()) {
    add(diagnostics, {
      path, code: "path-symlink-skipped", field: null, mode: mode === "strict" || mode === "strict-bundle" ? "strict" : "legacy",
      message: "Symlinked path under knowledge was not traversed.",
      remediation: "Keep knowledge content inside the selected root; do not use symlinks to import another filesystem tree.",
    });
  }
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const relativePath = relative(root, file).split(sep).join("/");
    const recordMode = effectiveMode(relativePath);
    const parsed = parseFrontmatter(content, relativePath);
    const record = { path: relativePath, relative: relativePath, body: parsed.body, frontmatter: parsed.frontmatter, parseable: parsed.diagnostics.length === 0 };
    records.push(record);
    for (const item of parsed.diagnostics) {
      add(diagnostics, {
        path: relativePath, code: item.code, field: null, mode: recordMode,
        message: item.message,
        remediation: "Retain the original file and correct it only through an approved authoring or curation action.",
      });
    }
    schemaDiagnostics(record, diagnostics, recordMode);
    localDiagnostics(root, record, diagnostics, recordMode, registeredExtensions);
  }

  if (mode === "strict-new") {
    const scannedPaths = new Set(records.map((record) => record.path));
    const missing = [...strictPathSet].filter((path) => !scannedPaths.has(path));
    if (missing.length > 0) throw new Error(`strict-new paths were not scanned: ${missing.sort().join(", ")}`);
  }

  const ids = new Map();
  for (const record of records.filter((item) => item.parseable && item.frontmatter.type !== "Inbox" && typeof item.frontmatter.id === "string")) {
    const paths = ids.get(record.frontmatter.id) ?? [];
    paths.push(record.path);
    ids.set(record.frontmatter.id, paths);
  }
  for (const [id, paths] of [...ids.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (paths.length > 1) {
      for (const path of paths) {
        add(diagnostics, {
          path, code: "identifier-duplicate", field: "id", mode: effectiveMode(path),
          message: `Stable concept identifier ${id} is duplicated by ${paths.join(", ")}.`,
          remediation: "Do not choose a winner automatically; resolve identity in an operator-reviewed change.",
        });
      }
    }
  }
  for (const record of records.filter((item) => item.parseable)) {
    for (const predicate of RELATION_FIELDS) {
      const targets = record.frontmatter[predicate];
      if (!Array.isArray(targets)) continue;
      for (const target of targets) {
        const targetPaths = ids.get(target);
        if (!targetPaths || targetPaths.length !== 1) {
          add(diagnostics, {
            path: record.path, code: "relationship-unresolved", field: predicate, mode: effectiveMode(record.path), strictSeverity: "warning",
            message: `Relationship target ${target} is not a unique local concept identifier.`,
            remediation: "Keep the literal target and resolve it in a reviewed relationship migration; never fetch or fabricate a target.",
          });
        }
      }
    }
  }

  return {
    root,
    mode,
    profile: "okf-core/1.0",
    strictPaths: [...strictPathSet].sort(),
    extensions: [...registeredExtensions].sort(),
    diagnostics: sortDiagnostics(diagnostics),
    filesChecked: records.length,
  };
}

export function formatText(result) {
  const lines = result.diagnostics.map((item) => `${item.severity.toUpperCase()} ${item.path} ${item.code}${item.field ? ` (${item.field})` : ""}: ${item.message} Remediation: ${item.remediation}`);
  return [...lines, `Checked ${result.filesChecked} record(s) in ${result.mode} mode.`].join("\n");
}
