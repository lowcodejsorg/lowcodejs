#!/bin/sh
set -e
chown -R 1001:1001 /app/_storage 2>/dev/null || true

echo "🔀 Verificando migração dual-connection..."
if [ -f "/app/database/migrations/migrate-dual-connection.ts" ]; then
  su-exec 1001:1001 npm run migrate:dual-connection
else
  su-exec 1001:1001 node /app/database/migrations/migrate-dual-connection.js
  # su-exec 1001:1001 node /app/database/migrations/migrate-dual-connection.js --drop-source
fi

echo "🌱 Rodando seeders..."
if [ -f "/app/database/seeders/main.ts" ]; then
  su-exec 1001:1001 npm run seed
else
  su-exec 1001:1001 node /app/database/seeders/main.js
fi

exec su-exec 1001 "$@"
