# Spec Freeze v1.0 — FMS MVP

Date: 2025-11-11

Purpose
- Lock the MVP specifications to prevent scope drift and enable development kickoff. Only typo/anchor fixes are allowed after this freeze; new ideas go to backlog.

Freeze Rules
- No new features or scope changes. Backlog any new requests with references to requirements.
- Only documentation hygiene allowed (typos, broken anchors). All other changes require a change request post‑freeze.

Delivered Scope (frozen)
- Requirements linkage: docs/requirements/warehouse-delivery-linked.md; RTM and Matrix: docs/traceability/rtm.md, docs/traceability/requirements-matrix.md.
- UI (web): docs/ui/front-end-spec.md (Map/KPI/Gantt/Orders/Optimization/Alerts/Reports), Admin Settings: docs/ui/admin-settings-spec.md.
- Driver app: docs/ui/driver-app-spec.md; Exceptions: docs/ui/driver-exceptions-spec.md.
- Integrations (N8N): docs/integrations/integration-hub.md + JSON Schemas in docs/integrations/schemas/*.
- Orders lifecycle: docs/domain/orders-lifecycle.md (forecast→provisional→firm, freeze rules, POD, reason codes).
- Data models: docs/data/erd.md; Convex collections: docs/data/schemas/convex-collections.yaml; Postgres/PostGIS DDL: db/*.sql.
- Traffic/ETAs/Voice: docs/technical/traffic-and-navigation.md.
- Security & Privacy: docs/security/security-privacy.md; Privacy settings: docs/settings/schemas/privacy-settings.schema.json.
- DR/HA & Monitoring: docs/technical/dr-ha-monitoring.md.
- Performance test plan: docs/qa/performance-test-plan.md.
- Billing & Auth: docs/domain/auth-billing.md; Billing settings: docs/settings/schemas/billing-settings.schema.json; OpenAPI billing endpoints.
- Zones (AU/QLD starter): docs/zones/au-qld-zones.yaml.
- Industry addenda: docs/domain/carrier-and-dairy-addendum.md; docs/domain/hazchem-addendum.md.
- Telematics: docs/domain/maintenance-telematics.md; mapping and sample CSV.

Decisions (locked)
- Datastores: Convex (operational), Postgres/PostGIS (reporting/telemetry).
- Integration: N8N inbound (HMAC) + outbox; server‑managed idempotency by `(tenant_id, external_order_id)` + canonical fingerprint; TTL default 24h.
- Planning: Forecast→Provisional→Firm; road=14d, rail=21d; freeze=48h; defaults configurable per Tenant/Mode/Zone.
- Notifications: ClickSend SMS/Email.
- Retention: default 7 years (configurable).
- Billing: included loads=1,000/mo; top‑ups 1k@10%, 5k@15%; PAYG $1.00/load; inline prompts at 90%/100%.

Open Items (post‑freeze backlog, defaults applied)
- Telematics provider selection (CSV/SFTP at launch). 
- Monitoring stack pick (Datadog vs OSS) for implementation details; SLOs and synthetics already defined.
- Traffic ML prediction (defer; rely on provider heuristics at launch).
- EU shorter telemetry default (off by default; schema supports enabling later).

Milestones
- Dev Kickoff: 2025-11-13
  - Sprint 1 (ends 2025-11-26): ERP webhook + upload, dedupe, scheduling core, Alerts Inbox, Admin Settings registry (Themes/Alerts/Planning/Ingestion), billing scaffolding.
  - Sprint 2 (ends 2025-12-10): Routing + re‑opt with traffic overlay, Driver app core (status + GS1 scans), reports exports, ClickSend.
  - Hardening/UAT prep (2025-12-11 → 2025-12-19): DR/HA runbooks, performance targets, Stripe wiring, polish.

Change Control
- Any requested scope changes post‑freeze must be logged in docs/work/todo.md and justified with a change request, estimating impact to the above milestones.
