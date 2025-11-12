# FMS MVP Specification Summary Report — Response to warehouse-delivery.md

Date: 2025-11-11
Audience: Product Owner (source: `warehouse-delivery.md:1`)
Status: Spec Freeze v1.0 (see `docs/plan/spec-freeze-v1.0.md:1`)

## Executive Summary
This report presents a practical plan that turns the original requirements into an implementable MVP. We have produced a complete set of specifications and linked artifacts, now frozen for delivery. Operational data will live in Convex, reporting and telemetry will live in Postgres with PostGIS, and N8N will sit at the edge to broker integrations. Routing and traffic come from Google Maps, notifications from ClickSend, and authentication and billing from Clerk and Stripe. We also seeded Australian zones with a Queensland focus and aligned with Australian standards. The following sections follow the original requirement order and explain how each capability will be delivered, which artifacts support it, and when it lands.

## How to Use This Report
The structure follows the sections in `warehouse-delivery.md`. Each subsection explains what the requirement means, how we will deliver it, where the detailed specification lives, and when it will be implemented. We end with cross‑cutting decisions, the delivery plan, open items, and a glossary.

## 1. System Overview
The FMS will serve Fleet Managers, Dispatchers, Drivers, and Warehouse Operators with a web application and a lightweight driver app. Operational data that changes frequently (orders, tasks, route plans, alerts) sits in Convex so the UI stays live without polling. Long‑term history and geospatial data (positions, geofences, snapshots, POD metadata) sit in Postgres with PostGIS. When something important happens, we record it as a domain event and deliver it reliably to any connected system through an outbox and N8N.

Artifacts
- Index and folder map: docs/README.md:1
- ERDs: docs/data/erd.md:1
- Operational model (Convex): docs/data/schemas/convex-collections.yaml:1

## 2. Functional Requirements

### 2.1 Integration with Order and Production Systems
The design provides automatic ingestion from enterprise systems, manual uploads when needed, and reliable outbound status to source systems. The approach is as follows:

• Point A: Accept orders from the ERP and handle retries gracefully.
  - Artifact 1: docs/integrations/integration-hub.md:1 — defines the ERP webhook with HMAC and batched JSON up to 10 MB, plus the SFTP CSV/JSON fallback.
  - Artifact 2: docs/integrations/schemas/order-ingest.schema.json — formal schema for inbound orders; the response schema documents per‑item results so partners can reconcile.
  - Decision: Idempotency is managed on the server using the external order identifier with a canonical fingerprint. Partners do not need to send an idempotency key.
  - Delivery: Sprint 1.

• Point B: Send delivery and planning events back to the ERP reliably.
  - Artifact 1: docs/integrations/integration-hub.md#outbound — describes the outbox→N8N delivery with retries and a dead‑letter queue.
  - Artifact 2: docs/integrations/schemas/outbound-event.schema.json — event envelope and fields.
  - Delivery: Sprint 1 foundation, expanded in Sprint 2.

• Point C: Manual upload for urgent cases and reconciliation for peace of mind.
  - Artifact 1: docs/ui/front-end-spec.md#order-upload-wizard — upload flow with column mapping, preview, and error CSV.
  - Artifact 2: docs/integrations/integration-hub.md#reconciliation — nightly comparison job and alerts.
  - Delivery: Sprint 1.

Related decisions: Notifications are sent via ClickSend. Historical data is retained for seven years, superseding the two‑year reference in the original document.

### 2.2 Delivery Scheduling
The system will schedule automatically while respecting priority, capacity, and driver availability, and it will offer a Gantt view for adjustments. The plan is:

• Point A: Optimise for cost while honouring constraints.
  - Artifact 1: docs/domain/orders-lifecycle.md:1 — defines the scheduling rules and service levels, including the five‑minute commit window after ingestion.
  - Decision: We begin with per‑kilometre and per‑minute costs. Refrigerated capacity, weight, volume, and pallets are enforced.

• Point B: Give dispatchers control with a clear timeline.
  - Artifact 1: docs/ui/front-end-spec.md (Scheduling/Gantt) — drag‑and‑drop adjustments with audit.
  - Artifact 2: docs/ui/front-end-spec.md (Alerts) — conflicts are raised with specific reasons.
  - Delivery: Sprint 1.

