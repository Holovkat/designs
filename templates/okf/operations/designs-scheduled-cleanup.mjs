#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { validateRoot } from "../lib/run-guard.mjs";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function manifestHash(value) {
  const { manifest_sha256: _ignored, ...body } = value;
  return sha256(JSON.stringify(canonical(body)));
}
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
function fileIdentity(root, path) {
  const full = resolve(root, path);
  if (!existsSync(full)) fail("cleanup-path-missing", `approved path is missing: ${path}`);
  const stat = lstatSync(full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("cleanup-path-invalid", `approved path is not a regular file: ${path}`);
  const content = readFileSync(full);
  return { full, bytes: content.length, sha256: sha256(content), mode: (stat.mode & 0o7777).toString(8).padStart(4, "0") };
}
function crontabBytes() {
  const result = spawnSync("crontab", ["-l"], { encoding: null, stdio: ["ignore", "pipe", "ignore"] });
  return result.status === 0 ? result.stdout : Buffer.alloc(0);
}
function matchingProcesses() {
  const result = spawnSync("pgrep", ["-afil", "okf-scheduled|scheduled-curation|okf.*curat"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return (result.status === 0 ? result.stdout.split("\n") : []).filter((line) => line && !line.includes("designs-scheduled-cleanup"));
}
function validatePlan(plan) {
  if (plan?.version !== "okf-designs-scheduled-cleanup-plan/1" || manifestHash(plan) !== plan.manifest_sha256) fail("cleanup-manifest-invalid", "cleanup manifest version or hash is invalid");
  const guarded = validateRoot(plan.root);
  if (guarded.revision !== plan.revision || git(guarded.root, ["branch", "--show-current"]) !== plan.branch) fail("cleanup-root-drift", "root branch or revision no longer matches the approved plan");
  if (sha256(crontabBytes()) !== plan.before_state.cron.full_crontab_sha256) fail("cleanup-cron-drift", "crontab changed after manifest review");
  if (matchingProcesses().length > 0) fail("cleanup-process-active", "a scheduled-curation process is active");
  for (const action of plan.actions.filter(({ action }) => action === "backup-then-remove")) {
    if (fileIdentity(guarded.root, action.path).sha256 !== action.expected_sha256) fail("cleanup-path-drift", `approved path hash changed: ${action.path}`);
  }
  const kill = plan.before_state.kill_switch;
  if (fileIdentity(guarded.root, kill.path).sha256 !== kill.sha256) fail("cleanup-kill-switch-drift", "kill-switch state changed after manifest review");
  for (const item of plan.before_state.preserve_evidence) {
    if (fileIdentity(guarded.root, item.path).sha256 !== item.sha256) fail("cleanup-preserved-evidence-drift", `preserved evidence/control changed: ${item.path}`);
  }
  return guarded.root;
}
function backupPath(root, plan, path) {
  const base = resolve(homedir(), ".okf/cleanup/designs/epic37-51", plan.manifest_sha256, "before");
  const destination = resolve(base, path);
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
  const source = resolve(root, path);
  cpSync(source, destination, { dereference: false, errorOnExist: true });
  chmodSync(destination, 0o600);
  return { source, destination };
}
function proveNegativePath(root, plan) {
  const removed = plan.actions.filter(({ action }) => action === "backup-then-remove").map(({ path }) => path);
  if (removed.some((path) => existsSync(resolve(root, path)))) fail("cleanup-negative-path", "a retired installed path still exists");
  if (sha256(crontabBytes()) !== plan.before_state.cron.full_crontab_sha256) fail("cleanup-cron-mutated", "cleanup unexpectedly changed crontab");
  if (matchingProcesses().length > 0) fail("cleanup-process-active", "a retired process is active after removal");
  for (const path of [".okf/bin/okf-curate.mjs", ".okf/bin/okf-inbox-archive.mjs", ".okf/bin/okf-inbox-status.mjs"]) {
    const checked = spawnSync(process.execPath, ["--check", resolve(root, path)], { stdio: "ignore" });
    if (checked.status !== 0) fail("cleanup-manual-control-invalid", `manual control no longer parses: ${path}`);
  }
}
function apply(root, plan, approvalRef) {
  const backups = [];
  const killPath = plan.before_state.kill_switch.path;
  try {
    for (const action of plan.actions.filter(({ action }) => action === "backup-then-remove")) {
      backups.push({ path: action.path, ...backupPath(root, plan, action.path) });
    }
    backups.push({ path: killPath, ...backupPath(root, plan, killPath) });
    for (const item of backups.filter(({ path }) => path !== killPath)) rmSync(item.source);
    proveNegativePath(root, plan);
    const killAction = plan.actions.find(({ action }) => action === "reset-kill-switch-last");
    const content = `${JSON.stringify(killAction.content, null, 2)}\n`;
    if (sha256(content) !== killAction.after_sha256) fail("cleanup-kill-switch-output", "approved kill-switch reset hash is inconsistent");
    writeFileSync(resolve(root, killPath), content, { mode: 0o644 });
    const receipt = {
      version: "okf-designs-scheduled-cleanup-receipt/1", run_id: plan.run_id,
      manifest_sha256: plan.manifest_sha256, approval_ref: approvalRef,
      completed_at: new Date().toISOString(), removed: backups.filter(({ path }) => path !== killPath).map(({ path }) => path),
      preserved: plan.before_state.preserve_evidence.map(({ path }) => path), kill_switch_reset_last: true,
      crontab_unchanged: true, rollback_root: dirname(backups[0].destination), status: "completed",
    };
    const receiptPath = resolve(homedir(), ".okf/cleanup/designs/epic37-51", plan.manifest_sha256, "receipt.json");
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    return { ...receipt, receipt_path: receiptPath };
  } catch (error) {
    for (const item of [...backups].reverse()) {
      try { cpSync(item.destination, item.source, { dereference: false, force: true }); } catch {}
    }
    throw error;
  }
}

function usage() { return "Usage: designs-scheduled-cleanup.mjs --manifest <absolute.json> [--approval-ref <reference> --execute]"; }
const args = process.argv.slice(2);
let manifestPath = null, approvalRef = null, execute = false;
for (let i = 0; i < args.length; i += 1) {
  const flag = args[i];
  if (flag === "--help") { console.log(usage()); process.exit(0); }
  if (flag === "--execute") { execute = true; continue; }
  if (!["--manifest", "--approval-ref"].includes(flag) || i + 1 >= args.length) { console.error(usage()); process.exit(2); }
  const value = args[++i]; if (flag === "--manifest") manifestPath = value; else approvalRef = value;
}
if (!manifestPath || !isAbsolute(manifestPath) || (execute && (!approvalRef || approvalRef.length < 8))) { console.error(usage()); process.exit(2); }
try {
  const plan = JSON.parse(readFileSync(manifestPath, "utf8"));
  const root = validatePlan(plan);
  console.log(JSON.stringify(execute ? apply(root, plan, approvalRef) : { status: "checked", manifest_sha256: plan.manifest_sha256, root, live_mutation_approved: false }, null, 2));
} catch (error) {
  console.error(`okf-designs-cleanup: ${error.code ?? "failed"}: ${error.message}`);
  process.exit(2);
}
