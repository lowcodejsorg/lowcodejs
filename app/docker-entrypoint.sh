#!/bin/sh

# Substitui variáveis de ambiente nos arquivos JS
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL:-http://localhost:3000}|g" {} \;

# Inicia nginx
nginx -g "daemon off;"