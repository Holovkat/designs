---
id: delivery-core
name: Core Delivery Lifecycle
version: 0.1.0
owner: operations
status: draft
---

## Summary
End‑to‑end delivery flow from scheduling to Proof of Delivery (POD). Captures normal and exception paths with reschedule/cancel behaviors.

## Actors
- Dispatcher
- Driver
- Customer
- System (Scheduler/Optimizer, Notification Service)

## Triggers
- New delivery scheduled
- Driver assignment confirmed
- Status updates via driver app or telematics

## State Machine
```mermaid
stateDiagram-v2
    [*] --> scheduled
    scheduled --> picked_up: pickup_confirmed
    picked_up --> in_transit: depart_origin
    in_transit --> delivered: pod_captured
    in_transit --> failed: exception_reported

    scheduled --> cancelled: cancel_request
    picked_up --> cancelled: cancel_request
    in_transit --> cancelled: cancel_request

    failed --> rescheduled: auto_or_manual_reschedule
    rescheduled --> scheduled

    delivered --> [*]
    cancelled --> [*]
```

## Happy Path (Flow)
```mermaid
flowchart TD
    A[Schedule Delivery] --> B[Assign Driver]
    B --> C[Pickup Confirmed]
    C --> D[Depart Origin]
    D --> E[Arrive Destination]
    E --> F[Capture POD]
    F --> G[Notify + Reconcile]
```

## Events
- Consumes: `delivery.scheduled`, `driver.assigned`, `delivery.pickup_confirmed`, `delivery.pod_captured`, `delivery.exception`.
- Emits: `delivery.status.changed`, `delivery.pod.available`, `delivery.rescheduled`, `delivery.cancelled`.

## Exceptions & Compensation
- Missed pickup → mark `failed`, attempt `rescheduled` with notification.
- Customer cancellation → transition to `cancelled`, notify stakeholders.
- Partial delivery → remain `in_transit` until resolved or fail and reschedule.

## Notes
- Mirrors state models used in `planning/glm/data-model.md` for consistency.

