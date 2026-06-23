#!/bin/sh
# Migration: backfill-storage-location
# Popula o campo `location` e `migration_status` em todos os docs Storage
# que não os possuem. Necessário após a feature de storage-migration.
# Idempotente: skip se marker MIGRATION_STORAGE_LOCATION_AT já setado.
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

# if [ -f "$MIGRATION_DIR/migrate-backfill-storage-location.ts" ]; then
#   runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-backfill-storage-location.ts"
# else
#   runas node "$MIGRATION_DIR/migrate-backfill-storage-location.js"
# fi
