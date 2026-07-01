#!/bin/sh
# Migration: relationship-cleanup-broken-definitions
# Quarentena campos espelho cujas RelationshipDefinitions referenciam tabelas
# inexistentes (gerados antes da correção do cleanupTable). Idempotente via
# marker MIGRATION_RELATIONSHIP_BROKEN_DEFINITIONS_AT. Repassa "$@" ao node.
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

if [ -f "$MIGRATION_DIR/26-migrate-relationship-cleanup-broken-definitions.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/26-migrate-relationship-cleanup-broken-definitions.ts" "$@"
else
  runas node "$MIGRATION_DIR/26-migrate-relationship-cleanup-broken-definitions.js" "$@"
fi
