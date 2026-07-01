#!/bin/sh
# Migration: repair-owns-fk
# Restaura FKs inline de relacionamentos OWNS_FK (1:1/1:N) que foram apagadas
# pela migration 23 ao recriar links indevidamente. Apaga os links criados pela
# 23 para essas definitions após restaurar as FKs. Idempotente via marker
# MIGRATION_REPAIR_OWNS_FK_AT. Repassa "$@" ao node.
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

if [ -f "$MIGRATION_DIR/27-migrate-repair-owns-fk.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/27-migrate-repair-owns-fk.ts" "$@"
else
  runas node "$MIGRATION_DIR/27-migrate-repair-owns-fk.js" "$@"
fi
