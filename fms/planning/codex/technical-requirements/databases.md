# Databases Strategy — Convex + Postgres

Purpose
- Use Convex for operational app data and realtime subscriptions.
- Use Postgres for analytics, reporting, exports, and long-term history.

Write model (dual-path via events)
- App writes occur via Convex mutations.
- Each mutation that changes state appends an `outbox_event` in Convex (idempotent key, type, payload, occurredAt).
- An Integration Bridge (n8n flow or small Node worker) polls/consumes outbox events and publishes to `fms.*` topics.
- Reporting ETL service consumes `fms.*` and writes to Postgres tables.

Sync guarantees
- At-least-once delivery with idempotent upserts in Postgres.
- Reconciliation job compares Convex state vs Postgres aggregates nightly; emits discrepancies.

Schema guidance (Postgres)
- `fact_deliveries(task_id, order_id, vehicle_id, driver_id, depot_id, planned_start, planned_end, actual_start, actual_end, status, distance_km, duration_s, on_time)`
- `dim_vehicle(vehicle_id, capacity_weight, capacity_volume, capabilities, active_from, active_to)`
- `telemetry(vehicle_id, ts, lat, lon, speed, heading, fuel_level, battery) PARTITION BY RANGE (ts)`
- `pod_metadata(task_id, type, uri, sha256, captured_at)`

Retention
- Telemetry partitions monthly; retain 30 days hot; archive older.
- POD metadata 2 years; blobs 7 years (per privacy policy).

