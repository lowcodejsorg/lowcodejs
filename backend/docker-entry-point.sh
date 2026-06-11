#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Em dev a imagem copia este entrypoint para "/" (raiz), mas o código da app
# (scripts/migrations, database/seeders) vive em /app. Cai para /app quando os
# scripts não estão ao lado do entrypoint.
if [ ! -d "$SCRIPT_DIR/scripts/migrations" ] && [ -d /app/scripts/migrations ]; then
  SCRIPT_DIR=/app
fi

chown -R 1001:1001 "$SCRIPT_DIR/_storage" 2>/dev/null || true

runas() {
  if command -v su-exec >/dev/null 2>&1; then
    su-exec 1001:1001 "$@"
  else
    "$@"
  fi
}

echo "🚀 Rodando migrations..."
for script in "$SCRIPT_DIR/scripts/migrations"/*.sh; do
  sh "$script"
done
echo "✅ Migrations concluídas."

echo "🌱 Rodando seeders..."
if [ -f "$SCRIPT_DIR/database/seeders/main.ts" ]; then
  runas npm run seed
else
  runas node "$SCRIPT_DIR/database/seeders/main.js"
fi

if command -v su-exec >/dev/null 2>&1; then
  exec su-exec 1001 "$@"
else
  exec "$@"
fi