• Point C: Prepare for simulations without blocking MVP.
  - Artifact 1: docs/plan/roadmap.md — what‑if scenario tooling is planned for a later phase.

### 2.3 Route Optimisation and Routing
The routing capability will provide fast optimisation with alternatives and traffic‑aware updates, and drivers will receive voice guidance via native navigation. The approach is:

• Point A: Compute good routes quickly and offer a choice.
  - Artifact 1: docs/technical/traffic-and-navigation.md — Directions and Distance Matrix usage, caching, and limits.
  - Decision: Google is the map provider. Alternatives are enabled so dispatch can choose.

• Point B: Recover when traffic derails the plan.
  - Artifact 1: docs/technical/traffic-and-navigation.md#reopt-flow — re‑optimisation triggers when delay exceeds ten minutes and applies within thirty seconds once approved.
  - Delivery: Sprint 2.

• Point C: Give drivers reliable turn‑by‑turn guidance.
  - Artifact 1: docs/ui/driver-app-spec.md — deep links to Google or Apple Maps, with an in‑app step list and offline support via the native apps.

### 2.4 Real‑Time Tracking and Updates
Live tracking, geofences, and traffic‑aware updates are included at launch, with a pragmatic path to predictive maintenance. The plan is:

• Point A: Store high‑volume telemetry without slowing the app.
  - Artifact 1: db/002_reporting.sql:1 — partitioned tables for positions and geofence events.
  - Artifact 2: docs/ui/front-end-spec.md#dashboard-map — map overlays for vehicles, routes, geofences, and traffic.

• Point B: Keep ETAs current and react to delays.
  - Artifact 1: docs/technical/traffic-and-navigation.md#live-eta — the loop that updates ETAs using Distance Matrix and triggers re‑optimisation.
  - Delivery: Sprint 2.

• Point C: Establish maintenance signals at launch.
  - Artifact 1: docs/domain/maintenance-telematics.md:1 — rules for due‑soon and overdue alerts and how to block out vehicles for service.
  - Artifact 2: docs/integrations/mappings/telematics-csv.md:1 — a canonical CSV for SFTP ingestion.
  - Delivery: Hardening for the initial dashboard and scheduling integration.

### 2.5 Live Feedback on Delivery Status
Timely status, robust proof of delivery, and clear exception handling will be delivered in three layers:

• Point A: Keep statuses accurate and auditable.
  - Artifact 1: docs/domain/orders-lifecycle.md#state-machine — formal states and transitions.
  - Artifact 2: docs/ui/driver-app-spec.md — driver controls to raise and clear statuses.

• Point B: Capture proof reliably.
  - Artifact 1: docs/domain/orders-lifecycle.md#pod-scanning — mandatory GS1 scanning at pickup and drop‑off and rule‑driven photo and signature.
  - Decision: Photo and signature default to required at AUD 10,000 and above.

• Point C: Escalate exceptions quickly.
  - Artifact 1: docs/ui/front-end-spec.md#alerts-inbox — Alerts Inbox with acknowledge, shelve, and archive.
  - Artifact 2: docs/settings/schemas/alerts-settings.schema.json — configurable thresholds for notifications.
  - Delivery: Sprint 2.

### 2.6 Live Dashboard for Fleet Operations
A single view of the fleet with traffic, KPIs, alerts, and accessible design will be delivered as follows:

• Point A: A map that shows reality.
  - Artifact 1: docs/ui/front-end-spec.md#dashboard-map — map layers for vehicles, routes, geofences, and Google Traffic.

• Point B: Metrics that matter.
  - Artifact 1: docs/ui/front-end-spec.md#kpi-export — KPIs with PNG and CSV export.

• Point C: Actionable alerts.
  - Artifact 1: docs/ui/front-end-spec.md#alerts-inbox — toasts and Inbox with deep links to resolve issues.
  - Delivery: Basic dashboard in Sprint 1 with widgets and exports in Sprint 2.

