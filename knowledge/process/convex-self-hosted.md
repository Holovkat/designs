---
type: Process
title: Convex Self-Hosted Setup
description: Self-hosted Convex infrastructure on Hetzner with Docker, dual environments, admin keys, and deployment workflows
resource: ./templates/instructional-documents/convex-self-hosted-setup.md
tags: [designs, convex, self-hosted, hetzner, docker, infrastructure, database, deployment]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Convex Self-Hosted Setup

## Server Infrastructure

- **Provider**: Hetzner Cloud (IP: 138.199.235.169)
- **OS**: Linux with Docker
- **Resources**: 7.5GB RAM, 75GB disk
- **Services**: Convex (dev + prd), Supabase (dev + prd), N8N, Nginx

## Environments

| Environment | Backend URL | Dashboard URL |
|-------------|-------------|---------------|
| Development | dev.convex.macinations.au | dashboard.dev.convex.macinations.au |
| Production | prd.convex.macinations.au | dashboard.prd.convex.macinations.au |

## Docker Compose Configuration

Each environment runs a Convex backend container and dashboard container. Key environment variables:
- `POSTGRES_URL` - PostgreSQL connection to Supabase
- `CONVEX_CLOUD_ORIGIN` / `CONVEX_SITE_ORIGIN` - Public URLs
- `INSTANCE_SECRET` - 64-char hex for persistent admin keys

### Port Mapping

| Env | Service | Host Port | Container Port |
|-----|---------|-----------|----------------|
| Dev | Backend API | 16442 | 3210 |
| Dev | HTTP Actions | 16444 | 3211 |
| Dev | Dashboard | 16445 | 6791 |
| Prd | Backend API | 16443 | 3210 |
| Prd | HTTP Actions | 16447 | 3211 |
| Prd | Dashboard | 16446 | 6791 |

All backend ports bound to `127.0.0.1` only; Nginx handles external access with SSL.

## Admin Keys

Generated using `./generate_admin_key.sh` inside the backend container. Keys are persistent as long as `INSTANCE_SECRET` remains unchanged.

## Database

Convex uses a separate database called `convex_self_hosted` in each Supabase instance (not a schema in `postgres`). Internal tables: `documents`, `indexes`, `leases`, `persistence_globals`, `read_only`.

## Local Development

```bash
# .env.local
CONVEX_SELF_HOSTED_URL=https://dev.convex.macinations.au
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01xxxxx...
NEXT_PUBLIC_CONVEX_URL=https://dev.convex.macinations.au

# Deploy
npx convex deploy

# Deploy to prd
CONVEX_SELF_HOSTED_URL=https://prd.convex.macinations.au \
CONVEX_SELF_HOSTED_ADMIN_KEY=<key> \
npx convex deploy
```

## Vercel Integration

Next.js frontend on Vercel connects to self-hosted Convex. Do NOT set `CONVEX_DEPLOYMENT` when using self-hosted Convex.

## Stripe Webhooks

Stripe webhooks are handled by Convex HTTP actions (not Vercel/Next.js). Webhook URL: `https://prd.convex.macinations.au/stripe-webhook`

## WorkOS Authentication

Redirect URIs configured in WorkOS Dashboard for production and local dev. WorkOS env vars set in both Vercel and Convex.

## Operations

- Start/stop services via Docker Compose
- View logs: `docker logs -f convex-dev-backend`
- Health check: `curl -s https://dev.convex.macinations.au/version`
- Data export/import: `npx convex export/import`
- SSL via Certbot (Let's Encrypt), auto-renewed

## Troubleshooting

- WebSocket 1011 errors: deploy functions with `npx convex deploy`
- Admin key invalid: check `INSTANCE_SECRET` in docker-compose
- Server overload during import: trim large tables, stop non-essential services

## Related Concepts

- [Deployment Guide](./deployment-guide.md)
- [Stripe Payment Integration](./stripe-payment-integration.md)
- [WorkOS Auth Integration](./workos-auth-integration.md)
- [GitHub Workflow Guide](./github-workflow.md)
