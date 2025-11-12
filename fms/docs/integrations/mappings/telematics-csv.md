# Telematics CSV Mapping (Launch)

Purpose
- Define the canonical CSV format supported for initial telematics ingestion via SFTP file drop into N8N.

CSV Columns
- `vehicle_id` (string, required)
- `ts` (ISO 8601 timestamp, required)
- `metric` (enum: engine_hours|odometer_km|fuel_pct|tpms_kpa|coolant_temp_c|dtc_code|location|ignition)
- `value` (number or string depending on metric; empty allowed for codes)
- `unit` (string; h|km|%|kPa|C or empty for codes)
- `provider` (string; source system id)
- `meta_json` (stringified JSON object with any extra fields)

Behavior
- N8N validates and normalizes rows → `telematics_events` (reporting plane) and raises alerts per rules in docs/domain/maintenance-telematics.md.
- Invalid rows are reported in a per-file results CSV with error reasons.

Sample
```
vehicle_id,ts,metric,value,unit,provider,meta_json
veh-001,2025-11-11T08:00:00Z,engine_hours,4821,h,ACME_TELEM,{"src":"csv"}
veh-001,2025-11-11T08:00:00Z,odometer_km,287450,km,ACME_TELEM,{"src":"csv"}
veh-001,2025-11-11T08:00:00Z,tpms_kpa,520,kPa,ACME_TELEM,{"axle":"front"}
veh-002,2025-11-11T08:00:00Z,dtc_code,P0420,,ACME_TELEM,{"severity":"high"}
```

Notes
- PII not expected in telematics rows; `vehicle_id` is an internal identifier.
- Thresholds and severity mapping are tenant-configurable where applicable.
