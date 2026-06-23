#!/bin/sh
# Migration: backfill-extension-table-settings
# Garante o campo `tableSettings` (default {}) nos Extension docs existentes — o
# campo Mixed foi adicionado ao model junto do row-access guard. Mongoose só
# aplica o default em leitura/escrita nova; aqui persistimos o {} nos docs
# antigos. Idempotente via marker MIGRATION_EXTENSION_TABLE_SETTINGS_AT.
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

if [ -f "$MIGRATION_DIR/20-migrate-backfill-extension-table-settings.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/20-migrate-backfill-extension-table-settings.ts" "$@"
else
  runas node "$MIGRATION_DIR/20-migrate-backfill-extension-table-settings.js" "$@"
fi
