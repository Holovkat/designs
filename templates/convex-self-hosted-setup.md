# Self-Hosted Convex Infrastructure Documentation

This document describes the self-hosted Convex setup on the Hetzner server for the FMS-GLM project.

## Server Infrastructure

### Server Details
- **Provider:** Hetzner Cloud
- **IP Address:** 138.199.235.169
- **SSH Access:** `ssh -i /Users/tonyholovka/hetzner_macinations root@138.199.235.169`
- **OS:** Linux (Docker-enabled)
- **Resources:** 7.5GB RAM, 75GB disk

### Services Running

| Service | Container(s) | Ports | Purpose |
|---------|-------------|-------|---------|
| **Convex Dev** | convex-dev-backend, convex-dev-dashboard | 16442, 16444, 16445 | Development Convex backend |
| **Convex Prd** | convex-prd-backend, convex-prd-dashboard | 16443, 16446, 16447 | Production Convex backend |
| **Supabase Dev** | supabase-dev-db, supabase-dev-vector | 15432 | Dev PostgreSQL (Convex DB) |
| **Supabase Prd** | supabase-prd-* (full stack) | 15492, 11000, 11443 | Production Supabase |
| **N8N** | n8n-macinations, n8n-redis | 5678 | Workflow automation |
| **Nginx** | Host service | 80, 443 | Reverse proxy & SSL |

### Directory Structure

```
/opt/
├── convex/
│   ├── dev/
│   │   └── docker-compose.yml
│   └── prd/
│       └── docker-compose.yml
├── supabase/
│   ├── development/
│   │   └── docker-compose.yml
│   └── prd/
│       └── docker-compose.yml
├── n8n/
│   └── docker-compose.yml
└── backups/
    └── YYYYMMDD_HHMMSS/
```

---

## Convex Configuration

### URLs and Endpoints

| Environment | Backend URL | Dashboard URL |
|-------------|-------------|---------------|
| **Development** | https://dev.convex.macinations.au | https://dashboard.dev.convex.macinations.au |
| **Production** | https://prd.convex.macinations.au | https://dashboard.prd.convex.macinations.au |

### Admin Keys

Admin keys are generated using `./generate_admin_key.sh` inside the backend container. These keys are **persistent** as long as the `INSTANCE_SECRET` environment variable remains unchanged.

**Generate Admin Key:**
```bash
# Dev
docker exec convex-dev-backend ./generate_admin_key.sh

# Prd
docker exec convex-prd-backend ./generate_admin_key.sh
```

### Port Mapping

| Environment | Service | Host Port | Container Port | Description |
|-------------|---------|-----------|----------------|-------------|
| Dev | Backend API | 16442 | 3210 | Convex sync/query API |
| Dev | HTTP Actions | 16444 | 3211 | HTTP action endpoints |
| Dev | Dashboard | 16445 | 6791 | Web dashboard |
| Prd | Backend API | 16443 | 3210 | Convex sync/query API |
| Prd | HTTP Actions | 16447 | 3211 | HTTP action endpoints |
| Prd | Dashboard | 16446 | 6791 | Web dashboard |

---

## Docker Compose Configuration

### Development (`/opt/convex/dev/docker-compose.yml`)

```yaml
services:
  backend:
    image: ghcr.io/get-convex/convex-backend:latest
    container_name: convex-dev-backend
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - 127.0.0.1:16442:3210
      - 127.0.0.1:16444:3211
    volumes:
      - convex-dev-data:/convex/data
    environment:
      POSTGRES_URL: postgresql://postgres:<PASSWORD>@host.docker.internal:15432/convex_self_hosted?sslmode=disable
      CONVEX_CLOUD_ORIGIN: https://dev.convex.macinations.au
      CONVEX_SITE_ORIGIN: https://dev.convex.macinations.au
      DO_NOT_REQUIRE_SSL: "true"
      RUST_LOG: info
      INSTANCE_NAME: convex-self-hosted
      INSTANCE_SECRET: <64-char-hex-secret>
    extra_hosts:
      - host.docker.internal:host-gateway
    restart: unless-stopped
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 10s

  dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    container_name: convex-dev-dashboard
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - 127.0.0.1:16445:6791
    environment:
      NEXT_PUBLIC_DEPLOYMENT_URL: https://dev.convex.macinations.au
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  convex-dev-data:
```

### Production (`/opt/convex/prd/docker-compose.yml`)

