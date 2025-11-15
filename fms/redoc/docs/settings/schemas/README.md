---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Settings Schema Catalog

The JSON Schemas in this folder define the typed configuration surface that Admin Settings exposes via the changeset workflow. Every schema enforces tenant scoping rules (Tenant → Mode → Zone → Mode+Zone), validates data types, and feeds both the Admin UI forms and the `/api/v1/config/*` endpoints.

## Schemas
- `theme-settings.schema.json` — Tenant theme presets with the launch-mandated 60:20:10 color ratio and WCAG AA contrast checks.
- `alerts-settings.schema.json` — Toast dedupe windows, inbox retention, escalation providers (ClickSend), and severity-specific dismissal timers.
- `planning-settings.schema.json` — Firming horizons, freeze windows, sea-handoff gating fields, horizon breach behavior, and per-mode overrides.
- `ingestion-settings.schema.json` — Canonical fingerprint configuration, dedupe TTL, and whether optional fields (notes/metadata) contribute to duplicates.
- `features-settings.schema.json` — Paid feature toggles (forecasting) and UI controls such as which planning statuses can be created.
- `reports-settings.schema.json` — Header/footer text, watermark settings, PDF defaults, timezone, and CSV delimiter policy.
- `billing-settings.schema.json` — Included-load allowances, PAYG price, top-up catalog definitions, and inline alert thresholds (90%/100% usage).
- `privacy-settings.schema.json` — Retention windows for telemetry/orders/POD, analytics opt-in, EU short-retention defaults.
- `zone-settings.schema.json` — Placeholder for zone-level overrides beyond the schema-driven settings above; ties into zone import tooling.

## How to Use
1. Admin UI reads `config/registry` to discover each schema reference.
2. Forms render dynamically from the schema (using custom widgets where necessary) and produce scoped changesets.
3. Validation combines JSON Schema checks plus bespoke rules (contrast, dependency constraints), ensuring the applied config matches launch guarantees.

The schema set is intentionally declarative so automated diffing, testing, and SDK generation stay in sync with Admin UX and runtime validation.

