# Reports API (Stubs)

Auth
- JWT; RBAC checked per role. Zone scoping applies to query params. `Accept: application/pdf|text/csv|image/png` as appropriate.

Common query params
- `date`, `from`, `to` (ISO 8601), `zoneId`, `vehicleGroup`, `accountId`, `timezone` (defaults to tenant setting), paging for CSV streams if needed.

GET /api/v1/reports/schedules.pdf
- Params: `date`, `zoneId`, `vehicleGroup`, `pageSize` (A4|Letter), `orientation` (portrait|landscape)
- 200: application/pdf (server‑rendered with theme)
- 400: invalid params

GET /api/v1/reports/schedules.xlsx
- Params: `date`, `zoneId`, `vehicleGroup`
- 200: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

GET /api/v1/reports/kpi.png
- Params: `metric` (on_time|active_vehicles|eta_variance|pending_tasks), `from`, `to`, `timezone`
- 200: image/png (widget snapshot with timestamps)

GET /api/v1/reports/kpi.csv
- Params as above; 200: text/csv with headers (timestamp,value,timezone)

GET /api/v1/reports/alerts.csv
- Params: `from`, `to`, `severity`, `type`, `zoneId`; 200: text/csv streaming
- Fields: id,severity,type,entity_ref,message,occurred_at,owner,state,resolved_at

GET /api/v1/reports/delivery.pdf (or .csv)
- Params: `from`, `to`, `zoneId`, `accountId`, `timezone`
- 200: application/pdf or text/csv
- Notes: aggregates from MVs

GET /api/v1/reports/utilization.pdf
- Params: `from`, `to`, `zoneId`
- 200: application/pdf; includes static map tiles and charts

Errors
- 400 invalid date range or params
- 401/403 unauthorized/forbidden
- 404 no data
- 429 too many requests (concurrency guardrails)
- 500 renderer error

Audit
- Each response adds an audit entry: who, when, endpoint, params, row counts (if CSV), pages (if PDF).
