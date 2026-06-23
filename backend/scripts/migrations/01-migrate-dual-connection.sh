#!/bin/sh
# Migration: dual-connection
# Copia collections dinâmicas do DB system (DB_DATABASE) para o DB data (DB_DATA_DATABASE).
# Habilita o split em 2 conexões Mongoose (system + data).
# Idempotente: skip se marker MIGRATION_DUAL_CONNECTION_AT já setado no Setting.
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

if [ -f "$MIGRATION_DIR/01-migrate-dual-connection.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/01-migrate-dual-connection.ts" "$@"
else
  runas node "$MIGRATION_DIR/01-migrate-dual-connection.js" "$@"
fi
