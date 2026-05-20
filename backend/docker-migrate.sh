#!/bin/sh
# Orquestrador de migrations. Executa todos os scripts em ordem numérica.
# Rodar dentro do container:
#   docker exec low-code-js-api sh /app/docker-migrate.sh
#
# Migration específica:
#   docker exec low-code-js-api sh /app/scripts/migrations/01-dual-connection.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Rodando todas as migrations..."

for script in "$SCRIPT_DIR/scripts/migrations"/*.sh; do
  sh "$script"
done

echo "✅ Migrations concluídas."
