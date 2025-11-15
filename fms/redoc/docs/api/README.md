---
last-redoc-date: 2025-11-12T23:25:18Z
---
# API Surface

API documentation in this directory covers both the machine-readable OpenAPI spec and narrative stubs for admin/configuration and reporting endpoints.

## Files
- `openapi.yaml` — Source-of-truth OpenAPI document for core REST endpoints (ingestion webhooks, orders, routes, reports, etc.). Agents and SDKs should generate from this file.
- `config-admin.md` — Changeset-based Admin Config API stubs (`/api/v1/config/*`) describing registry discovery, scoped reads, draft/validate/approve/apply flow, and error semantics.
- `reports.md` — Export endpoints for schedules, KPIs, alerts, delivery performance, utilization, and POD artifacts, including supported formats (PDF, CSV, PNG) and auditing behavior.

These docs align with the UI specs and settings schemas, ensuring every UI surface has a matching API contract.

