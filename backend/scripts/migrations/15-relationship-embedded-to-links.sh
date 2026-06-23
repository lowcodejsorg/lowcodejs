#!/bin/sh
# Migration: relationship-embedded-to-links
# Converte relacionamentos embedded (array de ObjectIds em row[field.slug]) para
# o modelo de pivô: cria RelationshipDefinition + campo-espelho no target + um
# RelationshipLink por ObjectId, valida contagem por row e faz $unset do array.
# Idempotente: skip se marker MIGRATION_RELATIONSHIP_EMBEDDED_TO_LINKS_AT setado;
# campos já com relationship.relationshipId são pulados.
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

if [ -f "$MIGRATION_DIR/migrate-relationship-embedded-to-links.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/migrate-relationship-embedded-to-links.ts"
else
  runas node "$MIGRATION_DIR/migrate-relationship-embedded-to-links.js"
fi
