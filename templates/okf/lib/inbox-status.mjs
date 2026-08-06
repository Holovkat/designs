import { createHash } from "node:crypto";
import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { basename, join } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { readKillSwitch } from "./run-control.mjs";
import { RunGuardError, resolveContainedPath, validateRoot } from "./run-guard.mjs";
import { readLock } from "./run-lock.mjs";

const DAY_SECONDS = 24 * 60 * 60;
const ADVISORY_AGE_SECONDS = 30 * DAY_SECONDS;
const ADVISORY_COUNT = 10;
const ADVISORY_BYTES = 16 * 1024;

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function parseAsOf(value) {
  if (value == null) return new Date();
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) fail("as-of-invalid", "--as-of must be an RFC3339 UTC instant");
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) fail("as-of-invalid", "--as-of must be a valid UTC instant");
  return date;
}

function relativePath(inbox, name) {
  return `knowledge/inbox/${name}`;
}

function parserDiagnostics(parsed) {
  return parsed.diagnostics.map((diagnostic) => ({ code: diagnostic.code, line: diagnostic.line ?? null })).sort((a, b) => a.code.localeCompare(b.code) || (a.line ?? -1) - (b.line ?? -1));
}

function strings(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : typeof value === "string" ? [value] : [];
}

function captureTier(frontmatter) {
  if (frontmatter.capture_tier == null) return "legacy-unspecified";
  if (["commit", "session"].includes(frontmatter.capture_tier)) return frontmatter.capture_tier;
  return "invalid";
}

function classify(record, asOf) {
  const { frontmatter, parsed, path, bytes } = record;
  const classes = new Set();
  if (parsed.diagnostics.length > 0 || !parsed.hasFrontmatter || frontmatter.type !== "Inbox") classes.add("malformed");
  if (captureTier(frontmatter) === "legacy-unspecified") classes.add("legacy-unspecified");
  if (captureTier(frontmatter) === "invalid") classes.add("capture-tier-invalid");
  if (typeof frontmatter.title !== "string" || typeof frontmatter.description !== "string" || !Array.isArray(frontmatter.tags)) classes.add("required-field-gap");
  const tags = strings(frontmatter.tags);
  if (tags.length !== new Set(tags).size) classes.add("duplicate-tags");
  if (tags.some((tag) => tag !== tag.toLowerCase())) classes.add("nonlowercase-tags");
  if (tags.length === 0 || typeof frontmatter.title !== "string" || parsed.body.trim().length === 0) classes.add("low-signal");
  if (captureTier(frontmatter) === "session" && !["# Decisions Made", "# What Was Deprecated", "# Lessons Learned", "# Current State"].every((heading) => parsed.body.includes(heading))) classes.add("body-headings-missing");
  if (bytes > ADVISORY_BYTES) classes.add("oversized");

  let timestamp = null;
  let ageSeconds = null;
  if (typeof frontmatter.timestamp === "string" && !Number.isNaN(new Date(frontmatter.timestamp).valueOf())) {
    timestamp = frontmatter.timestamp;
    ageSeconds = Math.floor((asOf.valueOf() - new Date(timestamp).valueOf()) / 1000);
    if (ageSeconds < 0) classes.add("provenance-ambiguous");
  } else {
    classes.add("provenance-ambiguous");
  }
  const fileStem = basename(path, ".md");
  if (timestamp && !fileStem.startsWith(timestamp.replace(/:/g, "-").replace(/\.\d+Z$/, "Z")) && !fileStem.startsWith(timestamp.slice(0, 10))) classes.add("filename-noncanonical");

  const commitShas = strings(frontmatter.commit_sha);
  if (commitShas.some((sha) => !/^[0-9a-f]{40}$/i.test(sha))) classes.add("provenance-unresolved");
  return Object.freeze({ ...record, capture_tier: captureTier(frontmatter), timestamp, age_seconds: ageSeconds, classifications: [...classes].sort(), parser_diagnostics: parserDiagnostics(parsed), commit_shas: commitShas, session_id: typeof frontmatter.session_id === "string" && frontmatter.session_id !== "" ? frontmatter.session_id : null });
}

function duplicateGroups(records, selector) {
  const groups = new Map();
  for (const record of records) {
    for (const value of selector(record)) {
      if (!value) continue;
      const current = groups.get(value) ?? [];
      current.push(record.path);
      groups.set(value, current);
    }
  }
  return [...groups.entries()].filter(([, paths]) => paths.length > 1).map(([value, paths]) => ({ value, paths: paths.sort() })).sort((a, b) => a.value.localeCompare(b.value));
}

function indexIntegrity(indexContent, paths) {
  const listed = [];
  const invalid = [];
  const expression = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of indexContent.matchAll(expression)) {
    const link = match[1];
    const name = link.replace(/^\.\//, "");
    if (!/^[^/]+\.md$/.test(name) || name === "index.md") invalid.push(link);
    else listed.push(`knowledge/inbox/${name}`);
  }
  const unique = new Set(listed);
  const pathSet = new Set(paths);
  return Object.freeze({
    linked_count: listed.length,
    unlisted: [...pathSet].filter((path) => !unique.has(path)).sort(),
    dangling: [...unique].filter((path) => !pathSet.has(path)).sort(),
    duplicate_links: [...new Set(listed.filter((path, index) => listed.indexOf(path) !== index))].sort(),
    invalid_links: [...new Set(invalid)].sort(),
  });
}

