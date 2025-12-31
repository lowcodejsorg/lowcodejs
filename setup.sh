#!/bin/bash

# Script de configuração inicial do projeto Matis
# Automatiza a criação de arquivos .env e geração de credenciais

set -e  # Para o script se houver erro

echo "Configurando projeto Matis..."
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "docker-compose.yml" ]; then
    echo "Execute este script na raiz do projeto (onde está o docker-compose.yml)"
    exit 1
fi

echo "1. Verificando .env.example na raiz..."

# Verificar se .env.example existe na raiz
if [ ! -f "./.env.example" ]; then
    echo "Arquivo ./.env.example não encontrado na raiz do projeto"
    exit 1
fi

# Verificar se credential-generator.sh existe
if [ ! -f "./credential-generator.sh" ]; then
    echo "Arquivo ./credential-generator.sh não encontrado"
    exit 1
fi

echo ""
echo "2. Gerando credenciais e criando .env..."

# Copiar .env.example para .env na raiz
cp ./.env.example ./.env
echo "Arquivo ./.env criado na raiz"

# Dar permissão e executar gerador de credenciais
chmod +x ./credential-generator.sh
echo "Gerando credenciais JWT..."
./credential-generator.sh

echo ""
echo "3. Interpolando variáveis de ambiente..."

# Carregar variáveis do .env para o ambiente
set -a
source ./.env
set +a

# Substituir ${VAR} pelos valores reais
envsubst < ./.env > ./.env.tmp
mv ./.env.tmp ./.env
echo "Variáveis interpoladas com sucesso"

echo ""
echo "4. Separando variáveis de ambiente..."

# Backend: todas as variáveis exceto VITE_*
grep -v "^VITE_" ./.env > ./backend/.env
echo "Arquivo ./backend/.env criado (sem VITE_*)"

# Frontend: apenas variáveis VITE_*
grep "^VITE_" ./.env > ./frontend/.env
echo "Arquivo ./frontend/.env criado (apenas VITE_*)"

echo ""
echo "Configuração concluída com sucesso!"
echo ""
echo "Próximos passos:"
echo "   1. Execute: docker compose up --build"
echo "   2. Em outro terminal: docker exec low-code-js-api npm run seed"
echo ""
echo "Acessos:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Docs:     http://localhost:3000/documentation"
echo ""