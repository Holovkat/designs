# Infrastructure & Environments

Local dev (Docker Compose)
- Profiles
  - `core`: Postgres, Redis, N8N (main + worker)
  - `events`: Redpanda (Kafka API), Kafka UI
  - `aux`: LocalStack (S3), Mailhog
  - `routing`: OSRM server (requires prepared map extract)
- Commands
  - `cp .env.example .env` (infra only; app config is DB‑driven and seeded on first run)
  - `docker compose --profile core --profile events up -d`
  - Optional: add `--profile aux` and/or `--profile routing`
- URLs
  - N8N: http://localhost:5678
  - Kafka UI: http://localhost:8080
  - Mailhog: http://localhost:8025
  - LocalStack S3: http://localhost:4566

N8N queue mode
- `EXECUTIONS_MODE=queue`, Redis backing store, separate `n8n worker` process.
- Retries, backoff, and concurrency configured per workflow.

Data persistence
- Volumes: `pgdata`, `n8n_data`, `osrmdata`.
- For S3 (POD), use LocalStack locally; in prod, point to cloud S3 with lifecycle policies.

Production sketch
- Convex: managed; deploy functions and schemas via Convex CLI.
- Event backbone: Kafka (or Redpanda) multi-broker, with metrics and ACLs.
- N8N: HA with multiple workers; Postgres as metadata DB; SSO enabled.
- Postgres: managed service (e.g., RDS/Cloud SQL) with PITR and read replicas for BI.
- Object storage: S3/GCS with encryption, lifecycle, and access policies.
- Observability: OpenTelemetry → Prometheus/Grafana; logs to a central store.

Secrets and config
- Only bootstrap addresses/credentials live in env; all other settings are stored in DB (`app_config`, `feature_flags`, `secrets`).
- Store production secrets in a managed secret manager/KMS; DB stores ciphertext only.

Backup/DR
- Postgres PITR; object storage versioning; export N8N flows to Git.