function controlState(root) {
  const kill = readKillSwitch(root);
  const lock = readLock(root);
  const killState = kill.ambiguous ? "indeterminate" : kill.active ? "active" : "inactive";
  const lockState = !lock ? "absent" : lock.malformed ? "malformed" : lock.stale ? "stale" : "live";
  return Object.freeze({
    kill_switch: { state: killState },
    lock: { state: lockState },
    hypothetical_executor_blocked: killState !== "inactive" || lockState !== "absent",
  });
}

export function inboxStatus(rootInput, { asOf } = {}) {
  const asOfDate = parseAsOf(asOf);
  const rootInfo = validateRoot(rootInput);
  const inbox = resolveContainedPath(rootInfo.root, "knowledge/inbox");
  const index = resolveContainedPath(rootInfo.root, "knowledge/inbox/index.md");
  const entries = readdirSync(inbox.full, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) if (entry.isSymbolicLink()) fail("path-symlink", `inbox contains a symlink: ${entry.name}`);
  const records = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md").map((entry) => {
    const full = join(inbox.full, entry.name);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) fail("path-symlink", `inbox item is a symlink: ${entry.name}`);
    const content = readFileSync(full, "utf8");
    const parsed = parseFrontmatter(content, relativePath(inbox.full, entry.name));
    return classify({ path: relativePath(inbox.full, entry.name), bytes: stat.size, sha256: sha256(content), frontmatter: parsed.frontmatter, parsed }, asOfDate);
  }).sort((a, b) => a.path.localeCompare(b.path));
  const bytes = records.reduce((total, record) => total + record.bytes, 0);
  const dated = records.filter((record) => record.timestamp && record.age_seconds >= 0).sort((a, b) => b.age_seconds - a.age_seconds || a.path.localeCompare(b.path));
  const largest = [...records].sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path))[0] ?? null;
  const tiers = Object.fromEntries(["commit", "session", "legacy-unspecified", "invalid"].map((tier) => [tier, records.filter((record) => record.capture_tier === tier).length]));
  const quality = records.flatMap((record) => record.classifications.map((code) => ({ path: record.path, code }))).sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
  const diagnostics = records.flatMap((record) => record.parser_diagnostics.map((diagnostic) => ({ path: record.path, ...diagnostic }))).sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code) || (a.line ?? -1) - (b.line ?? -1));
  const report = {
    version: "okf-inbox-status/1",
    root: rootInfo.root,
    revision: rootInfo.revision,
    measured_at: asOfDate.toISOString(),
    scope: ["knowledge/inbox/*.md", "knowledge/inbox/index.md", ".okf/KILL_SWITCH", ".okf/run.lock"],
    pending: {
      count: records.length,
      bytes,
      largest: largest ? { path: largest.path, bytes: largest.bytes } : null,
      oldest: dated[0] ? { path: dated[0].path, timestamp: dated[0].timestamp, age_seconds: dated[0].age_seconds } : null,
      capture_tiers: tiers,
    },
    advisory: {
      advisory_only: true,
      execution_authority: false,
      oldest_age_30_days: Boolean(dated[0] && dated[0].age_seconds >= ADVISORY_AGE_SECONDS),
      pending_count_10: records.length >= ADVISORY_COUNT,
      pending_bytes_16k: bytes >= ADVISORY_BYTES,
      oversized_items: records.filter((record) => record.bytes > ADVISORY_BYTES).map((record) => ({ path: record.path, bytes: record.bytes })),
      quality_findings_present: quality.length > 0,
    },
    quality,
    parser_diagnostics: diagnostics,
    duplicates: {
      content_sha256: duplicateGroups(records, (record) => [record.sha256]),
      commit_sha: duplicateGroups(records.filter((record) => record.capture_tier === "commit"), (record) => record.commit_shas.filter((sha) => /^[0-9a-f]{40}$/i.test(sha))),
      session_id: duplicateGroups(records.filter((record) => record.capture_tier === "session"), (record) => record.session_id ? [record.session_id] : []),
    },
    index: indexIntegrity(readFileSync(index.full, "utf8"), records.map((record) => record.path)),
    controls: controlState(rootInfo.root),
    read_only: true,
    curation_started: false,
    curation_authorized: false,
    files_changed: [],
  };
  return Object.freeze(report);
}

export function formatInboxStatus(report) {
  return [
    `OKF inbox status: ${report.pending.count} pending item(s)`,
    `root: ${report.root}`,
    `revision: ${report.revision}`,
    `bytes: ${report.pending.bytes}`,
    `advisory only: yes`,
    `hypothetical executor blocked: ${report.controls.hypothetical_executor_blocked ? "yes" : "no"}`,
  ].join("\n");
}
