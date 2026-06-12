#!/bin/sh
# Migration: table-permissions
# Backfilla o novo modelo de permissoes (binding por acao + members) a partir da
# visibility/owner/administrators legados. Idempotente: skip se marker setado.
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

echo "🔐 Verificando backfill de permissoes da tabela..."
if [ -f "$MIGRATION_DIR/migrate-table-permissions.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-table-permissions.ts"
else
  runas node "$MIGRATION_DIR/migrate-table-permissions.js"
fi
