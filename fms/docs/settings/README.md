# Settings Scoping & Precedence

This project uses a typed settings store with scopes so tenants can override defaults by transport mode and by operational zone.

Scopes
- `tenant` — default settings for the tenant
- `mode` — overrides for a transport mode (e.g., road, rail)
- `zone` — overrides for an operational zone (e.g., Brisbane, MacKay, Townsville)
- Combined (most specific): `mode+zone` — overrides for a mode within a zone

Resolution order (least → most specific)
1) Tenant default
2) Tenant + Mode override
3) Tenant + Zone override
4) Tenant + Mode + Zone override

Rules
- The most specific matching scope wins for a given key.
- Unknown keys are ignored; only keys defined by the setting’s JSON Schema are valid.
- Secrets are never stored in settings; store only references to a secret manager.

Schemas
- Zone settings: docs/settings/schemas/zone-settings.schema.json
- Planning & firming: docs/settings/schemas/planning-settings.schema.json
- Ingestion dedupe: docs/settings/schemas/ingestion-settings.schema.json (controls dedupe TTL and whether `notes`/`metadata` are part of the fingerprint)
 - Feature flags & UI: docs/settings/schemas/features-settings.schema.json (enables forecasting feature and controls UI order creation statuses)
 - Theme settings: docs/settings/schemas/theme-settings.schema.json (tenant theme with 60:20:10 color ratio)
 - Alerts settings: docs/settings/schemas/alerts-settings.schema.json (toasts, inbox retention, escalation to ClickSend)
 - Reports settings: docs/settings/schemas/reports-settings.schema.json (header/footer text, logo override, watermark, default timezone/page size/orientation, CSV delimiter)
 - Billing settings: docs/settings/schemas/billing-settings.schema.json (included loads default, pack catalog, PAYG price, thresholds and inline prompts)
 - Privacy settings: docs/settings/schemas/privacy-settings.schema.json (retention days, analytics opt-in, EU short-retention default)

Example (Planning)
- Tenant default: `firming_horizon_days.road = 14`
- Mode override (rail): `firming_horizon_days.rail = 21`
- Zone override (Townsville): `freeze_window_hours = 72`
- Mode+Zone override (Rail in Townsville): `on_horizon_breach = "always_raise"`

Evaluation
- For a Rail order in Townsville, use the Mode+Zone override for `on_horizon_breach`; for other planning keys fall back through Zone, then Mode, then Tenant.

Fingerprint configuration (ingestion)
- Defaults: include notes (true), include metadata (false).
- You may override per Tenant/Mode/Zone using the same precedence rules.

Feature gating
- `paid_features.forecasting` controls whether forecasting is available for a tenant.
- `ui.allow_forecast_entry` governs whether Forecast orders can be created from the UI (defaults to false at launch).
- `ui.allowed_order_creation_statuses` allows restricting which planning statuses appear in the UI creation dialog.

Privacy controls
- `privacy.telemetry_retention_days`, `orders_retention_days`, `pod_artifacts_retention_days` govern retention windows (defaults represent ~7 years).
- `privacy.analytics_opt_in` toggles anonymized product analytics.
- `privacy.eu_short_retention_default` applies shorter telemetry defaults to EU tenants when enabled.

Theming rules
- Tenants select a theme from 10 presets; each defines `background_60`, `text_20`, `accent_10`.
- UI enforces WCAG AA contrast on text/background; accent usage capped to ~10% of screen real estate.
- Themes load as CSS variables; switching requires no reload; per-user overrides are allowed unless tenant locks theme.
