import { createHash } from "node:crypto";
import validateSchema from "../schema/okf-knowledge-change-1.validator.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";
import { parseDocument } from "./yaml-runtime.mjs";

export const KNOWLEDGE_CHANGE_SCHEMA_VERSION = "okf-knowledge-change/1";
export const DEFAULT_MAX_CHANGE_SET_BYTES = 16 * 1024 * 1024;

const SECRET_PATTERN = /(?:-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----|(?:password|passwd|api[_-]?(?:key|token)|access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization)["']?\s*[:=]\s*["']?[^\s"']{12,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/iu;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function diagnostic(code, message, path = "") {
  return Object.freeze({ code, path, message });
}

function diagnosticsFromSchema(errors) {
  return (errors ?? []).map((error) => diagnostic(
    `schema-${error.keyword}`,
    error.message ?? "Schema validation failed.",
    error.instancePath || "/",
  ));
}

function inputDescriptor(input) {
  if (typeof input === "string") {
    return { hashInput: input, size: Buffer.byteLength(input, "utf8"), supported: true, bytes: () => Buffer.from(input, "utf8") };
  }
  if (Buffer.isBuffer(input)) return { hashInput: input, size: input.length, supported: true, bytes: () => input };
  if (input instanceof Uint8Array) {
    const view = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    return { hashInput: view, size: view.length, supported: true, bytes: () => view };
  }
  const label = Object.prototype.toString.call(input);
  const bytes = Buffer.from(label, "utf8");
  return { hashInput: bytes, size: bytes.length, supported: false, bytes: () => bytes };
}

function decodeUtf8(bytes) {
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, text: null };
  }
}

function rawPathDescriptor(path) {
  let raw = "<uninspectable-path>";
  try {
    raw = typeof path === "string" ? path : Object.prototype.toString.call(path);
  } catch {
    // The constant sentinel is intentionally non-secret and bounded.
  }
  try {
    return { raw, size: Buffer.byteLength(raw, "utf8"), sha256: sha256(raw) };
  } catch {
    const fallback = "<uninspectable-path>";
    return { raw: fallback, size: fallback.length, sha256: sha256(fallback) };
  }
}

function validSourcePath(path) {
  if (typeof path !== "string" || path.length < 1 || Buffer.byteLength(path, "utf8") > 1024) return false;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(path) || path.startsWith("/") || path.includes("\\") || /[\u0000-\u001f\u007f]/u.test(path)) return false;
  const segments = path.split("/");
  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function sourceIdentity(path, input, classification, contentAccess = "identity-only") {
  const pathDescriptor = rawPathDescriptor(path);
  const safePath = typeof path === "string" && validSourcePath(pathDescriptor.raw);
  return Object.freeze({
    path: safePath ? pathDescriptor.raw : "<invalid-path>",
    ...(safePath ? {} : { path_sha256: pathDescriptor.sha256, path_size_bytes: pathDescriptor.size }),
    sha256: sha256(input.hashInput),
    size_bytes: input.size,
    classification,
    content_access: contentAccess,
  });
}


function containsCredentialShape(value) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current === "string") {
      if (SECRET_PATTERN.test(current)) return true;
    } else if (Array.isArray(current)) {
      for (const item of current) pending.push(item);
    } else if (current && typeof current === "object") {
      for (const item of Object.values(current)) pending.push(item);
    }
  }
  return false;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function canonicalKnowledgeChangeJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function computeContentSha256(value) {
  return sha256(Buffer.from(String(value), "utf8"));
}

export function computeOperationIdempotencyKey(operation) {
  const applicationIdentity = {
    kind: operation.kind,
    target: operation.target,
    change: { mode: operation.change.mode, sha256: operation.change.sha256 },
    ...(operation.source_concept_ids ? { source_concept_ids: [...operation.source_concept_ids].sort() } : {}),
    ...(operation.deprecation ? {
      deprecation: {
        replacement_concept_id: operation.deprecation.replacement_concept_id,
        superseded_concept_ids: [...operation.deprecation.superseded_concept_ids].sort(),
      },
    } : {}),
  };
  return sha256(Buffer.from(JSON.stringify(stableValue(applicationIdentity)), "utf8"));
}

