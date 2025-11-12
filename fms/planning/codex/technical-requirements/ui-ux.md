# UI/UX Requirements

Roles
- Fleet Manager: monitoring, KPIs, alerts, what-if.
- Dispatcher: scheduling, assignments, re-optimization, comms.
- Driver: tasks, navigation handoff, status, POD.
- Warehouse Operator: ingestion, bay readiness, reconciliation.
- Customer (portal): delivery tracking, confirmation.

Design principles
- Real-time feedback, low-latency updates; optimistic UI for status.
- Accessibility: WCAG 2.1 AA; keyboard nav and high-contrast mode.
- Mobile-first patterns for driver; large controls; offline tolerant.

Core screens
- Dashboard: live map, KPIs, alerts panel with one-click actions.
- Schedule: Gantt and list; drag/drop; conflict warnings.
- Route detail: stop list, ETAs, deviations, re-route proposals.
- Driver app: task list, barcode/QR scan, photo capture, signature.
- POD viewer: timestamped artifacts, hash, recipient confirmation.
- Settings: depots, vehicles, drivers, geofences.

Navigation handoff
- In-app map for context; deep-link to native nav (Google/Apple) with return link; record acceptance of re-route.

Localization
- Support i18n; time zones per depot; 24/12h time.

Telemetry UX
- Map-matching to roads; cluster markers; color by schedule health.

Settings UX (DB‑driven configuration)
- Information architecture
  - Left nav: groups (Routing, Telemetry, Dashboard, Integrations, Notifications, Security).
  - Search across keys; filters for scope (Global/Tenant/Env), status (Active/Deprecated/Locked).
  - Tabs: Settings, Feature Flags, Change Sets, History.
- Settings screen
  - Table list: key, current value, effective scope, group, description, last updated, status.
  - Edit drawer generated from registry: correct control per type (toggle/select/number/JSON editor), validation hints, min/max.
  - Scope selector (Global/Tenant/Env) if allowed; shows effective precedence and inherited value.
  - Preview pane: “Effective value for Tenant X in Env Y”.
  - Secrets: write‑only field with masked display; rotate action; stores ciphertext only.
- Feature flags screen
  - Toggle per flag, rollout percentage slider, targeting editor (segments, attributes), dependency checks.
  - Kill switch prominent; experiment metrics link.
- Change sets
  - Create draft → add multiple edits → validate (dry‑run) → submit for approval → schedule/apply.
  - Show diff vs defaults and effective values; attach reason and Jira ticket.
  - Rollback creates inverse change set.
- History
  - Timeline of changes with actor, reason, and diff; export as CSV.
- Permissions
  - Editable by roles per registry; audit every change.
- Live updates
  - On apply, UI shows toast and highlights keys updated; services react via `config.changed` without restart.
