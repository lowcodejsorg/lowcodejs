#!/bin/sh
# Migration: extension-slots
# Renomeia o campo `slot` para `slots` (array) em documentos de extensões.
# Necessário após refatoração da API de extensões.
# Idempotente: skip se marker já setado no Setting.
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

echo "🧩 Verificando rename slot → slots em extensões..."
if [ -f "$MIGRATION_DIR/migrate-extension-slots.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-extension-slots.ts"
else
  runas node "$MIGRATION_DIR/migrate-extension-slots.js"
fi
