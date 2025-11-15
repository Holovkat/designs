---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Settings Architecture

Settings are scoped, schema-driven configurations that let tenants adapt themes, alerts, planning horizons, ingestion dedupe rules, and more without redeploying code.

## Scoping Model
1. Tenant default
2. Tenant + Mode override
3. Tenant + Zone override
4. Tenant + Mode + Zone override (most specific)

The most specific scope wins. Unknown keys are ignored, and secrets are referenced rather than stored inline. All settings changes flow through the Admin Config API and the changeset workflow described in `docs/ui/admin-settings-spec.md`.

## Schemas
See `docs/settings/schemas/` for JSON Schemas covering themes, alerts, planning, ingestion, features, reports, billing, privacy, and zone-specific overrides. Each schema feeds the Admin UI forms and enforces validation before configuration is applied.

## Usage Patterns
- Planning rules govern firming horizons, freeze windows, sea handoff gating, and auto-firming behavior.
- Ingestion dedupe controls whether optional fields (notes/metadata) contribute to the canonical fingerprint n8n uses for ERP batches.
- Feature flags manage forecasting availability and which planning statuses can be created from the UI.
- Alerts, reports, billing, and privacy settings keep operational experiences in sync with retention, notification, and branding policies.

By centralizing these schemas and precedence rules, admins can make tenant-level changes safely while BMAD workflows and agents consume a single, versioned configuration source.

