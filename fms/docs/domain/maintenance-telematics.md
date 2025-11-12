# Maintenance & Telematics (Predictive) — Launch Spec

Goals
- Ingest telematics (engine hours, odometer, TPMS, fuel, DTCs) and surface predictive maintenance alerts that can adjust schedules.

Integration Options (provider‑neutral)
- Provider APIs: Geotab/Samsara or similar (post‑launch); initial launch may use CSV/SFTP drop with the same canonical schema.
- N8N flows: normalize inbound payloads → `telematics_events` → rules engine → alerts + optional maintenance scheduling.

Canonical Event Schema (reporting plane)
- telematics_events(id, tenant_id, vehicle_id, ts, metric, value, unit, severity?, meta)
  - metric ∈ {engine_hours, odometer_km, fuel_pct, tpms_kpa, coolant_temp_c, dtc_code, location, ignition}
  - meta captures provider/raw fields; PII not expected.

Operational Entities (Convex)
- maintenance_plans(vehicle_id, type, interval_km, interval_days, interval_engine_hours)
- maintenance_events(vehicle_id, type, due_at_km?, due_at_date?, due_at_engine_hours?, status[pending|scheduled|completed], meta)

Rules & Alerts
- Thresholds: raise `maintenance.due_soon` at 80% of interval; `maintenance.overdue` at 100%.
- DTCs: severity mapping; criticals generate `alert` with severity=high/critical.
- TPMS: low pressure thresholds configurable per axle/vehicle type.
- Actions: create maintenance slot, mark vehicle unavailable during window, trigger reschedule for affected tasks.

UI (Dispatcher)
- Maintenance board: upcoming due items by vehicle; filter by severity/time window.
- Vehicle view: telemetry sparkline; last service date; next due (km/days/engine hours).
- Scheduling: “Create maintenance slot” dialog; suggests earliest feasible window with minimal disruption.

Integrations
- CSV/SFTP format for launch with fields: vehicle_id, ts, metric, value, unit, provider, meta_json.
- Optional provider APIs later; align with same canonical fields.

Acceptance
- Ingest CSV/SFTP file; events stored; alerts raised per thresholds; “Create maintenance slot” blocks scheduling windows; affected routes re‑optimized.

Open Items (tracked in gaps‑questions.md)
- First provider to target post‑launch; sampling frequencies per metric; KPIs for maintenance effectiveness.
