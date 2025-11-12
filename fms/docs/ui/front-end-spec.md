# Front-End Spec (Launch) — Dashboard/Map, Scheduling Gantt, Orders, Route Optimization

Purpose
- Specify launch UI for the features prioritized in warehouse-delivery.md.
- Define data contracts, interactions, accessibility, performance, and acceptance targets.

Global shell & navigation
- Floating top menu (sticky header): brand/tenant switcher (left), primary nav (center), user/actions (right).
- Primary nav: Dashboard, Scheduling, Orders, Routes, Alerts, Reports, Admin.
- Landing page: role‑aware tiles (Dispatcher, Manager, Operator) with key KPIs and quick links.
- Panels: resizable, dockable sub‑panels (map/list, Gantt/details) with draggable split; persistent per‑user layout.

Responsive & layout
- Breakpoints: sm ≤ 600px (single column), md ≤ 960px (stacked panels), lg ≤ 1280px (two panels), xl > 1280px (two panels + side drawer).
- Layout engine: CSS Grid + draggable split for resizable panels; panels collapse to tabs on sm.

Stack
- Web: React + TypeScript, TanStack Query, Convex client live queries, MUI components.
- Map: Google Maps JS API (TrafficLayer, polylines) per docs/technical/traffic-and-navigation.md.

Theming (tenant configurable)
- Setting: themes (choose 1 of 10 presets) in docs/settings/schemas/theme-settings.schema.json.
- 60:20:10 ratio rule:
  - 60% background/surfaces (neutral/background color scale)
  - 20% text/primary UI elements (high‑contrast on background)
  - 10% accent (buttons, highlights)
- Implemented via CSS variables; live switch without reload; WCAG AA/AAA contrast checks baked into presets.

<a id="dashboard-map"></a>
## 1) Live Dashboard + Fleet Map (2.6.1–2.6.4, 2.4.1)

Goals
- Live fleet view with 15s GPS refresh, congestion overlay, status coloring, KPI widgets, and alert triage.

Data contracts
- Vehicles stream: `GET /api/v1/vehicles/{id}/track` (last known) + live Convex subscription for `positions` (aggregated).
- Routes: live query for active `route_plans` + `route_stops` (eta, status).
- KPIs: Convex reads or MVs: on-time rate, active vehicles, ETA variance.
- Alerts: `GET /api/v1/alerts?severity=&type=&zoneId=` live query.

Interactions
- Map
  - Toggle layers: Vehicles, Routes, Geofences, Traffic.
  - Click vehicle → drawer with current task, route leg, ETA, deviations.
  - Click route → show polyline, stops list, delays by segment.
- KPI widgets
  - Click-through to filtered views (delayed, exceptions, idle vehicles).
  - Export PNG/CSV snapshot.
- Alerts panel
  - Filters: severity/type/recency; actions: Re-route, Assign backup, Acknowledge.

Performance & accessibility
- P95 initial render ≤ 3s; live updates ≤ 1s; map interactions ≤ 100ms.
- WCAG 2.1 AA: focus order, semantic regions, keyboard shortcuts (layer toggle, alert navigation), color-contrast safe palette.

Acceptance
- Traffic overlay visible and matches Google layer; KPI updates ≤ 10s; alert actions audit-logged.

