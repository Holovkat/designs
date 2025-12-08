# Deployment Guide

## Overview

This guide covers deploying the FMS-GLM application to two environments:

| Environment | Platform | Purpose | Trigger |
|-------------|----------|---------|---------|
| **Production Demo** | Vercel | Stakeholder demos, public access | Auto on `main` push |
| **UAT/Testing** | Dokku on Hetzner | Personal testing, validation | Auto on `main` push |
| **PR Previews** | Vercel | Review changes before merge | Auto on every PR |

This setup aligns with the [Graphite stacking workflow](./github-workflow.md) - single branch (`main`) deployment to both environments.

---

## Part 1: Vercel Setup (Production Demo)

Vercel provides zero-config Next.js deployments with automatic preview URLs for every PR.

### Option A: CLI Setup (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. From project root, initialize and deploy
cd /path/to/fms-glm
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: fms-glm
# - Framework: Next.js (auto-detected)
# - Build settings: Accept defaults
```

### Option B: Web UI Setup

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repo (`fms-glm`)
4. Vercel auto-detects Next.js settings
5. Click "Deploy"

### Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:

```
CONVEX_DEPLOYMENT=<your-convex-deployment>
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
WORKOS_API_KEY=<your-workos-api-key>
WORKOS_CLIENT_ID=<your-workos-client-id>
# Add other variables from .env.local as needed
```

**Important:** Mark sensitive variables as "Sensitive" to hide them in logs.

### Vercel Features

Once connected:
- **Auto-deploy:** Every push to `main` triggers production deployment
- **Preview URLs:** Every PR gets a unique preview URL (e.g., `fms-glm-pr-123.vercel.app`)
- **Rollbacks:** One-click rollback to any previous deployment
- **Analytics:** Built-in performance monitoring

---

## Part 2: Dokku on Hetzner Setup (UAT/Testing)

Dokku is a lightweight PaaS that runs on your existing Hetzner VPS alongside other Docker containers.

### Prerequisites

- Hetzner VPS with Docker installed
- Existing reverse proxy (nginx/Traefik)
- SSH access to server
- Domain pointed to your server (e.g., `fms-glm.yourdomain.com`)

### Server Setup

**On your Hetzner server:**

```bash
# 1. Install Dokku (skip if already installed)
wget -NP . https://dokku.com/install/v0.34.4/bootstrap.sh
sudo DOKKU_TAG=v0.34.4 bash bootstrap.sh

# 2. Set your domain (first-time setup)
dokku domains:set-global yourdomain.com

# 3. Create the app
dokku apps:create fms-glm

# 4. Set app domain
dokku domains:set fms-glm fms-glm.yourdomain.com

# 5. Configure environment variables
dokku config:set fms-glm \
  CONVEX_DEPLOYMENT=<your-convex-deployment> \
  NEXT_PUBLIC_CONVEX_URL=<your-convex-url> \
  WORKOS_API_KEY=<your-workos-api-key> \
  WORKOS_CLIENT_ID=<your-workos-client-id> \
  NODE_ENV=production

# 6. Set up SSL (optional but recommended)
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
dokku letsencrypt:set fms-glm email your@email.com
dokku letsencrypt:enable fms-glm
```

### Project Configuration

**1. Update `next.config.ts` for standalone output:**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // ... your other config
};

export default nextConfig;
```

**2. Create `Dockerfile` in project root:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

**3. Create `app.json` for Dokku (optional):**

```json
{
  "name": "fms-glm",
  "scripts": {
    "dokku": {
      "postdeploy": "echo 'Deployment complete!'"
    }
  },
  "healthchecks": {
    "web": [
      {
        "type": "startup",
        "name": "web check",
        "path": "/",
        "attempts": 3
      }
    ]
  }
}
```

**4. Create `.dockerignore`:**

```
node_modules
.next
.git
*.md
.env*
```

### Manual Deployment

**From your local machine:**

```bash
# 1. Add Dokku as a git remote (one-time setup)
git remote add dokku dokku@your-hetzner-ip:fms-glm

# 2. Deploy to Dokku
git push dokku main
```

### Automatic Deployment via GitHub Actions

**Create `.github/workflows/deploy-hetzner.yml`:**

