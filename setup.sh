#!/usr/bin/env sh

# Script de configuração inicial do projeto Matis
# POSIX-safe | Docker-safe | CI-safe

set -e

echo "Configurando projeto Matis..."
echo ""

# --------------------------------------------------
# Verificação da raiz do projeto
# --------------------------------------------------
if [ ! -f "docker-compose.yml" ]; then
  echo "Execute este script na raiz do projeto (onde está o docker-compose.yml)"
  exit 1
fi

echo "1. Verificando .env.example na raiz..."

if [ ! -f "./.env.example" ]; then
  echo "Arquivo ./.env.example não encontrado"
  exit 1
fi

if [ ! -f "./credential-generator.sh" ]; then
  echo "Arquivo ./credential-generator.sh não encontrado"
  exit 1
fi

# --------------------------------------------------
# Criar .env
# --------------------------------------------------
echo ""
echo "2. Criando .env e gerando credenciais..."

cp ./.env.example ./.env
echo "Arquivo ./.env criado na raiz"

chmod +x ./credential-generator.sh
echo "Gerando credenciais JWT..."
./credential-generator.sh

# --------------------------------------------------
# Interpolação segura (sem source)
# --------------------------------------------------
echo ""
echo "3. Interpolando variáveis de ambiente..."

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst não encontrado. Instale gettext."
  exit 1
fi

# Exporta SOMENTE os nomes das variáveis (sem executar valores)
export $(grep -E '^[A-Z0-9_]+=' ./.env | cut -d= -f1)

envsubst < ./.env > ./.env.tmp
mv ./.env.tmp ./.env

echo "Variáveis interpoladas com sucesso"

# --------------------------------------------------
# Separação backend / frontend
# --------------------------------------------------
echo ""
echo "4. Separando variáveis de ambiente..."

# Backend: tudo exceto VITE_
grep -v '^VITE_' ./.env > ./backend/.env
echo "Arquivo ./backend/.env criado"

# Frontend: apenas VITE_
grep '^VITE_' ./.env > ./frontend/.env
echo "Arquivo ./frontend/.env criado"

# --------------------------------------------------
# Finalização
# --------------------------------------------------
echo ""
echo "Configuração concluída com sucesso!"
echo ""
echo "Próximos passos:"
echo "  1. Execute: docker compose up --build"
echo "  2. Em outro terminal: docker exec low-code-js-api npm run seed"
echo ""
echo "Acessos:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  Docs:     http://localhost:3000/documentation"
echo ""
