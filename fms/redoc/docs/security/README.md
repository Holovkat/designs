---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Security & Privacy

`security-privacy.md` defines the launch security posture across encryption, key management, webhook authentication, PII handling, retention, analytics opt-in, and incident response.

## Highlights
- **Encryption** — Volume encryption for databases, server-side encryption for object storage, KMS-managed keys, and HMAC secrets per tenant for inbound/outbound webhooks.
- **PII Taxonomy** — Data schemas tag PII fields with sensitivity, ensuring logs, alerts, and reports mask identifiers while retaining observability.
- **Retention & DSAR** — Default 7-year retention (configurable via privacy settings), lifecycle jobs for storage tiers, and guidance for DSAR exports/deletions.
- **Transport Security & RBAC** — TLS 1.2+, JWTs with tenant/zone scopes, Postgres RLS, and ClickSend credentials stored in secret managers.
- **Monitoring** — Alerts on auth anomalies, webhook failures, config changesets, and privilege escalations, backed by incident runbooks.

Use this spec when implementing platform security controls, tagging fields in schemas, or answering compliance audits about how launch requirements are met.