```yaml
services:
  backend:
    image: ghcr.io/get-convex/convex-backend:latest
    container_name: convex-prd-backend
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - 127.0.0.1:16443:3210
      - 127.0.0.1:16447:3211
    volumes:
      - convex-prd-data:/convex/data
    environment:
      POSTGRES_URL: postgresql://postgres:<PASSWORD>@host.docker.internal:15492/convex_self_hosted?sslmode=disable
      CONVEX_CLOUD_ORIGIN: https://prd.convex.macinations.au
      CONVEX_SITE_ORIGIN: https://prd.convex.macinations.au
      DO_NOT_REQUIRE_SSL: "true"
      RUST_LOG: info
      INSTANCE_NAME: convex-self-hosted
      INSTANCE_SECRET: <64-char-hex-secret>
    extra_hosts:
      - host.docker.internal:host-gateway
    restart: unless-stopped
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 10s

  dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    container_name: convex-prd-dashboard
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - 127.0.0.1:16446:6791
    environment:
      NEXT_PUBLIC_DEPLOYMENT_URL: https://prd.convex.macinations.au
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  convex-prd-data:
```

### Key Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | PostgreSQL connection string to Supabase database |
| `CONVEX_CLOUD_ORIGIN` | Public URL for the Convex backend |
| `CONVEX_SITE_ORIGIN` | URL for HTTP actions (same as CLOUD_ORIGIN) |
| `DO_NOT_REQUIRE_SSL` | Set to "true" for internal PostgreSQL connections |
| `INSTANCE_NAME` | Name used in admin key generation |
| `INSTANCE_SECRET` | 64-char hex secret for persistent admin keys |
| `NEXT_PUBLIC_DEPLOYMENT_URL` | Backend URL for dashboard |

---

## Nginx Configuration

### Backend API (`/etc/nginx/sites-available/dev-convex.macinations.au`)

```nginx
server {
    server_name dev.convex.macinations.au;

    client_max_body_size 50M;

    access_log /var/log/nginx/dev.convex.macinations.au.access.log;
    error_log /var/log/nginx/dev.convex.macinations.au.error.log;

    location / {
        proxy_pass http://127.0.0.1:16442;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/dev.convex.macinations.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.convex.macinations.au/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = dev.convex.macinations.au) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name dev.convex.macinations.au;
    return 404;
}
```

### Dashboard (`/etc/nginx/sites-available/dashboard.dev.convex.macinations.au`)

```nginx
server {
    server_name dashboard.dev.convex.macinations.au;

    location / {
        proxy_pass http://127.0.0.1:16445;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/dashboard.dev.convex.macinations.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.dev.convex.macinations.au/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = dashboard.dev.convex.macinations.au) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name dashboard.dev.convex.macinations.au;
    return 404;
}
```

---

## Database Configuration

### PostgreSQL Database

Convex uses a **separate database** called `convex_self_hosted` in each Supabase instance (not a schema in the `postgres` database).

| Environment | Host | Port | Database | User |
|-------------|------|------|----------|------|
| Dev | host.docker.internal | 15432 | convex_self_hosted | postgres |
| Prd | host.docker.internal | 15492 | convex_self_hosted | postgres |

**Create Database (if needed):**
```bash
# Dev
docker exec supabase-dev-db psql -U postgres -c "CREATE DATABASE convex_self_hosted;"

# Prd
docker exec supabase-prd-db psql -U postgres -c "CREATE DATABASE convex_self_hosted;"
```

### Convex Internal Tables

Convex creates these tables in the `convex_self_hosted` database:
- `documents` - All application data
- `indexes` - Convex indexes
- `leases` - Internal state
- `persistence_globals` - Global state
- `read_only` - Read-only state

---

## Local Development Setup

### Environment Variables (`.env.local`)

```bash
# Self-hosted Convex (dev environment)
CONVEX_SELF_HOSTED_URL=https://dev.convex.macinations.au
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01xxxxx...

# Frontend client URL
NEXT_PUBLIC_CONVEX_URL=https://dev.convex.macinations.au
```

### Deploy Functions

```bash
# Deploy to dev (uses .env.local)
npx convex deploy

# Deploy to prd (override env vars)
CONVEX_SELF_HOSTED_URL=https://prd.convex.macinations.au \
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01xxxxx... \
npx convex deploy
```

### Set Environment Variables

```bash
# Set environment variable on the Convex instance
npx convex env set VARIABLE_NAME "value"

# List environment variables
npx convex env list
```

---

## Data Management

### Export Data

```bash
# Export from self-hosted
npx convex export --path ./backup.zip
```

### Import Data

```bash
# Import to self-hosted (replaces all data)
npx convex import --replace-all ./backup.zip

# Import with confirmation prompt
npx convex import ./backup.zip
```

