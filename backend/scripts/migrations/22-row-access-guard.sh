#!/bin/sh
# Migration: row-access-guard
# Marcadora (no-op): o controle de acesso por linha (visibility por grupo,
# creator-bypass, janela temporal) é avaliado em runtime e o campo de visibilidade
# + backfill das rows acontecem no bind-time (onTableBound), de forma idempotente.
# Não há backfill standalone aqui. Registra o marker MIGRATION_ROW_ACCESS_GUARD_AT
# só para manter a trilha de versão completa.
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

if [ -f "$MIGRATION_DIR/migrate-row-access-guard.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-row-access-guard.ts"
else
  runas node "$MIGRATION_DIR/migrate-row-access-guard.js"
fi
