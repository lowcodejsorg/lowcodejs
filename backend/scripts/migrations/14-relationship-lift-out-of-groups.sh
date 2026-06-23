#!/bin/sh
# Migration: relationship-lift-out-of-groups
# Promove campos RELATIONSHIP aninhados em FIELD_GROUP para o nível top-level da
# tabela (RELATIONSHIP é sempre top-level, §2), unindo (dedup) o dado dos itens
# do grupo num array top-level. Roda ANTES da conversão embedded→links (15).
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_LIFT_OUT_AT setado.
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

if [ -f "$MIGRATION_DIR/migrate-relationship-lift-out-of-groups.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-relationship-lift-out-of-groups.ts"
else
  runas node "$MIGRATION_DIR/migrate-relationship-lift-out-of-groups.js"
fi
