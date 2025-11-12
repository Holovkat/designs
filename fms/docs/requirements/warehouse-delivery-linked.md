# Warehouse Delivery — Linked Specification Index

Source document: /warehouse-delivery.md (original requirements)

This file links each section to the supporting design and implementation artifacts, and provides a checklist for delivery.

## 1. System Overview
- Linked specs: docs/domain/orders-lifecycle.md, docs/data/README.md
- Tenancy & zones: docs/data/README.md; db/001_zones.sql; settings/README.md

## 2. Functional Requirements

### 2.1 Integration with Order/Production Systems
- Inbound ERP → N8N: docs/integrations/integration-hub.md; schemas/order-ingest.schema.json
- Outbound events: schemas/outbound-event.schema.json; N8N flows
- Upload/manual ingestion: ui/front-end-spec.md (Order Upload wizard)
- OpenAPI paths: docs/api/openapi.yaml#/paths/~1webhook~1erp~1{tenant_id}~1orders
- Checklist
  - [ ] Webhook (HMAC) with partial acceptance
  - [ ] Upload UI & batch response handling
  - [ ] Reconciliation job & report

### 2.2 Delivery Scheduling
- Gantt & conflicts: ui/front-end-spec.md
- Auto schedule ≤ 5m: domain/orders-lifecycle.md (SLA)
- What‑if (backlog): plan/roadmap.md Phase 3
- Checklist
  - [ ] Auto schedule commit SLA
  - [ ] Drag/drop with audit
  - [ ] Conflict detection reasons

### 2.3 Route Optimization and Routing
- Optimizer & alternatives: ui/front-end-spec.md; technical/traffic-and-navigation.md
- Voice guidance & offline: technical/traffic-and-navigation.md; ui/driver-app-spec.md
- Checklist
  - [ ] Optimize ≤ 10s for ≤ 50 stops
  - [ ] Alternatives + KPIs
  - [ ] Voice nav deep links

### 2.4 Real-Time Tracking and Updates
- GPS 15s; geofences; metrics: db/002_reporting.sql; ui/front-end-spec.md
- Traffic-aware re‑opt (<30s): technical/traffic-and-navigation.md; orders-lifecycle.md
- Predictive maintenance: backlog (Phase 4)
- Checklist
  - [ ] Telemetry ingestion & map updates
  - [ ] Re‑opt trigger & apply in ≤ 30s

### 2.5 Live Feedback on Delivery Status
- Status flow & POD: domain/orders-lifecycle.md; ui/driver-app-spec.md; ui/driver-exceptions-spec.md
- Customer portal (tracking link): orders-lifecycle.md
- Checklist
  - [ ] Driver status transitions
  - [ ] Scans at pickup/drop enforced
  - [ ] Tracking link

### 2.6 Live Dashboard for Fleet Operations
- Map + Traffic + KPIs + Alerts: ui/front-end-spec.md; technical/traffic-and-navigation.md
- Exports: ui/reports-spec.md; api/reports.md
- Accessibility: ui/front-end-spec.md
- Checklist
  - [ ] Map layering + 15s refresh
  - [ ] KPI widgets & exports
  - [ ] Alerts toasts & Inbox
  - [ ] Role-based views; WCAG AA

## 3. Non-Functional Requirements
- Performance & availability: orders-lifecycle.md; plan/roadmap.md (Phase 5)
- Privacy & retention: settings/README.md
- Note: Original doc 2.1.1 AC4 mentions 2 years of historical order data; superseded by client decision to retain for 7 years by default (configurable).
 - Security & privacy: security/security-privacy.md (PII taxonomy, encryption, DSAR, retention jobs)
 - DR/HA & monitoring: technical/dr-ha-monitoring.md (RTO/RPO, failover, synthetics)
- Dashboard scalability: technical/traffic-and-navigation.md; ui/front-end-spec.md
- Checklist
  - [ ] API p95 < 2s; dashboard updates ≤ 1s
  - [ ] DR/backup plan
  - [ ] Accessibility checks

## Appendices
- Industry scenarios: domain/carrier-and-dairy-addendum.md; domain/hazchem-addendum.md
- OpenAPI: api/openapi.yaml
- RTM: traceability/rtm.md
