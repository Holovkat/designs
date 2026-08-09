import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { FIXED_TOOL_NAMES, createFixedToolBroker } from "./prime-tools.mjs";
import { ReceiptLedger } from "./receipt-ledger.mjs";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function positive(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) fail("manifest-limit-invalid", `${field} must be a positive safe integer`);
}

function safeRelativePath(value, field) {
  if (typeof value !== "string" || value.length === 0 || isAbsolute(value) || value.includes("\\") || value.split("/").some((part) => part === "" || part === "." || part === "..")) {
    fail("manifest-path-invalid", `${field} must be a safe relative path`);
  }
  return value;
}

function validatePackageFiles(prime) {
  if (prime?.version !== "0.7.1" || typeof prime.package_root !== "string" || !isAbsolute(prime.package_root)) fail("prime-version-invalid", "Prime Agent 0.7.1 with an absolute package root is required");
  const packageRoot = realpathSync(prime.package_root);
  if (resolve(prime.package_root) !== packageRoot) fail("prime-root-not-physical", "Prime package root must be a physical path");
  if (!Array.isArray(prime.files) || prime.files.length < 3) fail("prime-pin-missing", "Prime package pin must contain at least three files");
  for (const item of prime.files) {
    const path = safeRelativePath(item.path, "prime.files.path");
    if (!/^[0-9a-f]{64}$/u.test(item.sha256 ?? "")) fail("prime-pin-invalid", `invalid SHA-256 for ${path}`);
    const full = resolve(packageRoot, path);
    const rel = relative(packageRoot, full);
    if (rel.startsWith("..") || isAbsolute(rel)) fail("prime-pin-escape", `Prime pin escapes package root: ${path}`);
    let cursor = packageRoot;
    for (const part of rel.split(sep)) {
      cursor = resolve(cursor, part);
      if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) fail("prime-pin-path-invalid", `Prime pin path is missing or symlinked: ${path}`);
    }
    const content = readFileSync(full);
    if (sha256(content) !== item.sha256) fail("prime-pin-mismatch", `Prime package hash mismatch: ${path}`);
  }
  const packageJson = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));
  if (packageJson.name !== "prime-agent" || packageJson.version !== "0.7.1") fail("prime-package-identity", "Prime package identity does not match prime-agent 0.7.1");
  return packageRoot;
}

export function validatePrimeRunManifest(manifest, { requireRealApproval = true } = {}) {
  if (!manifest || manifest.version !== "okf-prime-run-manifest/1") fail("manifest-version-invalid", "expected okf-prime-run-manifest/1");
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/iu.test(manifest.run_id ?? "")) fail("manifest-run-id-invalid", "run_id is invalid");
  if (!['fake-provider', 'real-provider'].includes(manifest.mode)) fail("manifest-mode-invalid", "mode must be fake-provider or real-provider");
  if (!isAbsolute(manifest.root ?? "") || !/^[0-9a-f]{40}$/u.test(manifest.revision ?? "")) fail("manifest-root-revision-invalid", "an absolute root and full revision are required");
  safeRelativePath(manifest.selected_closeout, "selected_closeout");
  for (const field of ["prompt_sha256", "tool_contract_sha256", "case_sha256"]) if (!/^[0-9a-f]{64}$/u.test(manifest[field] ?? "")) fail("manifest-hash-invalid", `${field} must be SHA-256`);
  if (!isAbsolute(manifest.receipt_path ?? "")) fail("receipt-path-invalid", "receipt_path must be absolute and outside the repository");
  const rootPrefix = `${realpathSync(manifest.root)}${sep}`;
  if (resolve(manifest.receipt_path).startsWith(rootPrefix)) fail("receipt-path-inside-root", "receipt_path must remain outside the repository");
  if (manifest.retry_ceiling !== 0) fail("retry-ceiling-invalid", "retry_ceiling must be exactly zero");
  if (manifest.network?.tools !== "none" || manifest.network?.helpers !== "none" || typeof manifest.network?.broker_endpoint !== "string") fail("network-policy-invalid", "only the broker may use the approved provider endpoint");
  if (!manifest.credential_source || !["prime-login", "provider-login"].includes(manifest.credential_source.kind) || typeof manifest.credential_source.reference !== "string" || manifest.credential_source.reference.length === 0) fail("credential-reference-invalid", "a secure credential-source reference is required");
  const limits = manifest.limits ?? {};
  for (const field of ["max_provider_requests", "max_tool_calls", "max_tool_bytes", "max_top_k", "max_input_tokens", "max_output_tokens", "max_total_tokens", "max_wall_ms", "max_model_ms", "max_processes", "max_disk_bytes", "max_cost_microusd", "max_receipt_bytes"]) positive(limits[field], field);
  if (limits.max_sessions !== 1 || limits.max_processes !== 1) fail("session-process-ceiling", "max_sessions and max_processes must both equal one");
  if (manifest.mode === "real-provider" && requireRealApproval && (manifest.approval?.status !== "approved" || typeof manifest.approval.reference !== "string" || manifest.approval.reference.length === 0)) fail("real-provider-not-approved", "real-provider mode requires a separate owner approval reference");
  if (manifest.mode === "fake-provider" && manifest.approval?.status !== "not-required-fake") fail("fake-approval-state-invalid", "fake-provider mode must use not-required-fake approval state");
  const packageRoot = validatePackageFiles(manifest.prime);
  return Object.freeze({ ...manifest, packageRoot });
}

