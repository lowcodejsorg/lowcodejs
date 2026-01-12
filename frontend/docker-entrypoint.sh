#!/bin/sh
set -e

# Substitui placeholder pela URL real da API em runtime
if [ -n "$VITE_API_BASE_URL" ]; then
  echo "Configurando API URL: $VITE_API_BASE_URL"

  # Substitui em todos os arquivos JS do build
  find /app/.output -name "*.js" -o -name "*.mjs" | xargs sed -i "s|http://localhost:3000|$VITE_API_BASE_URL|g" 2>/dev/null || true
fi

exec "$@"
