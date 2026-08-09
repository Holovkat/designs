import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function positive(value, field, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > max) fail("sandbox-limit-invalid", `${field} must be a positive bounded integer`);
}

function safeName(value, field) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/iu.test(value)) fail("sandbox-name-invalid", `${field} is invalid`);
  return value;
}

function treeBytes(root) {
  let total = 0;
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) fail("sandbox-symlink-created", `helper created a symlink: ${entry.name}`);
      if (stat.isDirectory()) pending.push(path);
      else if (stat.isFile()) total += stat.size;
      else fail("sandbox-special-file", `helper created an unsupported file: ${entry.name}`);
    }
  }
  return total;
}

function copyInputs(runDir, inputs) {
  const inputDir = resolve(runDir, "inputs");
  mkdirSync(inputDir, { mode: 0o700 });
  const copied = [];
  for (const item of inputs) {
    safeName(item.name, "input.name");
    if (!isAbsolute(item.path) || !/^[0-9a-f]{64}$/u.test(item.sha256 ?? "")) fail("sandbox-input-invalid", "inputs require absolute paths and SHA-256");
    const physical = realpathSync(item.path);
    const stat = lstatSync(physical);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("sandbox-input-not-regular", `input is not a regular file: ${item.name}`);
    const content = readFileSync(physical);
    if (sha256(content) !== item.sha256) fail("sandbox-input-hash", `input hash mismatch: ${item.name}`);
    const destination = resolve(inputDir, item.name);
    cpSync(physical, destination, { dereference: false, errorOnExist: true });
    chmodSync(destination, 0o400);
    copied.push(Object.freeze({ name: item.name, bytes: content.length, sha256: item.sha256 }));
  }
  return Object.freeze(copied);
}

function profileText() {
  // Node's permission model supplies the file/process boundary; Seatbelt supplies
  // the network boundary that Node 22 does not expose as a permission flag.
  return "(version 1)\n(allow default)\n(deny network*)\n";
}

async function spawnSandbox({ sandboxExecutable, profilePath, nodePath, helperPath, runDir, timeoutMs, maxOutputBytes }) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(sandboxExecutable, [
      "-f", profilePath, nodePath,
      "--permission",
      `--allow-fs-read=${runDir}`,
      `--allow-fs-write=${runDir}`,
      helperPath,
    ], {
      cwd: runDir,
      detached: true,
      env: { HOME: runDir, TMPDIR: resolve(runDir, "tmp"), PATH: dirname(nodePath), LANG: "C", LC_ALL: "C" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolvePromise(result);
    };
    const append = (current, chunk) => {
      const next = Buffer.concat([current, chunk]);
      if (next.length > maxOutputBytes) {
        try { process.kill(-child.pid, "SIGKILL"); } catch {}
        finish(Object.assign(new Error("helper output ceiling exceeded"), { code: "helper-output-ceiling" }));
      }
      return next;
    };
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    child.on("error", (error) => finish(Object.assign(error, { code: "sandbox-spawn-failed" })));
    child.on("close", (code, signal) => finish(null, { code, signal, stdout, stderr }));
    const timer = setTimeout(() => {
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
      finish(Object.assign(new Error("helper runtime ceiling exceeded"), { code: "helper-timeout" }));
    }, timeoutMs);
  });
}

export function validateAdaptiveManifest(manifest) {
  if (!manifest || manifest.version !== "okf-adaptive-helper-manifest/1") fail("adaptive-manifest-version", "expected okf-adaptive-helper-manifest/1");
  safeName(manifest.run_id, "run_id");
  safeName(manifest.helper_id, "helper_id");
  if (manifest.network !== "none" || manifest.package_install !== "denied" || manifest.promotion !== "denied") fail("adaptive-authority-invalid", "network, package installation, and promotion must be denied");
  if (!isAbsolute(manifest.sandbox_executable ?? "") || !isAbsolute(manifest.node_path ?? "")) fail("adaptive-runtime-path", "sandbox and Node paths must be absolute");
  for (const field of ["max_runtime_ms", "max_output_bytes", "max_disk_bytes", "max_source_bytes"]) positive(manifest.limits?.[field], field, 64 * 1024 * 1024);
  if (manifest.limits?.max_processes !== 1) fail("adaptive-process-limit", "max_processes must equal one");
  if (!Array.isArray(manifest.inputs) || manifest.inputs.length === 0) fail("adaptive-inputs-missing", "at least one frozen input is required");
  return manifest;
}

