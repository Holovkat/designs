-- Postgres DDL for operational zones (states/regions/districts)
-- Requires: PostGIS, uuid-ossp or pgcrypto for UUIDs

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- provides uuid_generate_v4()

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'zone_level'
  ) THEN
    CREATE TYPE zone_level AS ENUM ('state','region','district');
  END IF;
END $$;

-- Zones live per tenant and can be nested (parent -> child)
CREATE TABLE IF NOT EXISTS zone_regions (
  zone_id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid NOT NULL,
  name              text NOT NULL,
  code              text NOT NULL,
  level             zone_level NOT NULL,
  parent_zone_id    uuid NULL REFERENCES zone_regions(zone_id) ON DELETE SET NULL,
  geom              geometry(MultiPolygon, 4326),
  attributes        jsonb NOT NULL DEFAULT '{}'::jsonb,
  active            boolean NOT NULL DEFAULT true,
  valid_from        timestamptz NOT NULL DEFAULT now(),
  valid_to          timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zone_code_unique UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS zone_regions_geom_gix ON zone_regions USING GIST (geom);
CREATE INDEX IF NOT EXISTS zone_regions_level_ix ON zone_regions (tenant_id, level);
CREATE INDEX IF NOT EXISTS zone_regions_parent_ix ON zone_regions (parent_zone_id);

-- Adjacency list to enable spillover/handoffs between neighboring zones
CREATE TABLE IF NOT EXISTS zone_adjacency (
  zone_id           uuid NOT NULL REFERENCES zone_regions(zone_id) ON DELETE CASCADE,
  neighbor_zone_id  uuid NOT NULL REFERENCES zone_regions(zone_id) ON DELETE CASCADE,
  PRIMARY KEY (zone_id, neighbor_zone_id),
  CONSTRAINT zone_adjacency_not_self CHECK (zone_id <> neighbor_zone_id)
);

-- Row Level Security scaffold (expects app.tenant_id to be set on session)
ALTER TABLE zone_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_adjacency ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'zone_regions' AND policyname = 'zones_rls'
  ) THEN
    CREATE POLICY zones_rls ON zone_regions
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'zone_adjacency' AND policyname = 'zones_adj_rls'
  ) THEN
    CREATE POLICY zones_adj_rls ON zone_adjacency
      USING (
        EXISTS (
          SELECT 1 FROM zone_regions zr
          WHERE zr.zone_id = zone_adjacency.zone_id
            AND zr.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
        AND EXISTS (
          SELECT 1 FROM zone_regions zr
          WHERE zr.zone_id = zone_adjacency.neighbor_zone_id
            AND zr.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
      );
  END IF;
END $$;

-- Helper function to find zones containing a point
CREATE OR REPLACE FUNCTION zone_regions_for_point(p_lon double precision, p_lat double precision)
RETURNS SETOF zone_regions
LANGUAGE sql STABLE AS $$
  SELECT *
  FROM zone_regions z
  WHERE z.active
    AND z.geom IS NOT NULL
    AND ST_Contains(z.geom, ST_SetSRID(ST_Point(p_lon, p_lat), 4326));
$$;

-- Optional: trigger to maintain updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS zone_regions_touch_updated_at ON zone_regions;
CREATE TRIGGER zone_regions_touch_updated_at
BEFORE UPDATE ON zone_regions
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