### Import Considerations

**Large Imports:** Importing large datasets (100K+ records) can overwhelm the server. For large imports:

1. Trim large tables before import:
```bash
# Extract export
unzip export.zip -d export_dir

# Trim large tables to 100 records
head -100 export_dir/alerts/documents.jsonl > temp && mv temp export_dir/alerts/documents.jsonl
head -100 export_dir/positions/documents.jsonl > temp && mv temp export_dir/positions/documents.jsonl

# Repackage
cd export_dir && zip -r ../trimmed-export.zip .
```

2. Stop non-essential services during import:
```bash
# Stop services to free resources
cd /opt/n8n && docker compose down
cd /opt/supabase/prd && docker compose down
```

---

## Operations

### Start Services

```bash
# Start Convex dev
cd /opt/convex/dev && docker compose up -d

# Start Convex prd
cd /opt/convex/prd && docker compose up -d

# Start all Supabase dev (minimal - just DB)
cd /opt/supabase/development && docker compose up -d db

# Start all Supabase prd (full stack)
cd /opt/supabase/prd && docker compose up -d

# Start N8N
cd /opt/n8n && docker compose up -d
```

### Stop Services

```bash
# Stop Convex dev
cd /opt/convex/dev && docker compose down

# Stop Convex prd
cd /opt/convex/prd && docker compose down

# Stop Supabase dev
cd /opt/supabase/development && docker compose down

# Stop Supabase prd
cd /opt/supabase/prd && docker compose down

# Stop N8N
cd /opt/n8n && docker compose down
```

### View Logs

```bash
# Convex dev logs
docker logs -f convex-dev-backend

# Convex prd logs
docker logs -f convex-prd-backend

# Last 50 lines
docker logs --tail 50 convex-dev-backend
```

### Check Status

```bash
# All containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Container stats
docker stats --no-stream

# System resources
top -bn1 | head -5
free -h
df -h /
```

### Generate Admin Key

```bash
# Dev
docker exec convex-dev-backend ./generate_admin_key.sh

# Prd
docker exec convex-prd-backend ./generate_admin_key.sh
```

---

## SSL Certificates

