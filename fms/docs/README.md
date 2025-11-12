# FMS Documentation Index (Overarching Guide)

Status
- Spec Freeze v1.0: 2025-11-11 — see plan/spec-freeze-v1.0.md

Purpose
- Provide a single entry point that ties requirements, design, UI, data, integrations, settings, and APIs together.
- Explain folder structure, how artifacts relate, and the delivery roadmap. Written for both humans and agents.

Repository structure (docs)
- requirements/ — source requirements and linked version
- plan/ — roadmap, phases, sprints, checklists
- traceability/ — requirements ↔ specs/artifacts matrix (RTM)
- domain/ — domain specs (orders lifecycle, industry addenda)
- ui/ — front‑end, driver app, admin settings, reports UI
- technical/ — traffic/ETA/nav, other technical plans
- data/ — ERDs, Convex collections, Postgres DDL
- integrations/ — N8N hub spec + JSON Schemas
- settings/ — JSON Schemas for tenant‑configurable features (themes, alerts, planning, etc.)
- api/ — OpenAPI and endpoint stubs

Quick links
- Requirements (linked): requirements/warehouse-delivery-linked.md:1
- Spec Freeze: plan/spec-freeze-v1.0.md:1
- Roadmap & phases: plan/roadmap.md:1
- RTM (traceability): traceability/rtm.md:1
- UI (web): ui/front-end-spec.md:1
- Traffic/ETAs/Voice nav: technical/traffic-and-navigation.md:1
- Driver app: ui/driver-app-spec.md:1, ui/driver-exceptions-spec.md:1
- Orders lifecycle: domain/orders-lifecycle.md:1
- Compliance (AU standards): compliance/au-standards.md:1
- Data model: data/erd.md:1, data/schemas/convex-collections.yaml:1, db/*.sql
- Integrations hub: integrations/integration-hub.md:1 (+ schemas/)
- Admin (schema‑driven): ui/admin-settings-spec.md:1 (+ settings/schemas/*.json)
- Reports: ui/reports-spec.md:1, api/reports.md:1
- OpenAPI: api/openapi.yaml:1

How artifacts fit
- Requirements → Linked spec (requirements/warehouse-delivery-linked.md) references the original and points to the corresponding design and implementation artifacts.
- RTM → Shows every requirement/AC mapped to specs, schemas, APIs, and tests (to be added) for clear coverage.
- Plan/Roadmap → Phases and sprints with checklists referencing artifacts to implement/verify.

Delivery governance
- Changes to settings use schema‑driven Admin forms with changesets (draft→validate→approve→apply) and emit config change events.
- Interfaces documented in OpenAPI and JSON Schemas; keep these in lockstep with code.

Team handoffs (party members)
- Product (PM): owns plan/roadmap, RTM coverage checks.
- Architect (Winston): owns domain & technical documents, data model.
- UX (Sally): owns UI specs & wireframes.
- Developer (Amelia): implements against specs; keeps API/DDL in sync.
- QA (Quinn): verifies ACs and RTM linkage; adds test plans later.

Read me first
- For a quick tour, start at requirements/warehouse-delivery-linked.md, then plan/roadmap.md, then traceability/rtm.md.