## 3. Non‑Functional Requirements
Performance. The API will meet the 95th percentile under two seconds. WebSocket updates will reach one hundred concurrent users within one second. Re‑optimisation will complete within thirty seconds. Reports will finish within fifteen seconds for the target volumes. The complete plan and harnesses are in `docs/qa/performance-test-plan.md:1`.

Availability. The service will achieve 99.9 percent uptime. We will fail over to a secondary region in under five minutes. The recovery time objective is five minutes and the recovery point objective is one minute for live data. The strategy, runbooks, and synthetic checks are in `docs/technical/dr-ha-monitoring.md:1`.

Usability. The user interface follows WCAG 2.1 AA. Details are in `docs/ui/front-end-spec.md:1`.

Data privacy. We catalogue personal data, encrypt data in transit and at rest, and enforce retention. We support data subject access requests. Policies and settings are in `docs/security/security-privacy.md:1` and `docs/settings/schemas/privacy-settings.schema.json:1`.

Dashboard scalability. Metrics and tests appear in the Performance Test Plan.

## Architecture and Environments
This section sets out the architecture, infrastructure, and the shape of the development and production environments that the team will build against.

Application architecture
- Web app: React and TypeScript with MUI components. Live queries to Convex for operational data. Reports export through API.
- Driver app: React Native (Expo), deep‑links to Google or Apple Maps for voice navigation, GS1 scanning, and offline queueing.
- Services: Convex functions for domain logic and events. ETA and re‑optimisation workers for traffic. Admin Config API for schema‑driven settings.
- Data: Convex for operational state. Postgres/PostGIS for telemetry, snapshots, and reports. Object storage for POD artifacts.
- Integrations: N8N flows for ERP inbound and outbound events, ClickSend notifications, SFTP ingestion for telematics.

Infrastructure and environments
- Development: Docker Compose for local services (see planning/codex/technical-requirements/docker-compose.yml). Mock credentials and non‑production API keys. Optional shared Dev/Stage N8N.
- Staging: Dedicated cloud environment mirroring production size and topology. N8N in queue mode with workers. Managed Postgres with HA. Convex project configured for staging. Object storage buckets with short‑lived data.
- Production: Multi‑AZ web and worker replicas. Managed Postgres HA with a synchronous replica in region and an asynchronous cross‑region replica. Convex project in production. N8N webhooks and workers scaled horizontally. Object storage with versioning and replication. DNS and TLS managed by the cloud provider.
- Secrets: Stored in a cloud secret manager with KMS‑backed keys. Rotation policies documented in `docs/security/security-privacy.md:1`.
- Monitoring: SLOs and synthetic checks in `docs/technical/dr-ha-monitoring.md:1`. The specific monitoring stack can be Datadog or an open‑source alternative; the plan supports both.

Software, tools, and licenses (keys/accounts)
- Google Maps Platform keys for Directions, Distance Matrix, and JavaScript APIs (usage‑based billing).
- ClickSend account for SMS and email.
- Clerk and Stripe accounts for authentication and billing.
- Convex subscription for the operational data layer.
- Postgres/PostGIS and N8N are self‑hosted. React, TypeScript, and MUI are open‑source.
- Optional: OR‑Tools or a heuristic library for optimisation (open‑source).

Tenancy and zones
- Multi‑tenant with settings precedence across Tenant, Mode, Zone, and Mode‑within‑Zone. Australian zones are seeded with Brisbane, MacKay, and Townsville. See `docs/zones/au-qld-zones.yaml:1`.

Integrations and idempotency
- N8N orchestrates inbound and outbound flows with retries and a dead‑letter queue. The outbox pattern ensures reliable event delivery. The server performs de‑duplication using the external order identifier and a canonical fingerprint with a 24‑hour time to live. See `docs/integrations/integration-hub.md:1` and `docs/data/README.md:1`.

Admin settings and billing
- Administrators manage Themes, Alerts, Planning, Ingestion, Features, Reports, Billing, and Privacy through schema‑driven forms and a governed changeset workflow. The base plan includes 1,000 loads per month with top‑up packs (1,000 at 10 percent off and 5,000 at 15 percent off) and pay‑as‑you‑go at AUD 1.00 per load. Inline prompts appear at 90 and 100 percent usage. See `docs/ui/admin-settings-spec.md:1`, `docs/domain/auth-billing.md:1`, and `docs/settings/schemas/billing-settings.schema.json:1`.

