# Backlog — Phases 0–2

## Phase 0 — Foundations
- AuthN/Z: As an Admin, I can log in via SSO and assign roles (RBAC) to users.
  - AC: Role matrix enforced on API and dashboard; audit log for role changes.
- Ingestion MVP: As an Operator, I can upload CSV/JSON and ingest orders.
  - AC: Validation errors shown; server‑managed dedupe on re-upload (file hash or canonical fingerprint); tasks created in <30s.
- Eventing: As a Developer, I can publish ingestion/status events to a stream.
  - AC: Topics per `topics.md`; outbox enabled; consumer replay works.
- Dashboard skeleton: As a Dispatcher, I can view a list of tasks with status.
  - AC: Filter/search by orderId/driver/vehicle; live updates via WebSocket.
- Integration Hub bootstrap: As a Platform Engineer, I can deploy N8N with SSO and secrets, and version control flows.
  - AC: Dev/Stage/Prod instances; flow export/import via CI; audit logs on changes.
 - N8N queue mode: As a Platform Engineer, I can enable queue mode with Redis and scale workers.
   - AC: `EXECUTIONS_MODE=queue` configured; N workers processing; retries/DLQ visible; backpressure tested.

## Phase 1 — MVP Operations
- Scheduling (baseline): As a Dispatcher, I can auto-assign tasks by capacity/shift.
  - AC: P95 from ingestion to schedule ≤ 5m; conflicts flagged.
- Manual overrides: As a Dispatcher, I can drag/drop assignments with audit.
  - AC: Overbooking alerts; rollback to previous plan.
- Driver app (status): As a Driver, I can update status (Departed/Arrived/Delivered) and capture POD.
  - AC: Works offline ≥ 60 minutes; sync on reconnect; POD hashed.
- Customer comms: As a Recipient, I get an SMS with ETA window and a confirmation link.
  - AC: Opt-in stored; quiet hours respected; delivery confirmation persisted.
 - ERP inbound via N8N: As a Dispatcher, new ERP orders arrive automatically.
   - AC: `intg.erp.order-inbound.v1` emits `fms.ingestion.order.ingested.v1`; dedupe via external_order_id + fingerprint; DLQ on failures.
- ERP outbound via N8N: As an ERP, I receive delivery status updates.
  - AC: Map `fms.delivery.status.updated.v1` to ERP API; retries with backoff; failures emit `integration.flow.failed.v1`.

- Planning basics: As a Planner, I can view Provisional vs Firm orders and a firming queue.
  - AC: Firming queue lists orders inside horizon with `firm_by_at` sorted; actions: Firm, Defer (if allowed), Escalate; emits `order.firmed`/`order.firming_due`.

## Phase 2 — Routing & Realtime
- Distance matrix + VRP(TW): As a Dispatcher, I get optimized routes for ≤50 stops.
  - AC: P95 route compute ≤ 10s; objective selectable (time/distance).
- Re-optimization: As a Dispatcher, I get traffic-aware suggestions.
  - AC: Trigger on predicted delay >10m; proposal delivered to driver in ≤5s.
- Live map: As a Manager, I see vehicles on a map colored by schedule health.
  - AC: P95 telemetry end-to-dashboard ≤ 2s; cluster rendering for dense areas.
- Geofencing: As an Operator, I can define zones and receive entry/exit events.
  - AC: P95 detection ≤ 15s; deviation >10% flagged.
- Reconciliation flow: As a Manager, nightly ERP↔FMS reconciliation runs.
  - AC: Summary report; discrepancies raised as alerts; replay supported.

- Planning board: As a Planner, I can see a timeline of Forecast/Provisional/Firm orders with freeze markers.
  - AC: Drag/drop changes reflect as planning updates; TPS plan_version deltas visible; capacity holds summarized by zone/mode.
  - Feature flag: Forecast entry in UI remains disabled at launch; enable via `paid_features.forecasting` and `ui.allow_forecast_entry` later.

## Estimation Guide
- S: 1–2 days; M: 3–5 days; L: 6–10 days; XL: 10+ days.
- Integrations and mobile features skew to L/XL; UI polish skews to S/M.
