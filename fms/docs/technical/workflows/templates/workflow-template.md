---
id: <domain>-<name>
name: <Readable Name>
version: 0.1.0
owner: <team>
status: draft
---

## Summary
One or two sentences describing the workflow’s goal and scope.

## Actors
- Primary human/system actors.

## Triggers
- Events or conditions that start the workflow.

## State Machine
```mermaid
stateDiagram-v2
    [*] --> state_a
    state_a --> state_b: event_name
    state_b --> [*]
```

## Main Flow
```mermaid
flowchart TD
    A[Step 1] --> B[Step 2]
    B --> C[Step 3]
```

## Events
- Consumes: event.one, event.two
- Emits: event.three, event.four

## Exceptions & Compensation
- Describe failure modes and how the system compensates.

