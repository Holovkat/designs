import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { readKillSwitch } from "./run-control.mjs";
import { RunGuardError, resolveContainedPath, validateRoot } from "./run-guard.mjs";
import { readLock } from "./run-lock.mjs";

const DAY_SECONDS = 24 * 60 * 60;
const STALE_AFTER_SECONDS = 30 * DAY_SECONDS;
const OVERSIZED_AFTER_BYTES = 16 * 1024;
const CATEGORY_ORDER = Object.freeze([
  "malformed",
  "duplicate",
  "oversized",
  "low-signal",
  "provenance-warning",
  "stale",
  "needs-human-review",
  "actionable",
]);
const COMMIT_HEADINGS = Object.freeze(["Why And How", "Impact"]);
const SESSION_HEADINGS = Object.freeze(["Decisions Made", "What Was Deprecated", "Lessons Learned", "Current State"]);

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseAsOf(value) {
  if (value == null) return new Date();
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) {
    fail("as-of-invalid", "as-of must be an RFC3339 UTC instant");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) fail("as-of-invalid", "as-of must be a valid UTC instant");
  return parsed;
}

function directInboxPath(value) {
  if (typeof value !== "string" || !/^knowledge\/inbox\/[^/]+\.md$/.test(value) || basename(value) === "index.md") {
    fail("selection-not-direct-inbox", "selected paths must name direct pending knowledge/inbox Markdown items");
  }
  return value;
}

