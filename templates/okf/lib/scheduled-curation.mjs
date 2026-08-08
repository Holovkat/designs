import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { processedPathFor } from "./curation-proposal.mjs";
import { triageInbox } from "./inbox-triage.mjs";
import { readKillSwitch } from "./run-control.mjs";
import { canonicalJson } from "./run-plan.mjs";
import { assertRevision, resolveContainedPath, resolveControlPath, validateRoot } from "./run-guard.mjs";

const CONFIG_VERSION = "okf-scheduled-curation/1";
const DRAFT_VERSION = "okf-scheduled-curation-draft/1";
const REPORT_VERSION = "okf-scheduled-curation-report/1";
const ATTEMPT_VERSION = "okf-scheduled-curation-attempt/1";
const LEASE_VERSION = "okf-scheduled-curation-lease/1";
const SCHEDULED_ROOT = ".okf/scheduled-curation";
const OUTER_LEASE_PATH = `${SCHEDULED_ROOT}/outer.lock`;
const PROMPT_PATH = ".okf/templates/scheduled-curation-prompt.md";
const MAX_CONFIG_BYTES = 64 * 1024;
const MAX_ATTEMPT_REPORT_BYTES = 64 * 1024;
const PROCESS_KILL_GRACE_MS = 250;
const SUBPROCESS_ENV_ALLOWLIST = Object.freeze([
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "LOGNAME",
  "PATH",
  "SHELL",
  "SSL_CERT_FILE",
  "TERM",
  "TMP",
  "TMPDIR",
  "TEMP",
  "USER",
  "XDG_CACHE_HOME",
  "XDG_CONFIG_HOME",
  "XDG_STATE_HOME",
]);
const CONCEPT_PATH = /^knowledge\/(?:architecture|components|domain|decisions|deprecation|process|state)\/[a-z0-9][a-z0-9._-]*\.md$/;
const INDEX_PATH = /^knowledge\/(?:inbox|architecture|components|domain|decisions|deprecation|process|state)\/index\.md$/;
const SAFE_CODE = /^[a-z0-9][a-z0-9:._-]{0,127}$/i;
const PLACEHOLDERS = new Set([
  "operator-id",
  "explicit approval reference",
  "explicit-model-id",
  "explicit-supported-level",
]);

const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const curatorCli = resolve(moduleRoot, "bin/okf-curate.mjs");

export class ScheduledCurationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new ScheduledCurationError(code, message);
}

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(path) {
  return sha256(readFileSync(path));
}

function textBytes(value) {
  return Buffer.byteLength(value, "utf8");
}

/** Build the complete environment shared with Git, Droid, and the curator. */
export function buildScheduledSubprocessEnv(source = process.env) {
  const result = {};
  for (const key of SUBPROCESS_ENV_ALLOWLIST) {
    if (typeof source[key] === "string" && source[key] !== "") result[key] = source[key];
  }
  return Object.freeze(result);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactObject(value, required, optional, label) {
  if (!isRecord(value)) fail("config-shape-invalid", `${label} must be an object`);
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  const missing = required.filter((key) => !keys.includes(key));
  const unknown = keys.filter((key) => !allowed.has(key));
  if (missing.length > 0 || unknown.length > 0) {
    fail("config-shape-invalid", `${label} has missing or unknown fields`);
  }
}

function nonEmptyString(value, code, label, maximum) {
  if (typeof value !== "string" || value.trim() === "" || value.includes("\0") || value.length > maximum) {
    fail(code, `${label} must be a bounded non-empty string`);
  }
  const normalized = value.trim();
  if (PLACEHOLDERS.has(normalized.toLowerCase()) || /<[^>]+>|replace[-_ ]?me|placeholder/i.test(normalized)) {
    fail("config-placeholder", `${label} must not be a placeholder`);
  }
  return normalized;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) fail("config-limit-invalid", `${label} must be a positive safe integer`);
  return value;
}

function freezeConfig(config) {
  return Object.freeze({
    ...config,
    operator: Object.freeze({ ...config.operator }),
    selection: Object.freeze({ ...config.selection }),
    limits: Object.freeze({ ...config.limits }),
    generator: Object.freeze({ ...config.generator }),
    commit: Object.freeze({ ...config.commit }),
  });
}

