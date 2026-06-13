#!/bin/sh
# Migration: backfill-row-slugs
# Gera sharedRowSlug para registros antigos de tabelas com rowSlugFieldId
# configurado, habilitando a URL amigável (/tables/:slug/:rowSlug) nos registros
# retroativos. Idempotente: skip se marker MIGRATION_ROW_SLUG_BACKFILL_AT setado.
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

if [ -f "$MIGRATION_DIR/migrate-backfill-row-slugs.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-backfill-row-slugs.ts"
else
  runas node "$MIGRATION_DIR/migrate-backfill-row-slugs.js"
fi