function toolParameters(name) {
  const schemas = {
    read_session_summary: { type: "object", additionalProperties: false, properties: {} },
    list_capture_dispositions: { type: "object", additionalProperties: false, properties: {} },
    search_concepts: { type: "object", additionalProperties: false, properties: { terms: { type: "array", items: { type: "string" } }, assertion_states: { type: "array", items: { type: "string" } }, statuses: { type: "array", items: { type: "string" } }, relationships: { type: "array", items: { type: "string" } }, evidence: { type: "array", items: { type: "string" } }, has_evidence: { type: "boolean" }, top_k: { type: "integer" } } },
    get_concept: { type: "object", additionalProperties: false, required: ["concept_id"], properties: { concept_id: { type: "string" } } },
    get_delivery_receipt: { type: "object", additionalProperties: false, required: ["path"], properties: { path: { type: "string" } } },
    get_owner_decision: { type: "object", additionalProperties: false, required: ["path"], properties: { path: { type: "string" } } },
    get_resource_at_revision: { type: "object", additionalProperties: false, required: ["path", "reason"], properties: { path: { type: "string" }, reason: { type: "string" } } },
    submit_knowledge_change_set: { type: "object", additionalProperties: false, required: ["change_set"], properties: { change_set: {} } },
  };
  return schemas[name];
}

function toolDescription(name) {
  return ({
    read_session_summary: "Read the selected session summary and immutable session identity.",
    list_capture_dispositions: "List complete capture coverage and pending review without raw source bodies.",
    search_concepts: "Run bounded local text/metadata/relationship search over permanent concepts.",
    get_concept: "Read one exact stable-ID concept and its body.",
    get_delivery_receipt: "Read one explicitly approved delivery evidence receipt.",
    get_owner_decision: "Read one explicitly approved owner decision record.",
    get_resource_at_revision: "Escalation-only read of one allowlisted resource at the frozen revision.",
    submit_knowledge_change_set: "Submit one schema-valid, non-mutating Knowledge Change Set result.",
  })[name];
}

function finalAssistantText(messages) {
  const message = [...messages].reverse().find((item) => item.role === "assistant");
  if (!message) return "";
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content.filter((item) => item.type === "text").map((item) => item.text).join("");
}

