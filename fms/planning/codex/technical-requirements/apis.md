# APIs — Surface and Contracts (Draft)

Principles
- RESTful JSON over HTTPS. Tenant‑facing ingestion is idempotent via server‑managed dedupe (external_order_id + canonical fingerprint). For other mutating endpoints, prefer `X-Request-Id`; `Idempotency-Key` may be supported for internal‑only calls.
- Auth via JWT (SSO/OIDC) for internal apps; PAT or mTLS for service calls.
- Webhooks for integrations, WebSockets for realtime dashboard updates.

Core endpoints (outline)
- Orders & Tasks
  - `POST /api/v1/orders` (integration or operator upload)
  - `POST /api/v1/orders/{orderId}/firm` (convert Provisional→Firm; respects freeze window and approvals)
  - `POST /api/v1/orders/{orderId}/defirm` (Firm→Provisional when allowed)
  - `GET /api/v1/tasks?status=...&vehicleId=...`
  - `PATCH /api/v1/tasks/{taskId}` (priority, notes)
- Scheduling
  - `POST /api/v1/schedules/compute` (batch plan for date/region)
  - `POST /api/v1/schedules/{routeId}/assign` (vehicle/driver)
- Routing
  - `POST /api/v1/routes/optimize` (stops, constraints)
  - `POST /api/v1/routes/{routeId}/reoptimize` (trigger)
- Telemetry
  - `POST /api/v1/telemetry/ingest` (mobile SDK or device gateway)
  - `GET /api/v1/vehicles/{id}/track` (last known)
- POD
  - `POST /api/v1/pod/{taskId}` (multipart form: photo, signature)
  - `GET /api/v1/pod/{taskId}` (metadata)
  - Dairy metadata keys: `{farm_id, compartment_id, sample_id, seal_numbers[], product_temp_c}`
- Alerts
  - `GET /api/v1/alerts?severity=...`
  - `POST /api/v1/alerts/{id}/ack`
- Configuration
  - `GET /api/v1/config?scope=global|tenant` (server-side only returns non-secret config)
  - `PUT /api/v1/config/{key}` (admin)
  - `GET /api/v1/flags` and `PUT /api/v1/flags/{key}` (admin)
  - Secrets are write-only via admin action; never returned by client APIs.
  - `GET /api/v1/config/registry` (read registry used to render UI + validations)
  - `POST /api/v1/config/changesets` (create draft) → `POST /api/v1/config/changesets/{id}/validate` → `POST /api/v1/config/changesets/{id}/approve` → `POST /api/v1/config/changesets/{id}/apply`
  - `GET /api/v1/config/history?key=...&tenantId=...`
- Integration webhooks
  - `POST /integrations/erp/order-created`
  - `POST /integrations/erp/status-updated`

- Planning
  - `GET /api/v1/planning/firming-queue?mode=road|rail&zoneId=...` (orders approaching/breaching firm_by_at)
  - `GET /api/v1/planning/capacity-calendar?from=...&to=...` (holds vs firmed load)
  - `GET /api/v1/route-templates?zoneId=...` (weekly milk run templates)
  - `POST /api/v1/route-templates/{templateId}/instantiate?week=YYYY-WW` → creates route_plans

Events (Kafka topics)
- `fms.ingestion.order.ingested.v1`
- `fms.order.planning_updated.v1`
- `fms.order.firming_due.v1`
- `fms.order.firmed.v1`
- `fms.scheduling.task.assigned.v1`
- `fms.routing.route.optimized.v1`
- `fms.delivery.status.updated.v1`
- `fms.pod.artifact.captured.v1`
- `intg.erp.order-inbound.v1` (control)
- `integration.flow.executed.v1`, `integration.flow.failed.v1`
 - `fms.config.changed.v1`

Versioning
- Path versioning (`/api/v1`); event version suffix (`.v1`).
