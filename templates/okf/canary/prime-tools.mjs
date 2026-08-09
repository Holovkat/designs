import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseFrontmatter } from "../lib/frontmatter.mjs";
import { canonicalKnowledgeChangeJson, parseKnowledgeChangeSet, projectCaptureCoverage } from "../lib/knowledge-change-set.mjs";
import { queryBundle } from "../lib/query.mjs";
import { assertRevision, resolveContainedPath, validateRoot } from "../lib/run-guard.mjs";

export const FIXED_TOOL_NAMES = Object.freeze([
  "read_session_summary",
  "list_capture_dispositions",
  "search_concepts",
  "get_concept",
  "get_delivery_receipt",
  "get_owner_decision",
  "get_resource_at_revision",
  "submit_knowledge_change_set",
]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function boundedInteger(value, fallback, max, label) {
  const selected = value ?? fallback;
  if (!Number.isSafeInteger(selected) || selected <= 0 || selected > max) fail("tool-argument-invalid", `${label} must be between 1 and ${max}`);
  return selected;
}

function boundedText(value, maxBytes, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (Buffer.byteLength(text, "utf8") > maxBytes) fail("tool-output-ceiling", `${label} exceeds the approved byte ceiling`);
  return text;
}

function readApprovedFile(root, path, allowlist, maxBytes) {
  if (!allowlist.has(path)) fail("tool-path-not-approved", `path is not approved for this tool: ${path}`);
  const resolved = resolveContainedPath(root, path);
  const content = readFileSync(resolved.full);
  if (content.length > maxBytes) fail("tool-output-ceiling", `approved file exceeds the tool byte ceiling: ${path}`);
  return content.toString("utf8");
}

function loadCloseout(root, path, maxBytes) {
  const content = readApprovedFile(root, path, new Set([path]), maxBytes);
  const parsed = parseKnowledgeChangeSet(content, { sourcePath: path, maxBytes });
  if (!parsed.ok) fail("closeout-invalid", `selected closeout is invalid: ${parsed.diagnostics.map(({ code }) => code).join(", ")}`);
  return parsed.value;
}

function publicConcept(record) {
  return Object.freeze({
    id: record.id,
    path: record.path,
    type: record.type,
    title: record.title,
    description: record.description,
    status: record.status,
    assertion_state: record.assertion_state,
    evidence_refs: record.evidence_refs,
    relationships: record.relationships,
    validation_status: record.validation_status,
  });
}

export function createFixedToolBroker({ root: rootCandidate, revision, selectedCloseout, receiptPaths = [], decisionPaths = [], resourcePaths = [], limits, ledger }) {
  const { root } = validateRoot(rootCandidate);
  assertRevision(root, revision);
  const maxToolCalls = boundedInteger(limits.max_tool_calls, null, 1000, "max_tool_calls");
  const maxToolBytes = boundedInteger(limits.max_tool_bytes, null, 16 * 1024 * 1024, "max_tool_bytes");
  const maxTopK = boundedInteger(limits.max_top_k ?? 20, 20, 100, "max_top_k");
  const receipts = new Set(receiptPaths);
  const decisions = new Set(decisionPaths);
  const resources = new Set(resourcePaths);
  let callCount = 0;
  let resultBytes = 0;
  let submitted = null;

  async function execute(tool, input, implementation) {
    if (!FIXED_TOOL_NAMES.includes(tool)) fail("unexpected-tool", `tool is not in the fixed allowlist: ${tool}`);
    if (callCount >= maxToolCalls) fail("tool-call-ceiling", "tool call ceiling reached");
    callCount += 1;
    const startedAt = new Date().toISOString();
    try {
      assertRevision(root, revision);
      const output = await implementation();
      const text = boundedText(output, maxToolBytes, `${tool} result`);
      const bytes = Buffer.byteLength(text, "utf8");
      if (resultBytes + bytes > maxToolBytes) fail("tool-byte-ceiling", "aggregate tool-result byte ceiling reached");
      resultBytes += bytes;
      const finishedAt = new Date().toISOString();
      const receipt = ledger.append({ tool, input, output, status: "ok", startedAt, finishedAt });
      return Object.freeze({ text, receipt_id: receipt.receipt_id });
    } catch (error) {
      const finishedAt = new Date().toISOString();
      ledger.append({ tool, input, output: { error: error.code ?? "failed" }, status: "error", startedAt, finishedAt, errorCode: error.code ?? "failed" });
      throw error;
    }
  }

  const handlers = Object.freeze({
    read_session_summary: (input = {}) => execute("read_session_summary", input, async () => {
      const changeSet = loadCloseout(root, selectedCloseout, maxToolBytes);
      return { session: changeSet.session, generated: changeSet.generated, summary: changeSet.summary, inbox: changeSet.inbox };
    }),

    list_capture_dispositions: (input = {}) => execute("list_capture_dispositions", input, async () => {
      const changeSet = loadCloseout(root, selectedCloseout, maxToolBytes);
      const coverage = projectCaptureCoverage(changeSet);
      return { complete: coverage.complete, captures: coverage.captures };
    }),

    search_concepts: (input = {}) => execute("search_concepts", input, async () => {
      const topK = boundedInteger(input.top_k ?? maxTopK, maxTopK, maxTopK, "top_k");
      const result = await queryBundle(root, {
        terms: Array.isArray(input.terms) ? input.terms : [],
        assertionStates: Array.isArray(input.assertion_states) ? input.assertion_states : [],
        statuses: Array.isArray(input.statuses) ? input.statuses : [],
        relationships: Array.isArray(input.relationships) ? input.relationships : [],
        evidence: Array.isArray(input.evidence) ? input.evidence : [],
        hasEvidence: input.has_evidence === true,
      });
      return { revision, count: result.count, truncated: result.count > topK, results: result.results.slice(0, topK).map(publicConcept) };
    }),

    get_concept: (input = {}) => execute("get_concept", input, async () => {
      if (typeof input.concept_id !== "string" || !/^okf-[0-9a-f-]{36}$/iu.test(input.concept_id)) fail("tool-argument-invalid", "concept_id must be a stable OKF ID");
      const result = await queryBundle(root, { terms: [input.concept_id.replaceAll("-", "\\-")] });
      const matches = result.results.filter(({ id }) => id === input.concept_id);
      if (matches.length !== 1) fail("concept-not-unique", `expected one concept for ${input.concept_id}, found ${matches.length}`);
      const record = matches[0];
      const content = readApprovedFile(root, record.path, new Set([record.path]), maxToolBytes);
      const parsed = parseFrontmatter(content, record.path);
      return { ...publicConcept(record), body: parsed.body };
    }),

    get_delivery_receipt: (input = {}) => execute("get_delivery_receipt", input, async () => ({ path: input.path, content: readApprovedFile(root, input.path, receipts, maxToolBytes) })),

    get_owner_decision: (input = {}) => execute("get_owner_decision", input, async () => ({ path: input.path, content: readApprovedFile(root, input.path, decisions, maxToolBytes) })),

    get_resource_at_revision: (input = {}) => execute("get_resource_at_revision", input, async () => {
      if (typeof input.reason !== "string" || input.reason.trim().length < 8) fail("escalation-reason-missing", "a precise escalation reason is required");
      if (!resources.has(input.path)) fail("tool-path-not-approved", `resource path is not approved: ${input.path}`);
      const content = execFileSync("git", ["show", `${revision}:${input.path}`], { cwd: root, encoding: "utf8", maxBuffer: maxToolBytes, stdio: ["ignore", "pipe", "ignore"] });
      return { path: input.path, revision, reason: input.reason, content };
    }),

    submit_knowledge_change_set: (input = {}) => execute("submit_knowledge_change_set", input, async () => {
      if (submitted) fail("change-set-already-submitted", "this run already accepted one knowledge change set");
      const candidate = typeof input.change_set === "string" ? input.change_set : canonicalKnowledgeChangeJson(input.change_set);
      const parsed = parseKnowledgeChangeSet(candidate, { sourcePath: "prime-submission.change.json", maxBytes: maxToolBytes });
      if (!parsed.ok) fail("change-set-invalid", `submitted change set is invalid: ${parsed.diagnostics.map(({ code }) => code).join(", ")}`);
      submitted = parsed.value;
      return { accepted: true, complete: parsed.complete, pending_capture_ids: parsed.pending_capture_ids, canonical: canonicalKnowledgeChangeJson(parsed.value) };
    }),
  });

  return Object.freeze({
    root,
    revision,
    toolNames: FIXED_TOOL_NAMES,
    handlers,
    metrics: () => Object.freeze({ call_count: callCount, result_bytes: resultBytes, submitted: submitted !== null }),
    submittedChangeSet: () => submitted,
  });
}
