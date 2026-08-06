import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";

export class RunGuardError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function posixRelative(root, path) {
  return relative(root, path).split(sep).join("/");
}

export function validateRoot(candidate) {
  if (typeof candidate !== "string" || candidate.length === 0 || !isAbsolute(candidate)) {
    fail("root-not-absolute", "root must be an absolute path");
  }
  let root;
  try {
    root = realpathSync(candidate);
  } catch {
    fail("root-unresolvable", "root cannot be resolved");
  }
  const home = realpathSync(homedir());
  if (root === parse(root).root || root === home || root === "/Users") {
    fail("root-forbidden", "root is a forbidden host boundary");
  }

  let topLevel;
  let revision;
  try {
    topLevel = realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
    revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    fail("root-not-git", "root must be a Git worktree");
  }
  if (topLevel !== root) fail("root-not-toplevel", "root must be the Git worktree top level");

  const knowledgeDir = resolve(root, "knowledge");
  try {
    const knowledge = lstatSync(knowledgeDir);
    if (!knowledge.isDirectory() || knowledge.isSymbolicLink()) fail("root-missing-knowledge", "root must contain a non-symlink knowledge directory");
  } catch (error) {
    if (error instanceof RunGuardError) throw error;
    fail("root-missing-knowledge", "root must contain a knowledge directory");
  }
  return Object.freeze({ root, revision, knowledgeDir });
}

export function resolveContainedPath(root, path, { optional = false } = {}) {
  if (typeof path !== "string" || path.length === 0) fail("path-invalid", "path must be a non-empty relative path");
  if (isAbsolute(path)) fail("path-absolute", "path must be relative to the approved root");
  const full = resolve(root, path);
  const rootRelative = posixRelative(root, full);
  if (rootRelative === "" || rootRelative === ".." || rootRelative.startsWith("../") || isAbsolute(rootRelative)) {
    fail("path-escapes-root", "path escapes the approved root");
  }

  let cursor = root;
  for (const component of rootRelative.split("/")) {
    cursor = resolve(cursor, component);
    if (!existsSync(cursor)) {
      if (optional) return Object.freeze({ path: rootRelative, full, exists: false });
      fail("path-missing", `approved path is missing: ${rootRelative}`);
    }
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) fail("path-symlink", `symlinks are not allowed in approved paths: ${rootRelative}`);
  }
  return Object.freeze({ path: rootRelative, full, exists: true });
}

export function resolveControlPath(root, path) {
  if (typeof path !== "string" || path.length === 0 || isAbsolute(path)) fail("path-invalid", "control path must be a non-empty relative path");
  const full = resolve(root, path);
  const rootRelative = posixRelative(root, full);
  if (rootRelative === "" || rootRelative === ".." || rootRelative.startsWith("../") || isAbsolute(rootRelative)) {
    fail("path-escapes-root", "control path escapes the approved root");
  }
  let existing = dirname(full);
  while (!existsSync(existing)) existing = dirname(existing);
  if (existing !== root) resolveContainedPath(root, posixRelative(root, existing));
  return Object.freeze({ path: rootRelative, full });
}

export function buildPathAllowlist(root, paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail("allowlist-missing", "at least one approved path is required");
  const items = paths.map((path) => resolveContainedPath(root, path));
  return Object.freeze([...new Set(items.map((item) => item.path))].sort());
}