Wireframe (Web UI, ASCII)
```
╔══════════════════════════════════════════════════════════════════════════════╗
║ Top Bar: [Brand ▾Tenant]  Dashboard | Scheduling | Orders | Routes | Alerts ║
║          Reports | Admin                                    [Search] {User} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ KPI STRIP: [ActiveVeh] [On‑time%] [ETA Δ] [Pending] [Alerts]   [Export ▼]   ║
╠══════════════════════════════╦══════════════════════════════════════════════╣
║ Layers: ✓Vehicles ✓Routes ✓GF ✓Traffic  ◇Clusters ◇Heatmap                  ║
║ ┌───────────────────────────┐ ║ ┌──────── Alerts Panel ────────┐            ║
║ │ Google Map (Traffic on)  │ ║ │ CRIT (3)  High(5)  Med(12)   │            ║
║ │ • Status‑colored markers │ ║ │ • Delay >15m: TKR‑02         │            ║
║ │ • Congestion‑tinted line │ ║ │ • Geofence breach: VIC‑E     │            ║
║ │ • Click→Drawer details   │ ║ │ • Breakdown: TKR‑03          │            ║
║ └───────────────────────────┘ ║ └──────────────────────────────┘            ║
╚══════════════════════════════╩══════════════════════════════════════════════╝
Legend: status colors; congestion ramp; export snapshot button on KPI strip.

<a id="kpi-export"></a>
KPI Export (ASCII)
```
┌──────── KPI: On‑time Rate ────────┐
│ 96.2%  ▼ timeframe: Today         │
│  Trend: ▄▅██▇█▇                   │
│  [Export PNG] [Export CSV]        │
└───────────────────────────────────┘
Notes:
- PNG captures the rendered widget with timestamp.
- CSV exports the underlying metrics (timestamp,value) for the selected timeframe.
```
```

## 2) Scheduling + Gantt (2.2.1–2.2.2)

Goals
- Auto schedules within 5 minutes; conflict detection; drag/drop with audit; what-if later.

Data contracts
- Schedules: live query over `delivery_tasks` + `route_plans` for date/zone.
- Conflicts: derived from capacity/shift/window checks; endpoint `GET /api/v1/schedules/conflicts?date=&zoneId=`.
- Actions: `POST /api/v1/schedules/{routeId}/assign` (driver/vehicle), drag/drop reorder (PATCH route stops), reschedule trigger.

Interactions
- Gantt swimlanes: Vehicle lanes; tasks as bars colored by status/priority.
- Drag/drop task between vehicles; confirm capacity & shift; conflicts shown inline.
- Right pane: task details, impact preview (ETA/cost deltas), Commit/Undo.

Performance & accessibility
- P95 zoom/scroll ≤ 50ms; drag feedback ≤ 50ms; virtualization for >500 tasks.
- Keyboard drag/drop alternative (move to next lane; arrow adjust start/end within constraints).

Acceptance
- Ingestion→schedule P95 ≤ 5m; manual changes audited; conflicts surfaced with clear reason codes.

Wireframe (Web UI, ASCII)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ DATE / ZONE FILTERS      │ CONFLICTS: 3 (capacity, shift, window)           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Vehicle: VIC‑WEST‑TKR‑01  |████ Task #123 (08:00–09:15) ████ Task #145      │
│                            ^ drag handle     ^ conflict badge               │
│ Vehicle: VIC‑WEST‑TKR‑02  |   ███ Task #131       ████ Task #152            │
│ Vehicle: VIC‑WEST‑TKR‑03  |      ▒▒▒ Break/Other (planned detour)          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Right Pane: Task Details                                                     │
│  • Order/Stops • Capacity fit • Shift check • ETA impact • Cost delta       │
│  Actions: [Commit] [Undo] [Re‑opt subset]                                   │
└──────────────────────────────────────────────────────────────────────────────┘
Legend: █ scheduled task bar; ▒ non‑FMS stop; badges show priority/status.
Keyboard: arrows move selection; Alt+↑/↓ reassign lane; Enter opens details.
```

Exports (Schedules)
- Export actions: [Export PDF] [Export Excel] on the Gantt toolbar; respects current filters (date/zone/vehicle).
- Dialog (options): include conflicts, include capacity %, page size (A4/Letter), orientation (Portrait/Landscape); theme preview.
- Endpoint integration: `GET /api/v1/reports/schedules.pdf?date=&zoneId=&vehicleGroup=` (and `.xlsx`).

<a id="order-ingestion"></a>
## 3) Order Ingestion & Management (2.1.1–2.1.2)

Goals
- Manual create + CSV/JSON upload; confirm ≤ 30s; validation with actionable errors.

Data contracts
- Create: `POST /api/v1/orders` (server-managed dedupe: external_order_id + fingerprint).
- Upload: `/api/v1/orders:upload` accepts CSV/JSON; returns batch results (200 + results[] schema).
- Order detail: timeline of states, items, constraints, stops, events.

Interactions
- Upload wizard: field auto-map, preview, submit, results panel with per-row status and retry for failures.
- Order detail: actions (Firm/Defirm with policy), Cancel (with reason), Split (create child tasks), View POD.

Performance & accessibility
- Upload parse ≥ 10k rows with streaming; show progress; keyboard navigation for mapping.

Acceptance
- Valid upload ingested; duplicates replay prior result; per-row errors list schema paths; firm/defirm respects freeze policy.

<a id="order-upload-wizard"></a>
Order Upload Wizard (ASCII)
```
Step 1: Select File
┌────────────────────────────────────────────┐
│ [ Browse… ] orders_2025-11-11.csv          │
│ File type: CSV (also accepts JSON batch)   │
│ [Next]                                     │
└────────────────────────────────────────────┘