SSL certificates are managed by Certbot (Let's Encrypt) and auto-renewed.

### Certificate Locations

| Domain | Certificate Path |
|--------|-----------------|
| dev.convex.macinations.au | /etc/letsencrypt/live/dev.convex.macinations.au/ |
| prd.convex.macinations.au | /etc/letsencrypt/live/prd.convex.macinations.au/ |
| dashboard.dev.convex.macinations.au | /etc/letsencrypt/live/dashboard.dev.convex.macinations.au/ |
| dashboard.prd.convex.macinations.au | /etc/letsencrypt/live/dashboard.prd.convex.macinations.au/ |

### Renew Certificates

```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

---

## Troubleshooting

### Common Issues

**1. WebSocket errors (code 1011: InternalServerError)**

**Cause:** Functions not deployed to the instance.

**Solution:**
```bash
npx convex deploy
```

**2. "Src Pkg storage key not found"**

**Cause:** Same as above - functions need to be deployed.

**3. Server overload during import**

**Symptoms:** SSH timeout, high CPU, unresponsive server.

**Solution:**
1. Wait for import to complete or server to recover
2. Use trimmed exports for large datasets
3. Stop non-essential services before import

**4. Admin key invalid after restart**

**Cause:** Missing `INSTANCE_SECRET` in docker-compose.

**Solution:** Ensure `INSTANCE_SECRET` is set in environment variables.

**5. Database connection errors**

**Cause:** Supabase not running or wrong connection string.

**Solution:**
```bash
# Check if Supabase DB is running
docker ps | grep supabase-dev-db

# Test connection
docker exec supabase-dev-db psql -U postgres -c "SELECT 1"
```

### Health Checks

```bash
# Check Convex backend health
curl -s http://127.0.0.1:16442/version

# Check dashboard
curl -s http://127.0.0.1:16445 | head -5

# Check external access
curl -s https://dev.convex.macinations.au/version
```

---

## Backup Procedures

### Backup Convex Data

```bash
# Export via CLI (recommended)
npx convex export --path /tmp/convex-backup-$(date +%Y%m%d).zip

# Or backup PostgreSQL directly
docker exec supabase-dev-db pg_dump -U postgres convex_self_hosted > /opt/backups/convex-dev-$(date +%Y%m%d).sql
```

### Backup Configurations

```bash
BACKUP_DIR="/opt/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Convex configs
cp -r /opt/convex $BACKUP_DIR/

# Nginx configs
cp -r /etc/nginx/sites-available/*convex* $BACKUP_DIR/

# SSL certs
cp -r /etc/letsencrypt $BACKUP_DIR/
```

---

## DNS Records

| Subdomain | Type | Value |
|-----------|------|-------|
| dev.convex.macinations.au | A | 138.199.235.169 |
| prd.convex.macinations.au | A | 138.199.235.169 |
| dashboard.dev.convex.macinations.au | A | 138.199.235.169 |
| dashboard.prd.convex.macinations.au | A | 138.199.235.169 |

---

## Security Considerations

1. **Admin Keys:** Store securely, never commit to version control
2. **INSTANCE_SECRET:** Keep confidential, changing it invalidates all admin keys
3. **Database Passwords:** URL-encoded in POSTGRES_URL, stored in docker-compose
4. **SSL:** All external traffic uses HTTPS via Let's Encrypt
5. **Firewall:** Backend ports (16442-16447) are bound to 127.0.0.1 only
6. **Network Isolation:** Containers communicate via Docker networks

---

## Vercel Deployment

The Next.js frontend is deployed on Vercel and connects to the self-hosted Convex backend.

### Vercel URLs

| Environment | URL |
|-------------|-----|
| **Production** | https://fms-git-main-macinations-projects.vercel.app |

### Required Environment Variables in Vercel

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://prd.convex.macinations.au` | Frontend connects to Convex |
| `CONVEX_SELF_HOSTED_URL` | `https://prd.convex.macinations.au` | For server-side operations |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | `convex-self-hosted\|01xxx...` | Admin key for deployments |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | `https://fms-git-main-macinations-projects.vercel.app/callback` | Auth callback |
| `WORKOS_CLIENT_ID` | Your WorkOS client ID | |
| `WORKOS_API_KEY` | Your WorkOS API key | |
| `WORKOS_COOKIE_PASSWORD` | 32+ char secret | |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox token | |

**Important:** Do NOT set `CONVEX_DEPLOYMENT` when using self-hosted Convex.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│   Vercel (Frontend)     │   │   Convex (Backend)          │
│   Next.js App           │   │   prd.convex.macinations.au │
│   UI, Auth Flow         │◄──│   Database, Functions       │
└─────────────────────────┘   │   HTTP Actions, Webhooks    │
                              └─────────────────────────────┘
```

---

## Stripe Webhook Configuration

Stripe webhooks are handled by Convex HTTP actions, NOT by Vercel/Next.js.

### Webhook Endpoint

| Environment | Webhook URL |
|-------------|-------------|
| **Production** | `https://prd.convex.macinations.au/stripe-webhook` |
| **Development** | `https://dev.convex.macinations.au/stripe-webhook` |

### Setup in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter the webhook URL: `https://prd.convex.macinations.au/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Set Webhook Secret in Convex

```bash
# Create env file for prd
cat > /tmp/convex-prd.env << 'EOF'
CONVEX_SELF_HOSTED_URL=https://prd.convex.macinations.au
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-prd-admin-key>
EOF

# Set the webhook secret
npx convex env set STRIPE_WEBHOOK_SECRET "whsec_your_secret_here" --env-file /tmp/convex-prd.env
```

### Required Stripe Environment Variables in Convex

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |

### Why Convex URL (not Vercel)?

The webhook handler is defined in `convex/http.ts`:

```typescript
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validates signature and processes events
  }),
});
```

This runs on the Convex backend infrastructure, not on Vercel. Stripe sends events directly to Convex, which then updates the database in real-time.

---

## WorkOS Authentication

### Redirect URIs

Configure these redirect URIs in the [WorkOS Dashboard](https://dashboard.workos.com):

| Environment | Redirect URI |
|-------------|--------------|
| **Production** | `https://fms-git-main-macinations-projects.vercel.app/callback` |
| **Local Dev** | `http://localhost:3000/callback` |

### Environment Variables

**In Vercel:**
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` = `https://fms-git-main-macinations-projects.vercel.app/callback`

**In Convex (both dev and prd):**
- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_COOKIE_PASSWORD`
- `WORKOS_ADMIN_EMAILS`

---

## References

- [Convex Self-Hosting Documentation](https://docs.convex.dev/self-hosting)
- [Convex Self-Hosted Docker Setup](https://github.com/get-convex/convex-backend/tree/main/self-hosted/docker)
- [Convex CLI Documentation](https://docs.convex.dev/cli)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [WorkOS Documentation](https://workos.com/docs)
