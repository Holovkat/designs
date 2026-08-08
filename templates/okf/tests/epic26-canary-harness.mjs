#!/usr/bin/env node
/**
 * Epic #26 D3-D5 operational canary harness.
 *
 * The harness is intentionally an operator-invoked test utility. It creates a
 * new temporary Git repository at one exact tracked source revision, overlays
 * the current repository-local OKF runtime in that temporary root, executes a
 * bounded proposal, validates retrieval and retention, and emits hash-only
 * evidence. It never writes to the source repository.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { executeCuration } from "../lib/curation-executor.mjs";
import { parseFrontmatter } from "../lib/frontmatter.mjs";
import { lintBundle } from "../lib/lint.mjs";
import { queryBundle } from "../lib/query.mjs";
import { readKillSwitch } from "../lib/run-control.mjs";
import { readLock } from "../lib/run-lock.mjs";
import { validateRunPlan } from "../lib/run-plan.mjs";

const testRoot = dirname(fileURLToPath(import.meta.url));
const templateRoot = resolve(testRoot, "..");
const MAX_PACKET_BYTES = 1024 * 1024;
const MAX_COMMAND_BUFFER = 64 * 1024 * 1024;
const CONCEPT_DIRECTORIES = Object.freeze({
  Architecture: "architecture",
  Component: "components",
  Domain: "domain",
  Decision: "decisions",
  Process: "process",
  Deprecation: "deprecation",
  State: "state",
});
const INDEX_LABELS = Object.freeze({
  architecture: "Architecture",
  components: "Components",
  domain: "Domain",
  decisions: "Decisions",
  process: "Process",
  deprecation: "Deprecation",
  state: "State",
  inbox: "Inbox",
});

class CanaryError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new CanaryError(code, message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function boundedString(value, name, maximum = 4096) {
  if (typeof value !== "string" || value.trim() === "" || Buffer.byteLength(value, "utf8") > maximum) {
    fail("packet-field-invalid", `${name} must be a non-empty bounded string`);
  }
  return value.trim();
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) fail("packet-limit-invalid", `${name} must be a positive safe integer`);
  return value;
}

function exactKeys(object, required, optional, name) {
  if (!object || typeof object !== "object" || Array.isArray(object)) fail("packet-object-invalid", `${name} must be an object`);
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(object);
  const missing = required.filter((key) => !(key in object));
  const unknown = keys.filter((key) => !allowed.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    fail("packet-keys-invalid", `${name} has missing or unknown keys`);
  }
  return object;
}

function rootRelative(path, name, pattern = null) {
  if (typeof path !== "string" || path.length === 0 || path.length > 512 || isAbsolute(path) || path.includes("\\") || path.includes("\0")) {
    fail("packet-path-invalid", `${name} must be one bounded POSIX root-relative path`);
  }
  const components = path.split("/");
  if (components.some((component) => component === "" || component === "." || component === "..")) {
    fail("packet-path-invalid", `${name} must not contain empty, dot, or parent components`);
  }
  if (pattern && !pattern.test(path)) fail("packet-path-invalid", `${name} is outside the approved path class`);
  return path;
}

function runIdentifier(value, name) {
  const id = boundedString(value, name, 96);
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/i.test(id)) fail("packet-run-id-invalid", `${name} is not filesystem-safe`);
  return id;
}

function physicalRoot(candidate, name) {
  if (typeof candidate !== "string" || !isAbsolute(candidate)) fail("packet-root-invalid", `${name} must be absolute`);
  let physical;
  try { physical = realpathSync(candidate); }
  catch { fail("packet-root-invalid", `${name} cannot be resolved`); }
  if (physical !== resolve(candidate)) fail("packet-root-invalid", `${name} must name its physical path`);
  return physical;
}

function normalizeSemanticQuery(value) {
  exactKeys(value, [], ["terms", "relationships", "assertionStates", "evidence", "statuses", "validationStatuses", "hasEvidence", "decisionsOnly"], "retrieval.semantic");
  const output = {};
  for (const key of ["terms", "relationships", "assertionStates", "evidence", "statuses", "validationStatuses"]) {
    const items = value[key] ?? [];
    if (!Array.isArray(items) || items.some((item) => typeof item !== "string" || item.length === 0 || item.length > 256)) {
      fail("packet-query-invalid", `retrieval.semantic.${key} must be a bounded string array`);
    }
    output[key] = [...new Set(items)];
  }
  output.hasEvidence = value.hasEvidence === true;
  output.decisionsOnly = value.decisionsOnly === true;
  const selectorCount = output.terms.length + output.relationships.length + output.assertionStates.length
    + output.evidence.length + output.statuses.length + output.validationStatuses.length + Number(output.hasEvidence);
  if (selectorCount === 0) fail("packet-query-invalid", "retrieval.semantic must contain at least one selector");
  return Object.freeze(output);
}

function validatePacket(raw) {
  const blockedControl = raw?.scenario === "blocked-control";
  exactKeys(raw,
    blockedControl
      ? ["version", "scenario", "source", "operator", "run_ids", "limits", "harness_limits", "control"]
      : ["version", "scenario", "source", "operator", "run_ids", "limits", "harness_limits", "curated_concept", "retrieval"],
    [], "packet");
  if (raw.version !== "okf-epic26-canary/1") fail("packet-version-invalid", "unsupported packet version");
  if (!new Set(["normal", "invalid-then-success", "interrupt-resume", "blocked-control"]).has(raw.scenario)) {
    fail("packet-scenario-invalid", "scenario must be normal, invalid-then-success, interrupt-resume, or blocked-control");
  }

  exactKeys(raw.source, ["root", "revision", "selected_inbox"], [], "source");
  const sourceRoot = physicalRoot(raw.source.root, "source.root");
  if (typeof raw.source.revision !== "string" || !/^[0-9a-f]{40}$/i.test(raw.source.revision)) {
    fail("packet-revision-invalid", "source.revision must be one full Git object ID");
  }
  if (!Array.isArray(raw.source.selected_inbox) || raw.source.selected_inbox.length === 0) {
    fail("packet-selection-invalid", "source.selected_inbox must contain at least one exact path");
  }
  const selectedInbox = raw.source.selected_inbox.map((path, index) => rootRelative(
    path,
    `source.selected_inbox[${index}]`,
    /^knowledge\/inbox\/[^/]+\.md$/,
  ));
  const sortedSelection = [...new Set(selectedInbox)].sort();
  if (sortedSelection.length !== selectedInbox.length || sortedSelection.some((path, index) => path !== selectedInbox[index])) {
    fail("packet-selection-invalid", "source.selected_inbox must be unique and lexically sorted");
  }

  exactKeys(raw.operator, ["identity", "request"], [], "operator");
  const operator = Object.freeze({
    identity: boundedString(raw.operator.identity, "operator.identity", 128),
    request: boundedString(raw.operator.request, "operator.request", 1024),
  });

  const runKeys = raw.scenario === "normal"
    ? ["normal"]
    : raw.scenario === "invalid-then-success"
      ? ["invalid", "success"]
      : raw.scenario === "interrupt-resume"
        ? ["interrupt"]
        : ["blocked_control"];
  exactKeys(raw.run_ids, runKeys, [], "run_ids");
  const runIds = Object.fromEntries(runKeys.map((key) => [key, runIdentifier(raw.run_ids[key], `run_ids.${key}`)]));
  if (new Set(Object.values(runIds)).size !== Object.values(runIds).length) fail("packet-run-id-invalid", "run IDs must be unique");

  exactKeys(raw.limits,
    ["max_items", "max_input_bytes", "max_generated_bytes", "max_runtime_seconds", "max_sessions"],
    [], "limits");
  const limits = Object.freeze(Object.fromEntries(Object.keys(raw.limits).map((key) => [key, positiveInteger(raw.limits[key], `limits.${key}`)])));
  if (limits.max_sessions !== 1) fail("packet-limit-invalid", "limits.max_sessions must equal one");
  if (limits.max_items !== selectedInbox.length) fail("packet-limit-invalid", "limits.max_items must exactly equal selected_inbox length");

  exactKeys(raw.harness_limits,
    ["max_snapshot_bytes", "max_disk_growth_bytes", "max_report_bytes", "max_wall_seconds", "max_cpu_milliseconds_per_run"],
    [], "harness_limits");
  const harnessLimits = Object.freeze(Object.fromEntries(Object.keys(raw.harness_limits)
    .map((key) => [key, positiveInteger(raw.harness_limits[key], `harness_limits.${key}`)])));
  if (harnessLimits.max_report_bytes > 1024 * 1024) fail("packet-limit-invalid", "max_report_bytes may not exceed 1 MiB");
  if (harnessLimits.max_report_bytes < 16 * 1024) fail("packet-limit-invalid", "max_report_bytes must allow at least 16 KiB of bounded evidence");

  let curatedConcept = null;
  let retrieval = null;
  let control = null;
  if (blockedControl) {
    exactKeys(raw.control, ["activated_by", "activated_at", "reason"], [], "control");
    const activatedAt = boundedString(raw.control.activated_at, "control.activated_at", 64);
    if (Number.isNaN(Date.parse(activatedAt))) fail("packet-control-invalid", "control.activated_at must be an RFC3339 instant");
    control = Object.freeze({
      activated_by: boundedString(raw.control.activated_by, "control.activated_by", 128),
      activated_at: activatedAt,
      reason: boundedString(raw.control.reason, "control.reason", 512),
    });
  } else {
    exactKeys(raw.curated_concept, ["path", "content"], [], "curated_concept");
    const conceptPath = rootRelative(
      raw.curated_concept.path,
      "curated_concept.path",
      /^knowledge\/(?:architecture|components|domain|decisions|deprecation|process|state)\/[a-z0-9][a-z0-9._-]*\.md$/,
    );
    if (basename(conceptPath) === "index.md") fail("packet-path-invalid", "curated concept may not replace an index");
    if (typeof raw.curated_concept.content !== "string" || raw.curated_concept.content.length === 0) {
      fail("packet-concept-invalid", "curated_concept.content must be non-empty");
    }
    const conceptContent = raw.curated_concept.content.endsWith("\n") ? raw.curated_concept.content : `${raw.curated_concept.content}\n`;
    if (Buffer.byteLength(conceptContent, "utf8") > limits.max_generated_bytes) {
      fail("packet-concept-invalid", "curated concept alone exceeds max_generated_bytes");
    }
    curatedConcept = Object.freeze({ path: conceptPath, content: conceptContent });

    exactKeys(raw.retrieval, ["semantic", "portable_terms"], ["portable_decisions_only"], "retrieval");
    if (!Array.isArray(raw.retrieval.portable_terms) || raw.retrieval.portable_terms.length === 0
      || raw.retrieval.portable_terms.some((term) => typeof term !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,80}$/.test(term))) {
      fail("packet-query-invalid", "retrieval.portable_terms must contain bounded literal-safe tokens");
    }
    retrieval = Object.freeze({
      semantic: normalizeSemanticQuery(raw.retrieval.semantic),
      portable_terms: Object.freeze([...new Set(raw.retrieval.portable_terms)]),
      portable_decisions_only: raw.retrieval.portable_decisions_only === true,
    });
  }

  return Object.freeze({
    version: raw.version,
    scenario: raw.scenario,
    source: Object.freeze({ root: sourceRoot, revision: raw.source.revision.toLowerCase(), selected_inbox: Object.freeze(selectedInbox) }),
    operator,
    run_ids: Object.freeze(runIds),
    limits,
    harness_limits: harnessLimits,
    curated_concept: curatedConcept,
    retrieval,
    control,
  });
}

function remainingMilliseconds(context) {
  const remaining = context.deadline_ms - Date.now();
  if (remaining <= 0) fail("harness-wall-limit", "harness wall-clock ceiling was reached");
  return Math.max(1, Math.min(remaining, 2_147_483_647));
}

function offlineEnvironment() {
  return {
    ...process.env,
    GIT_LFS_SKIP_SMUDGE: "1",
    GIT_TERMINAL_PROMPT: "0",
    HTTP_PROXY: "http://127.0.0.1:1",
    HTTPS_PROXY: "http://127.0.0.1:1",
    ALL_PROXY: "http://127.0.0.1:1",
    NO_PROXY: "*",
    npm_config_offline: "true",
  };
}

function command(context, executable, args, { cwd = undefined, accepted = [0], maxBuffer = MAX_COMMAND_BUFFER } = {}) {
  if (context.active_commands !== 0) fail("harness-concurrency", "commands must execute sequentially");
  context.active_commands += 1;
  context.max_command_concurrency = Math.max(context.max_command_concurrency, context.active_commands);
  let result;
  try {
    result = spawnSync(executable, args, {
      cwd,
      encoding: null,
      env: offlineEnvironment(),
      maxBuffer,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: remainingMilliseconds(context),
    });
  } finally {
    context.active_commands -= 1;
  }
  context.command_count += 1;
  if (result.error || !accepted.includes(result.status)) {
    const detail = Buffer.concat([
      Buffer.from(result.error?.code ?? "", "utf8"),
      result.stdout ?? Buffer.alloc(0),
      result.stderr ?? Buffer.alloc(0),
    ]);
    const error = new CanaryError("command-failed", `${basename(executable)} failed`);
    error.detail_sha256 = sha256(detail);
    error.status = result.status;
    throw error;
  }
  return Object.freeze({
    status: result.status,
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: result.stderr ?? Buffer.alloc(0),
  });
}

function git(context, root, args, options = {}) {
  return command(context, "git", ["-c", "core.fsmonitor=false", "-c", "protocol.file.allow=always", "-C", root, ...args], options);
}

function gitText(context, root, args) {
  return git(context, root, args).stdout.toString("utf8").trim();
}

function hashCommand(result) {
  return Object.freeze({ bytes: result.stdout.length, sha256: sha256(result.stdout) });
}

function sourceFingerprint(context, root) {
  const topLevel = physicalRoot(gitText(context, root, ["rev-parse", "--show-toplevel"]), "source Git top level");
  if (topLevel !== root) fail("source-not-git-root", "source.root must be the exact Git worktree top level");
  const status = git(context, root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const staged = git(context, root, ["diff", "--cached", "--binary", "--no-ext-diff", "--no-textconv"]);
  const worktree = git(context, root, ["diff", "--binary", "--no-ext-diff", "--no-textconv"]);
  const config = git(context, root, ["config", "--local", "--null", "--list"]);
  return Object.freeze({
    head: gitText(context, root, ["rev-parse", "HEAD"]).toLowerCase(),
    tree: gitText(context, root, ["rev-parse", "HEAD^{tree}"]).toLowerCase(),
    status: hashCommand(status),
    staged_diff: hashCommand(staged),
    worktree_diff: hashCommand(worktree),
    local_config: hashCommand(config),
  });
}

function fingerprintEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function assertRegularFile(path, code = "path-not-regular") {
  let stat;
  try { stat = lstatSync(path); }
  catch { fail(code, "required regular file is missing"); }
  if (!stat.isFile() || stat.isSymbolicLink()) fail(code, "required path must be a non-symlink regular file");
  return stat;
}

function readRegular(path, code = "path-not-regular") {
  assertRegularFile(path, code);
  return readFileSync(path);
}

function fileDescriptor(root, path) {
  const full = resolve(root, path);
  const rel = relative(root, full).split(sep).join("/");
  if (rel !== path || rel.startsWith("../")) fail("path-containment", "path escaped the snapshot root");
  const content = readRegular(full);
  return Object.freeze({ path, bytes: content.length, sha256: sha256(content) });
}

function walkTree(root, visitor, current = root) {
  for (const entry of readdirSync(current).sort()) {
    const full = join(current, entry);
    const stat = lstatSync(full);
    visitor(full, stat);
    if (stat.isDirectory() && !stat.isSymbolicLink()) walkTree(root, visitor, full);
  }
}

function treeBytes(root, ceiling) {
  let total = 0;
  walkTree(root, (_path, stat) => {
    total += stat.size;
    if (total > ceiling) fail("snapshot-disk-limit", "snapshot exceeded max_snapshot_bytes");
  });
  return total;
}

function treeManifest(root) {
  const records = [];
  walkTree(root, (path, stat) => {
    if (stat.isSymbolicLink()) fail("tooling-symlink", "current OKF tooling must not contain symlinks");
    if (stat.isFile()) {
      const content = readFileSync(path);
      records.push({ path: relative(root, path).split(sep).join("/"), bytes: content.length, sha256: sha256(content) });
    }
  });
  return Object.freeze({ files: records.length, sha256: sha256(canonicalJson(records)), bytes: records.reduce((sum, item) => sum + item.bytes, 0) });
}

function createSnapshot(context, packet, temporaryRoot) {
  const snapshot = join(temporaryRoot, "snapshot");
  mkdirSync(snapshot, { recursive: false });
  command(context, "git", ["init", "-q", snapshot]);
  git(context, snapshot, ["fetch", "--quiet", "--depth=1", "--no-tags", packet.source.root, packet.source.revision]);
  git(context, snapshot, ["checkout", "--detach", "--quiet", "FETCH_HEAD"]);
  git(context, snapshot, ["config", "core.hooksPath", ".okf/canary-no-hooks"]);
  const physical = realpathSync(snapshot);
  const revision = gitText(context, physical, ["rev-parse", "HEAD"]).toLowerCase();
  if (revision !== packet.source.revision) fail("snapshot-revision-mismatch", "throwaway snapshot does not match the approved revision");
  if (gitText(context, physical, ["rev-parse", "--show-toplevel"]) !== physical) fail("snapshot-root-mismatch", "snapshot is not its Git top level");
  return physical;
}

function installCanaryTooling(snapshot) {
  const sources = ["bin", "lib", "runtime", "schema"];
  const sourceManifests = sources.map((path) => ({ path, ...treeManifest(resolve(templateRoot, path)) }));
  mkdirSync(join(snapshot, ".okf"), { recursive: true });
  for (const path of sources) {
    cpSync(resolve(templateRoot, path), join(snapshot, ".okf", path), { recursive: true, force: true, errorOnExist: false });
  }
  cpSync(resolve(templateRoot, "okf-query.sh"), join(snapshot, "knowledge", "okf-query.sh"), { force: true });
  mkdirSync(join(snapshot, ".okf", "canary-no-hooks"), { recursive: true });
  mkdirSync(join(snapshot, ".okf", "proposals"), { recursive: true });
  writeFileSync(join(snapshot, ".okf", "KILL_SWITCH"), '{"active":false}\n', "utf8");
  const installed = treeManifest(join(snapshot, ".okf"));
  return Object.freeze({
    source: Object.freeze(sourceManifests),
    installed,
    portable_query_sha256: sha256(readRegular(join(snapshot, "knowledge", "okf-query.sh"))),
  });
}

function pendingFiles(root) {
  const inbox = join(root, "knowledge", "inbox");
  return readdirSync(inbox, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => `knowledge/inbox/${entry.name}`)
    .sort();
}

function pendingManifest(root, excluded = new Set()) {
  const records = pendingFiles(root).filter((path) => !excluded.has(path)).map((path) => fileDescriptor(root, path));
  return Object.freeze({ count: records.length, sha256: sha256(canonicalJson(records)) });
}

function selectedDescriptors(root, selected) {
  return Object.freeze(selected.map((path) => fileDescriptor(root, path)));
}

function selectedAgeEvidence(root, selected, nowMs) {
  const ages = [];
  let valid = 0;
  for (const path of selected) {
    const parsed = parseFrontmatter(readRegular(resolve(root, path)).toString("utf8"), path);
    const timestamp = parsed.frontmatter?.timestamp;
    const value = typeof timestamp === "string" ? Date.parse(timestamp) : Number.NaN;
    if (Number.isFinite(value)) {
      valid += 1;
      ages.push(Math.max(0, Math.floor((nowMs - value) / 1000)));
    }
  }
  return Object.freeze({
    selected_count: selected.length,
    timestamp_valid_count: valid,
    oldest_seconds: ages.length > 0 ? Math.max(...ages) : null,
    newest_seconds: ages.length > 0 ? Math.min(...ages) : null,
  });
}

function pendingAgeEvidence(root, nowMs) {
  return selectedAgeEvidence(root, pendingFiles(root), nowMs);
}

function instructionManifest(context, snapshot, revision) {
  const listing = git(context, snapshot, ["ls-tree", "-r", "--name-only", revision]).stdout.toString("utf8").split("\n")
    .filter((path) => path === "AGENTS.md" || path.endsWith("/AGENTS.md"))
    .sort();
  const records = listing.map((path) => fileDescriptor(snapshot, path));
  return Object.freeze({ count: records.length, sha256: sha256(canonicalJson(records)) });
}

function markdownCell(value) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return text.replaceAll("|", "\\|").replace(/[\r\n]+/g, " ").trim();
}

function conceptMetadata(packet, selected) {
  const parsed = parseFrontmatter(packet.curated_concept.content, packet.curated_concept.path);
  if (parsed.diagnostics.length > 0) fail("concept-frontmatter-invalid", "curated concept frontmatter is not parseable");
  const frontmatter = parsed.frontmatter;
  const expectedDirectory = CONCEPT_DIRECTORIES[frontmatter.type];
  const actualDirectory = packet.curated_concept.path.split("/")[1];
  if (!expectedDirectory || actualDirectory !== expectedDirectory) {
    fail("concept-type-path-mismatch", "curated concept type does not match its permanent concept directory");
  }
  for (const field of ["title", "description", "timestamp", "status", "id", "assertion_state", "generated_at", "generated_by", "source_authority"]) {
    if (typeof frontmatter[field] !== "string" || frontmatter[field].trim() === "") {
      fail("concept-metadata-missing", `curated concept must declare ${field}`);
    }
  }
  if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0
    || !Array.isArray(frontmatter.evidence_refs) || frontmatter.evidence_refs.length === 0) {
    fail("concept-metadata-missing", "curated concept must declare tags and immutable evidence_refs");
  }
  if (!frontmatter.evidence_refs.some((reference) => typeof reference === "string" && reference.includes(packet.source.revision))) {
    fail("concept-evidence-not-immutable", "at least one evidence reference must name the exact source revision");
  }
  const selectedHashManifest = sha256(canonicalJson(selected.map(({ path, sha256: hash }) => ({ path, sha256: hash }))));
  return Object.freeze({ frontmatter, directory: expectedDirectory, selected_hash_manifest: selectedHashManifest });
}

function directMarkdownCount(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .length;
}

function updateRootIndex(root, packet, concept) {
  const path = "knowledge/index.md";
  const current = readRegular(resolve(root, path)).toString("utf8");
  const counts = {};
  for (const directory of Object.values(CONCEPT_DIRECTORIES)) {
    counts[directory] = directMarkdownCount(join(root, "knowledge", directory)) + Number(directory === concept.directory);
  }
  counts.inbox = pendingFiles(root).length - packet.source.selected_inbox.length;
  if (counts.inbox < 0) fail("index-count-invalid", "selected inbox count exceeds pending snapshot count");

  const found = new Set();
  const lines = current.split("\n").map((line) => {
    for (const [directory, label] of Object.entries(INDEX_LABELS)) {
      if (!line.includes(`](${directory === "inbox" ? "./inbox/index.md" : `./${directory}/index.md`})`)) continue;
      const cells = line.split("|");
      if (cells.length < 4 || !/^\s*\d+\s*$/.test(cells[2] ?? "")) {
        fail("root-index-format-unsupported", `root index row for ${label} has no numeric count cell`);
      }
      cells[2] = ` ${counts[directory]} `;
      found.add(directory);
      return cells.join("|");
    }
    return line;
  });
  for (const directory of Object.keys(INDEX_LABELS)) {
    if (!found.has(directory)) fail("root-index-format-unsupported", `root index is missing the ${INDEX_LABELS[directory]} group row`);
  }
  return Object.freeze({ path, content: `${lines.join("\n").replace(/\n+$/u, "")}\n`, expected_sha256: sha256(Buffer.from(current, "utf8")) });
}

function updateConceptIndex(root, packet, concept) {
  const path = `knowledge/${concept.directory}/index.md`;
  const current = readRegular(resolve(root, path)).toString("utf8");
  const filename = basename(packet.curated_concept.path);
  if (current.includes(`./${filename}`)) fail("concept-index-path-exists", "curated concept path already appears in its index");
  const fm = concept.frontmatter;
  const row = `| [${markdownCell(fm.title)}](./${filename}) | ${markdownCell(fm.description)} | [${markdownCell(fm.tags)}] | ${markdownCell(fm.status)} |`;
  return Object.freeze({
    path,
    content: `${current.replace(/\n+$/u, "")}\n${row}\n`,
    expected_sha256: sha256(Buffer.from(current, "utf8")),
  });
}

function updateInboxIndex(root, packet) {
  const path = "knowledge/inbox/index.md";
  const current = readRegular(resolve(root, path)).toString("utf8");
  const selectedNames = packet.source.selected_inbox.map((item) => basename(item));
  const removals = Object.fromEntries(selectedNames.map((name) => [name, 0]));
  const retained = [];
  for (const line of current.split("\n")) {
    const selectedName = selectedNames.find((name) => line.includes(`./${name}`));
    if (selectedName) {
      removals[selectedName] += 1;
      continue;
    }
    retained.push(line);
  }
  for (const [name, count] of Object.entries(removals)) {
    if (count > 1) fail("inbox-index-selection-mismatch", `inbox index contains duplicate exact rows for ${name}`);
  }
  const membership = Object.entries(removals)
    .map(([name, matched_rows]) => Object.freeze({ name, matched_rows }))
    .sort((left, right) => left.name.localeCompare(right.name));
  return Object.freeze({
    path,
    content: `${retained.join("\n").replace(/\n+$/u, "")}\n`,
    expected_sha256: sha256(Buffer.from(current, "utf8")),
    membership: Object.freeze({
      mode: membership.every(({ matched_rows }) => matched_rows === 1)
        ? "linked-removal"
        : membership.every(({ matched_rows }) => matched_rows === 0) ? "legacy-unlisted" : "mixed",
      selected: Object.freeze(membership),
    }),
  });
}

function updateLog(root, packet, concept, runId) {
  const path = "knowledge/log.md";
  const current = readRegular(resolve(root, path)).toString("utf8");
  const entry = [
    `## ${concept.frontmatter.generated_at} - Epic 26 bounded canary ${runId}`,
    "",
    `- Curated ${packet.source.selected_inbox.length} retained inbox item(s) into \`${packet.curated_concept.path}\`.`,
    `- Exact source revision: \`${packet.source.revision}\`; selected hash manifest: \`${concept.selected_hash_manifest}\`.`,
  ].join("\n");
  return Object.freeze({
    path,
    content: `${current.replace(/\n+$/u, "")}\n\n${entry}\n`,
    expected_sha256: sha256(Buffer.from(current, "utf8")),
  });
}

function invalidConceptContent(content) {
  const lines = content.split("\n");
  const index = lines.findIndex((line) => /^generated_at\s*:/u.test(line));
  if (index < 0) fail("invalid-scenario-unavailable", "invalid scenario requires a generated_at field to remove at staging");
  lines.splice(index, 1);
  return lines.join("\n");
}

function outputRecord(root, path, content, sourceItems, expectedSha = undefined) {
  const full = resolve(root, path);
  const exists = existsSync(full);
  const expected = expectedSha === undefined
    ? exists ? sha256(readRegular(full)) : null
    : expectedSha;
  return Object.freeze({ path, expected_sha256: expected, source_items: sourceItems, content });
}

function buildProposal(root, packet, selected, concept, runId, { invalid = false } = {}) {
  if (existsSync(resolve(root, packet.curated_concept.path))) {
    fail("concept-target-exists", "canary concept path must be new at the frozen revision");
  }
  const sourceItems = packet.source.selected_inbox;
  const rootIndex = updateRootIndex(root, packet, concept);
  const conceptIndex = updateConceptIndex(root, packet, concept);
  const inboxIndex = updateInboxIndex(root, packet);
  const log = updateLog(root, packet, concept, runId);
  const conceptContent = invalid ? invalidConceptContent(packet.curated_concept.content) : packet.curated_concept.content;
  const outputs = [
    outputRecord(root, packet.curated_concept.path, conceptContent, sourceItems, null),
    outputRecord(root, conceptIndex.path, conceptIndex.content, sourceItems, conceptIndex.expected_sha256),
    outputRecord(root, inboxIndex.path, inboxIndex.content, sourceItems, inboxIndex.expected_sha256),
    outputRecord(root, rootIndex.path, rootIndex.content, sourceItems, rootIndex.expected_sha256),
    outputRecord(root, log.path, log.content, sourceItems, log.expected_sha256),
  ].sort((left, right) => left.path.localeCompare(right.path));
  const proposal = {
    version: "okf-curation-proposal/1",
    run_id: runId,
    revision: packet.source.revision,
    expected_outcome: invalid
      ? "Strict staging validation rejects the deliberately incomplete generated provenance and retains every source."
      : "One strict evidence-linked concept is indexed and every selected source is retained in inbox/processed.",
    recovery_plan: "Use the retained checkpoint, report, proposal hashes, staging paths, and frozen Git revision; never mutate the live source repository.",
    items: selected.map(({ path, bytes, sha256: hash }) => ({ path, bytes, sha256: hash })),
    outputs,
  };
  const proposalPath = `.okf/proposals/${runId}.json`;
  const content = `${JSON.stringify(proposal, null, 2)}\n`;
  writeFileSync(resolve(root, proposalPath), content, { encoding: "utf8", flag: "wx" });
  return Object.freeze({
    path: proposalPath,
    bytes: Buffer.byteLength(content, "utf8"),
    sha256: sha256(Buffer.from(content, "utf8")),
    output_count: outputs.length,
    concept_output_sha256: sha256(Buffer.from(conceptContent, "utf8")),
    inbox_index_membership: inboxIndex.membership,
  });
}

function executionInput(snapshot, packet, runId, proposal, resume = false) {
  return Object.freeze({
    root: snapshot,
    revision: packet.source.revision,
    operator_identity: packet.operator.identity,
    operator_request: packet.operator.request,
    run_id: runId,
    proposal_path: proposal.path,
    selected_items: packet.source.selected_inbox,
    resume,
    max_items: packet.limits.max_items,
    max_input_bytes: packet.limits.max_input_bytes,
    max_generated_bytes: packet.limits.max_generated_bytes,
    max_runtime_seconds: packet.limits.max_runtime_seconds,
    max_sessions: packet.limits.max_sessions,
  });
}

function safeReason(value) {
  const reason = String(value ?? "unknown");
  return /^[a-z0-9][a-z0-9:._-]{0,159}$/i.test(reason) ? reason : `sha256:${sha256(Buffer.from(reason, "utf8"))}`;
}

function reportFileEvidence(snapshot, result) {
  if (!result?.report_path) return null;
  const descriptor = fileDescriptor(snapshot, result.report_path);
  return Object.freeze({ path: descriptor.path, bytes: descriptor.bytes, sha256: descriptor.sha256 });
}

function projectRunResult(snapshot, label, input, result, wallMilliseconds, cpuUsage, diskBefore, diskAfter) {
  const report = result?.report ?? null;
  return Object.freeze({
    label,
    run_id: input.run_id,
    resume: input.resume === true,
    outcome: String(result?.outcome ?? "unknown"),
    reason: safeReason(result?.reason),
    wall_milliseconds: Math.ceil(wallMilliseconds),
    cpu_milliseconds: Math.ceil((cpuUsage.user + cpuUsage.system) / 1000),
    cpu_user_microseconds: cpuUsage.user,
    cpu_system_microseconds: cpuUsage.system,
    disk_bytes_before: diskBefore,
    disk_bytes_after: diskAfter,
    disk_growth_bytes: diskAfter - diskBefore,
    lock_released: result?.lock_released === true,
    bounded_report: reportFileEvidence(snapshot, result),
    plan: report ? Object.freeze({
      selection_mode: report.selection_mode ?? null,
      input_bytes: report.input_bytes ?? null,
      control_input_bytes: report.control_input_bytes ?? null,
      generated_bytes: report.generated_bytes ?? null,
      candidate_count: report.candidate_count ?? null,
      selected_count: Array.isArray(report.item_ids) ? report.item_ids.length : null,
      sessions_active: report.sessions_active ?? null,
      sessions_max: report.sessions_max ?? null,
      phase: report.phase ?? null,
      outcome: report.outcome ?? null,
      validation: Object.freeze({
        preflight_ok: report.validation?.preflight_ok ?? null,
        staging_ok: report.validation?.staging_ok ?? null,
        postflight_ok: report.validation?.postflight_ok ?? null,
      }),
    }) : null,
  });
}

function invokeExecutor(context, snapshot, packet, label, input, overrides = {}) {
  if (context.active_executor_runs !== 0) fail("harness-concurrency", "executor runs must be sequential");
  context.active_executor_runs += 1;
  context.max_executor_concurrency = Math.max(context.max_executor_concurrency, context.active_executor_runs);
  const diskBefore = treeBytes(snapshot, packet.harness_limits.max_snapshot_bytes);
  const cpuStart = process.cpuUsage();
  const wallStart = performance.now();
  let result;
  try {
    result = executeCuration(input, overrides);
  } finally {
    context.active_executor_runs -= 1;
  }
  const wallMilliseconds = performance.now() - wallStart;
  const cpuUsage = process.cpuUsage(cpuStart);
  const diskAfter = treeBytes(snapshot, packet.harness_limits.max_snapshot_bytes);
  const projected = projectRunResult(snapshot, label, input, result, wallMilliseconds, cpuUsage, diskBefore, diskAfter);
  if (projected.wall_milliseconds > packet.limits.max_runtime_seconds * 1000) {
    fail("executor-wall-limit", `${label} exceeded max_runtime_seconds`);
  }
  if (projected.cpu_milliseconds > packet.harness_limits.max_cpu_milliseconds_per_run) {
    fail("executor-cpu-limit", `${label} exceeded max_cpu_milliseconds_per_run`);
  }
  if (readLock(snapshot) !== null) fail("executor-lock-retained", `${label} left an active repository lock`);
  if (projected.disk_growth_bytes > packet.harness_limits.max_disk_growth_bytes) {
    fail("executor-disk-growth-limit", `${label} exceeded max_disk_growth_bytes`);
  }
  return Object.freeze({ result, evidence: projected });
}

function assertCompleted(invocation, label) {
  if (invocation.result.outcome !== "completed") fail("scenario-outcome", `${label} did not complete`);
  if (invocation.evidence.plan?.selection_mode !== "explicit") fail("selection-mode-invalid", `${label} did not use explicit selection`);
  if (invocation.evidence.plan?.sessions_max !== 1) fail("session-limit-invalid", `${label} did not report max_sessions one`);
  if (!invocation.evidence.lock_released) fail("executor-lock-retained", `${label} did not release its lock after terminal evidence`);
}

function retentionState(root, selected) {
  const records = selected.map(({ path, sha256: expectedHash }) => {
    const pending = resolve(root, path);
    const processedPath = `knowledge/inbox/processed/${basename(path)}`;
    const processed = resolve(root, processedPath);
    const pendingExists = existsSync(pending);
    const processedExists = existsSync(processed);
    const actualHash = processedExists ? sha256(readRegular(processed)) : pendingExists ? sha256(readRegular(pending)) : null;
    return Object.freeze({
      source_path: path,
      processed_path: processedPath,
      pending: pendingExists,
      processed: processedExists,
      expected_sha256: expectedHash,
      actual_sha256: actualHash,
      hash_preserved: actualHash === expectedHash,
    });
  });
  return Object.freeze({
    records: Object.freeze(records),
    all_pending: records.every((record) => record.pending && !record.processed && record.hash_preserved),
    all_processed: records.every((record) => !record.pending && record.processed && record.hash_preserved),
    manifest_sha256: sha256(canonicalJson(records)),
  });
}

function diagnosticSummary(result, conceptPath) {
  const records = result.diagnostics.map(({ path, code, severity, field }) => ({ path, code, severity, field: field ?? null }));
  const counts = {};
  for (const record of records) counts[`${record.severity}:${record.code}`] = (counts[`${record.severity}:${record.code}`] ?? 0) + 1;
  const conceptDiagnostics = records.filter((record) => record.path === conceptPath);
  return Object.freeze({
    mode: result.mode,
    files_checked: result.filesChecked,
    diagnostics: records.length,
    errors: records.filter(({ severity }) => severity === "error").length,
    warnings: records.filter(({ severity }) => severity === "warning").length,
    codes: Object.freeze(Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))),
    diagnostics_sha256: sha256(canonicalJson(records)),
    concept_diagnostics: conceptDiagnostics.length,
    concept_diagnostics_sha256: sha256(canonicalJson(conceptDiagnostics)),
  });
}

async function retrievalEvidence(context, snapshot, packet) {
  const semantic = await queryBundle(snapshot, packet.retrieval.semantic);
  const semanticPaths = semantic.results.map(({ path }) => path);
  const semanticMatch = semanticPaths.includes(packet.curated_concept.path);
  if (!semanticMatch) fail("semantic-retrieval-miss", "semantic query did not retrieve the curated concept");

  const portableArgs = [join(snapshot, "knowledge", "okf-query.sh"), "--root", snapshot];
  if (packet.retrieval.portable_decisions_only) portableArgs.push("--decisions");
  portableArgs.push(...packet.retrieval.portable_terms);
  const portable = command(context, "/bin/bash", portableArgs);
  const portableText = portable.stdout.toString("utf8");
  const portableMatch = portableText.includes(packet.curated_concept.path);
  if (!portableMatch) fail("portable-retrieval-miss", "portable query did not retrieve the curated concept");

  return Object.freeze({
    semantic: Object.freeze({
      count: semantic.count,
      matched_concept: semanticMatch,
      paths_sha256: sha256(canonicalJson(semanticPaths)),
      result_sha256: sha256(canonicalJson(semantic)),
      query_sha256: sha256(canonicalJson(packet.retrieval.semantic)),
    }),
    portable: Object.freeze({
      exit_status: portable.status,
      matched_concept: portableMatch,
      stdout_bytes: portable.stdout.length,
      stdout_sha256: sha256(portable.stdout),
      stderr_bytes: portable.stderr.length,
      stderr_sha256: sha256(portable.stderr),
      terms_sha256: sha256(canonicalJson(packet.retrieval.portable_terms)),
    }),
  });
}

function proposalSet(root, packet, selected, concept) {
  if (packet.scenario === "normal") {
    return Object.freeze({ normal: buildProposal(root, packet, selected, concept, packet.run_ids.normal) });
  }
  if (packet.scenario === "invalid-then-success") {
    return Object.freeze({
      invalid: buildProposal(root, packet, selected, concept, packet.run_ids.invalid, { invalid: true }),
      success: buildProposal(root, packet, selected, concept, packet.run_ids.success),
    });
  }
  return Object.freeze({ interrupt: buildProposal(root, packet, selected, concept, packet.run_ids.interrupt) });
}

function proposalEvidence(proposals) {
  return Object.freeze(Object.fromEntries(Object.entries(proposals).map(([key, proposal]) => [key, Object.freeze({
    path: proposal.path,
    bytes: proposal.bytes,
    sha256: proposal.sha256,
    output_count: proposal.output_count,
    concept_output_sha256: proposal.concept_output_sha256,
    inbox_index_membership: proposal.inbox_index_membership,
  })])));
}

function restoredProposalOutputs(root, proposalPath) {
  const proposal = JSON.parse(readRegular(resolve(root, proposalPath)).toString("utf8"));
  const records = proposal.outputs.map(({ path, expected_sha256 }) => {
    const full = resolve(root, path);
    const exists = existsSync(full);
    const actual = exists ? sha256(readRegular(full)) : null;
    return Object.freeze({ path, expected_sha256, actual_sha256: actual, restored: actual === expected_sha256 });
  });
  return Object.freeze({
    output_count: records.length,
    all_restored: records.every(({ restored }) => restored),
    manifest_sha256: sha256(canonicalJson(records)),
  });
}

function runScenario(context, snapshot, packet, proposals, selected) {
  const runs = [];
  const checkpoints = {};
  if (packet.scenario === "normal") {
    const input = executionInput(snapshot, packet, packet.run_ids.normal, proposals.normal);
    const invocation = invokeExecutor(context, snapshot, packet, "normal", input);
    runs.push(invocation.evidence);
    assertCompleted(invocation, "normal");
    return Object.freeze({ runs: Object.freeze(runs), checkpoints: Object.freeze(checkpoints) });
  }

  if (packet.scenario === "invalid-then-success") {
    const invalidInput = executionInput(snapshot, packet, packet.run_ids.invalid, proposals.invalid);
    const invalid = invokeExecutor(context, snapshot, packet, "invalid-staging", invalidInput);
    runs.push(invalid.evidence);
    if (invalid.result.outcome !== "failed" || invalid.result.reason !== "staging-validation-failed") {
      fail("scenario-outcome", "invalid staging did not fail at the strict staging gate");
    }
    checkpoints.invalid_retention = retentionState(snapshot, selected);
    if (!checkpoints.invalid_retention.all_pending || existsSync(resolve(snapshot, packet.curated_concept.path))) {
      fail("invalid-input-not-retained", "invalid staging advanced source or concept persistence");
    }
    if (!invalid.evidence.bounded_report || !invalid.evidence.lock_released) {
      fail("invalid-evidence-missing", "invalid staging did not retain bounded terminal evidence");
    }

    const successInput = executionInput(snapshot, packet, packet.run_ids.success, proposals.success);
    const success = invokeExecutor(context, snapshot, packet, "valid-success", successInput);
    runs.push(success.evidence);
    assertCompleted(success, "valid-success");
    return Object.freeze({ runs: Object.freeze(runs), checkpoints: Object.freeze(checkpoints) });
  }

  const interruptInput = executionInput(snapshot, packet, packet.run_ids.interrupt, proposals.interrupt);
  let faultInjected = false;
  const interrupted = invokeExecutor(context, snapshot, packet, "controlled-interrupt", interruptInput, {
    fault: (phase) => {
      if (phase === "after-source-move" && !faultInjected) {
        faultInjected = true;
        const error = new Error("controlled Epic 26 canary interruption");
        error.code = "epic26-controlled-interrupt";
        throw error;
      }
    },
  });
  runs.push(interrupted.evidence);
  if (!faultInjected || interrupted.result.outcome !== "failed" || interrupted.result.reason !== "epic26-controlled-interrupt") {
    fail("scenario-outcome", "controlled interrupt did not stop at the executor test seam");
  }
  checkpoints.interrupt_retention = retentionState(snapshot, selected);
  checkpoints.interrupt_output_rollback = restoredProposalOutputs(snapshot, proposals.interrupt.path);
  if (!checkpoints.interrupt_retention.all_pending
    || checkpoints.interrupt_retention.records.some((record) => !record.hash_preserved)
    || !checkpoints.interrupt_output_rollback.all_restored
    || !interrupted.evidence.bounded_report || !interrupted.evidence.lock_released) {
    fail("interrupt-recovery-invalid", "controlled interruption did not restore sources/outputs and retain bounded recovery evidence");
  }

  const resumeInput = executionInput(snapshot, packet, packet.run_ids.interrupt, proposals.interrupt, true);
  const resumed = invokeExecutor(context, snapshot, packet, "explicit-resume", resumeInput);
  runs.push(resumed.evidence);
  assertCompleted(resumed, "explicit-resume");
  return Object.freeze({ runs: Object.freeze(runs), checkpoints: Object.freeze(checkpoints) });
}

function assertFinalMaintenance(snapshot, packet, concept) {
  const conceptContent = readRegular(resolve(snapshot, packet.curated_concept.path));
  if (sha256(conceptContent) !== sha256(Buffer.from(packet.curated_concept.content, "utf8"))) {
    fail("concept-output-drift", "persisted concept does not match the reviewed packet output");
  }
  const conceptIndex = readRegular(resolve(snapshot, `knowledge/${concept.directory}/index.md`)).toString("utf8");
  const inboxIndex = readRegular(resolve(snapshot, "knowledge/inbox/index.md")).toString("utf8");
  const rootIndex = readRegular(resolve(snapshot, "knowledge/index.md")).toString("utf8");
  const log = readRegular(resolve(snapshot, "knowledge/log.md")).toString("utf8");
  if (!conceptIndex.includes(`./${basename(packet.curated_concept.path)}`)) fail("maintenance-index-missing", "concept index does not list the curated output");
  if (packet.source.selected_inbox.some((path) => inboxIndex.includes(`./${basename(path)}`))) fail("maintenance-inbox-stale", "inbox index still lists a processed selected item");
  if (!rootIndex.includes("./inbox/index.md") || !rootIndex.includes(`./${concept.directory}/index.md`)) fail("maintenance-root-index-invalid", "root index lost required group links");
  if (!log.includes(packet.source.revision) || !log.includes(packet.curated_concept.path)) fail("maintenance-log-missing", "bounded log entry lacks immutable revision or concept path");
  return Object.freeze({
    concept_sha256: sha256(conceptContent),
    concept_index_sha256: sha256(Buffer.from(conceptIndex, "utf8")),
    inbox_index_sha256: sha256(Buffer.from(inboxIndex, "utf8")),
    root_index_sha256: sha256(Buffer.from(rootIndex, "utf8")),
    log_sha256: sha256(Buffer.from(log, "utf8")),
  });
}

function snapshotStatusEvidence(context, snapshot) {
  const status = git(context, snapshot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  return Object.freeze({ bytes: status.stdout.length, sha256: sha256(status.stdout) });
}

function errorEvidence(error, stage = "operational-canary") {
  return Object.freeze({
    stage,
    code: safeReason(error?.code ?? error?.name ?? "canary-failed"),
    detail_sha256: error?.detail_sha256 ?? sha256(Buffer.from(String(error?.message ?? "unknown"), "utf8")),
    command_status: Number.isInteger(error?.status) ? error.status : null,
  });
}

function controlPlanInput(snapshot, packet) {
  return Object.freeze({
    trigger: "operator",
    operator_identity: packet.operator.identity,
    operator_request: packet.operator.request,
    root: snapshot,
    revision: packet.source.revision,
    run_id: packet.run_ids.blocked_control,
    inbox_path: "knowledge/inbox",
    selected_items: packet.source.selected_inbox,
    allowlist: ["knowledge"],
    extra_inputs: [],
    max_items: packet.limits.max_items,
    max_input_bytes: packet.limits.max_input_bytes,
    max_generated_bytes: packet.limits.max_generated_bytes,
    max_runtime_seconds: packet.limits.max_runtime_seconds,
    max_sessions: packet.limits.max_sessions,
  });
}

function writeKillSwitch(snapshot, value) {
  const path = resolve(snapshot, ".okf/KILL_SWITCH");
  assertRegularFile(path, "kill-switch-missing");
  writeFileSync(path, `${JSON.stringify(value, null, value.active ? 2 : 0)}\n`, "utf8");
  return fileDescriptor(snapshot, ".okf/KILL_SWITCH");
}

async function conductBlockedControlCanary(packet, packetHash, { retainSnapshot = false } = {}) {
  const startedAt = new Date();
  const wallStarted = performance.now();
  const cpuStarted = process.cpuUsage();
  const context = {
    deadline_ms: Date.now() + packet.harness_limits.max_wall_seconds * 1000,
    active_commands: 0,
    max_command_concurrency: 0,
    command_count: 0,
    active_executor_runs: 0,
    max_executor_concurrency: 0,
  };
  const state = {
    source_before: null,
    source_after: null,
    temporary_root: null,
    snapshot: null,
    tooling: null,
    selected_before: null,
    selected_after: null,
    unselected_before: null,
    unselected_after: null,
    pending_age: null,
    instructions_before: null,
    instructions_after: null,
    snapshot_status_before: null,
    snapshot_status_after: null,
    disk_before: null,
    disk_after: null,
    control_manifest_before: null,
    control_manifest_after: null,
    control_initial: null,
    control_active: null,
    control_restored: null,
    request_sha256: null,
    blocked_code: null,
    permitted_plan: null,
    failure: null,
  };

  try {
    state.source_before = sourceFingerprint(context, packet.source.root);
    git(context, packet.source.root, ["cat-file", "-e", `${packet.source.revision}^{commit}`]);
    state.temporary_root = mkdtempSync(join(tmpdir(), "okf-epic26-control-"));
    state.snapshot = createSnapshot(context, packet, state.temporary_root);
    const pending = new Set(pendingFiles(state.snapshot));
    for (const path of packet.source.selected_inbox) {
      if (!pending.has(path)) fail("selection-not-pending-at-revision", "a control selection is not pending at the exact revision");
    }
    state.selected_before = selectedDescriptors(state.snapshot, packet.source.selected_inbox);
    const selectedBytes = state.selected_before.reduce((sum, item) => sum + item.bytes, 0);
    if (selectedBytes > packet.limits.max_input_bytes) fail("selection-input-limit", "control selection exceeds max_input_bytes");
    for (const item of state.selected_before) {
      const revisionContent = git(context, state.snapshot, ["show", `${packet.source.revision}:${item.path}`]).stdout;
      if (revisionContent.length !== item.bytes || sha256(revisionContent) !== item.sha256) {
        fail("selection-revision-drift", "control selection differs from the exact tracked revision");
      }
    }
    const selectedSet = new Set(packet.source.selected_inbox);
    state.unselected_before = pendingManifest(state.snapshot, selectedSet);
    state.pending_age = pendingAgeEvidence(state.snapshot, startedAt.getTime());
    state.instructions_before = instructionManifest(context, state.snapshot, packet.source.revision);
    state.tooling = installCanaryTooling(state.snapshot);
    state.control_initial = fileDescriptor(state.snapshot, ".okf/KILL_SWITCH");
    const initial = readKillSwitch(state.snapshot);
    if (initial.active !== false || initial.ambiguous !== false) fail("kill-switch-initial-invalid", "control snapshot did not start inactive");
    state.control_manifest_before = treeManifest(join(state.snapshot, ".okf"));
    state.snapshot_status_before = snapshotStatusEvidence(context, state.snapshot);
    state.disk_before = treeBytes(state.snapshot, packet.harness_limits.max_snapshot_bytes);

    const request = controlPlanInput(state.snapshot, packet);
    state.request_sha256 = sha256(canonicalJson(request));
    try {
      state.control_active = writeKillSwitch(state.snapshot, { active: true, ...packet.control });
      const active = readKillSwitch(state.snapshot);
      if (active.active !== true || active.ambiguous !== false) fail("kill-switch-activation-invalid", "repository-local kill switch did not become unambiguously active");
      try {
        validateRunPlan(request);
        fail("control-not-blocked", "active kill switch unexpectedly permitted the check-only plan");
      } catch (error) {
        if (error.code !== "kill-switch-active") throw error;
        state.blocked_code = error.code;
      }
    } finally {
      state.control_restored = writeKillSwitch(state.snapshot, { active: false });
    }

    const restored = readKillSwitch(state.snapshot);
    if (restored.active !== false || restored.ambiguous !== false
      || state.control_restored.sha256 !== state.control_initial.sha256) {
      fail("kill-switch-recovery-invalid", "inactive kill-switch state was not restored byte-for-byte");
    }
    const permitted = validateRunPlan(request);
    if (permitted.selection_mode !== "explicit" || permitted.input_bytes !== selectedBytes
      || permitted.control_input_bytes !== 0 || permitted.items.length !== packet.source.selected_inbox.length) {
      fail("control-recovery-plan-invalid", "identical restored plan was not explicitly and exactly permitted");
    }
    state.permitted_plan = Object.freeze({
      permitted: true,
      plan_hash: permitted.plan_hash,
      selection_mode: permitted.selection_mode,
      input_bytes: permitted.input_bytes,
      control_input_bytes: permitted.control_input_bytes,
      selected_count: permitted.items.length,
      max_sessions: permitted.limits.max_sessions,
    });
    if (readLock(state.snapshot) !== null) fail("control-check-created-lock", "check-only control proof created a mutation lock");

    state.selected_after = selectedDescriptors(state.snapshot, packet.source.selected_inbox);
    if (canonicalJson(state.selected_before) !== canonicalJson(state.selected_after)) {
      fail("control-selected-source-mutated", "selected source changed during the control proof");
    }
    state.unselected_after = pendingManifest(state.snapshot, selectedSet);
    if (canonicalJson(state.unselected_before) !== canonicalJson(state.unselected_after)) {
      fail("control-unselected-source-mutated", "unselected source changed during the control proof");
    }
    state.instructions_after = instructionManifest(context, state.snapshot, packet.source.revision);
    if (canonicalJson(state.instructions_before) !== canonicalJson(state.instructions_after)) {
      fail("instructions-mutated", "control proof changed an AGENTS.md file");
    }
    state.snapshot_status_after = snapshotStatusEvidence(context, state.snapshot);
    if (canonicalJson(state.snapshot_status_before) !== canonicalJson(state.snapshot_status_after)) {
      fail("control-worktree-not-restored", "snapshot worktree status differs after control recovery");
    }
    state.control_manifest_after = treeManifest(join(state.snapshot, ".okf"));
    if (canonicalJson(state.control_manifest_before) !== canonicalJson(state.control_manifest_after)) {
      fail("control-artifacts-not-restored", "repository-local control artifacts differ after recovery");
    }
    state.disk_after = treeBytes(state.snapshot, packet.harness_limits.max_snapshot_bytes);
    if (state.disk_after - state.disk_before > packet.harness_limits.max_disk_growth_bytes) {
      fail("snapshot-disk-growth-limit", "blocked-control disk growth exceeded max_disk_growth_bytes");
    }
  } catch (error) {
    state.failure = errorEvidence(error, "blocked-control");
    if (state.snapshot && state.control_initial) {
      try { state.control_restored = writeKillSwitch(state.snapshot, { active: false }); }
      catch (restoreError) {
        state.failure = errorEvidence(restoreError, "blocked-control-recovery");
      }
    }
  }

  try {
    state.source_after = sourceFingerprint(context, packet.source.root);
    if (state.source_before && !fingerprintEqual(state.source_before, state.source_after) && !state.failure) {
      state.failure = errorEvidence(new CanaryError("live-source-mutated", "live source fingerprint changed during blocked-control proof"));
    }
  } catch (error) {
    if (!state.failure) state.failure = errorEvidence(error, "source-postflight");
  }

  const wallMilliseconds = Math.ceil(performance.now() - wallStarted);
  const cpu = process.cpuUsage(cpuStarted);
  const cpuMilliseconds = Math.ceil((cpu.user + cpu.system) / 1000);
  if (wallMilliseconds > packet.harness_limits.max_wall_seconds * 1000 && !state.failure) {
    state.failure = errorEvidence(new CanaryError("harness-wall-limit", "blocked-control wall limit exceeded"));
  }
  if (cpuMilliseconds > packet.harness_limits.max_cpu_milliseconds_per_run && !state.failure) {
    state.failure = errorEvidence(new CanaryError("executor-cpu-limit", "blocked-control CPU limit exceeded"));
  }
  const recovered = state.failure === null
    && state.blocked_code === "kill-switch-active"
    && state.permitted_plan?.permitted === true
    && state.control_initial?.sha256 === state.control_restored?.sha256;
  const oldestAgeDays = Math.ceil((state.pending_age?.oldest_seconds ?? 0) / 86_400);
  const report = {
    version: "okf-cadence-control-evidence/1",
    success: state.failure === null,
    scenario: "blocked-control",
    project_root: packet.source.root,
    revision: packet.source.revision,
    outcome: "blocked",
    packet_sha256: packetHash,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    automatic_execution: false,
    recovered,
    raw_inbox_content_recorded: false,
    control_proof: {
      path: ".okf/KILL_SWITCH",
      initial: state.control_initial ? { active: false, sha256: state.control_initial.sha256, bytes: state.control_initial.bytes } : null,
      activated: state.control_active ? {
        active: true,
        sha256: state.control_active.sha256,
        bytes: state.control_active.bytes,
        activated_by_sha256: sha256(Buffer.from(packet.control.activated_by, "utf8")),
        activated_at: packet.control.activated_at,
        reason_sha256: sha256(Buffer.from(packet.control.reason, "utf8")),
      } : null,
      blocked_check: {
        check_only: true,
        permitted: false,
        code: state.blocked_code,
        request_sha256: state.request_sha256,
        mutation: false,
      },
      restored: state.control_restored ? {
        active: false,
        sha256: state.control_restored.sha256,
        bytes: state.control_restored.bytes,
        matches_initial: state.control_initial?.sha256 === state.control_restored.sha256,
      } : null,
      permitted_check: state.permitted_plan ? {
        ...state.permitted_plan,
        check_only: true,
        request_sha256: state.request_sha256,
        mutation: false,
      } : null,
      identical_request: Boolean(state.request_sha256 && state.permitted_plan),
      recovery_complete: recovered,
    },
    integrity: {
      selected_before: state.selected_before,
      selected_after: state.selected_after,
      selected_unchanged: Boolean(state.selected_before && state.selected_after
        && canonicalJson(state.selected_before) === canonicalJson(state.selected_after)),
      unselected_before: state.unselected_before,
      unselected_after: state.unselected_after,
      unselected_unchanged: Boolean(state.unselected_before && state.unselected_after
        && canonicalJson(state.unselected_before) === canonicalJson(state.unselected_after)),
      live_before: state.source_before,
      live_after: state.source_after,
      live_unchanged: Boolean(state.source_before && state.source_after && fingerprintEqual(state.source_before, state.source_after)),
      instructions_unchanged: Boolean(state.instructions_before && state.instructions_after
        && canonicalJson(state.instructions_before) === canonicalJson(state.instructions_after)),
      snapshot_status_restored: Boolean(state.snapshot_status_before && state.snapshot_status_after
        && canonicalJson(state.snapshot_status_before) === canonicalJson(state.snapshot_status_after)),
      control_manifest_restored: Boolean(state.control_manifest_before && state.control_manifest_after
        && canonicalJson(state.control_manifest_before) === canonicalJson(state.control_manifest_after)),
    },
    controls: {
      network_used: false,
      scheduler_used: false,
      factory_used: false,
      child_runtime_sessions: 0,
      polling_used: false,
      mutation_lock_created: false,
      curator_started: false,
      automatic_retries: 0,
    },
    metrics: {
      runtime_seconds: Math.ceil(wallMilliseconds / 1000),
      wall_milliseconds: wallMilliseconds,
      cpu_ms: cpuMilliseconds,
      disk_growth_bytes: state.disk_before != null && state.disk_after != null ? Math.max(0, state.disk_after - state.disk_before) : 0,
      generated_bytes: 0,
      sessions_max: 0,
      concurrent_runs: 0,
      inbox_oldest_age_days: oldestAgeDays,
      processed_items: 0,
      useful_concept_changes: 0,
      operator_interventions: 2,
      command_count: context.command_count,
    },
    declared_limits: { executor: packet.limits, harness: packet.harness_limits },
    tooling: state.tooling,
    snapshot: { root: state.snapshot, retained: retainSnapshot, disk_bytes_before: state.disk_before, disk_bytes_after: state.disk_after },
    failure: state.failure,
  };

  if (!retainSnapshot && state.temporary_root) {
    try {
      const physicalTemporary = realpathSync(state.temporary_root);
      const expectedPrefix = `${realpathSync(tmpdir())}${sep}okf-epic26-control-`;
      if (!physicalTemporary.startsWith(expectedPrefix) || physicalTemporary === realpathSync(tmpdir())) {
        report.failure ??= errorEvidence(new CanaryError("temporary-root-unsafe", "refused unsafe control cleanup"), "cleanup");
        report.success = false;
        report.recovered = false;
      } else {
        rmSync(physicalTemporary, { recursive: true, force: false });
      }
    } catch (error) {
      report.failure ??= errorEvidence(error, "cleanup");
      report.success = false;
      report.recovered = false;
    }
  }
  const unsigned = { ...report };
  report.report_hashes = {
    evidence_payload_sha256: sha256(canonicalJson(unsigned)),
    control_request_sha256: state.request_sha256,
    selected_manifest_sha256: sha256(canonicalJson(state.selected_before)),
  };
  return report;
}

async function conductCanary(packet, packetHash, { retainSnapshot = false } = {}) {
  if (packet.scenario === "blocked-control") {
    return conductBlockedControlCanary(packet, packetHash, { retainSnapshot });
  }
  const startedAt = new Date();
  const wallStarted = performance.now();
  const cpuStarted = process.cpuUsage();
  const context = {
    deadline_ms: Date.now() + packet.harness_limits.max_wall_seconds * 1000,
    active_commands: 0,
    max_command_concurrency: 0,
    command_count: 0,
    active_executor_runs: 0,
    max_executor_concurrency: 0,
  };
  const state = {
    source_before: null,
    source_after: null,
    temporary_root: null,
    snapshot: null,
    snapshot_retained: retainSnapshot,
    tooling: null,
    selected: null,
    selected_revision_manifest: null,
    selected_age: null,
    pending_before: null,
    pending_after: null,
    unselected_before: null,
    unselected_after: null,
    instructions_before: null,
    instructions_after: null,
    proposals: null,
    scenario: null,
    final_retention: null,
    maintenance: null,
    strict_lint: null,
    retrieval: null,
    snapshot_status: null,
    disk_baseline: null,
    disk_after: null,
    failure: null,
  };

  try {
    state.source_before = sourceFingerprint(context, packet.source.root);
    git(context, packet.source.root, ["cat-file", "-e", `${packet.source.revision}^{commit}`]);

    state.temporary_root = mkdtempSync(join(tmpdir(), "okf-epic26-canary-"));
    state.snapshot = createSnapshot(context, packet, state.temporary_root);
    const pending = new Set(pendingFiles(state.snapshot));
    for (const path of packet.source.selected_inbox) {
      if (!pending.has(path)) fail("selection-not-pending-at-revision", "a selected path is not a direct pending inbox file at the exact revision");
    }
    state.selected = selectedDescriptors(state.snapshot, packet.source.selected_inbox);
    const selectedBytes = state.selected.reduce((sum, item) => sum + item.bytes, 0);
    if (selectedBytes > packet.limits.max_input_bytes) fail("selection-input-limit", "selected inbox bytes exceed max_input_bytes");
    const revisionRecords = [];
    for (const item of state.selected) {
      const revisionContent = git(context, state.snapshot, ["show", `${packet.source.revision}:${item.path}`]).stdout;
      const descriptor = { path: item.path, bytes: revisionContent.length, sha256: sha256(revisionContent) };
      if (descriptor.bytes !== item.bytes || descriptor.sha256 !== item.sha256) {
        fail("selection-revision-drift", "selected snapshot content differs from the exact tracked revision");
      }
      revisionRecords.push(descriptor);
    }
    state.selected_revision_manifest = Object.freeze({
      count: revisionRecords.length,
      bytes: revisionRecords.reduce((sum, item) => sum + item.bytes, 0),
      sha256: sha256(canonicalJson(revisionRecords)),
    });
    state.selected_age = selectedAgeEvidence(state.snapshot, packet.source.selected_inbox, startedAt.getTime());
    state.pending_before = pendingAgeEvidence(state.snapshot, startedAt.getTime());
    const selectedSet = new Set(packet.source.selected_inbox);
    state.unselected_before = pendingManifest(state.snapshot, selectedSet);
    state.instructions_before = instructionManifest(context, state.snapshot, packet.source.revision);

    state.tooling = installCanaryTooling(state.snapshot);
    const concept = conceptMetadata(packet, state.selected);
    const proposals = proposalSet(state.snapshot, packet, state.selected, concept);
    state.proposals = proposalEvidence(proposals);
    state.disk_baseline = treeBytes(state.snapshot, packet.harness_limits.max_snapshot_bytes);

    state.scenario = runScenario(context, state.snapshot, packet, proposals, state.selected);
    state.final_retention = retentionState(state.snapshot, state.selected);
    if (!state.final_retention.all_processed) fail("selected-source-not-retained", "not every selected source hash was preserved in inbox/processed");
    state.unselected_after = pendingManifest(state.snapshot, selectedSet);
    if (canonicalJson(state.unselected_before) !== canonicalJson(state.unselected_after)) {
      fail("unselected-inbox-mutated", "unselected snapshot inbox content changed");
    }
    state.pending_after = pendingAgeEvidence(state.snapshot, Date.now());
    if (state.pending_after.selected_count !== state.pending_before.selected_count - state.selected.length) {
      fail("pending-count-invalid", "pending count did not decrease by exactly the selected item count");
    }
    state.maintenance = assertFinalMaintenance(state.snapshot, packet, concept);

    const strict = lintBundle(state.snapshot, { mode: "strict" });
    state.strict_lint = diagnosticSummary(strict, packet.curated_concept.path);
    if (state.strict_lint.concept_diagnostics !== 0) fail("strict-concept-invalid", "curated concept has strict lint diagnostics");
    state.retrieval = await retrievalEvidence(context, state.snapshot, packet);
    state.instructions_after = instructionManifest(context, state.snapshot, packet.source.revision);
    if (canonicalJson(state.instructions_before) !== canonicalJson(state.instructions_after)) {
      fail("instructions-mutated", "snapshot AGENTS.md content changed");
    }
    state.snapshot_status = snapshotStatusEvidence(context, state.snapshot);
    state.disk_after = treeBytes(state.snapshot, packet.harness_limits.max_snapshot_bytes);
    if (state.disk_after - state.disk_baseline > packet.harness_limits.max_disk_growth_bytes) {
      fail("snapshot-disk-growth-limit", "aggregate canary disk growth exceeded max_disk_growth_bytes");
    }

    for (const run of state.scenario.runs) {
      if (run.plan?.input_bytes !== state.selected_revision_manifest.bytes) fail("input-accounting-invalid", "executor input_bytes does not equal selected source bytes");
      if (!Number.isSafeInteger(run.plan?.control_input_bytes) || run.plan.control_input_bytes <= 0
        || run.plan.control_input_bytes > packet.limits.max_generated_bytes) {
        fail("control-accounting-invalid", "proposal/control bytes are absent or exceed max_generated_bytes");
      }
      if (!Number.isSafeInteger(run.plan?.generated_bytes) || run.plan.generated_bytes > packet.limits.max_generated_bytes) {
        fail("generated-accounting-invalid", "executor generated bytes are absent or exceed max_generated_bytes");
      }
    }
  } catch (error) {
    state.failure = errorEvidence(error);
  }

  try {
    state.source_after = sourceFingerprint(context, packet.source.root);
    if (state.source_before && !fingerprintEqual(state.source_before, state.source_after) && !state.failure) {
      state.failure = errorEvidence(new CanaryError("live-source-mutated", "live source fingerprint changed during the canary"));
    }
  } catch (error) {
    if (!state.failure) state.failure = errorEvidence(error, "source-postflight");
  }

  const wallMilliseconds = Math.ceil(performance.now() - wallStarted);
  const cpuUsage = process.cpuUsage(cpuStarted);
  if (wallMilliseconds > packet.harness_limits.max_wall_seconds * 1000 && !state.failure) {
    state.failure = errorEvidence(new CanaryError("harness-wall-limit", "aggregate harness wall-clock ceiling was exceeded"));
  }
  const runs = state.scenario?.runs ?? [];
  const generatedTotal = runs.reduce((sum, run) => sum + (Number.isSafeInteger(run.plan?.generated_bytes) ? run.plan.generated_bytes : 0), 0);
  const controlTotal = runs.reduce((sum, run) => sum + (Number.isSafeInteger(run.plan?.control_input_bytes) ? run.plan.control_input_bytes : 0), 0);
  const report = {
    version: "okf-epic26-canary-evidence/1",
    success: state.failure === null,
    raw_inbox_content_recorded: false,
    scenario: packet.scenario,
    packet_sha256: packetHash,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    source: {
      root: packet.source.root,
      revision: packet.source.revision,
      selected_items: state.selected ?? packet.source.selected_inbox.map((path) => ({ path })),
      exact_revision_manifest: state.selected_revision_manifest,
      live_before: state.source_before,
      live_after: state.source_after,
      live_unchanged: Boolean(state.source_before && state.source_after && fingerprintEqual(state.source_before, state.source_after)),
    },
    snapshot: {
      root: state.snapshot,
      retained: retainSnapshot,
      exact_head: state.snapshot ? packet.source.revision : null,
      disk_bytes_baseline: state.disk_baseline,
      disk_bytes_after: state.disk_after,
      disk_growth_bytes: state.disk_baseline != null && state.disk_after != null ? state.disk_after - state.disk_baseline : null,
      status: state.snapshot_status,
      instructions_before: state.instructions_before,
      instructions_after: state.instructions_after,
      instructions_unchanged: Boolean(state.instructions_before && state.instructions_after
        && canonicalJson(state.instructions_before) === canonicalJson(state.instructions_after)),
    },
    controls: {
      explicit_operator_identity_sha256: sha256(Buffer.from(packet.operator.identity, "utf8")),
      explicit_operator_request_sha256: sha256(Buffer.from(packet.operator.request, "utf8")),
      tooling: state.tooling,
      network_used: false,
      scheduler_used: false,
      factory_used: false,
      child_runtime_sessions: 0,
      automatic_retries: 0,
      max_sessions: packet.limits.max_sessions,
      max_executor_concurrency_observed: context.max_executor_concurrency,
      max_command_concurrency_observed: context.max_command_concurrency,
      command_count: context.command_count,
    },
    proposals: state.proposals,
    runs,
    recovery_checkpoints: state.scenario?.checkpoints ?? null,
    integrity: {
      final_selected_retention: state.final_retention,
      unselected_before: state.unselected_before,
      unselected_after: state.unselected_after,
      unselected_unchanged: Boolean(state.unselected_before && state.unselected_after
        && canonicalJson(state.unselected_before) === canonicalJson(state.unselected_after)),
      maintenance: state.maintenance,
    },
    validation: {
      strict_lint: state.strict_lint,
      retrieval: state.retrieval,
    },
    backlog: {
      selected_age: state.selected_age,
      pending_before: state.pending_before,
      pending_after: state.pending_after,
    },
    usefulness: {
      useful_concept_changes: state.maintenance ? 1 : 0,
      processed_items: state.final_retention?.records.filter(({ processed }) => processed).length ?? 0,
      curation_yield: state.final_retention?.records.length ? 1 / state.final_retention.records.length : 0,
      strict_and_retrievable: Boolean(state.strict_lint?.concept_diagnostics === 0
        && state.retrieval?.semantic?.matched_concept && state.retrieval?.portable?.matched_concept),
    },
    metrics: {
      wall_milliseconds: wallMilliseconds,
      cpu_user_microseconds: cpuUsage.user,
      cpu_system_microseconds: cpuUsage.system,
      cpu_milliseconds: Math.ceil((cpuUsage.user + cpuUsage.system) / 1000),
      executor_invocations: runs.length,
      executor_generated_bytes_total: generatedTotal,
      proposal_control_bytes_total: controlTotal,
      max_active_sessions_observed: context.max_executor_concurrency,
      max_concurrent_runs_observed: context.max_executor_concurrency,
    },
    declared_limits: {
      executor: packet.limits,
      harness: packet.harness_limits,
    },
    failure: state.failure,
  };

  if (!retainSnapshot && state.temporary_root) {
    try {
      const physicalTemporary = realpathSync(state.temporary_root);
      const expectedPrefix = `${realpathSync(tmpdir())}${sep}okf-epic26-canary-`;
      if (!physicalTemporary.startsWith(expectedPrefix) || physicalTemporary === realpathSync(tmpdir())) {
        if (!state.failure) report.failure = errorEvidence(new CanaryError("temporary-root-unsafe", "refused unsafe temporary cleanup"), "cleanup");
        report.success = false;
      } else {
        rmSync(physicalTemporary, { recursive: true, force: false });
      }
    } catch (error) {
      if (!report.failure) report.failure = errorEvidence(error, "cleanup");
      report.success = false;
    }
  }

  const unsigned = { ...report };
  report.report_hashes = {
    evidence_payload_sha256: sha256(canonicalJson(unsigned)),
    bounded_executor_reports_sha256: sha256(canonicalJson(runs.map(({ bounded_report }) => bounded_report))),
    proposal_manifest_sha256: sha256(canonicalJson(state.proposals)),
  };
  return report;
}

function parseArguments(argv) {
  let packetPath = null;
  let reportPath = null;
  let retainSnapshot = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--retain-snapshot") {
      retainSnapshot = true;
      continue;
    }
    if (argument === "--packet" || argument === "--report") {
      if (index + 1 >= argv.length) fail("usage", `${argument} requires an absolute path`);
      const value = argv[++index];
      if (!isAbsolute(value)) fail("usage", `${argument} requires an absolute path`);
      if (argument === "--packet") {
        if (packetPath !== null) fail("usage", "--packet may be supplied only once");
        packetPath = value;
      } else {
        if (reportPath !== null) fail("usage", "--report may be supplied only once");
        reportPath = value;
      }
      continue;
    }
    if (argument === "--help") {
      return Object.freeze({ help: true, packetPath: null, reportPath: null, retainSnapshot: false });
    }
    fail("usage", `unknown argument: ${argument}`);
  }
  if (!packetPath) fail("usage", "--packet is required");
  return Object.freeze({ help: false, packetPath, reportPath, retainSnapshot });
}

function usage() {
  return [
    "Usage:",
    "  node epic26-canary-harness.mjs --packet /absolute/packet.json [--report /absolute/evidence.json] [--retain-snapshot]",
    "",
    "The report path must not be inside the source repository and is created without overwriting.",
    "Without --report, the bounded evidence JSON is emitted only to stdout.",
  ].join("\n");
}

function readPacket(path) {
  const physical = realpathSync(path);
  if (physical !== resolve(path)) fail("packet-path-invalid", "--packet must name its physical path");
  const stat = assertRegularFile(physical, "packet-path-invalid");
  if (stat.size > MAX_PACKET_BYTES) fail("packet-too-large", "packet exceeds the 1 MiB parser ceiling");
  const bytes = readFileSync(physical);
  let raw;
  try { raw = JSON.parse(bytes.toString("utf8")); }
  catch { fail("packet-json-invalid", "packet must be valid JSON"); }
  return Object.freeze({ packet: validatePacket(raw), bytes, sha256: sha256(bytes) });
}

function reportTarget(path, sourceRoot) {
  if (path === null) return null;
  const target = resolve(path);
  if (existsSync(target)) fail("report-target-exists", "--report will not overwrite an existing path");
  const parent = physicalRoot(dirname(target), "report parent");
  const rel = relative(sourceRoot, target);
  if (rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))) {
    fail("report-inside-source", "--report must be outside the live source repository");
  }
  return join(parent, basename(target));
}

function encodeEvidence(report, ceiling) {
  const json = JSON.stringify(report, null, 2);
  const bytes = Buffer.from(`${json}\n`, "utf8");
  if (bytes.length > ceiling) fail("evidence-report-limit", "evidence JSON exceeds max_report_bytes");
  return bytes;
}

let exitStatus = 1;
try {
  const args = parseArguments(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  const loaded = readPacket(args.packetPath);
  const target = reportTarget(args.reportPath, loaded.packet.source.root);
  const evidence = await conductCanary(loaded.packet, loaded.sha256, { retainSnapshot: args.retainSnapshot });
  const encoded = encodeEvidence(evidence, loaded.packet.harness_limits.max_report_bytes);
  if (target) writeFileSync(target, encoded, { flag: "wx" });
  process.stdout.write(encoded);
  exitStatus = evidence.success ? 0 : 1;
} catch (error) {
  const failure = {
    version: "okf-epic26-canary-evidence/1",
    success: false,
    failure: errorEvidence(error, "harness-bootstrap"),
  };
  const encoded = Buffer.from(`${JSON.stringify(failure, null, 2)}\n`, "utf8");
  process.stdout.write(encoded);
  exitStatus = 1;
}
process.exit(exitStatus);
