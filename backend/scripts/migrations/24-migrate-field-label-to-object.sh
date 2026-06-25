#!/bin/sh
# Migration: label de campo string → objeto por contexto {list,filter,form,detail}
# Idempotente: skip se marker setado.
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

if [ -f "$MIGRATION_DIR/24-migrate-field-label-to-object.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/24-migrate-field-label-to-object.ts" "$@"
else
  runas node "$MIGRATION_DIR/24-migrate-field-label-to-object.js" "$@"
fi
