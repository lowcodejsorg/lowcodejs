#!/bin/sh
# Migration: row-status-trashed
# Backfilla status/draftAt e remove o boolean `trashed` das rows dinâmicas e
# itens de grupo no DB de dados. A lixeira passa a ser controlada só por
# trashedAt. Idempotente: skip se marker MIGRATION_ROW_STATUS_TRASHED_AT setado.
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

if [ -f "$MIGRATION_DIR/migrate-row-status-trashed.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-row-status-trashed.ts"
else
  runas node "$MIGRATION_DIR/migrate-row-status-trashed.js"
fi