/** Validate the closed scheduled-curation profile without granting execution authority. */
export function validateScheduledConfig(value, root) {
  exactObject(value, [
    "version", "enabled", "root", "canonical_branch", "operator", "expected_outcome", "recovery_plan",
    "selection", "limits", "generator", "retry_policy", "failure_policy", "commit",
  ], ["allow_unrelated_worktree_changes"], "config");
  if (value.version !== CONFIG_VERSION) fail("config-version-invalid", `version must be ${CONFIG_VERSION}`);
  if (typeof value.enabled !== "boolean") fail("config-enabled-invalid", "enabled must be boolean");
  if (typeof value.root !== "string" || value.root !== root || !isAbsolute(value.root)) {
    fail("config-root-mismatch", "config root must exactly match the explicit physical root");
  }
  if (value.allow_unrelated_worktree_changes != null && typeof value.allow_unrelated_worktree_changes !== "boolean") {
    fail("config-worktree-policy-invalid", "allow_unrelated_worktree_changes must be boolean");
  }

  const canonicalBranch = nonEmptyString(value.canonical_branch, "config-branch-invalid", "canonical_branch", 256);
  if (/\s/.test(canonicalBranch) || canonicalBranch.startsWith("-") || canonicalBranch.includes("..")) {
    fail("config-branch-invalid", "canonical_branch is not a safe exact branch name");
  }
  exactObject(value.operator, ["identity", "approval_ref", "request"], [], "operator");
  const operator = {
    identity: nonEmptyString(value.operator.identity, "config-operator-invalid", "operator.identity", 128),
    approval_ref: nonEmptyString(value.operator.approval_ref, "config-approval-invalid", "operator.approval_ref", 512),
    request: nonEmptyString(value.operator.request, "config-request-invalid", "operator.request", 1_024),
  };
  const expectedOutcome = nonEmptyString(value.expected_outcome, "config-outcome-invalid", "expected_outcome", 1_024);
  const recoveryPlan = nonEmptyString(value.recovery_plan, "config-recovery-invalid", "recovery_plan", 2_048);

  exactObject(value.selection, ["mode", "max_items"], [], "selection");
  if (value.selection.mode !== "actionable-lexical-first" || value.selection.max_items !== 1) {
    fail("config-selection-invalid", "selection must be actionable-lexical-first with max_items equal to one");
  }
  exactObject(value.limits, [
    "max_items", "max_input_bytes", "max_generated_bytes", "max_runtime_seconds", "max_context_bytes",
    "max_model_output_bytes", "max_model_runtime_seconds", "max_total_runtime_seconds", "max_sessions",
  ], [], "limits");
  const limits = Object.fromEntries(Object.entries(value.limits).map(([key, item]) => [key, positiveInteger(item, `limits.${key}`)]));
  if (limits.max_items !== 1 || limits.max_sessions !== 1 || limits.max_items !== value.selection.max_items) {
    fail("config-limits-inconsistent", "max_items and max_sessions must equal one");
  }
  if (limits.max_input_bytes > limits.max_context_bytes
    || limits.max_model_output_bytes > limits.max_context_bytes
    || limits.max_generated_bytes > limits.max_context_bytes
    || limits.max_model_output_bytes >= limits.max_generated_bytes
    || limits.max_model_runtime_seconds > limits.max_total_runtime_seconds
    || limits.max_runtime_seconds > limits.max_total_runtime_seconds) {
    fail("config-limits-inconsistent", "declared limits are internally inconsistent");
  }

  exactObject(value.generator, ["kind", "binary", "binary_sha256", "model", "reasoning"], [], "generator");
  if (value.generator.kind !== "droid-exec") fail("config-generator-invalid", "generator.kind must be droid-exec");
  if (typeof value.generator.binary !== "string" || !isAbsolute(value.generator.binary)) {
    fail("config-binary-invalid", "generator.binary must be an absolute physical path");
  }
  if (typeof value.generator.binary_sha256 !== "string"
    || !/^[0-9a-f]{64}$/i.test(value.generator.binary_sha256)
    || /^0{64}$/i.test(value.generator.binary_sha256)) {
    fail("config-binary-hash-invalid", "generator.binary_sha256 must be a non-zero SHA-256");
  }
  const generator = {
    kind: "droid-exec",
    binary: value.generator.binary,
    binary_sha256: value.generator.binary_sha256.toLowerCase(),
    model: nonEmptyString(value.generator.model, "config-model-invalid", "generator.model", 256),
    reasoning: nonEmptyString(value.generator.reasoning, "config-reasoning-invalid", "generator.reasoning", 64),
  };
  if (!/^[a-z0-9][a-z0-9:.[\]_-]*$/i.test(generator.model) || !/^[a-z0-9][a-z0-9._-]*$/i.test(generator.reasoning)) {
    fail("config-generator-invalid", "model and reasoning must be explicit flag-safe identifiers");
  }
  if (value.retry_policy !== "never") fail("config-retry-invalid", "retry_policy must be never");
  if (value.failure_policy !== "activate-kill-switch") fail("config-failure-policy-invalid", "failure_policy must activate the kill switch");
  exactObject(value.commit, ["enabled", "subject_prefix"], [], "commit");
  if (value.commit.enabled !== true || value.commit.subject_prefix !== "okf-curation:") {
    fail("config-commit-invalid", "commit must be enabled with the okf-curation: prefix");
  }
  return freezeConfig({
    version: CONFIG_VERSION,
    enabled: value.enabled,
    root,
    canonical_branch: canonicalBranch,
    allow_unrelated_worktree_changes: value.allow_unrelated_worktree_changes === true,
    operator,
    expected_outcome: expectedOutcome,
    recovery_plan: recoveryPlan,
    selection: { mode: "actionable-lexical-first", max_items: 1 },
    limits,
    generator,
    retry_policy: "never",
    failure_policy: "activate-kill-switch",
    commit: { enabled: true, subject_prefix: "okf-curation:" },
  });
}

function fsyncDirectory(path) {
  let descriptor;
  try {
    descriptor = openSync(path, constants.O_RDONLY);
    fsyncSync(descriptor);
  } finally {
    if (descriptor != null) closeSync(descriptor);
  }
}

function writeOnceDurable(path, value, mode = 0o600) {
  mkdirSync(dirname(path), { recursive: true });
  const descriptor = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, mode);
  try {
    writeFileSync(descriptor, value);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  fsyncDirectory(dirname(path));
}

function readJsonFile(root, path, maximumBytes = MAX_CONFIG_BYTES) {
  const target = resolveContainedPath(root, path);
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("config-not-regular-file", "config must be a regular repository-local file");
  if (stat.size > maximumBytes) fail("config-too-large", "config exceeds its fixed parser boundary");
  const raw = readFileSync(target.full);
  try {
    return Object.freeze({ target, raw, value: JSON.parse(raw.toString("utf8")), sha256: sha256(raw) });
  } catch {
    fail("config-json-invalid", "config must contain exact JSON");
  }
}

function normalizeResult(result) {
  if (!result || typeof result !== "object") return { status: 1, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: "command-result-invalid" };
  return {
    ...result,
    status: Number.isInteger(result.status) ? result.status : result.exitCode ?? 1,
    stdout: Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? "", "utf8"),
    stderr: Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.from(result.stderr ?? "", "utf8"),
  };
}

function terminateProcess(child) {
  if (!child.pid) return;
  try {
    if (process.platform !== "win32") process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    try { child.kill("SIGTERM"); } catch { /* already stopped */ }
  }
  setTimeout(() => {
    try {
      if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
      else child.kill("SIGKILL");
    } catch {
      try { child.kill("SIGKILL"); } catch { /* already stopped */ }
    }
  }, PROCESS_KILL_GRACE_MS).unref();
}

async function runBoundedProcess(binary, args, { cwd, timeoutMs, maxStdoutBytes, maxStderrBytes = 64 * 1024 }) {
  return new Promise((resolvePromise) => {
    const started = Date.now();
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let forcedCode = null;
    let timedOut = false;
    let settled = false;
    const child = spawn(binary, args, {
      cwd,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: buildScheduledSubprocessEnv(),
    });
    const finish = (status, signal = null, error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolvePromise({
        status: Number.isInteger(status) ? status : 1,
        signal,
        error,
        code: forcedCode,
        timed_out: timedOut,
        wall_ms: Date.now() - started,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    };
    const deadline = setTimeout(() => {
      timedOut = true;
      forcedCode = "command-timeout";
      terminateProcess(child);
    }, Math.max(1, timeoutMs));
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxStdoutBytes) {
        forcedCode ??= "command-output-limit";
        terminateProcess(child);
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes > maxStderrBytes) {
        forcedCode ??= "command-stderr-limit";
        terminateProcess(child);
        return;
      }
      stderr.push(chunk);
    });
    child.once("error", (error) => finish(1, null, error));
    child.once("close", (status, signal) => finish(status, signal));
  });
}

async function defaultGit({ root, args, timeoutMs }) {
  return runBoundedProcess("git", args, { cwd: root, timeoutMs, maxStdoutBytes: 4 * 1024 * 1024 });
}

async function defaultModel({ binary, args, cwd, timeoutMs, maxOutputBytes }) {
  return runBoundedProcess(binary, args, {
    cwd,
    timeoutMs,
    maxStdoutBytes: Math.min(Number.MAX_SAFE_INTEGER, maxOutputBytes * 4 + 64 * 1024),
  });
}

async function defaultExecutor({ args, root, timeoutMs, maxOutputBytes }) {
  return runBoundedProcess(process.execPath, [curatorCli, ...args], {
    cwd: root,
    timeoutMs,
    maxStdoutBytes: Math.min(Number.MAX_SAFE_INTEGER, maxOutputBytes + 512 * 1024),
  });
}

