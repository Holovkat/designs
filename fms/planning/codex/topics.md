# Event Topics and Retention (Draft)

## Naming
- Format: `fms.<boundedContext>.<entity>.<event>.<version>`
- Examples:
  - `fms.ingestion.order.ingested.v1`
  - `fms.scheduling.task.assigned.v1`
  - `fms.routing.route.optimized.v1`
  - `fms.telemetry.vehicle.positioned.v1`
  - `fms.delivery.status.updated.v1`
  - `fms.pod.artifact.captured.v1`
  - `fms.alerts.alert.raised.v1`

Integration flows use a separate namespace for governance:
- Format: `intg.<system>.<purpose>.<version>` (e.g., `intg.erp.order-inbound.v1`)
 
 Config events (governance):
 - `fms.config.changed.v1`
 - `fms.config.changeset.created.v1`
 - `fms.config.changeset.approved.v1`
 - `fms.config.changeset.applied.v1`

## Keys
- Partition key: tenant ID (string)
- Secondary key fields (for consumers): routeId, taskId, vehicleId

## Retention (by topic)
- High-volume telemetry: 7 days on stream; compacted snapshots by vehicleId.
- Status/routing/scheduling: 30 days on stream; archived to object storage.
- POD artifacts: metadata events kept 2 years; blobs per retention policy in `privacy-retention.md`.
 - Integration control events: 30 days (to support audits and replays).

## Delivery Semantics
- Producers use outbox + exactly-once within a partition (idempotency via `eventId`).
- Consumers must be idempotent; store last processed offset per `(topic, consumer)`.
 - Integration hub (N8N) interacts via HTTP/webhooks or bridge services; when producing to Kafka, it must include `eventId` and `traceId` for correlation.
