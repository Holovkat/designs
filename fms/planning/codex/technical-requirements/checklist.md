Epic - Documentation
Phase 0 - Prep.
 [x] - Create architecture and infrastructure docs
 [x] - Add ERD and data models
 [x] - Document DB-driven configuration policy

Phase 1 - Review
 [ ] - Stakeholder review of technical pack
 [ ] - Update docs per feedback


Epic - Technical Shard Documentation
  Phase 0 - Prep.
   [x] - Define API surface and events
   [x] - Document Convex↔Postgres sync
   [x] - Add config & feature flag models and `config.changed` event

  Phase 1 - Review
     [ ] - API contract review (backend/web/mobile)
     [ ] - Event schema review (integration/routing)


Epic - Infrastructure Implementation

  Phase 0 - Prep.
   [x] - Provide Docker Compose with profiles
   [x] - Configure n8n queue mode and Redis
   [x] - Enforce minimal env-only bootstrap; seed config in DB

  Phase 1 - Review
     [ ] - Validate local stack healthchecks
     [ ] - Security baseline review (secrets, TLS plan, secrets in DB encrypted)


Epic - Execution

  Phase 0 - Prep.
   [x] - Seed backlog Phase 0–2
   [x] - Define SLOs and monitoring plan

  Phase 1 - Review
     [ ] - Sprint 1 UAT: ingestion + dashboard skeleton
     [ ] - Sprint 1 UAT: settings UI edits config and propagates live
     [ ] - Close sprint with demo and sign-off

  Phase 2 - Prep.
   [ ] - Routing spike results documented
   [ ] - Select matrix provider vs OSRM/Valhalla

  Phase 3 - Review
     [ ] - Sprint 2–3 UAT: scheduling + POD + ERP flows
     [ ] - Sprint 4–5 UAT: routing + realtime + KPIs

Note: Mark items done only after UAT is accepted by the user/reviewer.
