# Admin Settings UI Spec — Schema‑Driven Forms (Themes, Alerts, Planning)

Purpose
- Define the Admin Settings experience using JSON‑Schema–driven forms with scoped overrides (Tenant → Mode → Zone → Mode+Zone) and a governed changeset workflow.
- Cover two launch forms in detail: Themes and Alerts. Extendable to Planning/Firming, Ingestion, Features.

Architecture
- Config registry exposes available setting groups with schema refs.
- Admin UI renders forms from JSON Schemas using a React JSON‑Schema Form library with custom widgets/validators.
- Changes are made through changesets: draft → validate → approve → apply; all actions audited.

Navigation (Web UI)
- Admin ▸ Settings (left nav): Themes, Alerts, Planning, Ingestion, Features.
 - Admin ▸ Billing (separate): Plan selection, included loads, usage, invoices, top‑ups.
- Top controls: Scope selector chips [Tenant ▾] [Mode ▾] [Zone ▾]; Inherit toggle; Search.
- Main pane: Form generated from schema; field help; validation messages.
- Side pane: Live Preview (for Themes), Validation Results, Change Diff, Apply buttons.

Scope & Precedence
- Precedence: Tenant < Mode < Zone < Mode+Zone (most specific).
- UI shows effective value and indicates overridden fields. “Inherit” removes the override at the current scope.

Workflow
1) Create draft: user edits fields; changeset is created.
2) Validate: client + server validators run; errors block approval.
3) Approve: requires proper role; comment required; audit recorded.
4) Apply: settings persisted; fms.config.changed.v1 event emitted; live reload UI (CSS vars for theme).

Wireframe (ASCII)
```
╔════════ Admin ▸ Settings ════════╗  ╔════ Preview / Validation / Diff ════╗
║ [Tenant: DairyCo AU ▾] [Mode: road ▾] [Zone: VIC‑West ▾]  [Inherit ◇]     ║
║ ◉ Themes  ○ Alerts  ○ Planning  ○ Ingestion  ○ Features                   ║
║ ─────────────────────────────────────────────────────────────────────────  ║
║ Theme Preset:  [ sl ate ▾ ]                                               ║
║ background_60:  #0B1E2D   text_20: #DCE7F2   accent_10: #00B4D8            ║
║ Contrast:  AA ✓ (Text on Background)  Accent usage: 10% ✓                  ║
║ [Validate] [Save Draft] [Approve] [Apply]                                  ║
╚════════════════════════════════════════╝  ╚════════════════════════════════╝
```

Data contracts
- GET /api/v1/config/registry → list groups {id, title, scopeTypes, schemaRef}.
- GET /api/v1/config?scope=tenant|mode|zone&ids=… → current + effective configs.
- POST /api/v1/config/changesets {scope, group, values} → draft id.
- POST /api/v1/config/changesets/{id}/validate → {errors[], warnings[]} (server validators; contrast checks; alerts ranges).
- POST /api/v1/config/changesets/{id}/approve {comment}.
- POST /api/v1/config/changesets/{id}/apply.

Schema groups (examples)
- Theme: docs/settings/schemas/theme-settings.schema.json
- Alerts: docs/settings/schemas/alerts-settings.schema.json
- Planning: docs/settings/schemas/planning-settings.schema.json
- Ingestion: docs/settings/schemas/ingestion-settings.schema.json
- Features: docs/settings/schemas/features-settings.schema.json
 - Reports: docs/settings/schemas/reports-settings.schema.json
 - Billing: docs/settings/schemas/billing-settings.schema.json
 - Privacy: docs/settings/schemas/privacy-settings.schema.json

Admin ▸ Billing (stub)
<a id="admin-billing"></a>
- Overview tab: current plan (Monthly/Yearly), next invoice date, billing email, payment method.
- Allowance tab: included loads (default 1,000), usage this period, remaining, projected overage; buy Top‑Up Pack (buttons per catalog: 1,000 @10%, 5,000 @15%); PAYG toggle (if enabled).
  - Display PAYG price (AUD $1.00/load) and auto-calc projected overage cost at current run-rate.
- Invoices tab: invoice list with links to Stripe portal; proration notices for mid‑cycle changes.
 - Settings tab: billing address, tax info, alerts when usage crosses thresholds (default 90%, 100%), with inline “Buy Top‑Up” prompt at those thresholds.

Data contracts (billing)
- GET /api/v1/billing/summary → { plan, cadence, included_loads, used_loads, remaining, renewal_at }
- POST /api/v1/billing/topups → { pack_id } → Checkout link or client secret
- GET /api/v1/billing/invoices → list
 - GET /api/v1/billing/packs → top‑up catalog (ids, loads, discount)

Acceptance (billing)
- Included loads and usage reconcile with Stripe usage records.
- Proration reflected on plan changes; UI surfaces proration message.
 - Inline top‑up prompt appears at 90% and 100% usage by default (configurable via billing settings schema).

