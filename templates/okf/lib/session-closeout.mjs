import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname } from "node:path";
import {
  canonicalKnowledgeChangeJson,
  parseKnowledgeChangeSet,
  projectCaptureCoverage,
  renderTier2InboxMarkdown,
} from "./knowledge-change-set.mjs";
import { RunGuardError, resolveContainedPath, resolveControlPath, validateRoot } from "./run-guard.mjs";

function fail(code, message) {
  throw new RunGuardError(code, message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(root, args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    if (allowFailure) return null;
    fail("git-command-failed", `Git command failed: git ${args.join(" ")}`);
  }
}

function slugify(value) {
  const slug = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80)
    .replace(/-+$/gu, "");
  return slug || "session-closeout";
}

function timestampStem(timestamp) {
  return timestamp.replaceAll(":", "-");
}

function outputPaths(changeSet) {
  const stem = `${timestampStem(changeSet.generated.at)}-${slugify(changeSet.inbox.title)}`;
  return Object.freeze({
    markdown: `knowledge/inbox/${stem}.md`,
    change_set: `knowledge/inbox/${stem}.change.json`,
  });
}

function directPendingMarkdownCount(root) {
  const inbox = resolveContainedPath(root, "knowledge/inbox");
  return readdirSync(inbox.full, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .length;
}

function issueColumn(changeSet) {
  const refs = [...new Set([...changeSet.inbox.epic_refs, ...changeSet.inbox.issue_refs])].sort((left, right) => left - right);
  return refs.length === 0 ? "—" : refs.map((number) => `#${number}`).join(", ");
}

function indexRow(changeSet, markdownPath) {
  const tags = changeSet.inbox.tags.join(", ");
  return `| [${changeSet.inbox.title}](./${basename(markdownPath)}) | ${changeSet.generated.at} | ${tags} | ${issueColumn(changeSet)} |`;
}

function insertInboxRow(content, row) {
  if (content.includes(row)) return content;
  const marker = "<!-- Rows added by agents, removed by curation agent -->";
  if (!content.includes(marker)) fail("inbox-index-marker-missing", "knowledge/inbox/index.md is missing its insertion marker");
  return content.replace(marker, `${row}\n${marker}`);
}

function updateRootCount(content, count) {
  const pattern = /^(\| \[Inbox\]\(\.\/inbox\/index\.md\) \| )\d+( \|.*)$/mu;
  if (!pattern.test(content)) fail("root-index-inbox-row-missing", "knowledge/index.md is missing its Inbox count row");
  return content.replace(pattern, (_match, prefix, suffix) => `${prefix}${count}${suffix}`);
}

function assertCleanIndex(root) {
  if (git(root, ["diff", "--cached", "--quiet"], { allowFailure: true }) === null) {
    fail("git-index-dirty", "the Git index must be clean before session closeout writes its exact capture slice");
  }
}

function statusPaths(root) {
  const output = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (!output) return [];
  const entries = output.split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const code = entry.slice(0, 2);
    const path = entry.slice(3);
    paths.push(path);
    if ((code.includes("R") || code.includes("C")) && entries[index + 1]) paths.push(entries[++index]);
  }
  return [...new Set(paths)].sort();
}

function assertWorkingTreeScope(root, changeSetPath, changeSet, outputs) {
  const allowed = new Set([
    changeSetPath,
    changeSet.capture_selection.manifest_path,
    "knowledge/index.md",
    "knowledge/inbox/index.md",
    outputs.markdown,
    outputs.change_set,
    ...changeSet.captures.map((capture) => capture.source.path),
  ]);
  const unexpected = statusPaths(root).filter((path) => !allowed.has(path));
  if (unexpected.length > 0) {
    fail("working-tree-scope-conflict", `session closeout refuses unrelated dirty paths: ${unexpected.join(", ")}`);
  }
}

function assertSessionIdentity(root, changeSet) {
  const currentRevision = git(root, ["rev-parse", "HEAD"]).toLowerCase();
  if (currentRevision !== changeSet.session.head_revision.toLowerCase()) {
    fail("head-revision-mismatch", "change-set head_revision does not match the current Git HEAD");
  }
  const currentBranch = git(root, ["branch", "--show-current"]);
  if (currentBranch !== changeSet.session.branch) {
    fail("branch-mismatch", "change-set branch does not match the current Git branch");
  }
  for (const revision of [changeSet.session.base_revision, ...changeSet.inbox.commit_shas]) {
    if (git(root, ["cat-file", "-e", `${revision}^{commit}`], { allowFailure: true }) === null) {
      fail("commit-reference-missing", `change-set commit is not available in this repository: ${revision}`);
    }
  }
}

