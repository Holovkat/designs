# Phasing and Sprints — Detailed Delivery Plan

This plan explains the why, what, and how of each phase to ensure agents can execute confidently and reviewers have explicit, testable outcomes. Assumes 2‑week sprints; adjust cadence as needed.

Guiding principles
- Deliver thin vertical slices that demo end‑to‑end value every sprint.
- Bias to Docker Compose locally; keep complexity low and instrumentation high.
- Convex is operational source of truth; Postgres is reporting/analytics sink via events.
- n8n is the Integration Hub for ERP/CRM and reconciliation; Kafka‑compatible backbone for durable events and fanout.
- All scope gated by acceptance criteria, SLIs/SLOs, and UAT sign‑off.

Team/agents (workstreams)
- Integration (n8n flows, bridges)
- Backend (Convex app, APIs, outbox)
- Routing (OR‑Tools + matrix)
- Telemetry (GPS ingestion, geofence)
- Web (manager/dispatcher UI)
- Mobile (driver app)
- Data/Reporting (ETL → Postgres, KPIs)
- QA (test plans, automation, UAT facilitation)
- DevEx/Infra (Compose, CI, observability)

---

## Phase 0 — Foundations (Sprint 1)

Problem statement
- We lack a runnable baseline to integrate systems, validate data models, and observe end‑to‑end flows. Decision latency around stack choices (maps, events, nav) stalls downstream work.

Objectives (why)
- Establish a working dev environment on any laptop in <15 minutes.
- Lock core domain objects and event schema so downstream services are stable.
- Enable simple order ingestion and task visibility to validate data fidelity.

Scope (what)
- Infrastructure: Bring up Compose stack (Postgres, Redis, n8n main+worker, Redpanda, Kafka UI, LocalStack, Mailhog) with healthchecks.
- Backend (Convex): Seed schema for orders, tasks, routes, stops, assignments; implement RBAC scaffold; implement ingestion mutations and outbox table.
- Integration: Bootstrap n8n in queue mode; create ERP inbound flow (webhook → validate/transform → Convex ingestion API); export flows to Git.
- Events: Publish `fms.ingestion.order.ingested.v1` on successful ingestion; verify consumption via Kafka UI.
- Web (dispatcher): Minimal dashboard showing Pending/Scheduled tasks with live updates.
- QA/Observability: Baseline metrics (ingestion latency P95), logs, and a synthetic order generator.

Out of scope
- Optimized scheduling/routing; driver mobile application; telemetry stream.

How (approach)
- Compose up core+events; `.env` used for infrastructure only (DB/Redis/broker). Application settings seeded/loaded from DB.
- Implement Convex ingestion with server‑managed dedupe (external_order_id + fingerprint) and append to outbox.
- n8n queue mode with Redis and a single worker; ERP inbound webhook receives sample payloads, transforms to internal schema, calls Convex ingestion; on success, emit `order.ingested` event.
- Web UI subscribes to Convex query for task list (reactive updates).

Deliverables
- Running local stack; documented runbook.
- Event schemas committed; ERP inbound n8n flow JSON exported.
- Convex schema and ingestion API with unit tests.
- Minimal dashboard view with status filter.
- Config management live: `app_config`, `feature_flags`, `secrets` tables and admin Settings UI; `fms.config.changed.v1` emitted on change.

Acceptance criteria (DoD)
- From cold start, developer can: `cp .env.example .env && docker compose --profile core --profile events up -d` and ingest a CSV or webhook payload; task appears in dashboard in <30s.
- `fms.ingestion.order.ingested.v1` visible in Kafka UI with correct tenantId and payload shape.
- Metrics visible for ingestion latency and n8n flow success rate.
- Application starts with only DB/Redis/broker envs; other settings (dashboard refresh rate, KPI thresholds) come from DB and can be changed live via Settings UI.

Risks and mitigations
- Risk: n8n queue misconfigured → worker starvation. Mitigate with healthchecks and visible retries.
- Risk: Schema churn → consumer breakage. Mitigate with versioned events `.v1` and sample payloads under version control.

UAT
- Reviewer uploads sample CSV and triggers an ERP webhook; sees tasks populate within AC; verifies metrics dashboard.

---

## Phase 1 — MVP Operations (Sprints 2–3)

Problem statement
- Dispatchers manually assign tasks without constraints; Drivers have no official reporting path; stakeholders lack live status and POD proof.

Objectives (why)
- Automate baseline scheduling to reduce idle time and overbooking.
- Capture live delivery status and POD from the field.
- Keep ERP in sync bidirectionally (orders in, status out).

Scope (what)
- Scheduling baseline: Capacity/shift‑aware assignment; conflict detection; Gantt view; manual override with audit.
- Driver app (v1): Task list, status transitions (Departed/Arrived/Delivered), offline queueing, POD capture (photo/signature/scan).
- ERP outbound via n8n: Map `delivery.status.updated.v1` → ERP status API with retries, DLQ, and reconciliation report.
- Customer notifications: SMS/email on assignment and ETA changes via n8n templates; quiet hours.
- Privacy/retention: Implement baseline tagging and masking policies for PII in Convex and events.