Step 2: Map Fields (auto-mapped)
┌────────────────────────────────────────────┐
│ CSV Column            →  System Field      │
│ external_id          ✔  external_order_id │
│ account_code         ✔  account.code      │
│ order_type           ✔  order_type        │
│ priority             ✔  priority          │
│ pickup_addr          ✔  pickup.address    │
│ drop_addr            ✔  dropoff.address   │
│ items_json           ✔  items[]           │
│ notes                ⚙  notes (optional)  │
│ [Validate Sample] [Back] [Next]           │
└────────────────────────────────────────────┘

Step 3: Preview & Validate
┌────────────────────────────────────────────┐
│ Row  Status     Message                    │
│ 1    Accepted   order_id O‑42              │
│ 2    Duplicate  fingerprint match          │
│ 3    Error      missing dropoff.address    │
│ …                                          │
│ [Download Errors CSV] [Back] [Submit]      │
└────────────────────────────────────────────┘

Step 4: Results
┌────────────────────────────────────────────┐
│ Summary: total 500 • accepted 476 • failed 24 │
│ Retry: [Export Failed Rows Template]       │
│ [Close]                                    │
└────────────────────────────────────────────┘

Notes:
- Validation uses server‑managed dedupe (external_order_id + fingerprint).
- “Download Errors CSV” includes row, field path, and reason code.
- Large files stream; show progress and allow cancel.
```

<a id="route-optimization"></a>
## 4) Route Optimization Controls + Detail (2.3.1)

Goals
- Optimize up to 50 stops; show alternatives; respect windows, capacity, priority; re-opt triggers with approval.

Data contracts
- Optimize: `POST /api/v1/routes/optimize` with stops, constraints; returns alternative routes (polyline, ETAs, cost).
- Re-optimize: `POST /api/v1/routes/{routeId}/reoptimize` (subset or whole route).
- Telemetry-assisted ETAs: see traffic plan.

Interactions
- Route panel: stops list with time windows; “Optimize” → options (Fastest/Shortest/Current).
- Proposal diff: KPIs vs current (distance, time, cost, on-time %); Accept/Reject with reason.

Performance & accessibility
- Compute P95 ≤ 10s for 50 stops; Accept applies in ≤ 1s to UI.

Acceptance
- Alternatives displayed with clear KPIs; choosing applies and updates driver.

Proposal Diff Panel (ASCII)
```

<a id="reports-entry"></a>
## 5) Reports (Entry & UI)

Goals
- Provide a central Reports page to run exports (Schedules, KPI Snapshots, Alerts Log, Delivery Performance, Utilization & Deviation) aligned to on‑screen filters.