export async function runAdaptiveHelper({ manifest: rawManifest, source }) {
  const manifest = validateAdaptiveManifest(rawManifest);
  const sourceBytes = Buffer.from(source, "utf8");
  if (sourceBytes.length === 0 || sourceBytes.length > manifest.limits.max_source_bytes) fail("helper-source-size", "helper source is empty or oversized");
  const allowedModules = new Set(["node:crypto", "node:fs", "node:path"]);
  const imports = [...source.matchAll(/(?:import\s+(?:[^"']+?\s+from\s+)?|import\s*\()["']([^"']+)["']/gu)].map((match) => match[1]);
  if (imports.some((specifier) => !allowedModules.has(specifier))) fail("helper-source-prohibited-import", "helper source requests a module outside the fixed allowlist");
  if (/\b(?:eval|Function|WebAssembly|process|require|fetch|XMLHttpRequest)\b/u.test(source)) fail("helper-source-prohibited-capability", "helper source requests a prohibited dynamic capability");

  const base = mkdtempSync(resolve(realpathSync(tmpdir()), `okf-adaptive-${randomUUID()}-`));
  chmodSync(base, 0o700);
  const runDir = resolve(base, "run");
  mkdirSync(runDir, { mode: 0o700 });
  mkdirSync(resolve(runDir, "tmp"), { mode: 0o700 });
  const rawRecord = { source, source_sha256: sha256(sourceBytes), inputs: null };
  try {
    rawRecord.inputs = copyInputs(runDir, manifest.inputs);
    const helperPath = resolve(runDir, "helper.mjs");
    writeFileSync(helperPath, sourceBytes, { flag: "wx", mode: 0o500 });
    const profilePath = resolve(runDir, "sandbox.sb");
    writeFileSync(profilePath, profileText(), { flag: "wx", mode: 0o400 });
    const result = await spawnSandbox({
      sandboxExecutable: manifest.sandbox_executable,
      profilePath,
      nodePath: manifest.node_path,
      helperPath,
      runDir,
      timeoutMs: manifest.limits.max_runtime_ms,
      maxOutputBytes: manifest.limits.max_output_bytes,
    });
    if (result.code !== 0 || result.signal !== null) fail("helper-exit-failed", `helper exited unsuccessfully (${result.code ?? result.signal})`);
    const diskBytes = treeBytes(runDir);
    if (diskBytes > manifest.limits.max_disk_bytes) fail("helper-disk-ceiling", "helper disk ceiling exceeded");
    const output = Object.freeze({
      version: "okf-adaptive-helper-result/1",
      run_id: manifest.run_id,
      helper_id: manifest.helper_id,
      source_sha256: rawRecord.source_sha256,
      input_hashes: Object.freeze(rawRecord.inputs.map(({ name, sha256: hash }) => Object.freeze({ name, sha256: hash }))),
      exit_code: result.code,
      signal: result.signal,
      stdout_bytes: result.stdout.length,
      stdout_sha256: sha256(result.stdout),
      stderr_bytes: result.stderr.length,
      stderr_sha256: sha256(result.stderr),
      disk_bytes: diskBytes,
      network: "denied",
      package_install: "denied",
      promotion: "denied",
      teardown: "completed",
    });
    return { result: output, raw: Object.freeze({ ...rawRecord, stdout: result.stdout, stderr: result.stderr }) };
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}
