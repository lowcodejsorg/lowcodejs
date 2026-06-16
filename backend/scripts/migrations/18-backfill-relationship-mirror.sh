#!/bin/sh
# Migration: backfill-relationship-mirror
# Grava o espelho denormalizado `relationship.mirror` (multiple/visible/label do
# lado oposto) em campos RELATIONSHIP. Sem isto, roleOfField retorna null e a
# leitura/escrita da row cai no fallback legado (pivô), divergindo dos endpoints
# /links (FK-inline). Roda DEPOIS da 16 (endpoint flags) e 17 (links→FK).
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_MIRROR_AT setado.
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

if [ -f "$MIGRATION_DIR/migrate-backfill-relationship-mirror.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-backfill-relationship-mirror.ts"
else
  runas node "$MIGRATION_DIR/migrate-backfill-relationship-mirror.js"
fi
