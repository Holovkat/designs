# Architecture — FMS Warehouse Delivery (Technical Requirements)

Decision drivers
- App data + realtime: Convex for low-latency queries, reactive subscriptions, and simple serverless functions.
- Reporting/history: PostgreSQL for OLAP-ish queries, joins, exports, and BI tooling.
- Integrations: n8n as Integration Hub (queue mode, Redis), Kafka-compatible backbone (Redpanda locally) for durable events and fanout.
- Mobile/web UX: Real-time updates (Convex subscriptions + WebSockets), offline-friendly driver app.

High-level components
- Client apps
  - Dispatcher/Manager web app.
  - Driver mobile app (Android/iOS) with offline, scanning, navigation handoff.
  - Customer portal (read-only, POD confirm).
- Backend
  - Convex application logic (queries, mutations, actions) — authoritative app state for operations.
  - Event Backbone (Kafka API) for domain events and re-optimization triggers.
  - n8n Integration Hub for ERP/CRM/webhooks, outbound status/POD, reconciliation.
  - Router service using OR-Tools + matrix (OSRM/Valhalla/provider).
  - Telemetry engine for GPS map-matching, geofencing, delay prediction.
  - Reporting DB (PostgreSQL) fed by events/ETL for analytics and audits.
- Object storage (S3-compatible) for POD artifacts.

Configuration and secrets
- DB‑driven config: `app_config`, `feature_flags`, `secrets` in Convex with audit and versioning; runtime cache + event invalidation.
- Minimal env only for bootstrap (DB/Redis/broker endpoints, n8n encryption key). All other app knobs are stored and edited in DB.

Data flow
- Write path: Client → Convex mutation → Outbox row in Convex → Integration Bridge pulls outbox → publishes `fms.*` event → downstream consumers (Scheduler/Router/Reporting ETL) → Convex and/or Postgres updates.
- Read path: Clients subscribe to Convex queries; dashboards can also consume WebSocket feed for telemetry.
- Sync to Postgres: Event-driven ETL writes normalized tables; nightly reconciliation job verifies parity.
 - Config changes: Admin updates config via Settings UI → Convex persists and emits `fms.config.changed.v1` → services invalidate caches and re‑apply.

Multi-tenancy and security
- Tenant isolation at data layer (Convex tables scoped by tenantId; Postgres schemas per tenant or row-level security).
- RBAC enforced in Convex functions; service-to-service auth via mTLS/JWT.

Non-functional targets
- See `slos.md`; adhere to P95 latencies for routing, telemetry, and status updates.
