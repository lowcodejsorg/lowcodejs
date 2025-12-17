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

echo "1. Configurando Backend..."

# Configurar backend
if [ ! -f "./backend/.env.example" ]; then
    echo "Arquivo ./backend/.env.example não encontrado"
    exit 1
fi

cp ./backend/.env.example ./backend/.env
echo "Arquivo ./backend/.env criado"

# Configurar arquivo de ambiente de teste
if [ -f "./backend/.env.test.example" ]; then
    cp ./backend/.env.test.example ./backend/.env.test
    echo "Arquivo ./backend/.env.test criado"
fi

# Verificar se credential-generator.sh existe
if [ ! -f "./backend/credential-generator.sh" ]; then
    echo "Arquivo ./backend/credential-generator.sh não encontrado"
    exit 1
fi

# Dar permissão e executar gerador
chmod +x ./backend/credential-generator.sh
echo "Gerando credenciais JWT..."
./backend/credential-generator.sh

echo ""
echo "2. Configurando Frontend..."

# Configurar frontend
if [ ! -f "./frontend/.env.example" ]; then
    echo "  Arquivo ./frontend/.env.example não encontrado"
    exit 1
fi

cp ./frontend/.env.example ./frontend/.env
echo "  Arquivo ./frontend/.env criado"

echo ""
echo "3. Configurando .env na raiz para Docker Compose..."

# Remover .env da raiz se já existir
if [ -f ".env" ]; then
    rm .env
    echo "  Arquivo .env antigo removido"
fi

# Criar .env na raiz
echo "# Backend Configuration" >> .env
cat ./backend/.env >> .env

echo "" >> .env
echo "# Frontend Configuration" >> .env
cat ./frontend/.env >> .env

echo "  Arquivo .env da raiz configurado"

echo ""
echo "Configuração concluída com sucesso!"
echo ""
echo "Próximos passos:"
echo "   1. Execute: docker compose up --build"
echo "   2. Em outro terminal: docker exec matis-backend npx prisma db seed"
echo ""
echo "Acessos:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   Docs:     http://localhost:4000/documentation"
echo ""