function duplicateIds(items, key) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item[key])) duplicates.add(item[key]);
    seen.add(item[key]);
  }
  return [...duplicates].sort();
}

function semanticDiagnostics(changeSet) {
  const errors = [];
  const captureById = new Map(changeSet.captures.map((capture) => [capture.capture_id, capture]));
  const operationById = new Map(changeSet.operations.map((operation) => [operation.operation_id, operation]));
  const evidenceById = new Map(changeSet.evidence.map((evidence) => [evidence.evidence_id, evidence]));
  const requiredCaptureIds = new Set(changeSet.capture_selection.required_capture_ids);
  const actualCaptureIds = new Set(changeSet.captures.map((capture) => capture.capture_id));
  for (const captureId of [...requiredCaptureIds].filter((id) => !actualCaptureIds.has(id)).sort()) {
    errors.push(diagnostic("required-capture-missing", `Required capture ${captureId} has no coverage entry.`, "/capture_selection/required_capture_ids"));
  }
  for (const captureId of [...actualCaptureIds].filter((id) => !requiredCaptureIds.has(id)).sort()) {
    errors.push(diagnostic("capture-outside-selection", `Capture ${captureId} is outside the explicit selection manifest.`, "/captures"));
  }

  for (const id of duplicateIds(changeSet.captures, "capture_id")) {
    errors.push(diagnostic("capture-id-duplicate", `Capture ID ${id} is not unique.`, "/captures"));
  }
  for (const id of duplicateIds(changeSet.operations, "operation_id")) {
    errors.push(diagnostic("operation-id-duplicate", `Operation ID ${id} is not unique.`, "/operations"));
  }
  for (const id of duplicateIds(changeSet.evidence, "evidence_id")) {
    errors.push(diagnostic("evidence-id-duplicate", `Evidence ID ${id} is not unique.`, "/evidence"));
  }

  const sequences = new Set();
  const idempotencyKeys = new Set();
  const conceptPathById = new Map();
  const conceptIdByPath = new Map();
  const lastOperationByTarget = new Map();
  const globallySeenClaims = new Set();
  const referencedEvidenceIds = new Set();
  for (let index = 0; index < changeSet.operations.length; index += 1) {
    const operation = changeSet.operations[index];
    const path = `/operations/${index}`;
    if (operation.sequence !== index + 1) {
      errors.push(diagnostic("operation-sequence-order", "Operations must be stored in contiguous sequence order starting at 1.", `${path}/sequence`));
    }
    if (sequences.has(operation.sequence)) {
      errors.push(diagnostic("operation-sequence-duplicate", `Sequence ${operation.sequence} is duplicated.`, `${path}/sequence`));
    }
    sequences.add(operation.sequence);
    if (idempotencyKeys.has(operation.idempotency_key)) {
      errors.push(diagnostic("operation-idempotency-duplicate", "A change set must contain only one operation for each application identity.", `${path}/idempotency_key`));
    }
    idempotencyKeys.add(operation.idempotency_key);
    const priorPath = conceptPathById.get(operation.target.concept_id);
    if (priorPath && priorPath !== operation.target.path) {
      errors.push(diagnostic("operation-concept-path-conflict", "One stable concept ID cannot target multiple paths in a change set.", `${path}/target/path`));
    }
    const priorId = conceptIdByPath.get(operation.target.path);
    if (priorId && priorId !== operation.target.concept_id) {
      errors.push(diagnostic("operation-path-concept-conflict", "One concept path cannot target multiple stable IDs in a change set.", `${path}/target/concept_id`));
    }
    conceptPathById.set(operation.target.concept_id, operation.target.path);
    conceptIdByPath.set(operation.target.path, operation.target.concept_id);
    const targetKey = JSON.stringify([operation.target.concept_id, operation.target.path]);
    const priorOperation = lastOperationByTarget.get(targetKey);
    if (priorOperation) {
      if (!operation.depends_on.includes(priorOperation.operation_id)) {
        errors.push(diagnostic("operation-target-chain-dependency-missing", `A later write must depend on ${priorOperation.operation_id}.`, `${path}/depends_on`));
      }
      if (operation.target.expected.sha256 !== priorOperation.change.sha256) {
        errors.push(diagnostic("operation-target-chain-precondition-mismatch", "A later write must expect the exact output hash of the prior target operation.", `${path}/target/expected`));
      }
    }
    lastOperationByTarget.set(targetKey, operation);
    if (operation.change.sha256 !== computeContentSha256(operation.change.value)) {
      errors.push(diagnostic("operation-change-hash-mismatch", "Change content hash does not match the exact concept content.", `${path}/change/sha256`));
    }
    if (operation.idempotency_key !== computeOperationIdempotencyKey(operation)) {
      errors.push(diagnostic("operation-idempotency-mismatch", "Idempotency key does not match the canonical semantic operation.", `${path}/idempotency_key`));
    }
    const parsed = parseFrontmatter(operation.change.value, `${operation.operation_id}:content`);
    if (!parsed.hasFrontmatter || parsed.diagnostics.length > 0) {
      errors.push(diagnostic("operation-content-frontmatter-invalid", "Exact concept content must contain valid frontmatter.", `${path}/change/value`));
    } else if (parsed.frontmatter.id !== operation.target.concept_id) {
      errors.push(diagnostic("operation-content-target-id-mismatch", "Exact content ID must equal the operation target concept ID.", `${path}/change/value`));
    } else if (operation.kind === "supersede") {
      const supersedes = Array.isArray(parsed.frontmatter.supersedes) ? parsed.frontmatter.supersedes : [];
      const missing = operation.deprecation.superseded_concept_ids.filter((id) => !supersedes.includes(id));
      if (missing.length > 0) {
        errors.push(diagnostic("operation-content-supersedes-missing", "Replacement content must carry every declared old stable ID in supersedes.", `${path}/change/value`));
      }
    }
    for (const dependencyId of operation.depends_on) {
      const dependency = operationById.get(dependencyId);
      if (!dependency) {
        errors.push(diagnostic("operation-dependency-missing", `Dependency ${dependencyId} does not exist.`, `${path}/depends_on`));
      } else if (dependency.sequence >= operation.sequence) {
        errors.push(diagnostic("operation-dependency-order", `Dependency ${dependencyId} must precede this operation.`, `${path}/depends_on`));
      }
    }
    for (const captureId of operation.capture_ids) {
      const capture = captureById.get(captureId);
      if (!capture) {
        errors.push(diagnostic("operation-capture-missing", `Capture ${captureId} does not exist.`, `${path}/capture_ids`));
      } else if (!capture.disposition.operation_ids.includes(operation.operation_id)) {
        errors.push(diagnostic("coverage-operation-not-reciprocal", `Capture ${captureId} does not link back to ${operation.operation_id}.`, `${path}/capture_ids`));
      }
    }
    for (let claimIndex = 0; claimIndex < operation.claims.length; claimIndex += 1) {
      const claim = operation.claims[claimIndex];
      const claimPath = `${path}/claims/${claimIndex}`;
      if (globallySeenClaims.has(claim.claim_id)) {
        errors.push(diagnostic("claim-id-duplicate", `Claim ID ${claim.claim_id} is not unique.`, `${claimPath}/claim_id`));
      }
      globallySeenClaims.add(claim.claim_id);
      const referenced = claim.evidence_ids.map((id) => evidenceById.get(id));
      for (const evidenceId of claim.evidence_ids) referencedEvidenceIds.add(evidenceId);
      for (let evidenceIndex = 0; evidenceIndex < claim.evidence_ids.length; evidenceIndex += 1) {
        if (!referenced[evidenceIndex]) {
          errors.push(diagnostic("claim-evidence-missing", `Evidence ${claim.evidence_ids[evidenceIndex]} does not exist.`, `${claimPath}/evidence_ids`));
        }
      }
      if (claim.assertion_state === "verified" && !referenced.some((evidence) => evidence?.independence === "independent" && evidence.produced_by !== changeSet.generated.by)) {
        errors.push(diagnostic("verified-claim-independent-evidence-missing", "Verified claims require an independent receipt whose producer differs from the change-set author.", `${claimPath}/evidence_ids`));
      }
    }
    if (operation.kind === "supersede") {
      if (operation.deprecation.replacement_concept_id !== operation.target.concept_id) {
        errors.push(diagnostic("supersede-replacement-target-mismatch", "Deprecation replacement must be the operation target concept.", `${path}/deprecation/replacement_concept_id`));
      }
      if (operation.deprecation.superseded_concept_ids.includes(operation.target.concept_id)) {
        errors.push(diagnostic("supersede-self-reference", "A replacement cannot supersede itself.", `${path}/deprecation/superseded_concept_ids`));
      }
    }
  }

  for (const evidence of changeSet.evidence) {
    if (evidence.independence === "independent" && evidence.produced_by === changeSet.generated.by) {
      errors.push(diagnostic("evidence-independence-self-asserted", `Evidence ${evidence.evidence_id} cannot be independent of the same named producer.`, "/evidence"));
    }
    if (!referencedEvidenceIds.has(evidence.evidence_id)) {
      errors.push(diagnostic("evidence-unassociated", `Evidence ${evidence.evidence_id} is not associated with any claim.`, "/evidence"));
    }
  }

  const referencedOperations = new Set();
  for (let index = 0; index < changeSet.captures.length; index += 1) {
    const capture = changeSet.captures[index];
    const path = `/captures/${index}/disposition`;
    for (const operationId of capture.disposition.operation_ids) {
      referencedOperations.add(operationId);
      const operation = operationById.get(operationId);
      if (!operation) {
        errors.push(diagnostic("coverage-operation-missing", `Operation ${operationId} does not exist.`, `${path}/operation_ids`));
      } else if (!operation.capture_ids.includes(capture.capture_id)) {
        errors.push(diagnostic("coverage-capture-not-reciprocal", `Operation ${operationId} does not link back to ${capture.capture_id}.`, `${path}/operation_ids`));
      }
    }
    if (["create", "update", "merge", "supersede"].includes(capture.disposition.type)) {
      const matching = capture.disposition.operation_ids.some((operationId) => operationById.get(operationId)?.kind === capture.disposition.type);
      if (!matching) {
        errors.push(diagnostic("coverage-disposition-kind-unrepresented", `Disposition ${capture.disposition.type} must reference at least one matching operation.`, path));
      }
    }
    if (capture.disposition.type === "duplicate") {
      const visited = new Set([capture.capture_id]);
      let covering = capture.disposition.covered_by;
      while (covering.kind === "capture") {
        if (visited.has(covering.ref)) {
          errors.push(diagnostic("duplicate-cover-cycle", "Duplicate capture coverage must not contain a self-reference or cycle.", `${path}/covered_by/ref`));
          break;
        }
        visited.add(covering.ref);
        const coveringCapture = captureById.get(covering.ref);
        if (!coveringCapture) {
          errors.push(diagnostic("duplicate-cover-missing", `Covering capture ${covering.ref} does not exist.`, `${path}/covered_by/ref`));
          break;
        }
        if (coveringCapture.disposition.type === "review-required") {
          errors.push(diagnostic("duplicate-cover-nonterminal", `Covering capture ${covering.ref} is still review-required.`, `${path}/covered_by/ref`));
          break;
        }
        if (coveringCapture.disposition.type !== "duplicate") break;
        covering = coveringCapture.disposition.covered_by;
      }
      if (covering.kind === "operation" && !operationById.has(covering.ref)) {
        errors.push(diagnostic("duplicate-cover-missing", `Covering operation ${covering.ref} does not exist.`, `${path}/covered_by/ref`));
      }
    }
  }
  for (const operation of changeSet.operations) {
    if (!referencedOperations.has(operation.operation_id)) {
      errors.push(diagnostic("operation-uncovered", `Operation ${operation.operation_id} is not referenced by any capture.`, "/operations"));
    }
  }
  return errors.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

export function validateKnowledgeChangeSet(value) {
  let schemaOk = false;
  try {
    schemaOk = validateSchema(value);
  } catch {
    return Object.freeze({ ok: false, complete: false, pending_capture_ids: Object.freeze([]), diagnostics: Object.freeze([diagnostic("schema-validator-failure", "The dependency-free schema validator failed closed.")]) });
  }
  const diagnostics = schemaOk ? semanticDiagnostics(value) : diagnosticsFromSchema(validateSchema.errors);
  const pending = schemaOk
    ? value.captures.filter((capture) => capture.disposition.type === "review-required").map((capture) => capture.capture_id).sort()
    : [];
  return Object.freeze({
    ok: diagnostics.length === 0,
    complete: diagnostics.length === 0 && pending.length === 0,
    pending_capture_ids: Object.freeze(pending),
    diagnostics: Object.freeze(diagnostics),
  });
}

function parseFailure(status, identity, diagnostics) {
  return Object.freeze({ ok: false, complete: false, status, source_identity: identity, value: null, pending_capture_ids: Object.freeze([]), diagnostics: Object.freeze(diagnostics) });
}

/**
 * Inspect and parse one caller-supplied input without reading any path. All
 * unsupported inputs retain a bounded identity and become review-required.
 */
export function parseKnowledgeChangeSet(input, { sourcePath = "input.change.json", maxBytes = DEFAULT_MAX_CHANGE_SET_BYTES } = {}) {
  let normalized;
  try {
    normalized = inputDescriptor(input);
  } catch {
    const fallback = inputDescriptor("uninspectable-input");
    return parseFailure("review-required", sourceIdentity(sourcePath, fallback, "unknown"), [diagnostic("input-description-failure", "Input type could not be inspected; a bounded fallback identity was retained.")]);
  }

  try {
    if (!validSourcePath(sourcePath)) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("source-path-invalid", "Source path must be a bounded repository-relative path without traversal, control, drive, URL, or backslash forms.")]);
    }
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("input-limit-invalid", "maxBytes must be a positive safe integer.")]);
    }
    const effectiveMaxBytes = Math.min(maxBytes, DEFAULT_MAX_CHANGE_SET_BYTES);
    if (!normalized.supported) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("input-type-unsupported", "Input must be a string, Buffer, or Uint8Array.")]);
    }
    if (normalized.size > effectiveMaxBytes) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "oversized"), [diagnostic("input-oversized", "Input exceeds the explicit byte ceiling.")]);
    }
    const bytes = normalized.bytes();
    if (bytes.includes(0)) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "binary"), [diagnostic("input-binary", "Binary input is retained by identity only.")]);
    }
    const decoded = decodeUtf8(bytes);
    if (!decoded.ok) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "binary"), [diagnostic("input-encoding-invalid", "Input is not valid UTF-8 and is retained by identity only.")]);
    }
    if (SECRET_PATTERN.test(decoded.text)) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "secret-bearing"), [diagnostic("input-secret-bearing", "Credential-shaped input is retained by identity only.")]);
    }
    let value;
    try {
      value = JSON.parse(decoded.text);
    } catch {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "malformed"), [diagnostic("input-json-malformed", "Input is not valid JSON.")]);
    }
    const duplicateCheck = parseDocument(decoded.text, { maxAliasCount: 0, schema: "json", strict: true, uniqueKeys: true });
    if (duplicateCheck.errors.some((error) => error.code === "DUPLICATE_KEY")) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "malformed"), [diagnostic("input-json-duplicate-key", "Input contains a duplicate JSON object key.")]);
    }
    if (containsCredentialShape(value)) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "secret-bearing"), [diagnostic("input-secret-bearing", "Credential-shaped input is retained by identity only.")]);
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("input-shape-unsupported", "Input must contain one JSON object.")]);
    }
    if (!Object.prototype.hasOwnProperty.call(value, "schema_version")) {
      const legacy = value.capture_tier === "session" || Object.prototype.hasOwnProperty.call(value, "session_id");
      return parseFailure(legacy ? "legacy" : "review-required", sourceIdentity(sourcePath, normalized, legacy ? "text" : "unknown"), [diagnostic(legacy ? "schema-legacy" : "schema-version-missing", legacy ? "Legacy closeout input is retained for explicit migration review." : "Schema version is missing.")]);
    }
    if (value.schema_version !== KNOWLEDGE_CHANGE_SCHEMA_VERSION) {
      return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("schema-version-unsupported", "Schema version is not supported by this parser.", "/schema_version")]);
    }
    const validated = validateKnowledgeChangeSet(value);
    const identity = sourceIdentity(sourcePath, normalized, validated.ok ? "text" : "malformed", validated.ok ? "reviewed" : "identity-only");
    return Object.freeze({ ok: validated.ok, complete: validated.complete, status: validated.ok ? (validated.complete ? "valid-complete" : "valid-review-required") : "review-required", source_identity: identity, value: validated.ok ? value : null, pending_capture_ids: validated.pending_capture_ids, diagnostics: validated.diagnostics });
  } catch {
    return parseFailure("review-required", sourceIdentity(sourcePath, normalized, "unknown"), [diagnostic("input-inspection-failure", "Input inspection failed closed while retaining the original bounded identity.")]);
  }
}

