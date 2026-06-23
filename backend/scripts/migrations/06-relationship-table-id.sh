#!/bin/sh
# Migration: relationship-table-id
# Backfilla relationship.table._id em Field docs do tipo RELATIONSHIP onde
# o _id está ausente. Garante que refs de relacionamento sejam slug-independentes.
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_TABLE_ID_AT já setado.
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

if [ -f "$MIGRATION_DIR/migrate-relationship-table-id.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-relationship-table-id.ts"
else
  runas node "$MIGRATION_DIR/migrate-relationship-table-id.js"
fi