## Delivery Plan
The specification is frozen at v1.0 (see `docs/plan/spec-freeze-v1.0.md:1`). Development begins on 13 November 2025. Sprint 1 runs to 26 November 2025 and covers the ERP webhook, manual upload, server‑managed idempotency, the core scheduler, Alerts Inbox, Admin Settings for Themes, Alerts, Planning and Ingestion, and the billing scaffold. Sprint 2 runs to 10 December 2025 and covers routing and re‑optimisation, the traffic overlay, driver status and GS1 scanning, report exports, ClickSend notifications, and initial telemetry overlays. Hardening and UAT run from 11 December to 19 December 2025 and cover DR/HA runbooks, performance targets, Stripe wiring, and polish.

## Party Review Notes (Consensus and editorial changes)
- Product Management: Keep the narrative focused on outcomes, not tool names. Actioned by framing each section as a capability with supporting artifacts and timelines.
- Architecture: Make environments and licensing explicit. Actioned in “Architecture and Environments,” including keys, accounts, and HA posture.
- UX: Ensure dashboard, alerts, and upload wizard remain prominent at MVP. Actioned by highlighting those artifacts in sections 2.1, 2.5, and 2.6.
- QA: Strengthen acceptance language and cross‑link to the performance plan. Actioned with the Non‑Functional Requirements section and explicit SLAs.
- Scrum Master: Reinforce Spec Freeze and milestones. Actioned with the freeze note and dates in Delivery Plan and `docs/plan/spec-freeze-v1.0.md:1`.

## Gaps and Assumptions
We will launch telematics through CSV or JSON over SFTP and select a provider integration later. We will decide on a monitoring stack (Datadog or an open‑source alternative) after MVP, although the SLOs and checks are already defined. We will rely on provider traffic heuristics rather than our own machine‑learning model for the first release. The option to use shorter telemetry retention for EU tenants is disabled by default, but the schema supports enabling it. All open items are tracked in `docs/gaps-questions.md:1`.

## Glossary
- ADG: Australian Dangerous Goods Code. National guidance on transporting dangerous goods.
- Admin changeset: A governed workflow to draft, validate, approve, and apply configuration changes.
- API: Application Programming Interface. A contract between software components.
- DLQ: Dead‑Letter Queue. A holding area for messages that cannot be processed.
- DR/HA: Disaster Recovery and High Availability.
- DSAR: Data Subject Access Request. A request to retrieve or delete personal data.
- ERP: Enterprise Resource Planning system.
- ETA: Estimated Time of Arrival.
- FMS: Fleet Management System.
- GHS: Globally Harmonized System of Classification and Labelling of Chemicals.
- GS1 / GS1‑128 / GS1 Digital Link: Global standards for identification and barcodes used in supply chains.
- GTIN: Global Trade Item Number. A GS1 identifier for trade items.
- HMAC: Hash‑based Message Authentication Code used to authenticate webhook requests.
- JWT: JSON Web Token. A compact token format used for authentication claims.
- KPI: Key Performance Indicator.
- MVP: Minimum Viable Product.
- N8N: A workflow automation platform used here as the integration hub.
- PII: Personally Identifiable Information.
- POD: Proof of Delivery.
- PostGIS: A geospatial extension for Postgres.
- RBAC: Role‑Based Access Control.
- RPO: Recovery Point Objective. The maximum tolerable period in which data might be lost.
- RTO: Recovery Time Objective. The target time to recover after an incident.
- SFTP: Secure File Transfer Protocol.
- SLA: Service Level Agreement.
- SLO: Service Level Objective.
- TTL: Time to Live. A period after which cached or deduplication data expires.
- UAT: User Acceptance Testing.
- WCAG: Web Content Accessibility Guidelines.

## Appendices
- Roadmap: `docs/plan/roadmap.md:1`
- Requirements Matrix: `docs/traceability/requirements-matrix.md:1`
- RTM: `docs/traceability/rtm.md:1`