Entry points
- Top nav: Reports.
- Contextual: Dashboard KPI widget [Export ▼], Gantt toolbar [Export ▼], Alerts Inbox [Export CSV], Delivery Performance link from Orders.

Reports Landing (Web UI, ASCII)
```
╔════════ Reports ════════╗
║ [Date ▾] [Zone ▾] [Vehicle Group ▾] [Account ▾] [Timezone ▾]  [Run]       ║
║ ┌───────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐      ║
║ │ Schedules │  │ KPI Snapshot │  │ Alerts Log    │  │ Performance   │      ║
║ │  PDF/XLS  │  │  PNG/CSV     │  │  CSV/PDF      │  │  PDF/CSV      │      ║
║ └───────────┘  └──────────────┘  └───────────────┘  └───────────────┘      ║
║  [Utilization & Deviation (PDF)]                                           ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

Behavior
- Run uses the chosen report tile + filters to call the corresponding `/reports/*` endpoint.
- Server renders PDF/PNG with tenant theme; CSV/XLSX stream with headers including timezone.
- Audit: record who/when/filters; watermark PDFs for non‑manager roles.
┌──────── Route Proposal ────────┐
│ Current vs Proposed            │
│ Distance:   156 → 142 km  ▼‑9% │
│ Time:       4:05 → 3:42   ▼‑10%│
│ Cost (AUD):  $375 → $341  ▼‑9% │
│ On‑time %:   92% → 96%    ▲+4  │
├────────────────────────────────┤
│ Changes                        │
│ • Swap Stop #5/#6 (window fit) │
│ • Detour M1 (congestion ‑15m)  │
│ • Reassign Task #145 to TKR‑02 │
├────────────────────────────────┤
│ [Accept] [Reject]  Reason: ___ │
└────────────────────────────────┘
```

---

## Design Tokens & Components
- Tokens: typography scale, spacing, color (status/priority/alerts), map color ramp (congestion).
- Components: Map, KPIWidget, AlertsList, Gantt, DataGrid, StopList, ProposalDiff, UploadWizard, Drawer, Toast, Dialog.

## Error/Empty/Skeleton States
- Map empty: “No active vehicles” with quick links (select date/zone).
- Gantt empty: “No schedules yet” + ingestion link.
- Upload errors: show row number, field, rule, suggestion.

## Analytics & Audit
- Events: dashboard.view, alert.action, schedule.drag, optimize.run, optimize.accept, order.upload, order.firm.
- Audit trails: all assignment/approval changes captured in audit_log with before/after.

## Security & Privacy
- JWT + role (dispatcher, manager, operator); zone scoping; carrier_user restricted to assignments.
- No secret keys in client; Directions/Matrix calls server-side only.

## Links
- Traffic/Navigation plan: docs/technical/traffic-and-navigation.md
- Orders lifecycle: docs/domain/orders-lifecycle.md
- Integration hub: docs/integrations/integration-hub.md

## Landing Page (Web UI, ASCII)
```
╔════════════════════════════════════════════╗
║ [Brand]  ▾Tenant  | Dashboard | …         ║
╠════════════════════════════════════════════╣
║  Dispatcher                               ║
║  ┌───────────────┐  ┌───────────────┐     ║
║  │ Scheduling    │  │ Live Map       │     ║
║  │ Conflicts: 3  │  │ ActiveVeh: 62 │     ║
║  └───────────────┘  └───────────────┘     ║
║  Manager                                  ║
║  ┌───────────────┐  ┌───────────────┐     ║
║  │ KPIs          │  │ Reports        │     ║
║  └───────────────┘  └───────────────┘     ║
╚════════════════════════════════════════════╝
```

<a id="alerts-inbox"></a>
## 5) Alerts — Toasts and Inbox (2.6.3)

Goals
- Surface important events as non‑blocking toasts with deep links; maintain an Inbox/Log screen to triage, acknowledge, shelve, and archive items.

Toasts (web UI behavior)
- Non‑modal toasts appear bottom‑right (desktop), top‑center (mobile), stacking up to 3.
- Content: severity icon, concise message, primary action (View), secondary (Acknowledge). Auto‑dismiss after N seconds (severity‑based); persisted to Inbox regardless.
- Clicking View navigates to the relevant entity (route, task, vehicle, integration run) and highlights context.
- Rate‑limit and dedupe identical messages within a window; group bursts into a summary toast.

Inbox / Log screen
- Folders: Inbox (unread), Read, Shelved (snoozed), Archived.
- Bulk actions: Acknowledge, Shelve (duration), Archive, Assign (owner), Add note.
- Filters: severity, type (delay, geofence, breakdown, processing error), entity, zone, time.
- Row shows: severity, title, source (service/flow), entity ref, occurred_at, owner/state.
- Detail drawer: full message, related events, quick actions, audit trail.

Wireframe (Web UI, ASCII)
```
╔══════════════════════════════════════════════════════════════════════╗
║ Top Bar …                                                            ║
╠══════════════════════════════════════════════════════════════════════╣
║ Inbox ▸  Read ▸  Shelved ▸  Archived      Filters [Type][Severity]   ║
╠══════════════════════════════╦═══════════════════════════════════════╣
║ List                         ║ Details                               ║
║ • CRIT Delay >15m  TKR‑02    ║ Title: Delay >15m                     ║
║ • HIGH Geofence breach VIC‑E ║ Entity: Route #R‑19 (TKR‑02)          ║
║ • MED  Processing error CSV  ║ When: 10:42:13                        ║
║                              ║ Actions: [Acknowledge] [Shelve 1h]    ║
║                              ║          [Archive] [Assign ▾]         ║
╚══════════════════════════════╩═══════════════════════════════════════╝
```

Data sources / processes / validations / destinations
- Sources: Convex `alerts` collection; integration error logs from n8n (webhook executions, SFTP ingest results).
- Processes: toast dedupe/throttle; grouping; persisted state machine for alert item (unread → read/shelved/archived).
- Validations: RBAC (zone/carrier scope), retention policy, PII stripping for messages.
- Destinations: audit_log entries for user actions; outbound notifications (optional) when assigned/acknowledged.

Accessibility & performance
- Toasts are ARIA live region polite; keyboard focus restored after action.
- Inbox list virtualized for >5k items; actions available via keyboard; P95 row action ≤ 100ms.

Toast style (Web UI, ASCII)
```
Bottom‑right (stack up to 3)

┌──────────────────────────────────────────┐
│ ⛔ CRITICAL: Delay >15m on TKR‑02        │
│ ETA 09:45 → 10:00 (+15m)                │
│ [View]  [Acknowledge]         00:12 ▮▯  │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ ⚠ HIGH: Geofence breach VIC‑E           │
│ Route R‑19 exited zone (2.3 km)         │
│ [View]  [Acknowledge]         00:08 ▮▯  │
└──────────────────────────────────────────┘

Rules:
- CRITICAL auto‑dismiss 20s; HIGH 12s; MED 8s; LOW 5s (configurable).
- Clicking View routes to entity and closes toast; Acknowledge moves item → Read.
- Dedupe identical messages within 60s (configurable), otherwise group into a summary toast.
```

Admin forms (Alerts & Themes)
- Admin ▸ UI ▸ Themes
  - Choose preset (10 themes); live preview panel; save to tenant theme settings (60:20:10 enforced; AA contrast check).
  - Advanced: override colors with validation (contrast checker).
- Admin ▸ Alerts
  - Toast config: auto‑dismiss durations per severity; dedupe window; max stack; enable/disable toasts per type.
  - Inbox config: retention days; default folder for new items; escalation (send Email/SMS via ClickSend on CRITICAL if unacknowledged > X min).
  - Mapping: alert types → default actions; owner assignment rules; zones/carriers scopes.
