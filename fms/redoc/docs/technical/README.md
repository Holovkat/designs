---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Technical Architecture Notes

This directory houses the cross-cutting technical plans that keep the launch platform resilient and real-time.

## Documents
- `dr-ha-monitoring.md` — Disaster recovery and high availability strategy: multi-AZ app tier, Convex + Postgres replication, n8n worker pools, RTO/RPO targets (5 minutes / 1 minute), failover drills, golden-signal monitoring, and incident runbooks.
- `traffic-and-navigation.md` — Detailed blueprint for traffic overlays, live ETA computation via Google Distance Matrix, re-optimization triggers (<30s SLA), API usage guardrails, and driver voice-guidance deep links.
- `workflows/` — Operational workflows with catalogs, templates, and the delivery lifecycle spec, documented separately under `docs/technical/workflows`.

## How it Fits Together
- Monitoring and DR guardrails ensure the routing/ETA stack remains available even under failover scenarios.
- Traffic and navigation plans feed UI specs (`docs/ui/front-end-spec.md`) and driver behaviors (`docs/ui/driver-app-spec.md`) while controlling API cost and observability.
- Workflow templates keep every automation asset aligned with BMAD standards so ReDoc can render leaf-level docs consistently.

Consult this directory whenever you need platform-level guidance beyond individual product specs.

