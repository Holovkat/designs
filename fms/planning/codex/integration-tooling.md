# Integration & Tooling (Draft)

This section delineates the integration layer responsibilities and tooling. We propose N8N as the Integration Hub to orchestrate inbound/outbound flows, with the event backbone handling core system messaging.

## Goals
- Decouple external systems from core services.
- Provide low‑code, observable, and testable workflows for integrations.
- Ensure reliability via queues, idempotency, and replay.

## Components
- Integration Hub: N8N (self‑hosted) for workflows, webhooks, polling, transformations, retries, and notifications.
- Event Backbone: Kafka/PubSub for core domain events (`fms.*`).
- Bridge Services: Thin adapters (HTTP/GRPC) between N8N and backbone when a direct connector is unavailable.
- Queue Options: Prefer Kafka for backbone; optionally RabbitMQ/Redis Streams for point integrations where suitable.

### N8N Queue Mode
- Purpose: Queue and distribute workflow executions across workers.
- Backing store: Redis (Bull/BullMQ under the hood).
- Usage: Set `EXECUTIONS_MODE=queue`, configure Redis, run `n8n` (webhook/front-end) + one or more `n8n worker` processes.
- Strengths: Built-in retries, concurrency control, backpressure, and visibility in the Executions UI.
- Limits: Designed for orchestration of workflows, not as a high-throughput event backbone (limited retention/replay semantics, no partitions/consumer groups).

## When to use what
- Use N8N for:
  - ERP/OMS webhooks → validation/transform → `ingestion` API or event publish.
  - Outbound status/POD updates back to ERP/CRM.
  - Periodic reconciliation jobs and enrichment (geocode, address normalization).
  - Vendor APIs (SMS/email) with templating and simple rules.
- Use custom services for:
  - Hot path compute (routing, scheduling) and high‑volume telemetry ingestion.
  - Domain logic requiring strict performance/SLOs.

Notes:
- N8N queue mode can absorb bursts for the above integration cases; for durable, replayable streams and multi-consumer fanout, prefer Kafka as the backbone.

## Reliability & Patterns
- Idempotency/Deduplication:
  - Tenant‑facing ingestion (ERP → N8N): server‑managed dedupe using `(tenant_id, external_order_id)` + canonical JSON fingerprint (TTL configurable; default 24h). No `Idempotency-Key` required from partners.
  - Internal service calls: prefer stable `X-Request-Id` or event `id`; optional `Idempotency-Key` may be supported for internal‑only endpoints.
- Outbox: Core services use outbox to publish to Kafka; N8N consumes via webhook/bridge.
- Retries: Exponential backoff with circuit‑breaker nodes. Dead‑letter queue per flow.
- Replay: Flows can reprocess from a bookmark (time/window or offset).
- Rate limits: Token bucket at flow edges; backpressure via queue depth.

## Security
- Auth: N8N behind SSO; per‑flow secrets via KMS/secret manager.
- Network: Egress allow‑listing to vendors; ingress only from trusted sources.
- Audit: Flow changes version‑controlled (export JSON), approvals required for prod.

## Deployment
- Environments: Dev/Stage/Prod with separate N8N instances and credentials.
- CI/CD: Flow export in Git; lint/validate JSON; automated import to non‑prod.
- Observability: Emit flow metrics (success/failure/latency) to Prometheus; trace correlation via `traceId` headers.

### Example env (queue mode)
```
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis
QUEUE_BULL_REDIS_PORT=6379
N8N_ENCRYPTION_KEY=...
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true
```
Processes:
- `n8n` (main) for webhooks/UI + `n8n worker` x N for executions.

## Candidate Flows
- ERP → FMS Orders: Webhook ingest; validate; normalize; POST to `Ingestion` API; publish `order.ingested.v1`.
- FMS → ERP Status: Subscribe to `delivery.status.updated.v1`; map to ERP status API.
- POD Sync: Listen `pod.artifact.captured.v1`; push metadata/links to ERP/DRM.
- Reconciliation: Nightly compare ERP orders vs FMS tasks; emit discrepancies.
- Notifications: Trigger SMS/email on assignment, ETA changes, exceptions.

Connectors:
- Kafka: Consume/produce via Kafka nodes or through a lightweight bridge service if stricter control is required.
- AMQP/RabbitMQ: Use AMQP nodes for point-to-point integration.

## Queuing Considerations
- Backbone: Kafka for domain events and fanout.
- Bridge: If needed, RabbitMQ/Redis Streams for specific flow decoupling where Kafka is not available.
- Ordering: Partition by `tenantId` (and optionally `routeId`) for consumer locality.

## Governance
- Flow naming: `intg.<system>.<purpose>.<version>` (e.g., `intg.erp.order-inbound.v1`).
- Change control: PR review for flow JSON; migration notes per version.
- Runbooks: Per flow — inputs, outputs, SLIs/SLOs, failure modes, rollback.
