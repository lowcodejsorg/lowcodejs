#!/bin/sh
# Migration: backfill-logger-audit
# Copia para os logs de ROW (/logs) os campos creator/updatedBy/objectCreatedAt/
# objectUpdatedAt do registro referenciado, lidos das linhas de tabela dinamica.
# Idempotente via marker MIGRATION_LOGGER_AUDIT_AT no Setting singleton.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "/app/database/migrations" ]; then
  MIGRATION_DIR="/app/database/migrations"
else
  MIGRATION_DIR="$(cd "$SCRIPT_DIR/../../database/migrations" && pwd)"
fi

runas() {
  if command -v su-exec >/dev/null 2>&1; then
    su-exec 1001:1001 "$@"
  else
    "$@"
  fi
}

echo "🧾 Backfill dos campos do registro referenciado nos logs (/logs)..."
if [ -f "$MIGRATION_DIR/migrate-backfill-logger-audit.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-backfill-logger-audit.ts"
else
  runas node "$MIGRATION_DIR/migrate-backfill-logger-audit.js"
fi
