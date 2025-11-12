# Data Architecture Overview

This FMS uses Convex for operational application state and Postgres + PostGIS for historical/reporting data. This folder documents both layers:

- Operational (Convex): collections, fields, indexes, and emitted domain events
- Reporting (Postgres): tables, partitions, geospatial, status events, and dimensions

Key principles
- Single source of truth in Convex for live ops; Postgres receives immutable events and curated snapshots for analytics and compliance.
- All entities include `tenant_id`; many also include `zone_id`. Row Level Security is enforced in Postgres.
- Retention is configurable; default is 7 years for all data (telemetry included).

Files
- `erd.md` – ERD views (Mermaid embedded) for Convex and Postgres
- `schemas/convex-collections.yaml` – Convex collections, fields, and event emissions
- SQL DDL:
  - `db/001_zones.sql` – zones, adjacency, RLS (already added)
  - `db/002_reporting.sql` – telemetry landing (events_raw), positions, geofence, trip_segments (already added)
  - `db/003_reporting_domain.sql` – status events, POD artifacts, dimension tables, RLS

Planning & firming
- Orders carry planning fields: `planning_status (forecast|provisional|firm)`, `firm_by_at`, `firmed_at`, `not_before_at`, `auto_firm`, optional `plan_version`/`scenario_id` from TPS.
- Tenant settings (see `docs/settings/README.md`) control horizons and behavior on horizon breach; scoping supports Tenant → Mode → Zone → Mode+Zone.
- New outbound events: `order.planning_updated`, `order.firming_due`, `order.firmed`.

Idempotency & ingestion
- Tenant‑facing ingestion is deduped server‑side using `(tenant_id, external_order_id)` + canonical JSON fingerprint (TTL configurable; default 24h). No client idempotency key required.

Next
- Confirm these structures, then we’ll generate the Integration Hub Spec (N8N contracts) and the Orders & Lifecycle Spec aligned to these models.
