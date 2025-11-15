---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Integration Mappings

This folder stores CSV/flat-file mapping guides that supplement the JSON webhook schemas. At launch it focuses on telematics ingestion, which feeds maintenance alerts and dashboards.

## Telematics CSV
- `telematics-csv.md` defines the canonical CSV header set (`vehicle_id`, `ts`, `metric`, `value`, `unit`, `provider`, `meta_json`) for SFTP uploads.
- Metrics cover engine hours, odometer, TPMS, fuel %, coolant temp, DTC codes, ignition state, and raw location data—all normalized downstream into `telematics_events`.
- Behaviors spelled out in the spec ensure n8n validates rows, dedupes by `(vehicle_id, ts, metric)`, normalizes into Convex, and raises Alerts for invalid rows via per-file error CSVs.

## Usage
- External providers map their feeds to this CSV before the Integration Hub drops data into Convex.
- The mapping doc doubles as acceptance criteria for future API-based telematics connectors—inputs that match this contract can be converted losslessly into canonical telemetry events.

