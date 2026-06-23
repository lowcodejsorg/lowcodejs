#!/bin/sh
# Migration: field-validations
# Backfilla o array `validations` (default []) em Field docs existentes — base da
# camada unica de validacao de campo (core/validations/*). Nao deriva regras do
# `format` (legado segue validando). Idempotente via marker
# MIGRATION_FIELD_VALIDATIONS_AT no Setting singleton.
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

if [ -f "$MIGRATION_DIR/19-migrate-field-validations.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/19-migrate-field-validations.ts" "$@"
else
  runas node "$MIGRATION_DIR/19-migrate-field-validations.js" "$@"
fi