async function gitCommand(git, root, args, timeoutMs, code = "git-command-failed") {
  const result = normalizeResult(await git({ root, args, timeoutMs }));
  if (result.status !== 0 || result.timed_out || result.code) fail(result.code ?? code, `Git command failed: ${args[0]}`);
  return result.stdout;
}

function nulPaths(buffer) {
  return buffer.toString("utf8").split("\0").filter(Boolean).sort(compare);
}

async function outsideStatus(git, root, timeoutMs) {
  return gitCommand(git, root, [
    "status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ".",
    ":(exclude)knowledge", `:(exclude)${SCHEDULED_ROOT}`,
    ":(exclude).okf/run.lock", ":(exclude).okf/cancel", ":(exclude).okf/checkpoints",
    ":(exclude).okf/reports", ":(exclude).okf/staging",
  ], timeoutMs, "git-status-failed");
}

function assertNoTemporarySchedulerFiles(root) {
  const target = resolveControlPath(root, SCHEDULED_ROOT);
  if (!existsSync(target.full)) return;
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) fail("scheduled-control-symlink", "scheduler controls must not contain symlinks");
      if (entry.isDirectory()) walk(path);
      else if (!entry.isFile() || entry.name.endsWith(".tmp")) fail("scheduled-control-dirty", "scheduler controls contain an incomplete artifact");
    }
  };
  walk(target.full);
}

async function inspectGitState(root, config, git, timeoutMs, { lease = null, allowKnowledgeChanges = false } = {}) {
  const branch = (await gitCommand(git, root, ["symbolic-ref", "--quiet", "--short", "HEAD"], timeoutMs, "git-branch-invalid")).toString("utf8").trim();
  if (branch !== config.canonical_branch) fail("git-branch-mismatch", "current branch does not match canonical_branch");
  const revision = (await gitCommand(git, root, ["rev-parse", "--verify", "HEAD"], timeoutMs, "git-head-invalid")).toString("utf8").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(revision)) fail("git-head-invalid", "HEAD must be a full 40-hex revision");
  const staged = nulPaths(await gitCommand(git, root, ["diff", "--cached", "--name-only", "--no-renames", "-z"], timeoutMs));
  if (staged.length > 0) fail("git-index-dirty", "staged changes are not permitted");
  const tracked = nulPaths(await gitCommand(git, root, ["diff", "--name-only", "--no-renames", "-z"], timeoutMs));
  if (!config.allow_unrelated_worktree_changes
    && tracked.some((path) => !allowKnowledgeChanges || !(path === "knowledge" || path.startsWith("knowledge/")))) {
    fail("git-worktree-dirty", "tracked worktree changes are not permitted");
  }
  if (!allowKnowledgeChanges && tracked.some((path) => path === "knowledge" || path.startsWith("knowledge/"))) {
    fail("knowledge-dirty", "knowledge must be clean before scheduled curation");
  }
  const untrackedKnowledge = nulPaths(await gitCommand(git, root, ["ls-files", "--others", "--exclude-standard", "-z", "--", "knowledge"], timeoutMs));
  if (!allowKnowledgeChanges && untrackedKnowledge.length > 0) fail("knowledge-dirty", "untracked knowledge files are not permitted");
  const killSwitch = readKillSwitch(root);
  if (killSwitch.active) fail(killSwitch.ambiguous ? "kill-switch-indeterminate" : "kill-switch-active", "kill switch blocks scheduled curation");
  const innerLock = resolveControlPath(root, ".okf/run.lock");
  if (existsSync(innerLock.full)) fail("inner-lock-exists", "canonical curator lock already exists");
  const outer = resolveControlPath(root, OUTER_LEASE_PATH);
  if (lease == null && existsSync(outer.full)) fail("scheduled-lease-exists", "scheduled outer lease already exists");
  if (lease != null) {
    if (!existsSync(outer.full)) fail("scheduled-lease-lost", "scheduled outer lease is missing");
    let value;
    try { value = JSON.parse(readFileSync(outer.full, "utf8")); } catch { fail("scheduled-lease-drift", "scheduled outer lease is unreadable"); }
    if (value.lease_token !== lease.lease_token || value.attempt_key !== lease.attempt_key) fail("scheduled-lease-drift", "scheduled outer lease changed");
  }
  assertNoTemporarySchedulerFiles(root);
  return Object.freeze({ branch, revision, tracked, untrackedKnowledge });
}

function directInboxBounds(root, maximumBytes) {
  const inbox = resolveContainedPath(root, "knowledge/inbox");
  let bytes = 0;
  let count = 0;
  for (const entry of readdirSync(inbox.full, { withFileTypes: true }).sort((left, right) => compare(left.name, right.name))) {
    if (entry.isSymbolicLink()) fail("inbox-symlink", "inbox must not contain symlinks");
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "index.md") continue;
    const target = resolveContainedPath(root, `knowledge/inbox/${entry.name}`);
    const stat = lstatSync(target.full);
    bytes += stat.size;
    count += 1;
    if (bytes > maximumBytes || count > maximumBytes) fail("triage-context-exceeded", "pending inbox exceeds the bounded triage context");
  }
  return Object.freeze({ count, bytes });
}

function assertPinnedBinary(generator) {
  let physical;
  try { physical = realpathSync(generator.binary); } catch { fail("droid-binary-missing", "pinned Droid binary cannot be resolved"); }
  if (physical !== generator.binary) fail("droid-binary-not-physical", "pinned Droid binary must use its physical path");
  const stat = lstatSync(physical);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("droid-binary-invalid", "pinned Droid binary must be a regular file");
  if (sha256File(physical) !== generator.binary_sha256) fail("droid-binary-hash-mismatch", "pinned Droid binary hash changed");
}

function copyRegular(source, destination) {
  const stat = lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("snapshot-source-invalid", "snapshot sources must be regular non-symlink files");
  mkdirSync(dirname(destination), { recursive: true });
  writeOnceDurable(destination, readFileSync(source), 0o400);
  chmodSync(destination, 0o400);
  return Object.freeze({ bytes: stat.size, sha256: sha256File(source) });
}

function copyTree(source, destination, manifest, prefix) {
  const stat = lstatSync(source);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("snapshot-source-invalid", "snapshot directory must be non-symlink");
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true }).sort((left, right) => compare(left.name, right.name))) {
    if (entry.isSymbolicLink()) fail("snapshot-source-symlink", "snapshot refuses symlink content");
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    const relativePath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) copyTree(sourcePath, destinationPath, manifest, relativePath);
    else if (entry.isFile()) manifest.push(Object.freeze({ path: relativePath, ...copyRegular(sourcePath, destinationPath) }));
    else fail("snapshot-source-invalid", "snapshot refuses special files");
  }
  chmodSync(destination, 0o500);
}

