# Requirements Matrix by Phase (with Implementation Links)

Purpose
- Map each requirement from warehouse-delivery.md to concrete implementation artifacts across the stack.
- Columns indicate where the requirement is realized: Databases, Integration, APIs, UI, Workflows, Configuration, Administration, Reports.
- Use alongside docs/plan/roadmap.md and docs/traceability/rtm.md.

Legend
- Req ID = section.anchor (e.g., 2.1.1.AC1).
- Multiple links in a cell separated by line breaks.

Columns
- Convex DB = docs/data/schemas/convex-collections.yaml
- Postgres DB = db/*.sql
- Integration = docs/integrations/*
- App/API = docs/api/* (OpenAPI + stubs)
- UI/UX = docs/ui/* (web and driver)
- Workflows = docs/domain/* and docs/technical/* (state machines, ETA/nav)
- Config = docs/settings/schemas/*
- Admin = docs/ui/admin-settings-spec.md
- Reports = docs/ui/reports-spec.md, docs/api/reports.md

---

## Phase 0 — Foundations

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| 2.1.1 | ERP ingestion (webhook) | – | – | integrations/integration-hub.md#inbound-erp-webhook<br>integrations/schemas/order-ingest.schema.json | api/openapi.yaml#/paths/~1webhook~1erp~1{tenant_id}~1orders | – | – | settings/ingestion-settings.schema.json | – | – |
| 2.1.2 | Manual/CSV ingestion | – | – | – | – | ui/front-end-spec.md#order-upload-wizard | – | – | – | – |
| 2.6.1 | Minimal dashboard list | – | – | – | – | ui/front-end-spec.md (Dashboard skeleton) | domain/orders-lifecycle.md | – | – | – |
| New | Auth & Tenancy (Clerk) | convex-collections (tenants, memberships) | – | – | domain/auth-billing.md | ui/admin-settings-spec.md (Users TBD) | orders-lifecycle.md (RBAC mention) | – | ui/admin-settings-spec.md | – |
| New | Billing & Subscriptions (Stripe) | – | – | – | domain/auth-billing.md; api (Stripe) | Admin ▸ Billing (TBD in UI spec) | – | settings (future billing schema) | ui/admin-settings-spec.md | reports (invoices later) |

## Phase 1 — MVP Operations

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| 2.2.1 | Auto scheduling ≤5m; conflicts | data/schemas/convex-collections.yaml (delivery_tasks, route_plans) | – | – | – | ui/front-end-spec.md (Gantt) | domain/orders-lifecycle.md | – | – | – |
| 2.2.2 | Utilization, sim (baseline) | – | – | – | – | ui/front-end-spec.md (widgets baseline) | – | – | – | – |
| 2.3.2 | Driver app navigation & status | – | – | – | – | ui/driver-app-spec.md | domain/orders-lifecycle.md | – | – | – |
| 2.5.1 | Status + POD + scans | convex-collections (pod_artifacts_meta) | db/003_reporting_domain.sql (pod_artifacts_meta) | – | – | ui/driver-app-spec.md | domain/orders-lifecycle.md | settings/features-settings.schema.json | – | – |
| 2.1.1.AC5 | Outbound status to ERP | – | – | integrations/integration-hub.md (outbound events) | api/openapi.yaml (schemas/OutboundEvent) | – | domain/orders-lifecycle.md (events) | – | – | – |
| 2.6.3 | Alerts & notifications | convex-collections (alerts) | – | – | – | ui/front-end-spec.md#alerts-inbox | – | settings/alerts-settings.schema.json | ui/admin-settings-spec.md#admin-alerts | – |
| 2.6.2 | Exports (schedules, KPIs, alerts) | – | db MVs (planned) | – | api/reports.md | ui/reports-spec.md#reports | – | settings/reports-settings.schema.json | ui/admin-settings-spec.md#admin-reports | ui/reports-spec.md#reports |

## Phase 2 — Routing & Realtime

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| 2.4.1 | GPS tracking, geofences | – | db/002_reporting.sql (positions, geofence_events) | device→ingest (future) | – | ui/front-end-spec.md (Map) | – | – | – | – |
| 2.4.2 | Traffic-aware re‑opt ≤30s | – | – | – | – | ui/front-end-spec.md#route-optimization | technical/traffic-and-navigation.md#reopt-flow | – | – | – |
| 2.3.1 | Optimize routes ≤10s; alternatives | – | – | – | – | ui/front-end-spec.md#route-optimization | technical/traffic-and-navigation.md#traffic-apis | – | – | – |
| 2.6.1/2 | Map widgets & KPIs | – | MVs (planned) | – | – | ui/front-end-spec.md#dashboard-map<br>ui/front-end-spec.md#kpi-export | – | settings/theme-settings.schema.json | – | ui/reports-spec.md |

## Phase 3 — Advanced Ops & Admin

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| Planning | Planning board & firming | convex-collections (planning fields) | – | – | – | ui/front-end-spec.md (planning board TBD) | domain/orders-lifecycle.md | settings/planning-settings.schema.json | ui/admin-settings-spec.md | – |
| 2.6.4 | Role-based views; accessibility | – | – | – | – | ui/front-end-spec.md | – | – | ui/admin-settings-spec.md | – |

## Phase 4 — Industry Scenarios

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| Dairy | Tankers, compartments, sanitation | convex-collections (vehicles tanker fields) | – | – | – | – | domain/carrier-and-dairy-addendum.md | – | – | – |
| HazChem | Sea legs, DG, containers, handoff | convex-collections (itinerary_legs, containers) | – | – | – | – | domain/hazchem-addendum.md | planning-settings.schema.json (sea_handoff) | – | – |

## Phase 5 — Hardening & NFRs

| Req ID | Title | Convex DB | Postgres DB | Integration | App/API | UI/UX | Workflows | Config | Admin | Reports |
|---|---|---|---|---|---|---|---|---|---|---|
| N3.1 | Performance SLOs | – | – | – | api/openapi.yaml | ui/front-end-spec.md (perf targets) | technical/traffic-and-navigation.md | – | – | – |
| N3.2 | Availability & DR | – | – | – | – | – | plan/roadmap.md Phase 5 | – | – | – |
| N3.3 | Accessibility | – | – | – | – | ui/front-end-spec.md | – | – | – | – |
| N3.4 | Privacy/Retention | – | – | – | – | – | settings/README.md | – | – | – |
| N3.5 | Dashboard scalability | – | – | – | – | ui/front-end-spec.md | technical/traffic-and-navigation.md | – | – | – |

---

## Backlog / Priority Queue (post‑launch)
- Predictive maintenance provider integrations (2.4.3 specifics)
- What‑if simulation UI and methodology (2.2.2)
- Carrier portal (read/manage assigned work)
- Hazmat routing provider data & compliance constraints
- Tiered telemetry retention (hot/cold/archive)
- Full DMS for document validation (BL/DG/MSDS)
- Air mode flows (intermodal)
- Contributor guide & docs site generation

---

## AC‑Level Detail (by requirement)

Note: This section expands key requirements to Acceptance Criteria (AC) rows. Use it with the Phase tables above and docs/traceability/rtm.md.

### 2.1.1 ERP Ingestion — ACs
| AC ID | Description | Integration | App/API | UI/UX | Config |
|---|---|---|---|---|---|
| 2.1.1.AC1 | Poll or receive webhooks every 5m or realtime | integrations/integration-hub.md (webhook); n8n queue mode | api/openapi.yaml#/paths/~1webhook~1erp~1{tenant_id}~1orders | – | settings/ingestion-settings.schema.json (dedupe TTL) |
| 2.1.1.AC2 | Payload includes order/customer/items/priority/window | schemas/order-ingest.schema.json | – | Order Upload mapping (ui/front-end-spec.md) | – |
| 2.1.1.AC3 | Validate completeness; notify dispatcher | Partial acceptance + per‑item errors (integration-hub.md) | – | Alerts Toast + Inbox (ui/front-end-spec.md#5) | alerts-settings.schema.json |
| 2.1.1.AC4 | Store historical order data (7y default) | – | – | – | settings/README.md (retention policy) |
| 2.1.1.AC5 | Bidirectional sync (status updates) | Outbound events (integration-hub.md) | schemas/outbound-event.schema.json | – | – |

### 2.1.2 Manual / Ad‑Hoc Ingestion — ACs
| AC ID | Description | UI/UX | Integration |
|---|---|---|---|
| 2.1.2.AC1 | Web UI to upload CSV/JSON or enter manually | Order Upload wizard (ui/front-end-spec.md) | – |
| 2.1.2.AC2 | Auto‑map fields; allow overrides | Upload mapping step (ui/front-end-spec.md) | – |
| 2.1.2.AC3 | Confirm ingestion ≤ 30s; task ID | Upload preview/result (ui/front-end-spec.md) | – |
| 2.1.2.AC4 | Log manual entries with operator ID | – | – |

### 2.2.1 Delivery Scheduling — ACs
| AC ID | Description | Convex DB | UI/UX | Workflows |
|---|---|---|---|---|
| 2.2.1.AC1 | Consider priority, capacity, shifts, pickup times | convex-collections (orders, tasks, vehicles) | Gantt conflict badges (ui/front-end-spec.md) | orders-lifecycle.md |
| 2.2.1.AC2 | Gantt; manual adjustments; conflict detection | – | Gantt drag/drop + reasons (ui/front-end-spec.md) | – |
| 2.2.1.AC3 | Schedule ≤ 5m; idle <10% target | – | – | orders-lifecycle.md (SLA) |
| 2.2.1.AC4 | Notify driver with task details | – | Driver app spec (ui/driver-app-spec.md) | orders-lifecycle.md |
| 2.2.1.AC5 | Reschedule triggers re‑opt ≤ 2m (UI target) | – | Re‑opt controls (ui/front-end-spec.md) | traffic-and-navigation.md |

### 2.3.1 Routing — ACs
| AC ID | Description | UI/UX | Technical |
|---|---|---|---|
| 2.3.1.AC1 | Multi‑stop routes w/ constraints | Route panel (ui/front-end-spec.md) | traffic-and-navigation.md |
| 2.3.1.AC2 | ≤ 50 stops | – | traffic-and-navigation.md |
| 2.3.1.AC3 | Compute <10s; alternatives | Proposal diff (ui/front-end-spec.md) | traffic-and-navigation.md |
| 2.3.1.AC4 | External APIs (Google) | – | traffic-and-navigation.md |
| 2.3.1.AC5 | 15% reduction vs manual (UAT) | – | roadmap (UAT methodology TBD) |

### 2.4.1 Real‑time Tracking — ACs
| AC ID | Description | Postgres DB | UI/UX |
|---|---|---|---|
| 2.4.1.AC1 | Track every 15s; map dashboard | db/002_reporting.sql (positions) | Map (ui/front-end-spec.md) |
| 2.4.1.AC2 | Speed, distance, fuel | positions attributes | KPI/widgets (ui/front-end-spec.md) |
| 2.4.1.AC3 | Geofence alerts; route deviation | db/002_reporting.sql (geofence_events) | Alerts & deviations (ui/front-end-spec.md) |
| 2.4.1.AC4 | Battery/connectivity alerts | – | Alerts (ui-front-end-spec.md) |
| 2.4.1.AC5 | 30‑day history (policy) | – | – |

### 2.4.2 Traffic‑aware Updates — ACs
| AC ID | Description | Technical | UI/UX |
|---|---|---|---|
| 2.4.2.AC1 | Pull traffic every 5m; predict delays | traffic-and-navigation.md (Distance Matrix loop) | – |
| 2.4.2.AC2 | Trigger re‑opt if delay >10m | traffic-and-navigation.md | Re‑opt prompt (ui/front-end-spec.md) |
| 2.4.2.AC3 | Ripple updates & notify | – | Alerts + KPI deltas |
| 2.4.2.AC4 | Log rationale for auditing | – | Proposal diff reasons |
| 2.4.2.AC5 | Re‑opt completes <30s | traffic-and-navigation.md; orders-lifecycle.md (SLA) | – |

### 2.5.1 Live Status — ACs
| AC ID | Description | UI/UX | Driver |
|---|---|---|---|
| 2.5.1.AC1 | Status enumerators | Timeline (ui/front-end-spec.md) | – |
| 2.5.1.AC2 | Driver buttons; geofence auto | – | ui/driver-app-spec.md |
| 2.5.1.AC3 | Real‑time dashboards | – | – |
| 2.5.1.AC4 | Escalation rules | Alerts settings (admin) | – |
| 2.5.1.AC5 | Customer confirmation portal | Minimal tracking link | – |

### 2.6.1 Dashboard Map — ACs
| AC ID | Description | UI/UX |
|---|---|---|
| 2.6.1.AC1 | Map with live GPS; status colors | ui/front-end-spec.md#dashboard-map |
| 2.6.1.AC2 | Zoom/filter controls; clusters | ui-front-end-spec.md#dashboard-map |
| 2.6.1.AC3 | Auto-refresh 15s; full-screen | ui-front-end-spec.md#dashboard-map |
| 2.6.1.AC4 | Route polylines; deviations | ui-front-end-spec.md#dashboard-map |
| 2.6.1.AC5 | Responsive design | ui-front-end-spec.md#dashboard-map |

### 2.6.2 KPI Widgets — ACs
| AC ID | Description | UI/UX | Reports |
|---|---|---|---|
| 2.6.2.AC1 | Pre-built widgets (active, OTD, ETA variance, pending) | ui-front-end-spec.md#dashboard-map | – |
| 2.6.2.AC2 | Real-time updates ≤10s | ui-front-end-spec.md#dashboard-map | – |
| 2.6.2.AC3 | Threshold alerts; drill-down | ui-front-end-spec.md#dashboard-map | – |
| 2.6.2.AC4 | Export PNG/CSV | ui-front-end-spec.md#kpi-export | ui/reports-spec.md#report-kpi |
| 2.6.2.AC5 | Drag/drop layouts; presets | ui-front-end-spec.md#dashboard-map | – |

### 2.6.3 Alerts Panel — ACs
| AC ID | Description | UI/UX | Config |
|---|---|---|---|
| 2.6.3.AC1 | Unified alerts list, severity | ui-front-end-spec.md#alerts-inbox | settings/alerts-settings.schema.json |
| 2.6.3.AC2 | Configurable rules | ui-front-end-spec.md#alerts-inbox | settings/alerts-settings.schema.json |
| 2.6.3.AC3 | One-click actions; log | ui-front-end-spec.md#alerts-inbox | – |
| 2.6.3.AC4 | Historical trends | ui-front-end-spec.md#alerts-inbox | – |
| 2.6.3.AC5 | Browser alerts; end-to-end test | ui-front-end-spec.md#alerts-inbox | – |

### 2.6.4 Role-Based Views — ACs

### 2.3.2 Driver App — ACs
| AC ID | Description | UI/UX | Technical / DB |
|---|---|---|---|
| 2.3.2.AC1 | Route map with ETA, 30s updates | ui/driver-app-spec.md#driver-core-flows | technical/traffic-and-navigation.md#voice-guidance |
| 2.3.2.AC2 | Offline mode; sync on reconnect | ui/driver-app-spec.md#driver-core-flows | – |
| 2.3.2.AC3 | Voice prompts, multi-language | technical/traffic-and-navigation.md#voice-guidance | – |
| 2.3.2.AC4 | Route adherence logging | – | db/002_reporting.sql (trip_segments) |

### 2.5.2 Inventory Reconciliation — ACs
| AC ID | Description | UI/UX | Integration | Reports |
|---|---|---|---|---|
| 2.5.2.AC1 | Driver scans items at delivery; sync POD | ui/driver-app-spec.md#driver-scanning | – | ui/reports-spec.md#report-pod |
| 2.5.2.AC2 | Auto-update production system; flag discrepancies | – | integrations/integration-hub.md#reconciliation | reports-spec.md (R6) |
| 2.5.2.AC3 | Generate POD reports (timestamps, signatures, photos) | ui/reports-spec.md#report-pod | – | ui/reports-spec.md#report-pod |
| AC ID | Description | UI/UX | Admin |
|---|---|---|---|
| 2.6.4.AC1 | Tailored views per role | ui-front-end-spec.md#dashboard-map | ui/admin-settings-spec.md#admin-features |
| 2.6.4.AC2 | Shared elements; enforce RBAC | ui-front-end-spec.md#dashboard-map | – |
| 2.6.4.AC3 | Search/filter tools | ui-front-end-spec.md#dashboard-map | – |
| 2.6.4.AC4 | Usage logging (analytics) | ui-front-end-spec.md#dashboard-map | – |
| 2.6.4.AC5 | Accessibility WCAG AA | ui-front-end-spec.md#dashboard-map | – |
