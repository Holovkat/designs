---
type: Process
title: Deployment Guide
description: Dual-environment deployment with Vercel for production demos and Dokku on Hetzner for UAT testing
resource: ./templates/instructional-documents/deployment-guide.md
tags: [designs, deployment, vercel, dokku, hetzner, docker, ci-cd]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Deployment Guide

## Environments

| Environment | Platform | Purpose | Trigger |
|-------------|----------|---------|---------|
| Production Demo | Vercel | Stakeholder demos, public access | Auto on main push |
| UAT/Testing | Dokku on Hetzner | Personal testing, validation | Auto on main push |
| PR Previews | Vercel | Review changes before merge | Auto on every PR |

## Vercel Setup (Production Demo)

Vercel provides zero-config Next.js deployments with automatic preview URLs for every PR.

- CLI setup: `vercel login`, `vercel` from project root
- Environment variables set in Vercel Dashboard (CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, WORKOS keys)
- Features: auto-deploy on main push, preview URLs per PR, one-click rollbacks, analytics

## Dokku on Hetzner (UAT/Testing)

Dokku is a lightweight PaaS running on a Hetzner VPS.

### Setup Steps
1. Install Dokku on the server
2. Create app: `dokku apps:create fms-glm`
3. Set domain and environment variables
4. Configure SSL with Let's Encrypt

### Project Configuration
- `next.config.ts` with `output: 'standalone'`
- Multi-stage Dockerfile (builder + runner)
- `.dockerignore` for node_modules, .next, .git
- Optional `app.json` with healthchecks

### Deployment
- Manual: `git push dokku main`
- Automatic: GitHub Actions workflow using `dokku/github-action`

## Reverse Proxy Integration

Dokku uses nginx by default. Options:
- Let Dokku manage its own proxy on a different port
- Disable Dokku's proxy and use existing reverse proxy (nginx/Traefik)

## Deployment Flow

```
GitHub main push
  -> GitHub Actions -> Hetzner/Dokku (UAT)
  -> Vercel webhook -> Vercel (Production)
```

PR creation triggers Vercel preview deploy with unique URL.

## Security Considerations

1. Never commit secrets - use environment variables
2. Use SSH keys for Dokku deployments
3. Enable SSL with Let's Encrypt on both platforms
4. Rotate deployment keys periodically
5. Use GitHub branch protection rules

## Related Concepts

- [GitHub Workflow Guide](./github-workflow.md)
- [Convex Self-Hosted Setup](./convex-self-hosted.md)
- [WorkOS Auth Integration](./workos-auth-integration.md)
- [Stripe Payment Integration](./stripe-payment-integration.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
