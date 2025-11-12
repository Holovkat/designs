# SLIs/SLOs and Monitoring (Draft)

## Core SLIs
- Ingestion-to-schedule latency P95 (seconds)
- Route compute latency P95 for ≤50 stops (seconds)
- Telemetry end-to-dashboard fanout P95 (seconds)
- Re-optimization compute P95 (seconds)
- Dashboard update success rate per 5 minutes (%)
- Driver status event delivery P95 (seconds)
 - Integration flow success rate (%) per flow
 - Integration flow end-to-end latency P95 (seconds) per flow

## Target SLOs
- Ingestion-to-schedule: P95 ≤ 300s, P99 ≤ 600s
- Route compute: P95 ≤ 10s, P99 ≤ 25s
- Telemetry e2e: P95 ≤ 2s, P99 ≤ 5s
- Re-optimization compute: P95 ≤ 30s
- Dashboard update success: ≥ 99.9% per 5m window
 - Integration flow success: ≥ 99.5% daily; any single flow ≥ 99.0%
 - Integration flow e2e latency: P95 ≤ 10s for webhooks; P95 ≤ 5m for scheduled jobs

## Measurement
- Instrument producers with outbox durations and publish latencies.
- Use tracing across ingestion → schedule → routing → notification.
- Emit metrics via OpenTelemetry → Prometheus; alert via Alertmanager.
 - n8n exports flow metrics via webhook/Prometheus exporter; include `flowName`, `externalSystem` labels.

## Alerts (examples)
- Pager: Telemetry e2e P95 > 5s for 10m.
- Pager: Route compute P95 > 25s for 15m or error rate > 2%.
- Ticket: Dashboard success < 99.8% for 1h.
 - Pager: Any critical integration flow success < 98% over 30m or P95 latency > SLO.

## Error Budgets
- Monthly budget for each SLO = 1 - target. Freeze deploys if budget exhausted.

## Incident Basics
- Severity mapping (critical/high/medium) aligned to business impact.
- Runbooks for ingestion stall, router slowdown, websocket fanout saturation.
