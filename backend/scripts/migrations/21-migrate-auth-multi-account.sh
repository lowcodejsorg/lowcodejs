#!/bin/sh
# Migration: auth-multi-account
# Marcadora (no-op): as sessões multi-conta são 100% baseadas em cookies indexados
# (accessToken_<id>/refreshToken_<id> + activeAccountId) — não há campo persistido
# no User nem coleção a migrar. Registra o marker MIGRATION_AUTH_MULTI_ACCOUNT_AT
# só para manter a trilha de versão completa.
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

if [ -f "$MIGRATION_DIR/21-migrate-auth-multi-account.ts" ]; then
  runas node --import @swc-node/register/esm-register "$MIGRATION_DIR/21-migrate-auth-multi-account.ts" "$@"
else
  runas node "$MIGRATION_DIR/21-migrate-auth-multi-account.js" "$@"
fi
