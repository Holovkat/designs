# Zone Catalog and Geometry Import

This folder defines operational zones (states/regions/districts) used for dispatch, KPIs, and RBAC. Geometry is stored in Postgres (PostGIS) and referenced by `zone_regions`.

## Files

- `docs/zones/au-qld-zones.yaml` — YAML seed for Queensland with regions (Brisbane, Mackay, Townsville). Geometry to be imported from ABS ASGS.

## How to load zones

1) Ensure database has schema and PostGIS

- Apply `db/001_zones.sql` to create tables and policies.
- Set the tenant context for your session: `SELECT set_config('app.tenant_id', '<TENANT-UUID>', false);`

2) Prepare geometry (choose one)

- Preferred: Download ABS ASGS GeoJSON/Shapefiles (SA3/SA4) and build aggregated polygons per zone.
- Alternate: Draw polygons in an admin UI that writes MultiPolygons to `zone_regions.geom`.

3) Import YAML seed and attach geometry

- Use your ETL (n8n/job) to:
  - Upsert parent zone (AU-QLD), then child zones.
  - Map aggregated ASGS features to each zone; union polygons with `ST_Union` and cast to `MultiPolygon`.

Example SQL snippets:

```sql
-- Upsert a zone without geometry first
INSERT INTO zone_regions (tenant_id, name, code, level, attributes)
VALUES (:tenant_id, 'Queensland', 'AU-QLD', 'state', '{"country":"AU"}')
ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name;

-- Attach geometry after building it in a temp table `qld_bne_geom(geom geometry)`
UPDATE zone_regions z
SET geom = (SELECT ST_Multi(ST_Union(g.geom)) FROM qld_bne_geom g)
WHERE z.code = 'AU-QLD-BNE' AND z.tenant_id = :tenant_id;

-- Find the zone for a GPS point
SELECT zone_id, name, code FROM zone_regions_for_point(153.02, -27.47);
```

4) Define adjacency (optional)

```sql
INSERT INTO zone_adjacency(zone_id, neighbor_zone_id)
SELECT z1.zone_id, z2.zone_id
FROM zone_regions z1, zone_regions z2
WHERE z1.code = 'AU-QLD-MKY' AND z2.code = 'AU-QLD-TSV'
  AND z1.tenant_id = :tenant_id AND z2.tenant_id = :tenant_id;
```

## Notes

- CRS: EPSG:4326. Store polygons as `MultiPolygon` for consistency.
- RLS: All queries require `app.tenant_id` set; API should set it on connection.
- Cross-border regions (e.g., Riverina) can be created by aggregating polygons from multiple states.
- Avoid storing secrets in attributes; use settings/secret manager for configuration.