Custom validators
- Theme: WCAG AA contrast for text_20 on background_60; accent_10 usage capped to ~10% of UI.
- Alerts: durations within [2..120] seconds; dedupe window within [0..600]; max_stack [1..6].
- Planning: horizons and freeze non‑negative; on_horizon_breach in set; sea_handoff.required_fields recognized.
- Ingestion: dedupe_ttl_hours [1..168]; include_notes/metadata booleans.

Change Diff
- Before/After inline per field; highlight overrides vs inherited; show effective value after precedence merge.

Audit & Events
- Every action logs: who, when, scope, group, fields before/after.
- Emit fms.config.changed.v1 with {tenant_id, scope, group, diff} for listeners (web app, services) to refresh.

Acceptance Criteria
- Schema‑driven: new group appears by adding schema + registry entry; no code changes in form renderer.
- Validation: client shows inline messages; server validation must pass before approval.
- Apply: UI theme switches instantly via CSS variables; Alerts toasts obey new timings without reload.
- Accessibility: forms keyboard navigable; color pickers show contrast preview; ARIA roles for feedback.

Themes — details
<a id="admin-themes"></a>
- 10 presets listed; custom override allowed if tenant enables “advanced”.
- Color pickers with real‑time preview (panel + example widgets).
- Enforce 60:20:10: display utilization bars; warn if accent presence exceeds budget.

Alerts — details
<a id="admin-alerts"></a>
- Toast controls per severity (auto‑dismiss seconds), dedupe window, max stack.
- Inbox retention; escalation to ClickSend if CRITICAL unacknowledged > N minutes.
- Mapping table (future): alert type → default actions.

Links
- Settings scoping: docs/settings/README.md
- Schemas: see group list above
- Events: planning/codex/technical-requirements/apis.md (config endpoints, changed events)

---

<a id="admin-planning"></a>
## Planning Form (Firming, Freeze, Sea Handoff)

Goals
- Allow admins to configure planning horizons and freeze windows, auto‑firm behavior, and sea→AU handoff gating per scope (Tenant/Mode/Zone).

Form fields (from docs/settings/schemas/planning-settings.schema.json)
- firming_horizon_days: road (days), rail (days)
- freeze_window_hours (hours)
- on_horizon_breach: auto_firm_if_complete | always_raise
- default_auto_firm (bool)
- allow_order_override_auto_firm (bool)
- sea_handoff:
  - auto_create_au_leg (bool)
  - auto_firm_au_leg (bool)
  - match_strategy: by_booking_ref | by_external_order_id | by_container_id
  - required_fields: multiselect from defaults (container_ids, dg_class, UN_number, packing_group, discharge_port, customs_cleared, biosecurity_cleared, duties_and_taxes_settled, port_charges_settled) + custom entries

Wireframe (Web UI, ASCII)
```
╔════════ Admin ▸ Settings ▸ Planning ═══════════════════════════════════════╗
║ [Tenant: ChemCo AU ▾] [Mode: road ▾] [Zone: QLD‑Brisbane ▾]  [Inherit ◇]  ║
║ ────────────────────────────────────────────────────────────────────────── ║
║ Firming horizon (days):   Road [ 14 ]   Rail [ 21 ]                        ║
║ Freeze window (hours):    [ 48 ]                                           ║
║ On horizon breach:  (•) Auto‑firm if complete   ( ) Always raise           ║
║ Default auto‑firm:  [✓]    Allow order override: [✓]                       ║
║ ────────────────────────────────────────────────────────────────────────── ║
║ Sea → AU handoff                                                           ║
║  [✓] Auto‑create AU leg   [✓] Auto‑firm AU leg                             ║
║  Match strategy:  [ by_booking_ref ▾ ]                                     ║
║  Required fields: [container_ids] [dg_class] [UN_number] [packing_group]   ║
║                   [discharge_port] [customs_cleared] [biosecurity_cleared] ║
║                   [duties_and_taxes_settled] [port_charges_settled]        ║
║                   [+ Add custom]                                           ║
║ ────────────────────────────────────────────────────────────────────────── ║
║ [Validate] [Save Draft]                                  [Approve] [Apply] ║
╚════════════════════════════════════════════════════════════════════════════╝
```

Validation
- firming_horizon_days ≥ 0; freeze_window_hours ≥ 0.
- on_horizon_breach must be one of allowed values.
- sea_handoff.required_fields must be known or accepted as custom; provide suggestions and tooltips.
- Cross‑check: if auto_firm enabled, freeze window respected; warn if conflict.

Flows
1) Admin selects scope (e.g., Tenant + Mode road).
2) Edits fields; clicks Validate → client and server validators run; show inline errors.
3) Approve requires comment; Apply emits fms.config.changed.v1.
4) Live systems respond: Scheduler uses horizons/freeze; Ingestion/Handoff listens for sea_handoff changes.

Data sources / destinations
- Sources: GET config registry; GET current/effective planning config at scope.
- Destinations: Changeset persistence; config changed events; audit log.

