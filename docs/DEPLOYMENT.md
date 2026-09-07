# 🚀 Production Deployment & Operations Guide

## Paytm Recharge Platform

This document outlines the deployment, containerization, environment configuration, and operational runbooks for the **Paytm Recharge Next.js Platform**.

---

## 1. Quick Start: Docker Compose (Recommended)

Run the entire application stack (Next.js Standalone + PostgreSQL 16 + Auto-migrations & seeding) in isolated containers with a single command:

```bash
# From repository root
docker compose up --build -d
```

Verify services are up:
```bash
docker compose ps
```

Access the application:
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **PostgreSQL**: `localhost:5432` (`postgres:postgrespassword`)

To view live container logs:
```bash
docker compose logs -f web
```

To stop the services:
```bash
docker compose down
```

---

## 2. Local Production Build & Run

If running directly on a host machine without Docker:

### Step 1: Environment Variables
Create or verify `.env` inside `paytm-recharge-nextjs/`:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
PORT=3000
NODE_ENV=production
```

### Step 2: Database Preparation
```bash
cd paytm-recharge-nextjs
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 3: Compile Standalone Build
```bash
npm run build
```

### Step 4: Run Production Server
```bash
npm run start
# Or using the standalone server:
node .next/standalone/server.js
```

---

## 3. Cloud Deployment Strategies

### Option A: Vercel + Neon / Supabase (Serverless)

1. **Database Setup**:
   - Create a PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
   - Copy the connection string with connection pooling enabled (e.g. `postgresql://...pgbouncer=true` or standard pooler).
2. **Deploy to Vercel**:
   - Import the repository into Vercel.
   - Set the Root Directory to `paytm-recharge-nextjs`.
   - Add environment variable `DATABASE_URL`.
   - Set Build Command: `npx prisma generate && npm run build`.
3. **Database Push**:
   - Run `npx prisma db push` and `npx tsx prisma/seed.ts` from your local machine targeting the remote `DATABASE_URL`.

### Option B: VPS / Cloud VM (Docker Compose)

Deploy to AWS EC2, DigitalOcean Droplet, Linode, or GCP Compute Engine:

```bash
git clone https://github.com/<your-org>/SW2627-Nextjs-Paytm-Recharge.git
cd SW2627-Nextjs-Paytm-Recharge
docker compose up --build -d
```

Configure Nginx / Caddy as a reverse proxy with SSL termination (Let's Encrypt):

```nginx
server {
    server_name recharge.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Disable buffering for real-time Server-Sent Events (SSE)
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

---

## 4. Environment Variables Reference

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:password@localhost:5432/paytm_recharge` | PostgreSQL connection string |
| `NODE_ENV` | No | `production` | Node environment mode |
| `PORT` | No | `3000` | Server listening port |
| `NEXT_TELEMETRY_DISABLED` | No | `1` | Opt-out of anonymous analytics |

---

## 5. Health Checks & Observability

### Endpoint: `GET /api/health`

Returns live runtime diagnostics including database connectivity status, roundtrip latency, and heap memory usage:

#### Healthy Response (HTTP 200)
```json
{
  "status": "healthy",
  "timestamp": "2026-09-07T14:32:00.000Z",
  "uptimeSeconds": 1420,
  "latencyMs": 1,
  "database": {
    "status": "healthy",
    "latencyMs": 1
  },
  "system": {
    "heapUsedMb": 48.25,
    "rssMb": 98.41,
    "nodeVersion": "v20.x"
  }
}
```

#### Unhealthy Response (HTTP 503)
If the database connection is lost:
```json
{
  "status": "degraded",
  "database": {
    "status": "down",
    "latencyMs": -1
  }
}
```

Use this route in container orchestrators (Kubernetes liveness/readiness probes, Docker Compose healthchecks, AWS ECS target groups).

---

## 6. Performance & Quality Verification

### Run End-to-End Tests
```bash
cd paytm-recharge-nextjs
npm test
```

### Run Concurrency & Load Benchmark Suite
```bash
npm run test:perf
```

Verifies:
- **Baseline latency**: All endpoints `< 500ms` SLA (typically 1ms - 20ms).
- **Concurrency**: 50 concurrent connections sustained at `> 1,000 req/s`.
- **Race Condition Prevention**: 10 simultaneous duplicate recharge attempts result in exactly 1 approval (201) and 9 rejections (409).
- **SSE Stream Latency**: `< 5ms` real-time notification dispatch.
