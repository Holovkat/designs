# Addendum: Carrier Management and Dairy Tanker Use Case

This addendum refines requirements for scenarios where a tenant (e.g., a dairy) outsources transport to third‑party carriers and operates multi‑compartment tankers with sanitation and temperature constraints.

## Carrier Management
- Entity: Carrier (third‑party operator)
  - Fields: `carrier_id`, `tenant_id`, `name`, `zones[]`, `contact`, `compliance_docs[]`, `active`.
- Assignments
  - Routes and tasks may be assigned to a `carrier_id` (operator) while the asset owner may be the tenant or the carrier.
  - Vehicles/Drivers include `operator_carrier_id` (FK to Carrier); vehicles also include `owner_type` (tenant|carrier) and `owner_id`.
- RBAC
  - Role: `carrier_user` limited by `carrier_id` and zone scope.
  - Access: read/manage assigned routes/tasks; submit POD and exceptions for their assignments.
- Integrations (launch)
  - API-first (no portal at launch). Carriers can integrate via webhook/SFTP/email or future APIs; portal UI is roadmap.

## Tanker Extensions (Vehicles)
- Tanks/Compartments
  - `tanker: true`
  - `compartments: [{id, capacity_liters, sanitized: boolean}]`
  - `sanitation_status`, `last_cleaned_at`, `cleaning_method`, `temp_sensor`
- Validation
  - Assignment enforces compatible sanitation status and sufficient compartment capacity.

## Dairy Pickup Metadata (POD)
- At pickup: capture `farm_id`, `compartment_id`, `sample_id`, `seal_numbers[]`, `product_temp_c`.
- Store in `pod_artifacts_meta.metadata` and emit with `pod.received` event (redact PII per policy).

## Route Management for Milk Runs
- Route templates (weekly)
  - `route_templates(template_id, zone_id, valid_from, valid_to, weekly_pattern, stops[])`
  - Generate `route_plans` instances for the week; allow re‑optimization for closures/conditions.
- Stop sequencing
  - `route_stops.locked_sequence: boolean`
  - `route_stops.service_seconds: int` (hose/pump time) and `required_window_start/end` per farm.

## Coverage Check vs Requirements
- Zones/bases per region (VIC West/North/East): covered via Zone model and Depots.
- Weekly planning + firm/freeze windows: covered via Planning Settings and planning_status.
- Route management with fixed farm sequences: covered via route_plans/route_stops + locked_sequence + templates.
- Telemetry/breadcrumbing: covered via positions/geofence tables and dashboards.
- QR/Barcodes at pickup/drop: GS1‑128 + GS1 Digital Link QR; rules configurable; required at pickup and drop.
- Carrier outsourcing: covered via Carrier entity, RBAC, and assignment fields; API integrations at launch.
- Tanker specifics (compartments, sanitation, temperature): captured in vehicle extensions and POD metadata.

Open items (future)
- Carrier portal UI (read/manage assigned work, compliance tasks).
- Data exchange profiles per carrier (standardize CSV/JSON fields and webhooks).
- Optional roadworks/closure feeds as routing constraints.

