#!/bin/sh
# Migration: drop-legacy-permission-fields
# Remove os campos legados (visibility/collaboration/administrators das tabelas e
# showIn* dos campos) dos documentos JA migrados para o novo modelo.
# Roda DEPOIS de 09/10/11 (backfills). Idempotente: skip se marker setado.
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

if [ -f "$MIGRATION_DIR/migrate-drop-legacy-permission-fields.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-drop-legacy-permission-fields.ts"
else
  runas node "$MIGRATION_DIR/migrate-drop-legacy-permission-fields.js"
fi
