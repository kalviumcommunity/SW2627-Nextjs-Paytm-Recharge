FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/paytm_recharge

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Migration stage
FROM builder AS migrator
WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/paytm_recharge

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/paytm_recharge

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]