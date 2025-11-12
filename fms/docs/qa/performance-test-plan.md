# Performance Test Plan (Launch)

Purpose
- Validate that launch SLOs derived from warehouse-delivery.md and technical specs are met under realistic load, and establish a repeatable regression suite.

SLO Targets (derived)
- API: p95 < 2s across mutating and read endpoints (N3.1).
- Dashboard realtime: >95% updates delivered ≤ 1s to 100 concurrent users (N3.5).
- Re‑optimization: ≤ 30s end‑to‑end on trigger (2.4.2 AC5).
- Routing optimize: ≤ 10s for ≤ 50 stops (2.3.1 AC3).
- Reports: Schedules PDF ≤ 15s for 500 tasks; KPI CSV export streams promptly.

Workloads & Datasets
- Fleet sizes: small (25 vehicles), medium (150), large (500).
- Active routes: 1–3 per vehicle; 10–50 stops/route; mixed priorities.
- Orders: batches of 500–10,000 ingested via webhook/upload.
- Telemetry: positions at 15s cadence; geofence events as per doc.

Scenarios
1) API baseline and bursts
   - Mix: 60% reads (GET KPIs, alerts, schedules), 30% writes (status updates, acknowledges), 10% heavy (order upload, reports export).
   - Targets: p95 < 2s; zero error inflation beyond 0.5%.
2) Dashboard fan‑out (WebSocket)
   - 100 concurrent users on Fleet Map; 1 event/sec average; verify client receive latency ≤ 1s for >95%.
3) Live ETA loop cost and latency
   - Distance Matrix batching with 60–120s TTL cache; measure QPS, cache hit rate > 60%, per‑cycle latency ≤ 2s.
4) Re‑opt trigger pipeline
   - Inject delay >10m; measure trigger→proposal→apply; target ≤ 30s; audit events emitted.
5) Routing compute
   - Optimize 50‑stop routes; alternatives enabled; p95 ≤ 10s.
6) Reports export
   - Schedules PDF for 500 tasks ≤ 15s; alerts CSV > 50k rows streamed without timeouts.
7) Ingestion throughput & idempotency
   - Webhook (10 MB batch) returns 200 with per‑item results; replay within TTL confirms duplicate handling.

Tooling & Harness
- k6 (HTTP/WebSocket) for API and socket scenarios; Locust optional.
- Headless browser (Playwright) to measure PDF render and UI timing markers.
- Synthetic ETA harness to drive Distance Matrix requests and caching analysis.
- Data seeding: sample CSVs (orders, vehicles, locations, telematics) under planning/codex/sample-data/.

Metrics & Observability
- API: p50/p95/p99 latency, error rate, CPU/mem, GC.
- WebSocket: deliver latency distribution, drops, reconnections.
- ETA service: provider QPS, cache hit %, latency, failures.
- Re‑opt: time breakdown (detect → compute → approve/apply), success rate.
- Cost guardrails: provider call counts under budget thresholds.

Environments
- Staging mirroring production sizing; feature flags as per launch defaults.
- Secrets (maps, ClickSend) set; test tenants and zones provisioned.

Acceptance & Regression
- All SLOs above met with evidence (dashboards, exports, run logs).
- CI nightly: light suite (API smoke, WS mini fan‑out, reports sample) to catch regressions.

Appendix — k6 Sketch
```js
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 50, duration: '10m' };
export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/v1/reports/kpi.csv?metric=on_time`);
  check(res, { 'status 200': (r) => r.status === 200, 'p95<2s': (r) => r.timings.duration < 2000 });
  sleep(1);
}
```

