#!/bin/sh

# Substitui o placeholder pela variável de ambiente em todos os arquivos JS
find /usr/share/nginx/html -type f -name '*.js' -exec sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL:-}|g" {} \;

# Executa o comando (nginx)
exec "$@"