export async function runPrimeFixedCanary({ manifest: rawManifest, prompt }) {
  const manifest = validatePrimeRunManifest(rawManifest);
  if (sha256(Buffer.from(prompt, "utf8")) !== manifest.prompt_sha256) fail("prompt-hash-mismatch", "prompt does not match the frozen manifest");
  const toolSource = readFileSync(new URL("./prime-tools.mjs", import.meta.url));
  if (sha256(toolSource) !== manifest.tool_contract_sha256) fail("tool-contract-hash-mismatch", "fixed tool implementation does not match the frozen manifest");
  const prime = await import(pathToFileURL(resolve(manifest.packageRoot, "dist/index.js")).href);
  const ledger = new ReceiptLedger({ runId: manifest.run_id, maxBytes: manifest.limits.max_receipt_bytes });
  const broker = createFixedToolBroker({
    root: manifest.root,
    revision: manifest.revision,
    selectedCloseout: manifest.selected_closeout,
    receiptPaths: manifest.receipt_paths ?? [],
    decisionPaths: manifest.decision_paths ?? [],
    resourcePaths: manifest.resource_paths ?? [],
    limits: manifest.limits,
    ledger,
  });

  const customTools = FIXED_TOOL_NAMES.map((name) => prime.defineTool({
    name,
    label: name,
    description: toolDescription(name),
    parameters: toolParameters(name),
    execute: async (_toolCallId, params) => {
      const result = await broker.handlers[name](params);
      return { content: [{ type: "text", text: result.text }], details: { receipt_id: result.receipt_id } };
    },
  }));
  const authStorage = prime.AuthStorage.create();
  const modelRegistry = prime.ModelRegistry.create(authStorage);
  const model = modelRegistry.find(manifest.model.provider, manifest.model.id);
  if (!model) fail("model-selector-unavailable", "approved model/provider selector is unavailable in Prime Agent");
  const settingsManager = prime.SettingsManager.inMemory({
    retry: { enabled: false, maxRetries: 0, provider: { maxRetries: 0 } },
    compaction: { enabled: false, agentCallable: false },
    autoRefine: { enabled: false },
    packages: [], extensions: [], skills: [], prompts: [], themes: [],
    enableBuiltinSkills: false,
  });
  const { session } = await prime.createAgentSession({
    cwd: manifest.root,
    model,
    thinkingLevel: manifest.model.thinking ?? "off",
    authStorage,
    modelRegistry,
    noTools: "all",
    tools: [...FIXED_TOOL_NAMES],
    customTools,
    sessionManager: prime.SessionManager.inMemory(manifest.root),
    settingsManager,
    includeGoals: false,
    includeCompactSkill: false,
    rlmMaxDepth: 0,
  });
  const exposed = session.agent.state.tools.map(({ name }) => name).sort();
  if (JSON.stringify(exposed) !== JSON.stringify([...FIXED_TOOL_NAMES].sort())) {
    session.dispose();
    fail("tool-surface-mismatch", `Prime exposed unexpected tools: ${exposed.join(", ")}`);
  }

  const statusBefore = sha256(execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: manifest.root }));
  const metrics = { provider_requests: 0, retry_events: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0, cost_microusd: 0, model_ms: 0 };
  let eventFailure = null;
  const started = Date.now();
  const unsubscribe = session.subscribe((event) => {
    if (event.type === "auto_retry_start" || event.type === "auto_retry_end") {
      metrics.retry_events += 1;
      eventFailure = Object.assign(new Error("Prime emitted a retry event"), { code: "retry-event" });
      void session.abort();
    }
    if (event.type === "turn_start") {
      metrics.provider_requests += 1;
      if (metrics.provider_requests > manifest.limits.max_provider_requests) {
        eventFailure = Object.assign(new Error("provider request ceiling exceeded"), { code: "provider-request-ceiling" });
        void session.abort();
      }
    }
    if (event.type === "turn_end") {
      const usage = event.message?.usage ?? {};
      metrics.input_tokens += usage.input ?? usage.inputTokens ?? 0;
      metrics.output_tokens += usage.output ?? usage.outputTokens ?? 0;
      metrics.total_tokens += usage.totalTokens ?? ((usage.input ?? 0) + (usage.output ?? 0));
      const dollars = usage.cost?.total ?? usage.cost ?? 0;
      if (typeof dollars === "number") metrics.cost_microusd += Math.ceil(dollars * 1_000_000);
    }
  });

  let timeout;
  try {
    await Promise.race([
      session.prompt(prompt),
      new Promise((_, reject) => {
        timeout = setTimeout(async () => {
          await session.abort().catch(() => {});
          reject(Object.assign(new Error("Prime wall-clock ceiling exceeded"), { code: "wall-time-ceiling" }));
        }, manifest.limits.max_wall_ms);
      }),
    ]);
    if (eventFailure) throw eventFailure;
    metrics.model_ms = Date.now() - started;
    if (metrics.model_ms > manifest.limits.max_model_ms) fail("model-time-ceiling", "model time ceiling exceeded");
    if (metrics.input_tokens > manifest.limits.max_input_tokens || metrics.output_tokens > manifest.limits.max_output_tokens || metrics.total_tokens > manifest.limits.max_total_tokens) fail("token-ceiling", "approved token ceiling exceeded");
    if (metrics.cost_microusd > manifest.limits.max_cost_microusd) fail("cost-ceiling", "approved cost ceiling exceeded");
    if (!broker.submittedChangeSet()) fail("submission-missing", "Prime completed without one valid Knowledge Change Set submission");
    const summary = { status: "completed", ...metrics, tool_metrics: broker.metrics(), assistant_text_sha256: sha256(finalAssistantText(session.agent.state.messages)) };
    const statusAfter = sha256(execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: manifest.root }));
    const receipt = ledger.writeOnce(manifest.receipt_path, summary);
    const entries = ledger.entries;
    const execution = Object.freeze({
      version: "okf-canary-execution-proof/1",
      tool_names: exposed,
      root_revision_valid: execFileSync("git", ["rev-parse", "HEAD"], { cwd: manifest.root, encoding: "utf8" }).trim() === manifest.revision,
      repository_status_before_sha256: statusBefore,
      repository_status_after_sha256: statusAfter,
      submission_count: entries.filter(({ tool, status }) => tool === "submit_knowledge_change_set" && status === "ok").length,
      retry_events: metrics.retry_events,
      ledger_error_count: entries.filter(({ status }) => status !== "ok").length,
      ledger_redactions: entries.map(({ redaction }) => redaction),
      within_ceilings: true,
      clean_teardown: true,
      raw_source_retained: false,
      normalized_uninspectable_source: false,
    });
    return Object.freeze({ status: "completed", submitted_change_set: broker.submittedChangeSet(), metrics: summary, receipt, execution });
  } finally {
    if (timeout) clearTimeout(timeout);
    unsubscribe();
    session.dispose();
  }
}