function strings(value) {
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function exactHeadings(body) {
  return [...body.matchAll(/^# ([^\r\n]+)\r?$/gm)].map((match) => match[1]);
}

function hasHeadings(body, expected) {
  const actual = exactHeadings(body);
  let cursor = 0;
  for (const heading of expected) {
    const index = actual.indexOf(heading, cursor);
    if (index < 0) return false;
    cursor = index + 1;
  }
  return true;
}

function gitCommitExists(root, commitSha) {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(commitSha)) return false;
  try {
    execFileSync("git", ["cat-file", "-e", `${commitSha}^{commit}`], {
      cwd: root,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function timestampFacts(frontmatter, asOf, signals) {
  if (!nonEmptyString(frontmatter.timestamp) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(frontmatter.timestamp)) {
    signals.add("provenance:timestamp-invalid");
    return { timestamp: null, ageSeconds: null };
  }
  const timestamp = new Date(frontmatter.timestamp);
  if (Number.isNaN(timestamp.valueOf())) {
    signals.add("provenance:timestamp-invalid");
    return { timestamp: null, ageSeconds: null };
  }
  const ageSeconds = Math.floor((asOf.valueOf() - timestamp.valueOf()) / 1000);
  if (ageSeconds < 0) signals.add("provenance:timestamp-future");
  return { timestamp: frontmatter.timestamp, ageSeconds };
}

function captureTier(frontmatter) {
  if (frontmatter.capture_tier == null) return "legacy-unspecified";
  if (frontmatter.capture_tier === "commit" || frontmatter.capture_tier === "session") return frontmatter.capture_tier;
  return "invalid";
}

function identity(frontmatter, tier) {
  return Object.freeze({
    type: typeof frontmatter.type === "string" ? frontmatter.type : null,
    title: typeof frontmatter.title === "string" ? frontmatter.title : null,
    timestamp: typeof frontmatter.timestamp === "string" ? frontmatter.timestamp : null,
    capture_tier: tier,
    commit_sha: Object.freeze(strings(frontmatter.commit_sha)),
    session_id: nonEmptyString(frontmatter.session_id) ? frontmatter.session_id : null,
    branch: nonEmptyString(frontmatter.branch) ? frontmatter.branch : null,
    source_repository: nonEmptyString(frontmatter.source_repository) ? frontmatter.source_repository : null,
  });
}

function inspectRecord(root, path, asOf) {
  const target = resolveContainedPath(root, directInboxPath(path));
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("path-not-regular-file", `pending inbox item is not a regular file: ${path}`);
  const content = readFileSync(target.full);
  const text = content.toString("utf8");
  const parsed = parseFrontmatter(text, path);
  const frontmatter = parsed.frontmatter;
  const tier = captureTier(frontmatter);
  const signals = new Set(parsed.diagnostics.map((diagnostic) => `parser:${diagnostic.code}`));

  if (!parsed.hasFrontmatter) signals.add("frontmatter-missing");
  if (frontmatter.type !== "Inbox") signals.add("type-not-inbox");
  for (const field of ["title", "description"]) if (!nonEmptyString(frontmatter[field])) signals.add(`required-field:${field}`);
  if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) signals.add("required-field:tags");

  const tags = strings(frontmatter.tags);
  if (tags.length !== new Set(tags).size) signals.add("quality:duplicate-tags");
  if (tags.some((tag) => tag !== tag.toLowerCase())) signals.add("quality:nonlowercase-tags");
  if (parsed.body.trim() === "") signals.add("low-signal:empty-body");
  if (frontmatter.rationale_missing === true) signals.add("low-signal:rationale-missing");
  if (frontmatter.impact_missing === true) signals.add("low-signal:impact-missing");

  if (tier === "legacy-unspecified") {
    signals.add("review:legacy-unspecified");
  } else if (tier === "invalid") {
    signals.add("review:capture-tier-invalid");
    signals.add("required-field:capture_tier");
  } else if (!nonEmptyString(frontmatter.branch)) {
    signals.add("required-field:branch");
  }

  if (tier === "commit") {
    if (!hasHeadings(parsed.body, COMMIT_HEADINGS)) signals.add("required-body-headings:commit");
    if (typeof frontmatter.commit_sha !== "string") signals.add("required-field:commit_sha");
  }
  if (tier === "session") {
    if (!hasHeadings(parsed.body, SESSION_HEADINGS)) signals.add("required-body-headings:session");
    if (!Array.isArray(frontmatter.commit_sha) || frontmatter.commit_sha.length === 0) signals.add("required-field:commit_sha");
    if (!nonEmptyString(frontmatter.session_id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(frontmatter.session_id)) signals.add("required-field:session_id");
  }

  const commitShas = strings(frontmatter.commit_sha);
  for (const sha of commitShas) {
    if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(sha)) signals.add("provenance:commit-sha-format");
    else if (!gitCommitExists(root, sha)) signals.add("provenance:commit-sha-unresolved");
  }
  const { timestamp, ageSeconds } = timestampFacts(frontmatter, asOf, signals);
  if (timestamp) {
    const canonicalStamp = timestamp.replace(/:/g, "-");
    const stem = basename(path, ".md");
    if (!stem.startsWith(canonicalStamp)) signals.add("quality:filename-noncanonical");
  }

  return {
    path,
    bytes: stat.size,
    sha256: hash(content),
    timestamp,
    age_seconds: ageSeconds,
    identity: identity(frontmatter, tier),
    raw_signals: signals,
  };
}

function duplicateGroups(records, selector, kind) {
  const grouped = new Map();
  for (const record of records) {
    for (const value of selector(record)) {
      if (!value) continue;
      const paths = grouped.get(value) ?? [];
      paths.push(record.path);
      grouped.set(value, paths);
    }
  }
  return [...grouped.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => Object.freeze({ kind, value, paths: Object.freeze([...paths].sort()) }))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.value.localeCompare(right.value));
}

function classifications(record) {
  const signals = [...record.raw_signals];
  const categories = new Set();
  if (signals.some((code) => code.startsWith("parser:") || code === "frontmatter-missing" || code === "type-not-inbox" || code.startsWith("required-field:") || code.startsWith("required-body-headings:"))) categories.add("malformed");
  if (signals.some((code) => code.startsWith("duplicate:"))) categories.add("duplicate");
  if (record.bytes > OVERSIZED_AFTER_BYTES) categories.add("oversized");
  if (signals.some((code) => code.startsWith("low-signal:"))) categories.add("low-signal");
  if (signals.some((code) => code.startsWith("provenance:"))) categories.add("provenance-warning");
  if (record.age_seconds != null && record.age_seconds >= STALE_AFTER_SECONDS) categories.add("stale");
  if (signals.some((code) => code.startsWith("review:") || code.startsWith("quality:"))) categories.add("needs-human-review");
  if (categories.size === 0) categories.add("actionable");
  else categories.add("needs-human-review");
  return CATEGORY_ORDER.filter((category) => categories.has(category));
}

function controlState(root) {
  const killSwitch = readKillSwitch(root);
  const lock = readLock(root);
  return Object.freeze({
    kill_switch: killSwitch.ambiguous ? "indeterminate" : killSwitch.active ? "active" : "inactive",
    lock: !lock ? "absent" : lock.malformed ? "malformed" : lock.stale ? "stale" : "live",
  });
}

function buildReport(rootInfo, paths, asOf) {
  const records = paths.map((path) => inspectRecord(rootInfo.root, path, asOf)).sort((left, right) => left.path.localeCompare(right.path));
  const duplicateSets = [
    ...duplicateGroups(records, (record) => [record.sha256], "content-sha256"),
    ...duplicateGroups(records.filter((record) => record.identity.capture_tier === "commit"), (record) => record.identity.commit_sha.filter((sha) => /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(sha)), "commit-sha"),
    ...duplicateGroups(records.filter((record) => record.identity.capture_tier === "session"), (record) => record.identity.session_id ? [record.identity.session_id] : [], "session-id"),
  ].sort((left, right) => left.kind.localeCompare(right.kind) || left.value.localeCompare(right.value));
  const duplicatesByPath = new Map();
  for (const group of duplicateSets) {
    for (const path of group.paths) {
      const codes = duplicatesByPath.get(path) ?? [];
      codes.push(`duplicate:${group.kind}:${group.value}`);
      duplicatesByPath.set(path, codes);
    }
  }

  const items = records.map((record) => {
    for (const code of duplicatesByPath.get(record.path) ?? []) record.raw_signals.add(code);
    const itemClassifications = classifications(record);
    return Object.freeze({
      path: record.path,
      bytes: record.bytes,
      sha256: record.sha256,
      timestamp: record.timestamp,
      age_seconds: record.age_seconds,
      identity: record.identity,
      primary_classification: itemClassifications[0],
      classifications: Object.freeze(itemClassifications),
      signals: Object.freeze([...record.raw_signals].sort()),
    });
  });
  const byClassification = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, items.filter((item) => item.classifications.includes(category)).length]));
  const byPrimary = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, items.filter((item) => item.primary_classification === category).length]));

  return Object.freeze({
    version: "okf-inbox-triage/1",
    root: rootInfo.root,
    revision: rootInfo.revision,
    measured_at: asOf.toISOString(),
    scope: "direct-pending-inbox-only",
    selection_rule: "explicit paths, sorted lexicographically",
    thresholds: Object.freeze({ oversized_bytes: OVERSIZED_AFTER_BYTES, stale_age_seconds: STALE_AFTER_SECONDS }),
    summary: Object.freeze({ count: items.length, bytes: items.reduce((total, item) => total + item.bytes, 0), by_classification: Object.freeze(byClassification), by_primary_classification: Object.freeze(byPrimary) }),
    duplicate_groups: Object.freeze(duplicateSets),
    controls: controlState(rootInfo.root),
    items: Object.freeze(items),
    read_only: true,
    curation_started: false,
    archive_started: false,
    deletion_performed: false,
    files_changed: Object.freeze([]),
  });
}