export function projectCaptureCoverage(changeSet) {
  const result = validateKnowledgeChangeSet(changeSet);
  if (!result.ok) return Object.freeze({ ok: false, diagnostics: result.diagnostics, captures: Object.freeze([]) });
  return Object.freeze({
    ok: true,
    complete: result.complete,
    diagnostics: Object.freeze([]),
    captures: Object.freeze(changeSet.captures.map((capture) => Object.freeze({
      capture_id: capture.capture_id,
      path: capture.source.path,
      sha256: capture.source.sha256,
      size_bytes: capture.source.size_bytes,
      disposition: capture.disposition.type,
      operation_ids: Object.freeze([...capture.disposition.operation_ids]),
      pending: capture.disposition.type === "review-required",
    }))),
  });
}

/** Render the canonical Tier 2 prose projection: exactly the four allowed sections. */
export function renderSessionSynthesis(changeSet) {
  const result = validateKnowledgeChangeSet(changeSet);
  if (!result.ok) throw new Error("Cannot render an invalid knowledge change set.");
  const sections = [
    ["Decisions Made", changeSet.summary.decisions_made],
    ["What Was Deprecated", changeSet.summary.what_was_deprecated],
    ["Lessons Learned", changeSet.summary.lessons_learned],
    ["Current State", changeSet.summary.current_state],
  ];
  return `${sections.map(([title, entries]) => `# ${title}\n\n${entries.length > 0 ? entries.map((entry) => `- ${entry}`).join("\n") : "- None."}`).join("\n\n")}\n`;
}

/** Render the complete Tier 2 Inbox record from the same validated source. */
export function renderTier2InboxMarkdown(changeSet) {
  const result = validateKnowledgeChangeSet(changeSet);
  if (!result.ok) throw new Error("Cannot render an invalid knowledge change set.");
  const quote = (value) => JSON.stringify(value);
  const frontmatter = [
    "---",
    "type: Inbox",
    `title: ${quote(changeSet.inbox.title)}`,
    `description: ${quote(changeSet.inbox.description)}`,
    `tags: ${quote(changeSet.inbox.tags)}`,
    `timestamp: ${changeSet.generated.at}`,
    `session_id: ${changeSet.session.session_id}`,
    `commit_sha: ${quote(changeSet.inbox.commit_shas)}`,
    `branch: ${quote(changeSet.session.branch)}`,
    `issue_refs: ${quote(changeSet.inbox.issue_refs)}`,
    `epic_refs: ${quote(changeSet.inbox.epic_refs)}`,
    "capture_tier: session",
    `generated_at: ${changeSet.generated.at}`,
    `generated_by: ${quote(changeSet.generated.by)}`,
    "---",
  ].join("\n");
  return `${frontmatter}\n${renderSessionSynthesis(changeSet)}`;
}
