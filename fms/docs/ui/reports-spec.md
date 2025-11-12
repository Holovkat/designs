<a id="reports"></a>
# Reports & Exports Spec (Launch)

Purpose
- Define initial reports and export capabilities aligned to warehouse-delivery.md (Schedules PDF/Excel, KPI PNG/CSV, Alerts CSV, Delivery Performance PDF/CSV, Utilization PDF). Server‑side rendering for reproducibility and branding.

Stack & Approach
- Data sources: Postgres MVs (KPIs, utilization, deviations), Convex read models (live states), nightly rollups.
- Rendering: PDF via headless Chromium (HTML + tenant theme CSS); CSV/Excel via streaming writers.
- Branding: Tenant theme (60:20:10) applied to headers, tables, charts; watermark rules per Reports settings.

<a id="report-list"></a>
## Reports (R1–R5)

<a id="report-schedules"></a>
- R1 Schedules Export (PDF/Excel)
  - Scope: date/zone; vehicle lanes; tasks with windows, ETAs, driver/vehicle, conflicts.
  - Filters: zone, vehicle group, status.
  - Columns: route_id, vehicle, driver, start, end, stops, capacity %, conflicts.
  - SLA: ≤ 10s for ≤ 500 tasks.

<a id="report-kpi"></a>
- R2 KPI Snapshot (PNG/CSV)
  - Metrics: on‑time %, active vehicles, ETA variance, pending tasks.
  - Export: widget PNG (timestamped, themed); CSV (timestamp,value,timezone).
  - SLA: ≤ 3s.

<a id="report-alerts"></a>
- R3 Alerts Log (CSV/PDF)
  - Fields: id, severity, type, entity, message, occurred_at, owner, state, resolved_at.
  - CSV stream for large ranges; PDF includes summary.

<a id="report-delivery"></a>
- R4 Delivery Performance (PDF/CSV)
  - Metrics: OTD, lateness, exceptions by reason, distance/time, utilization.
  - MVs refreshed nightly.

<a id="report-utilization"></a>
- R5 Utilization & Deviation (PDF)
  - Charts: utilization % by vehicle; deviation heatmaps (>5 min).
  - Map tiles rendered server‑side as static images.

<a id="report-pod"></a>
- R6 POD Artifacts (PDF/CSV)
  - Scope: per date/zone/account; keys include task_id, order_id, timestamps, signer name (if applicable), photo links, scan summaries.
  - Privacy: PII redaction where required; signed URLs/time‑boxed access for photos.
  - Retention: default 7 years (tenant-configurable).

Endpoints
- See docs/api/reports.md for `/api/v1/reports/*` endpoints.

Branding & Theming
- Apply tenant theme: settings/theme-settings.schema.json; enforce WCAG contrast.
- Watermark for non‑manager roles (settings/reports-settings.schema.json).

Acceptance Criteria
- Exports match UI filters; include timestamps and brand; pass contrast checks.
- CSV streaming handles ≥ 500k rows; PDF renders ≤ 15s typical.
