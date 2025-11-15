---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Integration JSON Schemas

These schemas anchor the Integration Hub (n8n) contracts so inbound ERP feeds, outbound status events, and API responses stay versioned and testable.

## Files
- `order-ingest.schema.json` — Batch payload for ERP → n8n ingestion. Defines `batch_id`, an `orders[]` array with planning metadata, pickup/drop-off blocks, per-line constraints, and canonical fingerprint fields. Required properties enforce data sufficiency before routing or firming.
- `order-ingest-response.schema.json` — Structured 200 OK response containing aggregate totals plus per-item status (`accepted`, `duplicate`, `failed`) with optional `order_id` echo and machine-readable error codes.
- `outbound-event.schema.json` — Envelope for domain events (`order.*`, `task.*`, `exception.*`, `pod.received`, planning events). Standardizes `id`, `tenant_id`, `occurred_at`, `mode`, and opaque `payload` so receivers can treat delivery as idempotent by `id`.

## Usage Notes
- The schemas are Draft 2020-12 compliant and align with the HMAC-signed webhook contracts defined in `integration-hub.md`.
- Server-managed idempotency relies on the field sets declared here, so any change must be coordinated with Convex storage and dedupe logic.
- Test harnesses and DLQ replay scripts validate payloads against these schemas before re-delivery, preventing malformed data from entering Convex or partner ERPs.

