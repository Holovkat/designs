# DR/HA & Monitoring

Objectives
- Availability 99.9% monthly; failover to secondary region in < 5 minutes (RTO). Live data RPO ≤ 1 minute; artifacts RPO ≤ 15 minutes.

HA Architecture
- App/API: stateless replicas across at least 2 AZs; autoscaling on CPU/QPS/queue depth.
- Data plane
- Convex (ops): multi‑zone HA; durable event outbox; backpressure to N8N.
  - Postgres (reporting): managed HA with synchronous replica in primary region; async cross‑region replica.
  - Object storage: cross‑region replication for POD artifacts and reports.
- Integration hub (N8N): webhooks front + worker pool in HA mode; Redis or equivalent for queue; store executions for replay.

DR Strategy
- Secondary region
- Warm standby for app/API, N8N, and Postgres async replica.
  - IaC (Terraform) to promote standby and provision missing pieces.
- Failover/failback
  - Trigger conditions: region health, DB health, control-plane failures.
  - Promote DB replica; switch DNS/ingress; drain/rehydrate queues; reconcile outbox to avoid duplicate deliveries (idempotent by event id).
- Backups
  - Daily encrypted snapshots for Postgres with PITR; periodic restore tests.
  - Object storage versioning + lifecycle to cold storage.

Monitoring & Alerting
- Golden signals: latency, traffic, errors, saturation per service.
- Business SLIs: ingestion success rate, schedule commit latency, re‑opt SLA, alerts delivery, billing usage pipeline.
- Synthetics: public endpoints (webhook HMAC test, reports export), private health (DB/read/write checks), route optimization canary.
- Alert routing: severity matrices; paging for SLO breach; Slack/email for warnings.

Runbooks (summaries)
- Loss of primary DB: promote replica; rotate app connections; verify RLS and writers.
- N8N backlog surge: scale workers; enable queue mode backoff; throttle inbound; DLQ/Replays.
- Object storage outage: queue POD uploads locally; reconcile on restore; maintain manifest of pending artifacts.

Exercises
- Quarterly DR drills incl. DNS cutover; monthly backup restore verification; post‑mortems recorded with actions.