How (approach)
- Implement scheduler in Convex first (simple heuristics) with hard/soft constraints; store conflicts; expose REST endpoints for schedule views and overrides.
- Mobile: Cross‑platform stack (e.g., React Native) with background sync; local store for offline actions; photo capture to S3 (LocalStack locally) and metadata event.
- Integration: Two flows in n8n — ERP outbound (status mapping) and nightly reconciliation (ERP vs FMS orders/tasks).
- Notifications: n8n nodes for SMS/email; templating per tenant; opt‑in flags in Convex.
 - Feature flags: Scheduler toggles and UI experiments behind tenant‑scoped flags with live reload via config change events.

Deliverables
- Scheduling UI + override controls with audit trail.
- Driver app v1 APK/IPA (test build) with offline queue and POD.
- ERP outbound n8n flow with error handling and DLQ; reconciliation summary.
- Notifications templates + consent management fields.

Acceptance criteria (DoD)
- P95 ingestion‑to‑schedule ≤ 5m; conflict list rendered; manual override logged with before/after.
- Driver can complete a task offline ≥ 60 minutes; upon reconnect, status + POD synced; `pod.artifact.captured.v1` emitted with SHA256.
- ERP reflects Delivered within 60s of status update; failures land in DLQ and appear in integration flow failed events.
- Customer receives a message with ETA window and confirmation link; opt‑out respected.
 - Changing a feature flag or config value updates behavior without restart (e.g., dashboard refresh cadence).

Risks and mitigations
- Risk: Offline complexity in mobile. Mitigate by keeping v1 scope to status + POD and using reliable background sync.
- Risk: SMS deliverability (10DLC). Mitigate by registering brand/campaign early and using sandbox email in dev.

Sprint breakdown
- Sprint 2
  - Scheduling baseline + UI, manual overrides, audit trail.
  - Driver app status updates (online), POD capture to S3, metadata to Convex.
  - ERP outbound (Delivered/Exception) flow, retries/DLQ.
  - Demo: Create schedule, override, complete a delivery with POD; ERP updated.
- Sprint 3
  - Driver offline queue + conflict resolution on reconnect.
  - Customer notifications and consent; reconciliation flow v1.
  - Hardening: RBAC enforcement in UI and API; privacy tags.
  - Demo: Offline run-through + reconciliation report; UAT sign‑off.

UAT
- End‑to‑end scenario from order ingestion → schedule → driver completes → ERP updated → customer confirmation recorded → reports show counts.

---

## Phase 2 — Routing & Realtime (Sprints 4–5)

Problem statement
- Manual or naive routing increases distance/time and misses delivery windows; lack of traffic‑aware re‑optimization; limited real‑time situational awareness on maps.

Objectives (why)
- Reduce distance/time with VRP(TW) routing to improve on‑time rate and fuel costs.
- React to traffic and disruptions quickly with driver‑approved re‑optimization.
- Provide live map with schedule health and geofence alerts for proactive management.

Scope (what)
- Routing: Distance/time matrix (OSRM/Valhalla/provider) + OR‑Tools heuristics; objective selectable (time/distance/cost).
- Re‑optimization: Trigger on predicted delay >10m; proposal delivered to driver within 5s; audit acceptance decision.
- Telemetry: GPS ingestion, map‑matching, geofencing; end‑to‑dashboard P95 ≤ 2s; deviation >10% flagged.
- Reporting ETL: Populate Postgres facts/dimensions; KPI views for on‑time rate, utilization, ETA variance.

How (approach)
- Integrate matrix source behind an interface to allow provider swap; implement savings + local search heuristics.
- Telemetry engine ingests mobile SDK or device data → map‑match → publish `vehicle.positioned` events → dashboard WebSocket.
- Re‑optimization guardrails to prevent thrash (minimum time between recomputes, soft commitment windows).
- ETL consumer idempotently upserts facts; create materialized views for KPIs.

Deliverables
- `/routes/optimize` and `/routes/{id}/reoptimize` endpoints; UI to compare candidate routes.
- Driver app prompt for route change with clear summary and safety first UX.
- Live dashboard map with clustering, color‑by schedule health, and geofence alerts.
- KPI widgets fed from Postgres materialized views.

Acceptance criteria (DoD)
- P95 compute ≤ 10s for 50 stops/10 vehicles; proposal reaches driver ≤ 5s end‑to‑end.
- Demonstrated ≥10% distance reduction vs nearest‑neighbor baseline on sample data (documented method).
- Telemetry end‑to‑dashboard P95 ≤ 2s; geofence detection ≤ 15s.
- KPI widgets load ≤ 3s and export to CSV/PNG.