Accessibility & performance
- All inputs keyboard accessible; radio buttons and checkboxes with labels.
- P95 Validate ≤ 300ms client; server validation ≤ 1s.

---

<a id="admin-ingestion"></a>
## Ingestion Form (Dedupe & Notes/Metadata)

Goals
- Configure server‑managed dedupe retention and whether `notes`/`metadata` are included in the canonical fingerprint, per scope (Tenant/Mode/Zone).

Form fields (from docs/settings/schemas/ingestion-settings.schema.json)
- dedupe_ttl_hours (default 24)
- include_notes_in_fingerprint (default true)
- include_metadata_in_fingerprint (default false)

Wireframe (Web UI, ASCII)
```
╔════════ Admin ▸ Settings ▸ Ingestion ═══════════════════════════════════════╗
║ [Tenant: DairyCo AU ▾] [Mode: road ▾] [Zone: VIC‑West ▾]   [Inherit ◇]     ║
║ ──────────────────────────────────────────────────────────────────────────  ║
║ Dedupe retention (hours):  [ 24 ]                                           ║
║ Include notes in fingerprint:      [✓]                                      ║
║ Include metadata in fingerprint:   [ ]                                      ║
║ Help: metadata often noisy; keep off unless required by partner.            ║
║ [Validate] [Save Draft]                                   [Approve] [Apply] ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

Validation
- dedupe_ttl_hours in [1..168]; booleans present.

Flows
1) Adjust fields per scope; Validate → Apply.
2) n8n ingestion flow reads settings and updates fingerprint logic immediately.

---

<a id="admin-features"></a>
## Features Form (Forecasting & UI Statuses)

Goals
- Toggle paid features and control which planning statuses appear in the Order creation UI.

Form fields (from docs/settings/schemas/features-settings.schema.json)
- paid_features.forecasting (bool)
- ui.allow_forecast_entry (bool)
- ui.allowed_order_creation_statuses (array of forecast|provisional|firm)

Wireframe (Web UI, ASCII)
```
╔════════ Admin ▸ Settings ▸ Features ════════════════════════════════════════╗
║ [Tenant: ChemCo AU ▾] [Mode: road ▾] [Zone: QLD‑Brisbane ▾]  [Inherit ◇]    ║
║ ──────────────────────────────────────────────────────────────────────────  ║
║ Forecasting (paid feature):   [ ] Disabled  (Enable to unlock Forecast UI)  ║
║ Allow Forecast entry (UI):    [ ]                                            ║
║ Allowed creation statuses:    [✓] Provisional   [✓] Firm   [ ] Forecast      ║
║ [Validate] [Save Draft]                                   [Approve] [Apply]  ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

Validation
- If forecasting disabled, force `ui.allow_forecast_entry = false` and remove `forecast` from allowed statuses.
- At least one creation status must be enabled.

Flows
1) Tenant enables forecasting later → Forecast statuses appear in UI and Orders creation dialog.
2) Disabling forecasting hides Forecast status; existing Forecast orders remain visible but creation disabled.

---

<a id="admin-reports"></a>
## Reports Form (Header/Footer/Watermark/Defaults)

Goals
- Configure report branding (header/footer text, optional logo override), watermark behavior, and default rendering options.

Form fields (from docs/settings/schemas/reports-settings.schema.json)
- header_text (string ≤ 120), footer_text (≤ 200)
- logo_url (optional https://)
- watermark: enabled (bool), text (≤ 60), opacity [0..1]
- defaults: pdf_page_size (A4|Letter), pdf_orientation (portrait|landscape), timezone, csv_delimiter (comma|semicolon|tab)

Wireframe (Web UI, ASCII)
```
╔════════ Admin ▸ Settings ▸ Reports ════════════════════════════════════════╗
║ [Tenant: DairyCo AU ▾]  [Inherit ◇]                                        ║
║ ─────────────────────────────────────────────────────────────────────────  ║
║ Header text:  [ Deliveries — {{date}} — {{zone}} ]                          ║
║ Footer text:  [ Generated by FMS • {{timestamp_tz}} ]                       ║
║ Logo URL:     [ https://cdn.example.com/tenant-logo.png ]                   ║
║ ─────────────────────────────────────────────────────────────────────────  ║
║ Watermark:     [✓] Enabled     Text: [ CONFIDENTIAL ]   Opacity: [ 0.15 ]  ║
║ Defaults:      Page [ A4 ▾ ]   Orientation [ landscape ▾ ]                 ║
║                Timezone [ Australia/Sydney ▾ ]  CSV delimiter [ , ▾ ]       ║
║ [Validate] [Save Draft]                                  [Approve] [Apply]  ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

Validation
- URL pattern for logo; watermark opacity [0..1]; known page sizes/orientations.
- Timezone must be valid (IANA); delimiter in allowed set.

Flows
1) Admin saves and applies changes; report exports immediately include updated header/footer/watermark and defaults.
2) If watermark enabled and role < manager, enforce watermark regardless of user choice within report UI.
