#!/bin/sh
# Migration: backfill-relationship-endpoint-flags
# Garante a flag `visible` (top-level e em relationship.visible) em campos
# RELATIONSHIP que ainda não a tenham. Não toca multiple nem relationshipId.
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_ENDPOINT_FLAGS_AT setado.
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

if [ -f "$MIGRATION_DIR/migrate-backfill-relationship-endpoint-flags.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-backfill-relationship-endpoint-flags.ts"
else
  runas node "$MIGRATION_DIR/migrate-backfill-relationship-endpoint-flags.js"
fi
