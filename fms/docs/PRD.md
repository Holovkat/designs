# fms - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-13
**Version:** 1.0

---

## Executive Summary
FMS turns fragmented warehouse delivery operations into a single pane of glass for Australian fleet managers, dispatchers, drivers, and warehouse operators. Orders flow in automatically from ERPs or urgent manual uploads, are committed within five minutes, and stay in sync through a reliable outbox and N8N integration layer. Convex keeps operational data live for the UI, Postgres/PostGIS safeguards geospatial history and analytics, and Google Maps plus ClickSend provide traffic-aware routing and proactive communications. Drivers execute with a lightweight React Native app that enforces GS1 scanning, captures POD artifacts, and deep-links into native navigation so every stakeholder can trust status, capacity, and compliance at any moment.

### What Makes This Special
Dispatchers, drivers, and warehouse operators share one live “control hub” where ERPs, schedulers, and on-road execution stay reconciled within minutes, GS1-compliant POD and alerts keep mining loads auditable, and re-optimisation plus telemetry overlays let remote ops rooms steer every truck with confidence.

---

## Project Classification

**Technical Type:** Multi-surface SaaS platform (web control hub workspace + React Native driver app + integration hub)
**Domain:** Road transport & mining logistics (Australia)
**Complexity:** High (NHVR fatigue, ADG/GHS compliance, 7-year retention)

- Multi-tenant orchestration platform spanning dispatch UI, driver execution, schema-driven admin settings, and automation workers, as outlined in `docs/README.md` and Spec Freeze v1.0 artifacts.
- Convex live data layer keeps scheduling, routing, alerts, and admin settings responsive while Postgres/PostGIS stores long-lived telemetry, POD artifacts, and analytics snapshots.
- Integration hub (N8N flows, webhooks, SFTP ingestion) plus ClickSend communications, Clerk identity, and Stripe billing implement the enterprise edges and governance described across requirements, integrations, and settings specs.

### Domain Context
Australian road transport serving mining operations must enforce NHVR Standard Hours fatigue profiles, capture Australian Dangerous Goods (ADG) metadata before domestic legs, reflect GHS labelling, surface load-restraint warnings, and require GS1 scanning at pickup/drop—launch scope focuses on these in-app guardrails with deeper automation on the roadmap.

---

## Success Criteria
Success for FMS means every Queensland mining fleet can see, steer, and certify their road operations from one control hub:

- **Ingestion & Planning Parity**: ERP webhooks (HMAC-signed) and urgent CSV/JSON uploads both land in Convex within five minutes, with nightly reconciliation proving line-by-line agreement between ERP, Convex, and Postgres history.
- **Live Operational Awareness**: Dispatch UI maintains 99.9% uptime, API p95 stays <2s, and WebSocket pushes refresh KPIs, alerts, and traffic overlays for at least 100 concurrent operators in <1s, enabling remote ops rooms to trust the board view.
- **Driver Compliance & POD Fidelity**: React Native driver app enforces NHVR Standard Hours assignments, GS1 scans at pickup/drop, POD signature/photo for loads ≥AUD 10k, and exception workflows so auditors can trace every mining delivery.
- **Adaptive Routing & Recovery**: Google Maps-powered optimisation returns ≤10s for ≤50 stops, offers at least one alternative path, and re-optimises within 30s when telemetry or traffic delays breach the 10-minute threshold, keeping site SLAs intact.
- **Telemetry & Reporting Integrity**: Postgres/PostGIS stores seven years of positions, geofence hits, POD metadata, and maintenance cues; report exports finish <15s for the frozen MVP volumes and feed compliance packs without manual stitching.
- **Resilience & Data Guardianship**: Active-active HA keeps user impact below five minutes (RTO) with a one-minute RPO; failover and synthetic monitors in `docs/technical/dr-ha-monitoring.md` continuously validate this posture.

### Business Metrics
- Onboard three mining-aligned transport operators (≥150 daily loads each) through the ERP webhook + settings changeset flow without engineering intervention.
- Achieve ≥95% successful GS1 scan capture rate and ≥98% POD artifact completeness across all audited deliveries in Spec Freeze scope.
- Reduce dispatcher intervention time by 30% versus baseline (tracked through Alerts Inbox acknowledgments) by Sprint 2 completion.
- Maintain <0.5% reconciliation discrepancies between ERP, Convex operational data, and Postgres ledger during the first two sprints.
- Deliver at least five real-time KPI widgets (Loads on time, Vehicles active, Alerts unresolved, Zones breached, Driver fatigue warnings) with export parity (PNG + CSV).

---

## Product Scope

### MVP - Minimum Viable Product
<!-- mvp_scope -->

### Growth Features (Post-MVP)
<!-- growth_features -->

### Vision (Future)
<!-- vision_features -->

---

## Domain-Specific Requirements
<!-- domain_considerations -->

---

## Innovation & Novel Patterns
<!-- innovation_patterns -->

### Validation Approach
<!-- validation_approach -->

---

## Project Type Specific Requirements
<!-- project_type_requirements -->

### API Specification
<!-- endpoint_specification -->

### Authentication & Authorization
<!-- authentication_model -->

### Platform Support
<!-- platform_requirements -->

### Device Capabilities
<!-- device_features -->

### Multi-Tenancy Architecture
<!-- tenant_model -->

### Permissions & Roles
<!-- permission_matrix -->

---

## User Experience Principles
<!-- ux_principles -->

### Key Interactions
<!-- key_interactions -->

---

## Functional Requirements
<!-- functional_requirements_complete -->

---

## Non-Functional Requirements

### Performance
<!-- performance_requirements -->

### Security
<!-- security_requirements -->

### Scalability
<!-- scalability_requirements -->

### Accessibility
<!-- accessibility_requirements -->

### Integration
<!-- integration_requirements -->

<!-- no_nfrs -->

---

## Implementation Planning

### Epic Breakdown Required
Requirements must be decomposed into epics and bite-sized stories (200k context limit).

**Next Step:** Run `workflow epics-stories` to create the implementation breakdown.

---

## References

- Product Brief: docs/requirements/requirements.md
- Domain Brief: docs/domain/orders-lifecycle.md
- Research: docs/requirements/warehouse-delivery-linked.md; docs/compliance/au-standards.md

---

## Next Steps

1. **Epic & Story Breakdown** - Run: `workflow epics-stories`
2. **UX Design** (if UI) - Run: `workflow ux-design`
3. **Architecture** - Run: `workflow create-architecture`

---

_This PRD captures the essence of fms - unified mining-ready dispatch, telemetry, and compliance in one control hub_

_Created through collaborative discovery between BMad and AI facilitator._
