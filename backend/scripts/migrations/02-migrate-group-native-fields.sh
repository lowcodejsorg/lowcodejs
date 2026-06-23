#!/bin/sh
# Migration: native-fields (tabela + grupos)
# Garante os campos nativos no nivel raiz da tabela (FIELD_NATIVE_LIST) e em cada
# subtabela FIELD_GROUP (FIELD_GROUP_NATIVE_LIST), incluindo os de auditoria
# updatedAt e updater. Marker versionado MIGRATION_NATIVE_FIELDS_AT.
# Idempotente: verifica presença por slug antes de inserir.
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

if [ -f "$MIGRATION_DIR/02-migrate-group-native-fields.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/02-migrate-group-native-fields.ts" "$@"
else
  runas node "$MIGRATION_DIR/02-migrate-group-native-fields.js" "$@"
fi
