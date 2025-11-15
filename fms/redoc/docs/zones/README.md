---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Zone Catalog

This folder defines the operational zone hierarchy that underpins RBAC, KPIs, and routing constraints.

## Contents
- `au-qld-zones.yaml` seeds Queensland’s state + region structure (Brisbane, MacKay, Townsville) with codes, centroids, and adjacency placeholders. Geometry is imported later from ABS ASGS data.
- `README.md` (source) walks through loading steps: apply the database schema, prepare geometry, import YAML via ETL, attach shapes, and optionally define adjacency pairs.

## Key Concepts
- **Hierarchy** — Zones encode ISO-style codes (`AU-QLD`, `AU-QLD-BNE`, etc.) with nested children for operational planning.
- **Geometry Pipeline** — Polygons live in Postgres/PostGIS (`zone_regions`). The YAML captures metadata while ETL scripts union ABS shapes and attach them to each zone.
- **Adjacency & RBAC** — Zone adjacency supports routing heuristics, while `tenant_id` scoping and zone assignments enforce RBAC boundaries for drivers, vehicles, and dashboards.

Use this folder when onboarding new regions: clone the YAML, update names/codes, import via ETL, and tie the records back to geometry stored in the reporting database.

