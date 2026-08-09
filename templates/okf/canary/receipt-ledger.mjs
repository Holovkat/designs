import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value) {
  return Buffer.from(JSON.stringify(value ?? null), "utf8");
}

export class ReceiptLedger {
  constructor({ runId, maxBytes }) {
    if (typeof runId !== "string" || !/^[a-z0-9][a-z0-9._-]{0,95}$/iu.test(runId)) throw new Error("invalid runId");
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("maxBytes must be positive");
    this.runId = runId;
    this.maxBytes = maxBytes;
    this.entries = [];
    this.totalBytes = 0;
  }

  append({ tool, input, output, status, startedAt, finishedAt, redaction = "hash-only", errorCode = null }) {
    const inputBytes = bytes(input);
    const outputBytes = bytes(output);
    const entry = Object.freeze({
      receipt_id: `receipt-${randomUUID()}`,
      run_id: this.runId,
      tool,
      status,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt)),
      input_bytes: inputBytes.length,
      input_sha256: sha256(inputBytes),
      output_bytes: outputBytes.length,
      output_sha256: sha256(outputBytes),
      redaction,
      ...(errorCode ? { error_code: errorCode } : {}),
    });
    const encoded = bytes(entry).length;
    if (this.totalBytes + encoded > this.maxBytes) {
      const error = new Error("receipt ledger byte ceiling exceeded");
      error.code = "receipt-byte-ceiling";
      throw error;
    }
    this.entries.push(entry);
    this.totalBytes += encoded;
    return entry;
  }

  document(summary = {}) {
    return Object.freeze({
      version: "okf-prime-receipt-ledger/1",
      run_id: this.runId,
      generated_at: new Date().toISOString(),
      receipt_count: this.entries.length,
      encoded_entry_bytes: this.totalBytes,
      entries: Object.freeze([...this.entries]),
      summary: Object.freeze({ ...summary }),
    });
  }

  writeOnce(path, summary = {}) {
    const content = `${JSON.stringify(this.document(summary), null, 2)}\n`;
    if (Buffer.byteLength(content) > this.maxBytes) {
      const error = new Error("receipt document byte ceiling exceeded");
      error.code = "receipt-byte-ceiling";
      throw error;
    }
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    writeFileSync(path, content, { flag: "wx", mode: 0o600 });
    return Object.freeze({ path, bytes: Buffer.byteLength(content), sha256: sha256(content) });
  }
}
