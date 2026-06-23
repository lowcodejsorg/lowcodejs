#!/bin/sh
# Migration: backfill-relationship-create-records
# Backfilla registros de criação em campos de relacionamento existentes.
# Idempotente: skip se marker já setado no Setting.
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

if [ -f "$MIGRATION_DIR/04-migrate-backfill-relationship-create-records.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/04-migrate-backfill-relationship-create-records.ts" "$@"
else
  runas node "$MIGRATION_DIR/04-migrate-backfill-relationship-create-records.js" "$@"
fi
