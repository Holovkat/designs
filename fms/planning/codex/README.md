# FMS Planning Artifacts (Codex)

This directory contains initial implementation planning artifacts for the Warehouse Delivery scope of the Fleet Management System.

## Contents
- `erd.md` — domain ERD and table notes
- `topics.md` — event topics, keys, and retention
- `event-schemas/` — JSON Schemas for core events
- `backlog/phase-0-2.md` — user stories and ACs for Phases 0–2
- `slos.md` — SLIs/SLOs, measurement, alerts
- `routing-spike.md` — OR-Tools + OSRM/Valhalla spike plan
- `sequences.md` — sequence diagrams for critical flows
- `privacy-retention.md` — proposed retention and privacy posture
- `sample-data/` — small CSVs to drive spikes
 - `integration-tooling.md` — delineation of integration layer (n8n) and queuing

## How to use
- Start with `erd.md` and `topics.md` to align on data and events.
- Use `backlog/phase-0-2.md` to seed tickets.
- Run the prototype work guided by `routing-spike.md` and `slos.md`.
- For integrations, follow `integration-tooling.md` to choose n8n vs custom services and queueing patterns.
