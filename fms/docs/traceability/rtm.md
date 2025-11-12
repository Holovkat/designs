# Requirements Traceability Matrix (RTM)

Maps warehouse-delivery.md requirements to specs/artifacts for implementation and verification.

Legend
- Req ID: section.anchor (e.g., 2.1.1.AC1)
- Spec: primary doc reference
- Impl: code/config/doc artifacts

## 2.1 Integration with Order/Production Systems
- 2.1.1.AC1 polling/webhooks → Spec: integrations/integration-hub.md:1; Impl: N8N flows, api/openapi.yaml#/paths/~1webhook~1erp~1{tenant_id}~1orders
- 2.1.1.AC2 payload schema → Spec: integrations/schemas/order-ingest.schema.json:1
- 2.1.1.AC3 validation/notify → Spec: integration-hub.md (partial accept); Impl: Alerts Inbox (ui/front-end-spec.md)
- 2.1.1.AC4 2y history (adjusted to 7y) → Spec: data/README.md; settings/README.md
- 2.1.1.AC5 bidirectional status → Spec: outbound-event.schema.json; Impl: N8N outbound flows

- 2.1.2 manual ingestion → Spec: ui/front-end-spec.md (upload wizard); Impl: upload endpoint

## 2.2 Delivery Scheduling
- 2.2.1 auto scheduling ≤5m → Spec: orders-lifecycle.md; ui/front-end-spec.md (Gantt)
- 2.2.1 conflicts & manual overrides → ui/front-end-spec.md (Gantt)
- 2.2.1 re‑opt triggers → technical/traffic-and-navigation.md
- 2.2.2 utilization/KPIs/export → ui/front-end-spec.md; ui/reports-spec.md

## 2.3 Route Optimization & Routing
- 2.3.1 up to 50 stops; <10s; alternatives → ui/front-end-spec.md; technical plan
- 2.3.2 turn‑by‑turn voice; offline → technical/traffic-and-navigation.md; driver-app-spec.md

## 2.4 Real‑Time Tracking & Updates
- 2.4.1 GPS 15s; geofences; metrics → db/002_reporting.sql; ui/front-end-spec.md
- 2.4.2 traffic-aware re‑opt; <30s → technical/traffic-and-navigation.md; orders-lifecycle.md (SLA)
- 2.4.3 predictive maintenance → backlog item; to be specified per provider

## 2.5 Live Feedback on Delivery Status
- 2.5.1 status enums; driver app; dashboards; escalation → orders-lifecycle.md; driver-app-spec.md; ui/front-end-spec.md
- 2.5.2 inventory reconciliation/POD → driver-app-spec.md; outbound events

## 2.6 Live Dashboard for Fleet Operations
- 2.6.1 map & status colors; 15s refresh → ui/front-end-spec.md; traffic plan
- 2.6.2 KPI widgets; exports; 10s refresh → ui/front-end-spec.md; ui/reports-spec.md
- 2.6.3 alerts & notifications → ui/front-end-spec.md (toasts & inbox); settings/alerts-settings.schema.json
- 2.6.4 role-based views; accessibility → ui/front-end-spec.md

## N3 Non‑Functionals
- N3.1 Performance p95 <2s → global SLO; orders-lifecycle.md; traffic plan
- N3.2 Availability 99.9%; failover → roadmap/hardening (Phase 5)
- N3.3 Accessibility WCAG 2.1 AA → ui/front-end-spec.md
- N3.4 Data Privacy; encryption; anonymise → privacy backlog; settings/README.md
- N3.5 Dashboard scalability → traffic plan; ui/front-end-spec.md (perf targets)

## Industry addenda & planning
- Dairy tanker → domain/carrier-and-dairy-addendum.md; data/schemas/convex-collections.yaml (tanker fields)
- HazChem intermodal → domain/hazchem-addendum.md; data/schemas/convex-collections.yaml (sea leg & DG)
- Planning pipeline → domain/orders-lifecycle.md; settings/planning-settings.schema.json