```yaml
name: Deploy to Hetzner UAT

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Deploy to Dokku
        uses: dokku/github-action@master
        with:
          git_remote_url: 'ssh://dokku@${{ secrets.HETZNER_HOST }}:22/fms-glm'
          ssh_private_key: ${{ secrets.DOKKU_SSH_KEY }}
          branch: main
```

**GitHub Secrets Required:**
- `HETZNER_HOST`: Your Hetzner server IP or hostname
- `DOKKU_SSH_KEY`: Private SSH key with access to Dokku

**Generate SSH key for deployments:**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/dokku_deploy

# Add public key to Dokku (on server)
cat ~/.ssh/dokku_deploy.pub | ssh root@your-hetzner-ip "sudo dokku ssh-keys:add github-actions"

# Copy private key content to GitHub Secrets as DOKKU_SSH_KEY
cat ~/.ssh/dokku_deploy
```

---

## Part 3: Reverse Proxy Integration

If you have an existing reverse proxy on Hetzner:

### Option A: Let Dokku Manage Its Own Proxy

Dokku uses nginx by default. Configure it to listen on a different port:

```bash
# Set Dokku's nginx to use port 8080
dokku nginx:set fms-glm proxy-port-map http:80:3000
```

Then proxy from your main reverse proxy to Dokku's nginx.

### Option B: Disable Dokku's Proxy

```bash
# Disable Dokku's built-in nginx for this app
dokku nginx:set fms-glm disable-proxy true

# Get the app's container port
dokku proxy:ports fms-glm

# Configure your existing reverse proxy to point to the container
```

**Example nginx config (your existing proxy):**

```nginx
server {
    listen 80;
    server_name fms-glm.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;  # Or container port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Part 4: Deployment Flow

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                       (main branch)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Push to main
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│   GitHub Actions        │   │   Vercel                    │
│   (deploy-hetzner.yml)  │   │   (automatic webhook)       │
└───────────┬─────────────┘   └─────────────┬───────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│   Hetzner/Dokku (UAT)   │   │   Vercel (Production)       │
│   fms-glm.yourdomain.com│   │   fms-glm.vercel.app        │
└─────────────────────────┘   └─────────────────────────────┘
```

### PR Preview Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Pull Request Created/Updated                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Vercel Preview Deploy     │
              │   Automatic for every PR    │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Preview URL               │
              │   fms-glm-pr-123.vercel.app │
              │   (Test before merge)       │
              └─────────────────────────────┘
```

---

## Part 5: Useful Commands

### Vercel CLI

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs

# Set environment variable
vercel env add VARIABLE_NAME
```

### Dokku Commands

```bash
# View app logs
dokku logs fms-glm -t

# Restart app
dokku ps:restart fms-glm

# View app status
dokku ps:report fms-glm

# Scale app
dokku ps:scale fms-glm web=2

# View environment variables
dokku config:show fms-glm

# Enter app container
dokku enter fms-glm

# View deployment history
dokku events

# Rollback to previous deployment
dokku git:from-image fms-glm <previous-image>
```

---

## Troubleshooting

### Vercel Issues

**Build fails:**
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `npm run build` works locally

**Environment variables not working:**
- Prefix client-side vars with `NEXT_PUBLIC_`
- Redeploy after changing env vars

### Dokku Issues

**Deployment fails:**
```bash
# Check app logs
dokku logs fms-glm --num 100

# Check nginx config
dokku nginx:show-config fms-glm

# Rebuild app
dokku ps:rebuild fms-glm
```

**Container won't start:**
```bash
# Check container status
docker ps -a | grep fms-glm

# View container logs
docker logs <container-id>
```

**Port conflicts:**
```bash
# Check what ports are in use
dokku proxy:ports fms-glm

# Clear and reset ports
dokku proxy:ports-clear fms-glm
dokku proxy:ports-add fms-glm http:80:3000
```

---

## Security Considerations

1. **Never commit secrets** - Use environment variables
2. **Use SSH keys** - Not passwords for Dokku deployments
3. **Enable SSL** - Use Let's Encrypt on both platforms
4. **Rotate keys** - Periodically rotate deployment SSH keys
5. **Limit access** - Use GitHub branch protection rules

---

## Related Documentation

- [GitHub Workflow Guide](./github-workflow.md) - Graphite stacking workflow
- [Vercel Documentation](https://vercel.com/docs)
- [Dokku Documentation](https://dokku.com/docs/getting-started/installation/)