/**
 * Deterministically classify direct pending inbox files without changing them.
 */
export function triageInbox(rootInput, { asOf } = {}) {
  const rootInfo = validateRoot(rootInput);
  const inbox = resolveContainedPath(rootInfo.root, "knowledge/inbox");
  const entries = readdirSync(inbox.full, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) if (entry.isSymbolicLink()) fail("path-symlink", `inbox contains a symlink: ${entry.name}`);
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => `knowledge/inbox/${entry.name}`);
  return buildReport(rootInfo, paths, parseAsOf(asOf));
}

/**
 * Classify an explicit subset. Duplicate groups are limited to that selection;
 * use triageInbox for whole-backlog duplicate evidence before choosing paths.
 */
export function triageSelectedInbox(rootInput, selectedPaths, { asOf } = {}) {
  if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) fail("selection-missing", "at least one direct pending inbox path is required");
  const paths = [...new Set(selectedPaths.map(directInboxPath))].sort();
  const rootInfo = validateRoot(rootInput);
  return buildReport(rootInfo, paths, parseAsOf(asOf));
}

export function formatInboxTriage(report) {
  const lines = [
    `OKF inbox triage: ${report.summary.count} direct pending item(s)`,
    `root: ${report.root}`,
    `revision: ${report.revision}`,
  ];
  for (const category of CATEGORY_ORDER) {
    const count = report.summary.by_primary_classification[category];
    if (count > 0) lines.push(`${category}: ${count}`);
  }
  lines.push("read only: yes", "curation/archive authority: no");
  return lines.join("\n");
}

export const INBOX_TRIAGE_THRESHOLDS = Object.freeze({
  oversized_bytes: OVERSIZED_AFTER_BYTES,
  stale_age_seconds: STALE_AFTER_SECONDS,
});