function assertSourceIdentity(root, source) {
  const resolved = resolveContainedPath(root, source.path);
  const stat = lstatSync(resolved.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("capture-source-not-regular", `capture source is not a regular file: ${source.path}`);
  const content = readFileSync(resolved.full);
  if (content.length !== source.size_bytes || sha256(content) !== source.sha256) {
    fail("capture-source-drift", `capture source no longer matches its declared identity: ${source.path}`);
  }
}

function assertSelection(root, changeSet, { exactReplay = false } = {}) {
  const manifest = resolveContainedPath(root, changeSet.capture_selection.manifest_path);
  const manifestContent = readFileSync(manifest.full);
  if (sha256(manifestContent) !== changeSet.capture_selection.manifest_sha256 && !exactReplay) {
    fail("capture-selection-drift", "capture selection manifest no longer matches its approved SHA-256");
  }
  for (const capture of changeSet.captures) assertSourceIdentity(root, capture.source);
}

function isExactExistingFile(root, path, content) {
  const target = resolveControlPath(root, path);
  if (!existsSync(target.full)) return false;
  const stat = lstatSync(target.full);
  return stat.isFile() && !stat.isSymbolicLink() && readFileSync(target.full).equals(content);
}

function plannedFile(root, path, content, { existingAllowed = false } = {}) {
  const target = resolveControlPath(root, path);
  if (existsSync(target.full)) {
    const stat = lstatSync(target.full);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("output-not-regular", `output is not a regular file: ${path}`);
    const existing = readFileSync(target.full);
    if (existing.equals(content) && existingAllowed) return Object.freeze({ path, full: target.full, action: "unchanged", content, sha256: sha256(content) });
    fail("output-conflict", `output already exists with different content: ${path}`);
  }
  return Object.freeze({ path, full: target.full, action: "create", content, sha256: sha256(content) });
}

function plannedRewrite(root, path, content) {
  const target = resolveContainedPath(root, path);
  const before = readFileSync(target.full);
  return Object.freeze({
    path,
    full: target.full,
    action: before.equals(content) ? "unchanged" : "rewrite",
    before,
    content,
    sha256: sha256(content),
  });
}

function atomicReplace(path, content) {
  const temporary = `${path}.okf-closeout-${process.pid}.tmp`;
  writeFileSync(temporary, content, { flag: "wx", mode: 0o644 });
  renameSync(temporary, path);
}

function applyPlan(plan) {
  const applied = [];
  try {
    for (const entry of plan) {
      if (entry.action === "unchanged") continue;
      if (entry.action === "create") {
        writeFileSync(entry.full, entry.content, { flag: "wx", mode: 0o644 });
      } else {
        atomicReplace(entry.full, entry.content);
      }
      applied.push(entry);
    }
  } catch (error) {
    for (const entry of [...applied].reverse()) {
      try {
        if (entry.action === "create") rmSync(entry.full, { force: true });
        else atomicReplace(entry.full, entry.before);
      } catch {
        fail("closeout-rollback-failed", `session closeout failed and could not restore ${entry.path}`);
      }
    }
    throw error;
  }
}

export function planSessionCloseout(rootCandidate, changeSetPath) {
  const { root } = validateRoot(rootCandidate);
  assertCleanIndex(root);
  const input = resolveContainedPath(root, changeSetPath);
  const stat = lstatSync(input.full);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("change-set-not-regular", "change-set input must be a regular contained file");
  const parsed = parseKnowledgeChangeSet(readFileSync(input.full), { sourcePath: changeSetPath });
  if (!parsed.ok) {
    const codes = parsed.diagnostics.map(({ code }) => code).join(", ") || "invalid";
    fail("change-set-invalid", `knowledge change set failed closed: ${codes}`);
  }
  const changeSet = parsed.value;
  const outputs = outputPaths(changeSet);
  const canonicalJson = Buffer.from(canonicalKnowledgeChangeJson(changeSet), "utf8");
  const markdown = Buffer.from(renderTier2InboxMarkdown(changeSet), "utf8");
  const exactReplay = isExactExistingFile(root, outputs.change_set, canonicalJson)
    && isExactExistingFile(root, outputs.markdown, markdown);
  assertWorkingTreeScope(root, changeSetPath, changeSet, outputs);
  assertSessionIdentity(root, changeSet);
  assertSelection(root, changeSet, { exactReplay });

  const inboxIndex = resolveContainedPath(root, "knowledge/inbox/index.md");
  const rootIndex = resolveContainedPath(root, "knowledge/index.md");
  const inboxAfter = Buffer.from(insertInboxRow(readFileSync(inboxIndex.full, "utf8"), indexRow(changeSet, outputs.markdown)), "utf8");
  const nextCount = directPendingMarkdownCount(root) + (existsSync(resolveControlPath(root, outputs.markdown).full) ? 0 : 1);
  const rootAfter = Buffer.from(updateRootCount(readFileSync(rootIndex.full, "utf8"), nextCount), "utf8");

  const plan = Object.freeze([
    plannedFile(root, outputs.change_set, canonicalJson, { existingAllowed: true }),
    plannedFile(root, outputs.markdown, markdown, { existingAllowed: true }),
    plannedRewrite(root, "knowledge/inbox/index.md", inboxAfter),
    plannedRewrite(root, "knowledge/index.md", rootAfter),
  ]);
  const coverage = projectCaptureCoverage(changeSet);
  return Object.freeze({
    version: "okf-session-closeout-plan/1",
    root,
    revision: changeSet.session.head_revision,
    change_set_id: changeSet.change_set_id,
    complete: parsed.complete,
    pending_capture_ids: parsed.pending_capture_ids,
    outputs,
    coverage: coverage.captures,
    operations: Object.freeze(changeSet.operations.map(({ operation_id, sequence, kind, target, idempotency_key }) => Object.freeze({ operation_id, sequence, kind, target, idempotency_key }))),
    writes: Object.freeze(plan.map(({ path, action, content, sha256: hash }) => Object.freeze({ path, action, bytes: content.length, sha256: hash }))),
    _plan: plan,
  });
}

export function writeSessionCloseout(rootCandidate, changeSetPath) {
  const planned = planSessionCloseout(rootCandidate, changeSetPath);
  applyPlan(planned._plan);
  const { _plan: _ignored, ...receipt } = planned;
  return Object.freeze({ ...receipt, status: receipt.complete ? "written-complete" : "written-review-required" });
}

export function publicSessionCloseoutPlan(rootCandidate, changeSetPath) {
  const planned = planSessionCloseout(rootCandidate, changeSetPath);
  const { _plan: _ignored, ...result } = planned;
  return result;
}
