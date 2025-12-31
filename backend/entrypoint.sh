#!/bin/sh
set -e

# Verificar se seeders já foram executados
if [ ! -f "/app/_storage/.seeded" ]; then
    echo "🌱 Primeira execução - rodando seeders..."
    node database/seeders/main.js

    if [ $? -eq 0 ]; then
        touch /app/_storage/.seeded
        echo "✅ Seeders executados com sucesso!"
    else
        echo "❌ Erro ao executar seeders"
        exit 1
    fi
else
    echo "⏭️ Seeders já foram executados anteriormente"
fi

# Executar comando principal (node bin/server.js)
exec "$@"
