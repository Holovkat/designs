---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Documentation Tree Overview

This ReDoc run captured the entire `docs/` hierarchy using the reverse-tree method (leaf folders first, then parents). Each subfolder now has an up-to-date README under `redoc/docs/...`, summarizing the artifacts it contains so teams can navigate the design set without scanning every Markdown file.

## Highlights by Area
- **Domain & Requirements** — `docs/domain/` (orders lifecycle, auth/billing, industry addenda, maintenance) and `docs/requirements/` (warehouse-delivery linkage) lock functional scope to specific specs.
- **Technical & Data** — `docs/technical/` (traffic/ETAs, DR/HA, workflows) and `docs/data/` (ERDs, Convex schemas) describe how the platform is built and observed.
- **Integrations & Settings** — `docs/integrations/` (n8n hub, schemas, mappings) and `docs/settings/` (scoping rules + JSON Schemas) ensure external systems and admin controls stay synchronized.
- **UI/UX** — `docs/ui/` covers dispatcher dashboards, admin settings, driver app, exceptions, and reporting surfaces, all tied back to the API contracts in `docs/api/`.
- **Compliance, Security, and QA** — `docs/compliance/`, `docs/security/`, and `docs/qa/` document regulatory anchors, security posture, and performance test strategy.
- **Traceability & Planning** — `docs/traceability/`, `docs/plan/`, and `docs/work/` keep scope frozen, map requirements to artifacts, and track outstanding documentation debt.
- **Reference Data** — `docs/zones/` and `docs/settings/schemas/` define operational inputs (zones, settings), while `docs/integrations/schemas/` anchors payload contracts.

Each README includes `last-redoc-date` so future runs can detect drift. Use this index to jump into the folder that matches your question, then open the corresponding README to understand the contents before diving into detailed specs.

