-- Reporting domain (events, snapshots, dimensions) with RLS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic status events for orders and tasks (partition by occurred_at)
CREATE TABLE IF NOT EXISTS status_events (
  event_id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      uuid NOT NULL,
  entity_type    text NOT NULL CHECK (entity_type IN ('order','task')),
  entity_id      uuid NOT NULL,
  event_type     text NOT NULL,
  occurred_at    timestamptz NOT NULL,
  zone_id        uuid,
  mode           text, -- road|rail at launch
  correlation_id text,
  payload        jsonb NOT NULL
) PARTITION BY RANGE (occurred_at);

ALTER TABLE status_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='status_events' AND policyname='status_events_rls'
  ) THEN
    CREATE POLICY status_events_rls ON status_events
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Convenience function to create a daily partition for status_events
CREATE OR REPLACE FUNCTION create_status_events_partition(day date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE part_name text := format('status_events_%s', to_char(day,'YYYYMMDD'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF status_events FOR VALUES FROM (%L) TO (%L);',
                 part_name, day::timestamptz, (day+1)::timestamptz);
END $$;

-- POD artifacts metadata (immutable references to object storage)
CREATE TABLE IF NOT EXISTS pod_artifacts_meta (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    uuid NOT NULL,
  order_id     uuid NOT NULL,
  task_id      uuid,
  artifact_type text NOT NULL,
  storage_url  text NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pod_artifacts_meta ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pod_artifacts_meta' AND policyname='pod_artifacts_meta_rls'
  ) THEN
    CREATE POLICY pod_artifacts_meta_rls ON pod_artifacts_meta
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Dimension tables (fed from Convex via ETL/CDC)
CREATE TABLE IF NOT EXISTS accounts_dim (
  account_id uuid PRIMARY KEY,
  tenant_id  uuid NOT NULL,
  name       text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts_dim ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='accounts_dim' AND policyname='accounts_dim_rls'
  ) THEN
    CREATE POLICY accounts_dim_rls ON accounts_dim
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vehicles_dim (
  vehicle_id uuid PRIMARY KEY,
  tenant_id  uuid NOT NULL,
  rego       text,
  capacity_weight_kg numeric,
  capacity_volume_m3 numeric,
  capacity_pallets   int,
  refrigerated       boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles_dim ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='vehicles_dim' AND policyname='vehicles_dim_rls'
  ) THEN
    CREATE POLICY vehicles_dim_rls ON vehicles_dim
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS drivers_dim (
  driver_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name      text,
  license_class text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drivers_dim ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='drivers_dim' AND policyname='drivers_dim_rls'
  ) THEN
    CREATE POLICY drivers_dim_rls ON drivers_dim
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS warehouses_dim (
  warehouse_id uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL,
  name         text,
  zone_id      uuid,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE warehouses_dim ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='warehouses_dim' AND policyname='warehouses_dim_rls'
  ) THEN
    CREATE POLICY warehouses_dim_rls ON warehouses_dim
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Optional daily snapshots for reporting (denormalized)
CREATE TABLE IF NOT EXISTS orders_snapshot (
  order_id    uuid,
  tenant_id   uuid,
  status      text,
  order_type  text,
  priority    text,
  sla_start   timestamptz,
  sla_end     timestamptz,
  account_id  uuid,
  zone_id     uuid,
  snapshot_at timestamptz NOT NULL,
  PRIMARY KEY (order_id, snapshot_at)
);

ALTER TABLE orders_snapshot ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders_snapshot' AND policyname='orders_snapshot_rls'
  ) THEN
    CREATE POLICY orders_snapshot_rls ON orders_snapshot
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tasks_snapshot (
  task_id     uuid,
  tenant_id   uuid,
  order_id    uuid,
  status      text,
  vehicle_id  uuid,
  driver_id   uuid,
  zone_id     uuid,
  snapshot_at timestamptz NOT NULL,
  PRIMARY KEY (task_id, snapshot_at)
);

ALTER TABLE tasks_snapshot ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks_snapshot' AND policyname='tasks_snapshot_rls'
  ) THEN
    CREATE POLICY tasks_snapshot_rls ON tasks_snapshot
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

