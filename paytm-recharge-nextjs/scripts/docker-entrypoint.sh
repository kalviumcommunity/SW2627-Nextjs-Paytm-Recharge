#!/bin/sh
set -e

echo "==> Paytm Recharge Container Starting..."

# Wait for PostgreSQL to become available if DATABASE_URL is defined
if [ -n "$DATABASE_URL" ]; then
  echo "==> Ensuring PostgreSQL database schema is up-to-date..."
  npx prisma db push --skip-generate || true

  echo "==> Seeding initial operators and default user..."
  npx tsx prisma/seed.ts || true
fi

echo "==> Starting Next.js Production Server..."
exec "$@"
