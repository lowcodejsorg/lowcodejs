#!/bin/sh
# Migration: group-native-fields
# Garante que cada Field do tipo FIELD_GROUP tenha os 5 campos nativos
# (_id, creator, createdAt, trashed, trashedAt) em sua subtabela.
# Idempotente: verifica presença dos campos antes de inserir.
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

if [ -f "$MIGRATION_DIR/migrate-group-native-fields.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-group-native-fields.ts"
else
  runas node "$MIGRATION_DIR/migrate-group-native-fields.js"
fi
