#!/bin/sh
# Migration: menu-visibility
# Define visibility=PUBLIC nos menus existentes (legado: visível a todos).
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

if [ -f "$MIGRATION_DIR/migrate-menu-visibility.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-menu-visibility.ts"
else
  runas node "$MIGRATION_DIR/migrate-menu-visibility.js"
fi
