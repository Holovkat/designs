# Technical Requirements Pack

This folder contains the detailed technical requirements and a ready-to-run Docker Compose dev stack for the FMS Warehouse Delivery scope.

Contents
- `docker-compose.yml` — local dev stack with profiles
- `.env.example` — env defaults to copy as `.env`
- `architecture.md` — system architecture (Convex + events + n8n)
- `infrastructure.md` — environments, operations, Compose usage
- `data-models.md` — ERD and entity mapping
- `databases.md` — Convex (app) + Postgres (reporting) strategy
- `apis.md` — API surface and contract outlines
- `ui-ux.md` — role-based UX, core screens, patterns
- `phasing-and-sprints.md` — deliverable slicing and sprint plan
- `checklist.md` — execution TODOs by Epic and Phase

How to start
- Copy `.env.example` to `.env` for infrastructure only (containers). Application configuration is database‑driven and seeded on first run — do not add app settings to `.env`.
- `docker compose --profile core --profile events up -d`
- Open n8n at http://localhost:5678 and Kafka UI at http://localhost:8080

Configuration policy
- Only minimal bootstrap secrets/addresses may live in env: database credentials, Redis, event broker address, n8n encryption key.
- All other application configuration (feature flags, thresholds, UI toggles, business rules) must live in the database and be edited via the Settings UI or config APIs.
