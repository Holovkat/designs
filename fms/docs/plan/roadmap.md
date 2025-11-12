# Roadmap & Phases (Launch)

This roadmap aligns implementation to warehouse-delivery.md and links to the corresponding specs. Use the checkboxes to track progress.

## Milestones
- Spec Freeze v1.0: 2025-11-11 — see plan/spec-freeze-v1.0.md
- Dev Kickoff: 2025-11-13

## Phase 0 — Foundations (Sprint 1)
- [ ] Bring up local stack (Postgres, Redis, N8N) and Convex baseline
- [ ] Data model stubs (Convex collections, ERDs) — docs/data/schemas/convex-collections.yaml:1, data/erd.md:1
- [ ] Ingestion MVP (CSV/upload + webhook mock) — docs/integrations/integration-hub.md:1 (Ref 2.1.1, 2.1.2)
- [ ] Minimal dashboard (task list) — ui/front-end-spec.md:1 (Ref 2.6.1)
- [ ] Config registry + Admin changesets stubs — api/config-admin.md:1

## Phase 1 — MVP Operations (Sprints 2–3)
- [ ] Scheduling (auto within 5m; conflicts) — ui/front-end-spec.md:1; domain/orders-lifecycle.md:1 (Ref 2.2.1, 2.2.2)
- [ ] Driver app essentials (status, POD, scans) — ui/driver-app-spec.md:1 (Ref 2.3.2, 2.5.1)
- [ ] ERP inbound/outbound (N8N flows; DLQ) — integrations/integration-hub.md:1 (Ref 2.1.1 AC5)
- [ ] Alerts toasts & Inbox — ui/front-end-spec.md#5-alerts--toasts-and-inbox-263; settings/alerts-settings.schema.json:1 (Ref 2.6.3)
- [ ] Reports: Schedules, KPI Snapshot, Alerts Log — ui/reports-spec.md:1; api/reports.md:1 (Ref 2.6.2)

## Phase 2 — Routing & Realtime (Sprints 4–5)
- [ ] Traffic overlay + live ETAs (Distance Matrix) — technical/traffic-and-navigation.md:1 (Ref 2.4.1, 2.4.2)
- [ ] Re-optimization flow (≤ 30s) — technical/traffic-and-navigation.md:1; ui/front-end-spec.md:1 (Ref 2.4.2 AC5)
- [ ] Map widgets and KPI dashboards — ui/front-end-spec.md:1 (Ref 2.6.1, 2.6.2)

## Phase 3 — Advanced Ops & Admin (Sprints 6–7)
- [ ] Planning board + firming queue — domain/orders-lifecycle.md:1; ui/front-end-spec.md:1 (Refs Planning addendum)
- [ ] Admin settings (Themes, Alerts, Planning, Ingestion, Features, Reports) — ui/admin-settings-spec.md:1; settings/schemas/* (Ref 2.6.4, N3.3)
- [ ] Delivery performance & utilization reports — ui/reports-spec.md:1 (Ref 2.6.2)

## Phase 4 — Industry Scenarios
- [ ] Dairy tanker addendum (compartments, sanitation) — domain/carrier-and-dairy-addendum.md:1
- [ ] HazChem addendum (sea leg, DG, containers, handoff) — domain/hazchem-addendum.md:1

## Phase 5 — Hardening
- [ ] OpenAPI verification & mock server — api/openapi.yaml:1 (Ref N3.1)
- [ ] Load tests (Matrix/Reports) & cost guardrails — technical/traffic-and-navigation.md:1; ui/reports-spec.md:1 (Ref N3.1, N3.5)
- [ ] Privacy & retention enforcement — settings/README.md:1 (Ref N3.4)

## Non‑functionals & SLOs
- [ ] API p95 < 2s; dashboard updates ≤ 1s; re‑opt ≤ 30s (Refs N3.1, 2.6.x, 2.4.2)
- [ ] Availability 99.9%; DR runbook (Ref N3.2)

## Notes
- Theme is tenant-configurable with 60:20:10 ratio — settings/theme-settings.schema.json:1
- All Admin changes via changesets — ui/admin-settings-spec.md:1
