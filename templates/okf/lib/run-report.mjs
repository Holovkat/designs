const OUTCOMES = new Set(["completed", "cancelled", "quota-exceeded", "blocked", "failed"]);
const REQUIRED = [
  "run_id", "operator_request", "root", "revision", "allowlist", "item_ids", "limits", "lock_state",
  "phase", "elapsed_seconds", "input_bytes", "generated_bytes", "sessions_active", "sessions_max",
  "last_checkpoint", "outcome", "reason", "recovery_instruction",
];

function hasRawContent(value) {
  if (Array.isArray(value)) return value.some(hasRawContent);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => key === "content" || key === "body" || hasRawContent(nested));
}

export function buildReport(input) {
  if (hasRawContent(input)) throw new Error("report-contains-source");
  for (const key of REQUIRED) if (!(key in input)) throw new Error(`report-missing-${key}`);
  if (!OUTCOMES.has(input.outcome)) throw new Error("report-invalid-outcome");
  const report = {
    ...input,
    item_count: input.item_ids.length,
    mutated: { source: false, knowledge: false, archive: false, instructions: false },
  };
  return Object.freeze({ report: Object.freeze(report), bytes: Buffer.byteLength(`${JSON.stringify(report)}\n`, "utf8") });
}

export function formatReport(report, format = "text") {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format !== "text") throw new Error("report-invalid-format");
  return [
    `OKF run ${report.run_id}: ${report.outcome}`,
    `root: ${report.root}`,
    `revision: ${report.revision}`,
    `items: ${report.item_count}`,
    `reason: ${report.reason}`,
  ].join("\n");
}
