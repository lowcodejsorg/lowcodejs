#!/bin/sh
# Migration: backfill de formMode='manage' em campos espelho N:N
# Idempotente: skip se marker setado.
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

if [ -f "$MIGRATION_DIR/25-migrate-relationship-backfill-form-mode.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/25-migrate-relationship-backfill-form-mode.ts" "$@"
else
  runas node "$MIGRATION_DIR/25-migrate-relationship-backfill-form-mode.js" "$@"
fi
