---
last-redoc-date: 2025-11-12T23:25:18Z
---
# QA & Performance

`performance-test-plan.md` defines the launch performance validation strategy across APIs, dashboards, routing services, reports, ingestion, and live ETA pipelines.

## Key Elements
- **SLO Targets** — API p95 < 2s, dashboard updates ≤ 1s for 100 concurrent users, re-optimization ≤ 30s, routing ≤ 10s for 50 stops, report exports ≤ 15s for 500 tasks.
- **Workloads** — Fleet sizes (25/150/500 vehicles), telemetry cadence, ingestion batch shapes, re-optimization triggers, and report export loads.
- **Scenarios & Tooling** — k6 for HTTP/WebSocket load, Playwright for PDF timing, custom harnesses for Distance Matrix cache tests, ingestion idempotency validation.
- **Metrics & Acceptance** — Latency distributions, error budgets, provider cost guardrails, and regression automation.

The plan is the authoritative reference for perf testing requirements and is where additional test suites should be documented as the product evolves.