Risks and mitigations
- Risk: Map/provider ToS for offline/caching. Mitigate by using OSRM/MapLibre for offline in dev; verify licenses for prod.
- Risk: Route oscillation. Mitigate with hysteresis: minimum dwell and acceptance requirements.

Sprint breakdown
- Sprint 4: Matrix integration, OR‑Tools solver, optimize endpoint, baseline KPIs; telemetry ingest + map‑matching.
- Sprint 5: Re‑optimization flow with driver approval, live map + geofences, KPI widgets and exports; ETL hardening.

UAT
- Side‑by‑side comparison of baseline vs optimized routes; traffic event triggers re‑optimization with driver consent; dashboards reflect state promptly.

---

## Phase 3 — Advanced Operations (Sprints 6–7)

Problem statement
- Operators need proactive alerting and “what‑if” planning; managers require richer exports and stabilized dashboards at scale.

Objectives (why)
- Centralize alerts with one‑click actions.
- Provide scenario simulation to explore utilization before committing changes.
- Improve dashboard and API scalability for 100+ concurrent users.

Scope (what)
- Alerts panel: unified, severity‑sorted alerts (traffic, breakdowns, geofence breaches) with quick actions (re‑route, reassign, silence).
- What‑if simulation: Add/remove vehicle/shift; show impact on utilization and on‑time rate.
- Scalability: Backpressure on WebSockets; pagination/caching; P95 widget render time ≤ 3s cold start.
- Exports: PDF/Excel schedule exports and snapshot APIs.

How (approach)
- Alert rules configured in Convex; delivery via WebSocket and n8n for external comms; all interactions audited.
- Simulation runs the same solver with modified inputs; results presented side‑by‑side; commit creates changeset events.
- Optimize dashboard reads with read‑optimized views and caching (Redis) where appropriate.

Deliverables
- Alerts UI with actions and audit trail.
- Simulation UI with commit/discard flow and metrics deltas.
- Export endpoints + scheduled reports.

Acceptance criteria (DoD)
- Critical alert to actionable response path ≤ 30s median; interaction logged.
- Simulation run P95 ≤ 15s for typical day; utilization delta computed.
- Dashboard sustains 100 concurrent users with >95% updates under 1s.

Risks and mitigations
- Risk: Alert noise. Mitigate by thresholds and dedupe windows; user‑level mute.

---

## Phase 4 — Maintenance & Telematics (Sprints 8–9)

Problem statement
- Unplanned downtime due to reactive maintenance; lack of integrated service scheduling impacts delivery reliability.

Objectives (why)
- Reduce breakdowns via preventative/predictive maintenance using telematics.
- Auto‑reschedule deliveries when vehicles go down.

Scope (what)
- Telematics ingestion (engine hours, tire pressure, DTC codes) via providers or OBD.
- Maintenance thresholds and simple ML heuristics; maintenance calendars; rescheduling automation.

How (approach)
- Normalize telematics payloads; compute health scores; create alerts when thresholds exceeded; schedule maintenance jobs; trigger task reassignments.

Deliverables
- Maintenance views, alerts, and job tickets; rescheduling flows.

Acceptance criteria (DoD)
- Alerts generated within 2 minutes of anomaly; impacted tasks re‑planned with audit.

Risks and mitigations
- Risk: Provider variability. Mitigate by building a translation layer with tests per provider.

---

## Phase 5 — Hardening & Scale (Sprints 10–11)

Problem statement
- Need production‑grade resilience, compliance, and cost controls as scale and user base grow.

Objectives (why)
- Improve availability, DR posture, and observability; align with privacy/security requirements.

Scope (what)
- Error budgets and SLO enforcement; incident runbooks.
- DR: backups, RTO/RPO targets verified; failover rehearsal.
- Cost/performance: Cache tuning; matrix cost model; API quotas.
- Compliance prep: Audit trails, access reviews, retention enforcement.

Deliverables
- SLO dashboards and alerting; DR test report; cost dashboards; audit evidence pack.

Acceptance criteria (DoD)
- SLOs met over 30‑day window; successful DR drill within targets; monthly cost within budget; privacy/retention controls enforced.

---

## Cross‑cutting practices (all phases)
- Definition of Ready: Story has problem statement, acceptance criteria, test plan, telemetry plan, and design notes.
- Definition of Done: Code + tests merged, docs updated, dashboards/alerts configured, UAT sign‑off recorded.
- Metrics: Capture SLIs for each epic; publish per sprint with trend.
- Security: Threat model review when introducing new external integrations.
- Documentation: Keep `technical-requirements` and `planning/codex` assets current; export n8n flows to Git per release.

## Dependencies and sequencing
- Phase 0 unblocks everything by fixing environment and schemas.
- Phase 1 depends on Phase 0; Phase 2 depends on sample data and basic scheduling from Phase 1; later phases can proceed in parallel slices where risk is low.

## Estimation guidance
- S: 1–2 days; M: 3–5 days; L: 6–10 days; XL: 10+ days. Reassess after each spike.
