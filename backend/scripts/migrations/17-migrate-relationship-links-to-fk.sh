#!/bin/sh
# Migration: relationship-links-to-fk
# Converte vínculos (RelationshipLink) de relacionamentos 1:1 e 1:N para FK
# single inline na própria row (modelo FK-inline). N:N segue no pivô (links
# preservados). Roda DEPOIS da 15 (embedded → links) e 16 (endpoint flags).
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_LINKS_TO_FK_AT setado.
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

if [ -f "$MIGRATION_DIR/17-migrate-relationship-links-to-fk.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/17-migrate-relationship-links-to-fk.ts" "$@"
else
  runas node "$MIGRATION_DIR/17-migrate-relationship-links-to-fk.js" "$@"
fi
