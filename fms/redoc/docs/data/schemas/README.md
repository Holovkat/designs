---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Operational Data Schemas

`convex-collections.yaml` enumerates every Convex collection, field, index, and event emission that powers the operational side of the FMS. It is the single source of truth for live data structures before they are projected into Postgres snapshots.

## Highlights
- **Envelope Definition** — A shared event envelope (`events_outbox`) with tenant, zone, correlation, and payload metadata; every collection that emits events references this shape.
- **Collections** — Customer accounts, orders, delivery tasks, itineraries/legs, route plans, driver/vehicle registries (including tanker compartments and carrier ownership), alerts, POD artifacts, maintenance queues, and more. Each collection lists primary keys, required fields, indexes, and associated domain events.
- **Planning Fields** — Orders capture `planning_status`, `plan_version`, `scenario_id`, `firm_by_at`, freeze windows, and constraint objects (DG, temperature) to align with the ingestion and planning specs.
- **Compliance Metadata** — Drivers include fatigue profiles, credentials, and zone scopes; vehicles include sanitation status, reefer information, and carrier ownership to satisfy dairy and hazchem addenda.

## Usage
- Convex migrations and seed scripts import this YAML to ensure consistent field definitions.
- Documentation, the Integration Hub, and Admin Settings all cross-reference these definitions so dedupe logic, retention, and alerts stay consistent with the live schema.

