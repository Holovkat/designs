---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Data Architecture

The data folder explains how Convex (operational) and Postgres/PostGIS (reporting) cooperate to satisfy tenancy, retention, and analytics requirements.

## Documents
- `README.md` — High-level overview of operational vs. reporting data stores, retention defaults, planning metadata, and ingestion idempotency strategy.
- `erd.md` — Mermaid ERDs for Convex and Postgres, including field-level diagrams for orders, itineraries, tasks, route plans, vehicles, drivers, zones, warehouse resources, alerts, and POD artifacts.
- `schemas/` — Convex collection definitions and envelope metadata (documented separately).
- `erd/` — Placeholder for exported diagram assets (currently empty).

## Themes
- Every entity includes `tenant_id` (and often `zone_id`) for RLS and RBAC.
- Event outbox and snapshot tables link operational changes to reporting pipelines.
- Planning metadata (`planning_status`, horizons, freeze timestamps) flows from ingestion through scheduling and into analytics.

Use this folder as the canonical source for data modeling discussions and to verify that downstream consumers mirror the latest schema definitions.

