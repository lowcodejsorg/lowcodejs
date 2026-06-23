#!/bin/sh
# Migration: field-permissions
# Backfilla a visibilidade por contexto (list/form/detail) a partir dos booleans
# showIn* legados. Idempotente: skip se marker setado.
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

if [ -f "$MIGRATION_DIR/10-migrate-field-permissions.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/10-migrate-field-permissions.ts" "$@"
else
  runas node "$MIGRATION_DIR/10-migrate-field-permissions.js" "$@"
fi
