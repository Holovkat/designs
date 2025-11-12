# Gaps & Questions Log

Use this file to capture open questions that need product/owner decisions. We will ask one question at a time in the conversation, but this log shows the pipeline.

## Open Questions
1) Predictive maintenance provider(s): Which telematics/OEM platform(s) should we target at launch (e.g., Geotab, Samsara), or start with CSV/SFTP integration first?
2) Traffic ML predictions: Include ML now or rely on provider heuristics and defer ML?
3) DR/HA monitoring stack: Preferred tools for SLOs (e.g., Datadog, CloudWatch, Grafana)?
4) EU telemetry default: Keep default at 7 years globally or set EU tenants to 30 days by default (overrideable)?
5) Forecast UI: Feature exists in backend; confirm when to enable Admin flag to expose forecast entry in UI at tenant level for GA.

## Decisions (log)
- Integration: n8n hub with HMAC; batch JSON up to 10 MB; always 200 with per‑item results.
- Idempotency: Server‑managed dedupe on `(tenant_id, external_order_id)` + canonical fingerprint; TTL default 24h; no client idempotency key.
- Notifications: ClickSend SMS/Email at launch.
- Planning: Forecast → Provisional → Firm; default firming horizons road=14d, rail=21d; freeze window=48h; approval SLA default 6h.
- Retention: Default 7 years across orders/events/POD.
- Billing: Hybrid model — base plan includes loads + optional top‑ups or PAYG; yearly discount; proration enabled; near‑threshold auto top‑up is backlog.
- Billing: Base plan included loads default = 1,000/month per tenant.
- Billing: Top‑up packs default catalog — 1,000 loads (10% off), 5,000 loads (15% off).
- Billing: PAYG overage default price — AUD $1.00 per load.
