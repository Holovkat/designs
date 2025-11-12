# Security & Privacy Spec (Launch)

Purpose
- Define concrete controls for encryption, PII handling, anonymized analytics, retention enforcement, and secure integrations across FMS components.

Scope
- Applies to Convex (operational), Postgres/PostGIS (reporting), n8n (integration edge), object storage (POD artifacts), web/mobile apps, and admin APIs.

Encryption & Key Management
- At rest
  - Databases: disk/volume encryption enabled; Postgres WAL/archive also encrypted.
  - Object storage: server-side encryption (SSE) for artifacts; per‑tenant buckets or prefixes.
  - Field‑level: encrypt high‑risk fields (e.g., driver phone) before write where supported.
- In transit
  - TLS 1.2+ everywhere; HSTS on web; certificate pinning considered for mobile.
- Keys & secrets
  - Managed via cloud KMS; rotate service keys annually or on incident; store secrets in a secret manager, not env files.
  - HMAC secrets per tenant for webhooks; rotate with overlap windows and dual‑validation during cutover.

PII Taxonomy, Tagging, and Masking
- PII categories
  - Direct identifiers: name, email, phone, signature image.
  - Sensitive location: precise driver/home coordinates when tied to a person.
  - Contact metadata: recipient phone/email.
- Tagging strategy
  - Annotate PII in schemas (see Data → Convex collections) using `pii: true` and `sensitivity: {low|moderate|high}` notes.
  - Prohibit PII in analytics/events by default; allow hashed references only.
- Masking & redaction
  - Logs/alerts: mask direct identifiers; show last‑4 if needed for troubleshooting.
  - Export/report: role‑based redaction; watermark for non‑manager roles (see Reports settings).

Analytics (Anonymized)
- Event payloads exclude PII; use IDs and hashed keys.
- Tenant setting `features.paid_features.forecasting` has no PII impact; analytics still anonymous.
- Opt‑in/opt‑out per tenant for product analytics; sampling configurable.

Retention, Deletion, DSAR
- Defaults
  - Orders, events, POD: 7 years (configurable; see settings schemas).
  - Telemetry: 7 years default; may set shorter for specific regions (EU suggested 30 days default policy when enabled).
- Enforcement
  - Scheduled retention jobs: sweep objects and DB tables by `created_at/occurred_at` with safety window; dry‑run mode.
  - Object storage lifecycle rules for artifact tiers and expiry.
- DSAR
  - Export: compile subject data from Convex/Postgres/Object storage; redact third‑party PII.
  - Deletion: tombstone or hard‑delete depending on record type; audit DSAR actions.

Transport Security & AuthZ
- Webhooks: HMAC SHA‑256 with timestamp; clock skew ±5m; reject on mismatch (see Integration Hub spec).
- App/API: JWT with tenant_id and role/zone scopes in claims; short lifetimes; refresh via Clerk.
- RBAC: enforced on all endpoints; Postgres RLS set via `app.tenant_id`.

Monitoring & Incident Response (security)
- Alerts on auth anomalies, webhook HMAC failures, config changesets, and elevation of privileges.
- Runbooks for credential rotation, webhook key roll, and data‑leak response.

Deliverables & Links
- Tag PII in Convex schema (docs/data/schemas/convex-collections.yaml).
- Add privacy settings schema (docs/settings/schemas/privacy-settings.schema.json).
- Define retention job specs and object lifecycle policies.
