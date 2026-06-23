#!/bin/sh
# Migration: relationship-repair-unmaterialized
# Reconstrói links de relacionamentos FK-inline a partir do embedded sobrevivente
# (definition materializada com 0 links) e materializa campos RELATIONSHIP que
# caíram no vão das migrations 14/15 (group sem slug). Idempotente via marker
# MIGRATION_RELATIONSHIP_REPAIR_AT. Repassa "$@" (ex.: --force) ao node.
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

if [ -f "$MIGRATION_DIR/23-migrate-relationship-repair-unmaterialized.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/23-migrate-relationship-repair-unmaterialized.ts" "$@"
else
  runas node "$MIGRATION_DIR/23-migrate-relationship-repair-unmaterialized.js" "$@"
fi
