# Convex Self-Hosted Quick Reference

## URLs

| Environment | Backend | Dashboard |
|-------------|---------|-----------|
| **Dev** | https://dev.convex.macinations.au | https://dashboard.dev.convex.macinations.au |
| **Prd** | https://prd.convex.macinations.au | https://dashboard.prd.convex.macinations.au |

## SSH Access

```bash
ssh -i /Users/tonyholovka/hetzner_macinations root@138.199.235.169
```

## Admin Keys

```bash
# Generate dev admin key
docker exec convex-dev-backend ./generate_admin_key.sh

# Generate prd admin key
docker exec convex-prd-backend ./generate_admin_key.sh
```

## Deploy Functions

```bash
# To dev (uses .env.local)
npx convex deploy

# To prd (override env)
CONVEX_SELF_HOSTED_URL=https://prd.convex.macinations.au \
CONVEX_SELF_HOSTED_ADMIN_KEY=<prd-admin-key> \
npx convex deploy
```

## Environment Variables

```bash
# Set env var
npx convex env set VAR_NAME "value"

# List env vars
npx convex env list
```

## Service Management

```bash
# Start
cd /opt/convex/dev && docker compose up -d
cd /opt/convex/prd && docker compose up -d

# Stop
cd /opt/convex/dev && docker compose down
cd /opt/convex/prd && docker compose down

# Restart
cd /opt/convex/dev && docker compose restart
cd /opt/convex/prd && docker compose restart

# Logs
docker logs -f convex-dev-backend
docker logs -f convex-prd-backend
```

## Data Import/Export

```bash
# Export
npx convex export --path ./backup.zip

# Import (replaces all data)
npx convex import --replace-all ./backup.zip
```

## Health Check

```bash
# Check containers
docker ps | grep convex

# Check backend health
curl -s https://dev.convex.macinations.au/version

# Check stats
docker stats --no-stream | grep convex
```

## Port Reference

| Port | Service |
|------|---------|
| 16442 | Dev backend API |
| 16443 | Prd backend API |
| 16444 | Dev HTTP actions |
| 16445 | Dev dashboard |
| 16446 | Prd dashboard |
| 16447 | Prd HTTP actions |

## Local .env.local

```bash
CONVEX_SELF_HOSTED_URL=https://dev.convex.macinations.au
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01xxxxx...
NEXT_PUBLIC_CONVEX_URL=https://dev.convex.macinations.au
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket 1011 errors | `npx convex deploy` |
| Admin key invalid | Check INSTANCE_SECRET in docker-compose |
| DB connection failed | Ensure supabase-dev-db is running |
| Server overloaded | Stop non-essential services, use smaller imports |

---

## Vercel Production

**URL:** https://fms-git-main-macinations-projects.vercel.app

**Key env vars:**
- `NEXT_PUBLIC_CONVEX_URL` = `https://prd.convex.macinations.au`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` = `https://fms-git-main-macinations-projects.vercel.app/callback`
- Do NOT set `CONVEX_DEPLOYMENT`

---

## Stripe Webhooks

**Webhook URL (NOT Vercel):**
```
https://prd.convex.macinations.au/stripe-webhook
```

**Events to subscribe:**
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Set webhook secret in Convex:**
```bash
npx convex env set STRIPE_WEBHOOK_SECRET "whsec_xxx" --env-file /tmp/convex-prd.env
```

---

## WorkOS Redirect URIs

| Environment | URI |
|-------------|-----|
| Production | `https://fms-git-main-macinations-projects.vercel.app/callback` |
| Local | `http://localhost:3000/callback` |