function createReadOnlySnapshot(root, configPath) {
  const physical = realpathSync(mkdtempSync(join(tmpdir(), "okf-scheduled-")));
  const manifest = [];
  copyTree(resolve(root, "knowledge"), resolve(physical, "knowledge"), manifest, "knowledge");
  const inputs = [configPath, ".okf/agents/okf-curator.md", ".okf/templates/curation-prompt.md", PROMPT_PATH];
  for (const path of [...new Set(inputs)].sort(compare)) {
    const target = resolveContainedPath(root, path, { optional: true });
    if (!target.exists) {
      if (path === PROMPT_PATH) fail("scheduled-prompt-missing", "installed scheduled-curation prompt is required");
      continue;
    }
    manifest.push(Object.freeze({ path, ...copyRegular(target.full, resolve(physical, path)) }));
  }
  const ordered = manifest.sort((left, right) => compare(left.path, right.path));
  chmodSync(physical, 0o500);
  return Object.freeze({
    root: physical,
    manifest_sha256: sha256(canonicalJson(ordered)),
    bytes: ordered.reduce((total, item) => total + item.bytes, 0),
    files: ordered.length,
  });
}

function removeReadOnlySnapshot(path) {
  if (!path || !existsSync(path)) return;
  const makeRemovable = (target) => {
    const stat = lstatSync(target);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      chmodSync(target, 0o700);
      for (const entry of readdirSync(target)) makeRemovable(join(target, entry));
    } else if (!stat.isSymbolicLink()) {
      chmodSync(target, 0o600);
    }
  };
  makeRemovable(path);
  rmSync(path, { recursive: true, force: true });
}

function renderPrompt(template, envelope, maximumBytes) {
  const marker = "{{SCHEDULED_ENVELOPE_JSON}}";
  if (template.split(marker).length !== 2) fail("scheduled-prompt-invalid", "scheduled prompt must contain exactly one envelope marker");
  const prompt = template.replace(marker, JSON.stringify(envelope, null, 2));
  if (textBytes(prompt) > maximumBytes) fail("model-context-exceeded", "rendered model prompt exceeds max_context_bytes");
  return prompt;
}

function modelArgs(config, prompt) {
  return Object.freeze([
    "exec", "-o", "json", "--disable-builtin-skills",
    "--model", config.generator.model,
    "--reasoning-effort", config.generator.reasoning,
    "--enabled-tools", "Read,Grep,Glob,LS",
    "--cwd", ".",
    prompt,
  ]);
}

function parseJsonBuffer(buffer, code, label) {
  const raw = buffer.toString("utf8");
  try { return JSON.parse(raw); } catch { fail(code, `${label} must be exact JSON`); }
}

function parseModelResult(result, limits) {
  if (result.timed_out || result.code === "command-timeout") fail("model-timeout", "Droid proposal session exceeded its wall timeout");
  if (result.code === "command-output-limit") fail("model-wrapper-too-large", "Droid JSON wrapper exceeded its output boundary");
  if (result.status !== 0) fail("model-exec-failed", "Droid proposal session failed");
  const wrapper = parseJsonBuffer(result.stdout, "model-wrapper-invalid", "Droid output wrapper");
  if (!isRecord(wrapper) || wrapper.type !== "result" || wrapper.is_error === true || typeof wrapper.result !== "string") {
    fail("model-wrapper-invalid", "Droid output must be one successful result wrapper");
  }
  if (!Number.isSafeInteger(wrapper.num_turns) || wrapper.num_turns <= 0) fail("model-wrapper-invalid", "Droid wrapper must report num_turns");
  const duration = Number.isSafeInteger(wrapper.duration_ms) && wrapper.duration_ms >= 0 ? wrapper.duration_ms : result.wall_ms;
  if (duration > limits.max_model_runtime_seconds * 1000 || result.wall_ms > limits.max_model_runtime_seconds * 1000) {
    fail("model-timeout", "Droid proposal session exceeded max_model_runtime_seconds");
  }
  const raw = wrapper.result;
  if (textBytes(raw) > limits.max_model_output_bytes) fail("model-output-too-large", "raw proposal draft exceeds max_model_output_bytes");
  let draft;
  try { draft = JSON.parse(raw); } catch { fail("model-draft-invalid", "Droid result must be raw exact JSON without fences or commentary"); }
  return Object.freeze({ wrapper, raw, draft, duration_ms: duration });
}

function outputKind(path) {
  if (CONCEPT_PATH.test(path) && !path.endsWith("/index.md")) return "concept";
  if (path === "knowledge/index.md" || path === "knowledge/log.md" || INDEX_PATH.test(path)) return "maintenance";
  return null;
}

function validateDraft(value) {
  exactObject(value, ["version", "outputs"], [], "model draft");
  if (value.version !== DRAFT_VERSION || !Array.isArray(value.outputs) || value.outputs.length === 0 || value.outputs.length > 64) {
    fail("model-draft-invalid", `model draft must be ${DRAFT_VERSION} with outputs`);
  }
  const outputs = value.outputs.map((output) => {
    exactObject(output, ["path", "content"], ["replaces_path"], "model output");
    if (typeof output.path !== "string" || !outputKind(output.path)) fail("model-output-path-invalid", "model output path is outside canonical curation paths");
    if (typeof output.content !== "string" || output.content.length === 0) fail("model-output-content-invalid", "model output content must be non-empty");
    if (output.replaces_path != null) {
      if (typeof output.replaces_path !== "string" || !CONCEPT_PATH.test(output.replaces_path) || output.replaces_path.endsWith("/index.md") || output.replaces_path === output.path) {
        fail("model-replacement-invalid", "replacement path must name a different permanent concept");
      }
    }
    return { path: output.path, content: output.content, ...(output.replaces_path ? { replaces_path: output.replaces_path } : {}) };
  }).sort((left, right) => compare(left.path, right.path));
  if (outputs.some((output, index) => index > 0 && output.path === outputs[index - 1].path)) fail("model-output-duplicate", "model output paths must be unique");
  if (!outputs.some(({ path }) => outputKind(path) === "concept")) fail("model-concept-missing", "one selected item requires a concept output");
  return Object.freeze(outputs.map(Object.freeze));
}

function targetHash(root, path, { required = false } = {}) {
  const target = resolveContainedPath(root, path, { optional: !required });
  if (!target.exists) {
    if (required) fail("model-replacement-missing", "replacement source does not exist");
    return null;
  }
  const stat = lstatSync(target.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("proposal-target-invalid", "proposal targets must be regular files");
  return sha256File(target.full);
}

function linkedLines(value) {
  return value.split(/\r?\n/).filter((line) => /\[[^\]]+\]\(([^)]+)\)/.test(line));
}

function linkTarget(line) {
  return line.match(/\[[^\]]+\]\(([^)]+)\)/)?.[1] ?? null;
}

