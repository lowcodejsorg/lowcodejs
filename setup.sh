#!/bin/bash

# Script de configuração inicial do projeto LowCodeJS
# Compatível com: Linux, macOS e Windows (Git Bash)

set -e  # Para o script se houver erro

# Função para configurar a URL da API no frontend (após docker compose up)
setup_frontend_url() {
    echo ""
    echo "Configurando URL da API no frontend..."

    # Carregar variáveis do .env
    if [ -f "./.env" ]; then
        set -a
        source ./.env
        set +a
    fi

    API_URL="${APP_SERVER_URL:-http://localhost:3000}"
    VOLUME_PATH="/var/lib/docker/volumes/lowcodejs_lowcodejs-app-public/_data"

    # Verificar se o container está rodando
    if ! docker ps --format '{{.Names}}' | grep -q "lowcodejs-app"; then
        echo "Container lowcodejs-app não está rodando."
        echo "Execute primeiro: docker compose -f docker-compose.oficial.yml up -d"
        exit 1
    fi

    # Copiar arquivos do container para o volume (primeira vez)
    if [ ! -d "$VOLUME_PATH" ] || [ -z "$(ls -A $VOLUME_PATH 2>/dev/null)" ]; then
        echo "Copiando arquivos do container para o volume..."
        docker cp lowcodejs-app:/app/.output/public/. "$VOLUME_PATH/"
    fi

    # Fazer replace da URL
    echo "Substituindo http://localhost:3000 -> $API_URL"
    find "$VOLUME_PATH" -type f -name "*.js" -exec sed -i "s|http://localhost:3000|$API_URL|g" {} +

    # Reiniciar o app para usar os arquivos atualizados
    echo "Reiniciando container..."
    docker restart lowcodejs-app

    echo ""
    echo "Frontend configurado com sucesso!"
    echo "API URL: $API_URL"
}

# Se passou --frontend-url, executar apenas essa função
if [ "$1" = "--frontend-url" ]; then
    setup_frontend_url
    exit 0
fi

echo "Configurando projeto LowCodeJS..."
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.oficial.yml" ]; then
    echo "Execute este script na raiz do projeto (onde está o docker-compose.yml)"
    exit 1
fi

echo "1. Verificando .env.example na raiz..."

if [ ! -f "./.env.example" ]; then
    echo "Arquivo ./.env.example não encontrado na raiz do projeto"
    exit 1
fi

if [ ! -f "./credential-generator.sh" ]; then
    echo "Arquivo ./credential-generator.sh não encontrado"
    exit 1
fi

echo ""
echo "2. Gerando credenciais e criando .env..."

cp ./.env.example ./.env
echo "Arquivo ./.env criado na raiz"

chmod +x ./credential-generator.sh
echo "Gerando credenciais JWT..."
./credential-generator.sh

echo ""
echo "3. Interpolando variáveis de ambiente..."

# Carregar variáveis do .env para o ambiente
set -a
source ./.env
set +a

# Verificar se envsubst está disponível
if command -v envsubst &> /dev/null; then
    envsubst < ./.env > ./.env.tmp
    mv ./.env.tmp ./.env
    echo "Variáveis interpoladas com sucesso"
else
    echo "⚠️  envsubst não encontrado, usando fallback..."
    
    # Fallback manual para interpolação
    cp ./.env ./.env.tmp
    
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Ignorar linhas vazias e comentários
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        
        # Remover espaços do key
        key=$(echo "$key" | xargs)
        
        # Pegar o valor da variável exportada
        eval "real_value=\$$key"
        
        # Escapar caracteres especiais para sed
        escaped_value=$(printf '%s\n' "$real_value" | sed 's/[&/\]/\\&/g')
        
        # Substituir ${KEY} pelo valor (compatível com macOS e Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|\${$key}|$escaped_value|g" ./.env.tmp 2>/dev/null || true
        else
            sed -i "s|\${$key}|$escaped_value|g" ./.env.tmp 2>/dev/null || true
        fi
    done < ./.env
    
    mv ./.env.tmp ./.env
    echo "Variáveis interpoladas com sucesso (fallback)"
fi

echo ""
echo "4. Separando variáveis de ambiente..."

mkdir -p ./backend ./frontend

# Filtrar variáveis (compatível com grep sem matches)
grep -v "^VITE_" ./.env > ./backend/.env 2>/dev/null || true
echo "Arquivo ./backend/.env criado (sem VITE_*)"

grep "^VITE_" ./.env > ./frontend/.env 2>/dev/null || true
echo "Arquivo ./frontend/.env criado (apenas VITE_*)"

echo ""
echo "Configuração concluída com sucesso!"
echo ""
echo "Próximos passos (desenvolvimento local):"
echo "   1. Execute: docker compose up --build"
echo "   2. Em outro terminal: docker exec lowcodejs-api node database/seeders/main.js"
echo ""
echo "Próximos passos (VPS/produção com docker-compose.oficial.yml):"
echo "   1. Configure APP_SERVER_URL no .env (ex: http://SEU_IP:3000)"
echo "   2. Execute: docker compose -f docker-compose.oficial.yml up -d"
echo "   3. Execute: ./setup.sh --frontend-url"
echo "   4. Execute: docker exec lowcodejs-api node database/seeders/main.js"
echo ""
echo "Acessos (local):"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Docs:     http://localhost:3000/documentation"
echo ""