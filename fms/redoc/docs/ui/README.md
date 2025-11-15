---
last-redoc-date: 2025-11-12T23:25:18Z
---
# UI Specifications

The UI folder contains launch-ready specifications for every surface area that touches dispatchers, admins, and drivers. Each spec describes flows, data contracts, UX patterns, accessibility targets, and performance SLAs derived from `warehouse-delivery.md`.

## Documents
- `front-end-spec.md` — Web dashboard, scheduling Gantt, order ingestion UI, route optimization panel, alerts inbox/toasts, KPI exports, and reports landing page. Includes ASCII wireframes, API dependencies, performance goals, and accessibility requirements.
- `admin-settings-spec.md` — Schema-driven Admin experience (Themes, Alerts, Planning, Ingestion, Features, Reports) plus Billing scaffolding. Details scope precedence, changeset workflow, validation, and preview panes.
- `driver-app-spec.md` — React Native app behaviors: authentication, task list, navigation deep links, GS1 scanning/POD, offline queueing, performance, and accessibility requirements.
- `driver-exceptions-spec.md` — Exception logging flows (delay, damage, address, weather, etc.), evidence capture requirements, dispatcher triage, and event contracts.
- `reports-spec.md` — End-to-end report/export experience covering Schedules, KPI snapshots, Alerts log, Delivery Performance, Utilization/Deviation, and POD artifacts.

## Using These Specs
- Product/design teams rely on the wireframes and interaction flows.
- Engineering references the API contracts, data sources, and performance SLAs.
- Admin-configured behavior (themes, alerts, reports, billing) is kept in lockstep with the JSON Schemas in `docs/settings/schemas`.

Together these documents guarantee a consistent user experience across dispatcher dashboards, admin consoles, and driver mobile flows.

