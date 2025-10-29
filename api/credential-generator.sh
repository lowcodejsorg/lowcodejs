#!/bin/bash

# Gera as chaves temporárias
openssl genrsa -out temp_private.pem 2048
openssl rsa -in temp_private.pem -pubout -out temp_public.pem

# Define as variáveis
JWT_PRIVATE_KEY=$(base64 -w 0 temp_private.pem)
JWT_PUBLIC_KEY=$(base64 -w 0 temp_public.pem)
COOKIE_SECRET=$(openssl rand -hex 32)

# Cria ou atualiza o arquivo .env
ENV_FILE=".env"

# Cria o arquivo .env se não existir
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# Remove as chaves antigas se existirem
sed -i '/^JWT_PRIVATE_KEY=/d' "$ENV_FILE"
sed -i '/^JWT_PUBLIC_KEY=/d' "$ENV_FILE"
sed -i '/^COOKIE_SECRET=/d' "$ENV_FILE"

# Adiciona as novas chaves
echo "JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY" >> "$ENV_FILE"
echo "JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY" >> "$ENV_FILE"
echo "COOKIE_SECRET=$COOKIE_SECRET" >> "$ENV_FILE"

# Remove os arquivos temporários
rm temp_private.pem temp_public.pem

echo "✅ Chaves geradas e adicionadas ao arquivo .env com sucesso!"