function logSections(value) {
  const starts = [...value.matchAll(/^## /gm)].map((match) => match.index);
  if (starts.length === 0) return { prefix: value, sections: [] };
  return {
    prefix: value.slice(0, starts[0]),
    sections: starts.map((start, index) => value.slice(start, starts[index + 1] ?? value.length)),
  };
}

function assertMaintenancePreserved(root, outputs, selectedPath) {
  const concepts = new Set(outputs.filter(({ path }) => outputKind(path) === "concept").map(({ path }) => `./${basename(path)}`));
  const replacements = new Set(outputs.flatMap(({ replaces_path }) => replaces_path ? [`./${basename(replaces_path)}`] : []));
  const affectedGroups = new Set([
    "./inbox/index.md",
    ...outputs.filter(({ path }) => outputKind(path) === "concept").map(({ path }) => `./${path.split("/")[1]}/index.md`),
    ...outputs.flatMap(({ replaces_path }) => replaces_path ? [`./${replaces_path.split("/")[1]}/index.md`] : []),
  ]);
  for (const output of outputs.filter(({ path }) => outputKind(path) === "maintenance")) {
    const target = resolveContainedPath(root, output.path, { optional: true });
    if (!target.exists) continue;
    const current = readFileSync(target.full, "utf8");
    if (output.path === "knowledge/log.md") {
      const retained = logSections(current);
      if (!output.content.startsWith(retained.prefix)) fail("maintenance-history-lost", "proposed log must preserve its existing preamble");
      let cursor = 0;
      for (const section of retained.sections) {
        cursor = output.content.indexOf(section, cursor);
        if (cursor < 0) fail("maintenance-history-lost", "proposed log must preserve every prior entry byte-for-byte");
        cursor += section.length;
      }
      continue;
    }
    for (const line of linkedLines(current)) {
      const targetLink = linkTarget(line);
      const selectedLink = `./${basename(selectedPath)}`;
      const mayChange = output.path === "knowledge/index.md"
        ? affectedGroups.has(targetLink)
        : output.path === "knowledge/inbox/index.md"
          ? targetLink === selectedLink
          : concepts.has(targetLink) || replacements.has(targetLink);
      if (mayChange) continue;
      if (!output.content.includes(line)) fail("maintenance-unrelated-row-lost", `proposal removed an unrelated index row from ${output.path}`);
    }
  }
}

function buildProposal(root, config, revision, runId, item, draftOutputs) {
  const outputs = draftOutputs.map((output) => ({
    path: output.path,
    expected_sha256: targetHash(root, output.path),
    source_items: [item.path],
    content: output.content,
    ...(output.replaces_path ? {
      replaces_path: output.replaces_path,
      expected_replaces_sha256: targetHash(root, output.replaces_path, { required: true }),
    } : {}),
  }));
  assertMaintenancePreserved(root, outputs, item.path);
  const proposal = {
    version: "okf-curation-proposal/1",
    run_id: runId,
    revision,
    expected_outcome: config.expected_outcome,
    recovery_plan: config.recovery_plan,
    items: [{ path: item.path, bytes: item.bytes, sha256: item.sha256 }],
    outputs,
  };
  const raw = `${JSON.stringify(proposal, null, 2)}\n`;
  if (textBytes(raw) > config.limits.max_generated_bytes) fail("proposal-too-large", "proposal control input exceeds max_generated_bytes");
  return Object.freeze({ proposal, raw, sha256: sha256(raw), bytes: textBytes(raw) });
}

function attemptPaths(attemptKey, runId) {
  return Object.freeze({
    marker: `${SCHEDULED_ROOT}/attempts/${attemptKey}.json`,
    proposal: `${SCHEDULED_ROOT}/proposals/${runId}.json`,
    report: `${SCHEDULED_ROOT}/reports/${attemptKey}.json`,
  });
}

function acquireAttempt(root, attemptKey, runId, evidence, nowIso) {
  const outer = resolveControlPath(root, OUTER_LEASE_PATH);
  const paths = attemptPaths(attemptKey, runId);
  if (existsSync(resolveControlPath(root, paths.marker).full)) fail("attempt-already-recorded", "the same scheduled envelope has already been attempted");
  if (existsSync(resolveControlPath(root, paths.proposal).full) || existsSync(resolveControlPath(root, paths.report).full)) {
    fail("scheduled-control-collision", "scheduled proposal or report path already exists");
  }
  const leaseToken = randomUUID();
  const lease = {
    version: LEASE_VERSION,
    lease_token: leaseToken,
    attempt_key: attemptKey,
    run_id: runId,
    root: evidence.root,
    revision: evidence.revision,
    branch: evidence.branch,
    acquired_at: nowIso,
    pid: process.pid,
  };
  writeOnceDurable(outer.full, `${JSON.stringify(lease, null, 2)}\n`);
  const marker = {
    version: ATTEMPT_VERSION,
    attempt_key: attemptKey,
    run_id: runId,
    revision: evidence.revision,
    branch: evidence.branch,
    config_sha256: evidence.config_sha256,
    prompt_sha256: evidence.prompt_sha256,
    selected: evidence.selected,
    generator: evidence.generator,
    created_at: nowIso,
  };
  writeOnceDurable(resolveControlPath(root, paths.marker).full, `${JSON.stringify(marker, null, 2)}\n`);
  return Object.freeze({ ...lease, paths });
}

function releaseAttemptLease(root, lease) {
  const target = resolveControlPath(root, OUTER_LEASE_PATH);
  if (!existsSync(target.full)) fail("scheduled-lease-lost", "outer lease disappeared before release");
  let current;
  try { current = JSON.parse(readFileSync(target.full, "utf8")); } catch { fail("scheduled-lease-drift", "outer lease is unreadable"); }
  if (current.lease_token !== lease.lease_token || current.attempt_key !== lease.attempt_key) fail("scheduled-lease-drift", "outer lease ownership changed");
  unlinkSync(target.full);
  fsyncDirectory(dirname(target.full));
}

function activateKillSwitch(root, reason, nowIso) {
  const state = readKillSwitch(root);
  if (state.active) return true;
  const target = resolveControlPath(root, ".okf/KILL_SWITCH");
  const before = readFileSync(target.full);
  const payload = {
    active: true,
    activated_by: "okf-scheduled-curation",
    activated_at: nowIso,
    reason: SAFE_CODE.test(reason) ? reason : "scheduled-curation-failed",
  };
  const token = randomUUID();
  const temporary = `${target.full}.${token}.tmp`;
  writeOnceDurable(temporary, `${JSON.stringify(payload, null, 2)}\n`);
  if (!readFileSync(target.full).equals(before)) {
    unlinkSync(temporary);
    fail("kill-switch-drift", "kill switch changed during activation");
  }
  renameSync(temporary, target.full);
  fsyncDirectory(dirname(target.full));
  return readKillSwitch(root).active;
}

function safeReason(error) {
  const code = typeof error?.code === "string" ? error.code : "scheduled-curation-failed";
  return SAFE_CODE.test(code) ? code : "scheduled-curation-failed";
}

function parseCuratorResult(result, phase) {
  if (result.timed_out || result.code === "command-timeout") fail(`${phase}-timeout`, `canonical curator ${phase} timed out`);
  if (result.code) fail(`${phase}-process-failed`, `canonical curator ${phase} process failed`);
  const parsed = parseJsonBuffer(result.stdout, `${phase}-json-invalid`, `canonical curator ${phase} output`);
  if (result.status !== 0) fail(`${phase}-blocked`, `canonical curator ${phase} did not complete`);
  return parsed;
}

function curatorEnvelope(config, root, revision, runId, proposalPath, selectedPath) {
  const values = Object.freeze([
    "--root", root,
    "--revision", revision,
    "--operator-identity", config.operator.identity,
    "--operator-request", config.operator.request,
    "--run-id", runId,
    "--proposal", proposalPath,
    "--select", selectedPath,
    "--max-items", String(config.limits.max_items),
    "--max-input-bytes", String(config.limits.max_input_bytes),
    "--max-generated-bytes", String(config.limits.max_generated_bytes),
    "--max-runtime-seconds", String(config.limits.max_runtime_seconds),
    "--max-sessions", String(config.limits.max_sessions),
    "--format", "json",
  ]);
  return Object.freeze({ values, check: Object.freeze(["--check-only", ...values]), execute: Object.freeze(["--execute", ...values]) });
}

async function knowledgeChanges(git, root, timeoutMs) {
  const tracked = nulPaths(await gitCommand(git, root, ["diff", "--name-only", "--no-renames", "-z", "--", "knowledge"], timeoutMs));
  const untracked = nulPaths(await gitCommand(git, root, ["ls-files", "--others", "--exclude-standard", "-z", "--", "knowledge"], timeoutMs));
  return [...new Set([...tracked, ...untracked])].sort(compare);
}

async function assertSelectedPinnedToHead(git, root, revision, item, timeoutMs) {
  await gitCommand(git, root, ["ls-files", "--error-unmatch", "--", item.path], timeoutMs, "selected-item-untracked");
  const committed = await gitCommand(git, root, ["show", `${revision}:${item.path}`], timeoutMs, "selected-item-not-in-head");
  if (committed.length !== item.bytes || sha256(committed) !== item.sha256) {
    fail("selected-item-head-drift", "selected actionable item must exactly match its tracked HEAD blob");
  }
  return Object.freeze({ bytes: committed.length, sha256: sha256(committed) });
}

function expectedKnowledgePaths(proposal, item) {
  return [...new Set([
    ...proposal.outputs.map(({ path }) => path),
    ...proposal.outputs.flatMap(({ replaces_path }) => replaces_path ? [replaces_path] : []),
    item.path,
    processedPathFor(item.path),
  ])].sort(compare);
}

function assertCompletedExecutor(parsed, root, revision, runId, proposal, item) {
  if (parsed.outcome !== "completed" || parsed.report?.version !== "okf-run-report/1" || parsed.report.outcome !== "completed"
    || parsed.report.run_id !== runId || parsed.report.root !== root || parsed.report.revision !== revision || typeof parsed.report_path !== "string") {
    fail("execute-terminal-invalid", "canonical executor did not return the matching completed terminal report");
  }
  const proposed = (parsed.report.changes?.proposed_outputs ?? []).map(({ path, sha256: hash }) => `${path}:${hash}`).sort(compare);
  const expectedProposed = proposal.outputs.map(({ path, content }) => `${path}:${sha256(content)}`).sort(compare);
  const expectedApplied = proposal.outputs
    .filter(({ content, expected_sha256: expectedHash, replaces_path: replacesPath }) => replacesPath || expectedHash !== sha256(content))
    .map(({ path }) => path)
    .sort(compare);
  if (JSON.stringify(proposed) !== JSON.stringify(expectedProposed)
    || JSON.stringify([...(parsed.report.changes?.applied_outputs ?? [])].sort(compare)) !== JSON.stringify(expectedApplied)
    || JSON.stringify(parsed.report.changes?.moved_items ?? []) !== JSON.stringify([item.path])
    || JSON.stringify(parsed.report.changes?.completed_items ?? []) !== JSON.stringify([item.path])
    || (parsed.report.changes?.untouched_items ?? []).length !== 0) {
    fail("execute-terminal-mismatch", "canonical executor terminal change receipt does not match the proposal");
  }
}

function buildReport(state, outcome, reason, endedAt, wallMs, killSwitchActivated) {
  const report = {
    version: REPORT_VERSION,
    attempt_key: state.attempt_key ?? null,
    run_id: state.run_id ?? null,
    root: state.root ?? null,
    revision: state.revision ?? null,
    branch: state.branch ?? null,
    config: state.config ? { path: state.config.path, sha256: state.config.sha256 } : null,
    operator: state.operator ?? null,
    selected: state.selected ?? null,
    limits: state.limits ?? null,
    started_at: state.started_at,
    ended_at: endedAt,
    wall_ms: wallMs,
    model: state.model ?? null,
    proposal: state.proposal ?? null,
    check: state.check ?? null,
    executor: state.executor ?? null,
    changed_paths: Object.freeze([...(state.changed_paths ?? [])]),
    commit_sha: state.commit_sha ?? null,
    outcome,
    reason,
    kill_switch_activated: killSwitchActivated,
  };
  const raw = `${JSON.stringify(report, null, 2)}\n`;
  if (/"(?:content|body|prompt|stdout|stderr|operator_request)"\s*:/.test(raw)) fail("attempt-report-contains-raw-content", "attempt report contains a forbidden raw-content field");
  if (textBytes(raw) > MAX_ATTEMPT_REPORT_BYTES) {
    fail("attempt-report-too-large", "attempt report exceeds its bounded evidence limit");
  }
  return Object.freeze({ report: Object.freeze(report), raw });
}

function writeAttemptReport(root, lease, built) {
  const target = resolveControlPath(root, lease.paths.report);
  writeOnceDurable(target.full, built.raw);
  return target.path;
}

function baseState(rootInput, startedAt) {
  return {
    root: typeof rootInput === "string" ? rootInput : null,
    started_at: startedAt,
    changed_paths: [],
  };
}

/** Run exactly one bounded scheduled curation envelope. No retry or resume path exists. */
export async function runScheduledCuration({ root: rootInput, configPath }, deps = {}) {
  const now = deps.now ?? (() => Date.now());
  const nowIso = deps.nowIso ?? (() => new Date().toISOString());
  const git = deps.git ?? defaultGit;
  const model = deps.model ?? defaultModel;
  const executor = deps.executor ?? defaultExecutor;
  const triage = deps.triage ?? triageInbox;
  const startedMs = now();
  const state = baseState(rootInput, nowIso());
  let root = null;
  let config = null;
  let lease = null;
  let snapshot = null;
  let markerCreated = false;
  const remaining = () => {
    if (!config) return 10_000;
    const value = config.limits.max_total_runtime_seconds * 1000 - Math.max(0, now() - startedMs);
    if (value <= 0) fail("total-runtime-exceeded", "scheduled curation exceeded max_total_runtime_seconds");
    return value;
  };
  try {
    if (typeof configPath !== "string" || configPath === "" || isAbsolute(configPath)) fail("config-path-invalid", "config must be an explicit root-relative path");
    const rootInfo = validateRoot(rootInput);
    root = rootInfo.root;
    state.root = root;
    const configFile = readJsonFile(root, configPath);
    config = validateScheduledConfig(configFile.value, root);
    state.config = Object.freeze({ path: configFile.target.path, sha256: configFile.sha256 });
    state.operator = Object.freeze({
      identity_sha256: sha256(config.operator.identity),
      request_sha256: sha256(config.operator.request),
      approval_ref_sha256: sha256(config.operator.approval_ref),
    });
    state.limits = config.limits;
    if (!config.enabled) {
      return buildReport(state, "disabled", "config-disabled", nowIso(), Math.max(0, now() - startedMs), false).report;
    }

    assertPinnedBinary(config.generator);
    const initial = await inspectGitState(root, config, git, remaining());
    assertRevision(root, initial.revision);
    state.branch = initial.branch;
    state.revision = initial.revision;
    const outside = await outsideStatus(git, root, remaining());
    const outsideHash = sha256(outside);
    directInboxBounds(root, config.limits.max_context_bytes);
    const measuredAt = nowIso();
    const triageReport = await triage(root, { asOf: measuredAt });
    if (triageReport.version !== "okf-inbox-triage/1" || triageReport.root !== root || triageReport.revision !== initial.revision
      || triageReport.controls?.kill_switch !== "inactive" || triageReport.controls?.lock !== "absent") {
      fail("triage-receipt-invalid", "local inbox triage did not return a clean matching receipt");
    }
    const candidates = triageReport.items
      .filter(({ primary_classification }) => primary_classification === "actionable")
      .sort((left, right) => compare(left.path, right.path));
    if (candidates.length === 0) {
      return buildReport(state, "no-action", "no-actionable-item", nowIso(), Math.max(0, now() - startedMs), false).report;
    }
    const item = candidates[0];
    if (item.bytes > config.limits.max_input_bytes) fail("selected-input-too-large", "selected actionable item exceeds max_input_bytes");
    await assertSelectedPinnedToHead(git, root, initial.revision, item, remaining());
    state.selected = Object.freeze({ path: item.path, bytes: item.bytes, sha256: item.sha256, classification: "actionable" });

    const promptTarget = resolveContainedPath(root, PROMPT_PATH);
    const promptTemplate = readFileSync(promptTarget.full, "utf8");
    const promptHash = sha256(promptTemplate);
    const keyBody = {
      version: CONFIG_VERSION,
      root,
      revision: initial.revision,
      branch: initial.branch,
      config_sha256: configFile.sha256,
      prompt_sha256: promptHash,
      outside_status_sha256: outsideHash,
      selected: state.selected,
      generator: config.generator,
      limits: config.limits,
      operator: state.operator,
    };
    const attemptKey = sha256(canonicalJson(keyBody));
    const runId = `okf-scheduled-${attemptKey.slice(0, 24)}`;
    state.attempt_key = attemptKey;
    state.run_id = runId;
    const evidence = {
      root, revision: initial.revision, branch: initial.branch, config_sha256: configFile.sha256, prompt_sha256: promptHash,
      selected: state.selected,
      generator: { binary_sha256: config.generator.binary_sha256, model: config.generator.model, reasoning: config.generator.reasoning },
    };
    lease = acquireAttempt(root, attemptKey, runId, evidence, nowIso());
    markerCreated = true;
    await inspectGitState(root, config, git, remaining(), { lease });

    snapshot = createReadOnlySnapshot(root, configFile.target.path);
    const promptEnvelope = {
      version: "okf-scheduled-curation-envelope/1",
      snapshot_root: snapshot.root,
      repository_root_sha256: sha256(root),
      revision: initial.revision,
      branch: initial.branch,
      run_id: runId,
      selected: state.selected,
      expected_outcome: config.expected_outcome,
      recovery_plan: config.recovery_plan,
      limits: { max_context_bytes: config.limits.max_context_bytes, max_model_output_bytes: config.limits.max_model_output_bytes },
    };
    const prompt = renderPrompt(promptTemplate, promptEnvelope, config.limits.max_context_bytes);
    if (snapshot.bytes + textBytes(prompt) > config.limits.max_context_bytes) {
      fail("model-context-exceeded", "read-only snapshot plus rendered prompt exceeds max_context_bytes");
    }
    const args = modelArgs(config, prompt);
    const modelStarted = now();
    const modelResult = normalizeResult(await model({
      binary: config.generator.binary,
      args,
      cwd: snapshot.root,
      timeoutMs: Math.min(config.limits.max_model_runtime_seconds * 1000, remaining()),
      maxOutputBytes: config.limits.max_model_output_bytes,
    }));
    const parsedModel = parseModelResult({ ...modelResult, wall_ms: modelResult.wall_ms ?? Math.max(0, now() - modelStarted) }, config.limits);
    state.model = Object.freeze({
      binary_sha256: config.generator.binary_sha256,
      model: config.generator.model,
      reasoning: config.generator.reasoning,
      duration_ms: parsedModel.duration_ms,
      wall_ms: modelResult.wall_ms ?? Math.max(0, now() - modelStarted),
      num_turns: parsedModel.wrapper.num_turns,
      wrapper_sha256: sha256(modelResult.stdout),
      output_sha256: sha256(parsedModel.raw),
      output_bytes: textBytes(parsedModel.raw),
      snapshot_manifest_sha256: snapshot.manifest_sha256,
    });
    removeReadOnlySnapshot(snapshot.root);
    snapshot = null;

    const draftOutputs = validateDraft(parsedModel.draft);
    const beforeProposal = await inspectGitState(root, config, git, remaining(), { lease });
    if (beforeProposal.revision !== initial.revision || sha256(await outsideStatus(git, root, remaining())) !== outsideHash) {
      fail("worktree-drift", "repository state changed during proposal generation");
    }
    const builtProposal = buildProposal(root, config, initial.revision, runId, item, draftOutputs);
    const proposalTarget = resolveControlPath(root, lease.paths.proposal);
    writeOnceDurable(proposalTarget.full, builtProposal.raw);
    state.proposal = Object.freeze({ path: proposalTarget.path, sha256: builtProposal.sha256, bytes: builtProposal.bytes });

    const envelope = curatorEnvelope(config, root, initial.revision, runId, proposalTarget.path, item.path);
    const checkStarted = now();
    const checkRaw = normalizeResult(await executor({
      mode: "check-only", envelope: envelope.values, args: envelope.check, root,
      timeoutMs: Math.min(config.limits.max_runtime_seconds * 1000, remaining()),
      maxOutputBytes: config.limits.max_generated_bytes,
    }));
    const check = parseCuratorResult({ ...checkRaw, wall_ms: checkRaw.wall_ms ?? Math.max(0, now() - checkStarted) }, "check-only");
    if (check.version !== "okf-curation-dry-run/1" || check.check_only !== true || check.permitted !== true || check.mutation !== false
      || check.plan?.run_id !== runId || check.plan?.revision !== initial.revision || check.proposal?.sha256 !== builtProposal.sha256) {
      fail("check-only-receipt-invalid", "canonical check-only receipt does not match the scheduled envelope");
    }
    state.check = Object.freeze({
      permitted: true,
      stdout_sha256: sha256(checkRaw.stdout),
      wall_ms: checkRaw.wall_ms ?? Math.max(0, now() - checkStarted),
      plan_hash: check.plan.plan_hash,
      proposal_sha256: check.proposal.sha256,
      output_count: check.proposal.output_count,
    });
    const beforeExecute = await inspectGitState(root, config, git, remaining(), { lease });
    if (beforeExecute.revision !== initial.revision || sha256(await outsideStatus(git, root, remaining())) !== outsideHash) {
      fail("worktree-drift", "repository state changed before canonical execution");
    }

    const executeStarted = now();
    const executeRaw = normalizeResult(await executor({
      mode: "execute", envelope: envelope.values, args: envelope.execute, root,
      timeoutMs: Math.min(config.limits.max_runtime_seconds * 1000, remaining()),
      maxOutputBytes: config.limits.max_generated_bytes,
    }));
    const executed = parseCuratorResult({ ...executeRaw, wall_ms: executeRaw.wall_ms ?? Math.max(0, now() - executeStarted) }, "execute");
    assertCompletedExecutor(executed, root, initial.revision, runId, builtProposal.proposal, item);
    const executorReport = resolveControlPath(root, executed.report_path);
    const executorReportStat = lstatSync(executorReport.full);
    if (!executorReportStat.isFile() || executorReportStat.isSymbolicLink()) fail("executor-report-invalid", "executor report path must be a regular control file");
    let retainedExecutorReport;
    try { retainedExecutorReport = JSON.parse(readFileSync(executorReport.full, "utf8")); } catch { fail("executor-report-invalid", "executor report path must contain JSON"); }
    if (canonicalJson(retainedExecutorReport) !== canonicalJson(executed.report)) {
      fail("executor-report-mismatch", "retained executor report does not match the completed command receipt");
    }
    state.executor = Object.freeze({
      outcome: "completed",
      stdout_sha256: sha256(executeRaw.stdout),
      wall_ms: executeRaw.wall_ms ?? Math.max(0, now() - executeStarted),
      report_path: executorReport.path,
      report_sha256: sha256File(executorReport.full),
    });

    const afterExecution = await inspectGitState(root, config, git, remaining(), { lease, allowKnowledgeChanges: true });
    if (afterExecution.revision !== initial.revision || sha256(await outsideStatus(git, root, remaining())) !== outsideHash) {
      fail("worktree-drift", "unrelated repository state changed during canonical execution");
    }
    const changed = await knowledgeChanges(git, root, remaining());
    const allowed = expectedKnowledgePaths(builtProposal.proposal, item);
    if (changed.length === 0 || changed.some((path) => !allowed.includes(path))
      || !changed.includes(item.path) || !changed.includes(processedPathFor(item.path))) {
      fail("unexpected-knowledge-diff", "knowledge diff is not the expected-only proposal manifest");
    }
    state.changed_paths = Object.freeze(changed);

    await gitCommand(git, root, ["add", "--", ...changed], remaining(), "git-stage-failed");
    const staged = nulPaths(await gitCommand(git, root, ["diff", "--cached", "--name-only", "--no-renames", "-z", "--", "knowledge"], remaining()));
    if (JSON.stringify(staged) !== JSON.stringify(changed)) fail("git-stage-mismatch", "staged paths do not exactly match the verified knowledge diff");
    const unstagedKnowledge = nulPaths(await gitCommand(git, root, ["diff", "--name-only", "--no-renames", "-z", "--", "knowledge"], remaining()));
    if (unstagedKnowledge.length > 0) fail("git-stage-incomplete", "verified knowledge paths remain unstaged");
    await gitCommand(git, root, ["diff", "--cached", "--check"], remaining(), "git-diff-check-failed");
    if (sha256(await outsideStatus(git, root, remaining())) !== outsideHash || readKillSwitch(root).active) {
      fail("pre-commit-drift", "repository controls or unrelated work changed before commit");
    }

    const subject = `okf-curation: scheduled ${runId}`;
    await gitCommand(git, root, ["commit", "-m", subject], remaining(), "git-commit-failed");
    const commitSha = (await gitCommand(git, root, ["rev-parse", "--verify", "HEAD"], remaining())).toString("utf8").trim().toLowerCase();
    if (!/^[0-9a-f]{40}$/.test(commitSha) || commitSha === initial.revision) fail("git-commit-invalid", "scheduled curation commit was not created");
    const committedSubject = (await gitCommand(git, root, ["log", "-1", "--format=%s"], remaining())).toString("utf8").trim();
    if (!committedSubject.startsWith("okf-curation:")) fail("git-commit-subject-invalid", "commit subject lost the curation loop guard");
    const committedPaths = nulPaths(await gitCommand(git, root, ["diff-tree", "--no-commit-id", "--name-only", "--no-renames", "-r", "-z", "HEAD"], remaining()));
    if (JSON.stringify(committedPaths) !== JSON.stringify(changed)) fail("git-commit-paths-invalid", "commit contains paths outside exact staging");
    const parents = (await gitCommand(git, root, ["rev-list", "--parents", "-n", "1", "HEAD"], remaining())).toString("utf8").trim().split(/\s+/);
    if (parents.length !== 2) fail("git-commit-parent-invalid", "scheduled curation must create one non-merge commit");
    if (sha256(await outsideStatus(git, root, remaining())) !== outsideHash) fail("worktree-drift", "unrelated worktree state changed after commit");
    state.commit_sha = commitSha;

    const completed = buildReport(state, "completed", "bounded-scheduled-curation-complete", nowIso(), Math.max(0, now() - startedMs), false);
    const reportPath = writeAttemptReport(root, lease, completed);
    if (typeof deps.afterSuccessReport === "function") await deps.afterSuccessReport({ root, lease, reportPath });
    releaseAttemptLease(root, lease);
    return Object.freeze({ ...completed.report, report_path: reportPath });
  } catch (error) {
    const reason = safeReason(error);
    let killed = false;
    if (root) {
      try { killed = activateKillSwitch(root, reason, nowIso()); } catch { killed = readKillSwitch(root).active; }
    }
    const failed = buildReport(state, "failed", reason, nowIso(), Math.max(0, now() - startedMs), killed);
    if (root && lease && markerCreated && !existsSync(resolveControlPath(root, lease.paths.report).full)) {
      try {
        const reportPath = writeAttemptReport(root, lease, failed);
        return Object.freeze({ ...failed.report, report_path: reportPath });
      } catch {
        // The outer lease and attempt marker remain the fail-closed evidence.
      }
    }
    return failed.report;
  } finally {
    if (snapshot?.root && existsSync(snapshot.root)) removeReadOnlySnapshot(snapshot.root);
  }
}

export function formatScheduledResult(result, format = "text") {
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format !== "text") fail("report-format-invalid", "format must be text or json");
  return [
    `OKF scheduled curation: ${result.outcome}`,
    `root: ${result.root ?? "unresolved"}`,
    `revision: ${result.revision ?? "unresolved"}`,
    `run: ${result.run_id ?? "none"}`,
    `reason: ${result.reason}`,
    `commit: ${result.commit_sha ?? "none"}`,
  ].join("\n");
}

export const SCHEDULED_CURATION_PATHS = Object.freeze({ root: SCHEDULED_ROOT, outer_lease: OUTER_LEASE_PATH, prompt: PROMPT_PATH });
