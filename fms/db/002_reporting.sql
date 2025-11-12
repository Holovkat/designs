-- Historical/Reporting data plane (per infra cell)
-- Requires: PostGIS, UUID extension, zones tables from 001_zones.sql

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Raw event landing (idempotent upsert target for webhooks/ingestion)
CREATE TABLE IF NOT EXISTS events_raw (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL,
  type            text NOT NULL,
  source          text NOT NULL,
  occurred_at     timestamptz NOT NULL,
  payload         jsonb NOT NULL,
  correlation_id  text,
  received_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events_raw ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events_raw' AND policyname='events_raw_rls'
  ) THEN
    CREATE POLICY events_raw_rls ON events_raw
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Time-series telemetry with PostGIS, partitioned by day
CREATE TABLE IF NOT EXISTS positions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL,
  vehicle_id  uuid NOT NULL,
  ts          timestamptz NOT NULL,
  geom        geography(Point, 4326) NOT NULL,
  speed_kph   numeric,
  heading_deg numeric,
  fuel_pct    numeric,
  zone_id     uuid NULL REFERENCES zone_regions(zone_id),
  attributes  jsonb NOT NULL DEFAULT '{}'::jsonb
) PARTITION BY RANGE (ts);

CREATE INDEX IF NOT EXISTS positions_geom_gix ON positions USING GIST (geom);
CREATE INDEX IF NOT EXISTS positions_vehicle_ts_ix ON positions (tenant_id, vehicle_id, ts);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='positions' AND policyname='positions_rls'
  ) THEN
    CREATE POLICY positions_rls ON positions
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Geofence enter/exit and deviations
CREATE TABLE IF NOT EXISTS geofence_events (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL,
  vehicle_id  uuid NOT NULL,
  geofence_id uuid,
  event_type  text NOT NULL, -- entered|exited|deviation
  ts          timestamptz NOT NULL,
  geom        geography(Point, 4326),
  route_id    uuid,
  zone_id     uuid REFERENCES zone_regions(zone_id),
  attributes  jsonb NOT NULL DEFAULT '{}'::jsonb
) PARTITION BY RANGE (ts);

CREATE INDEX IF NOT EXISTS geofence_events_geom_gix ON geofence_events USING GIST (geom);

ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='geofence_events' AND policyname='geofence_events_rls'
  ) THEN
    CREATE POLICY geofence_events_rls ON geofence_events
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Trip segments (planned vs actual comparison)
CREATE TABLE IF NOT EXISTS trip_segments (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL,
  vehicle_id    uuid NOT NULL,
  trip_id       uuid NOT NULL,
  segment_seq   int  NOT NULL,
  planned_geom  geography(LineString, 4326),
  actual_geom   geography(LineString, 4326),
  planned_eta   interval,
  actual_eta    interval,
  planned_dist_km numeric,
  actual_dist_km  numeric,
  zone_id       uuid REFERENCES zone_regions(zone_id),
  attributes    jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE trip_segments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='trip_segments' AND policyname='trip_segments_rls'
  ) THEN
    CREATE POLICY trip_segments_rls ON trip_segments
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Helpers to create/drop daily partitions for telemetry
CREATE OR REPLACE FUNCTION create_daily_partition(tbl text, day date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  part_name text := format('%s_%s', tbl, to_char(day, 'YYYYMMDD'));
  sql text;
BEGIN
  sql := format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);',
                part_name, tbl, day::timestamptz, (day + 1)::timestamptz);
  EXECUTE sql;
END $$;

-- convenience procedure to rotate N days ahead
CREATE OR REPLACE PROCEDURE ensure_partitions(days_ahead int)
LANGUAGE plpgsql AS $$
DECLARE d date := current_date; i int := 0; BEGIN
  WHILE i <= days_ahead LOOP
    PERFORM create_daily_partition('positions', d + i);
    PERFORM create_daily_partition('geofence_events', d + i);
    i := i + 1;
  END LOOP;
END $$;

