---
title: Instalacao
description: Guia para instalar e configurar o LowCodeJS com Docker.
---

## Pre-requisitos

- Docker
- Docker Compose

## Instalacao

### 1. Baixe os arquivos

```bash
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/docker-compose.oficial.yml
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/.env.example
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/credential-generator.sh
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/setup.sh

chmod +x credential-generator.sh setup.sh
```

### 2. Configure o ambiente

```bash
cp .env.example .env
nano .env
```

Altere as variaveis com seu IP ou dominio (pode ser localhost):

```env
APP_SERVER_URL=http://SEU_IP:3000
APP_CLIENT_URL=http://SEU_IP:5173
VITE_API_BASE_URL=http://SEU_IP:3000
COOKIE_DOMAIN=SEU_IP
DB_PASSWORD=sua_senha_segura
```

### 3. Gere as credenciais

```bash
./credential-generator.sh
```

### 4. Suba os containers

```bash
docker compose -f docker-compose.oficial.yml up -d
```

### 5. Configure o frontend

```bash
./setup.sh --frontend-url
```

### 6. Execute o seed

```bash
docker exec lowcodejs-api node database/seeders/main.js
```

Acesse `http://SEU_IP:5173`

---

## Arquivos

### docker-compose.oficial.yml

```yaml
name: lowcodejs

services:
  mongo:
    image: mongo:latest
    container_name: lowcodejs-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME:-lowcodejs}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - lowcodejs-mongo-data:/data/db
    networks:
      - lowcodejs-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s

  api:
    image: marcosjhollyfer/lowcodejs-api:latest
    container_name: lowcodejs-api
    restart: unless-stopped
    env_file: .env
    ports:
      - "${APP_SERVER_PORT:-3000}:3000"
    volumes:
      - lowcodejs-storage:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - lowcodejs-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health-check"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  app:
    image: marcosjhollyfer/lowcodejs-app:latest
    container_name: lowcodejs-app
    restart: unless-stopped
    env_file: .env
    environment:
      - VITE_API_BASE_URL=${APP_SERVER_URL:-http://localhost:3000}
      - NITRO_HOST=0.0.0.0
      - NITRO_PORT=3000
    ports:
      - "${APP_CLIENT_PORT:-5173}:3000"
    volumes:
      - lowcodejs-app-public:/app/.output/public
    depends_on:
      api:
        condition: service_healthy
    networks:
      - lowcodejs-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  lowcodejs-mongo-data:
    driver: local
  lowcodejs-storage:
    driver: local
  lowcodejs-app-public:
    driver: local

networks:
  lowcodejs-network:
    driver: bridge
```

### .env.example

```env
NODE_ENV=production
PORT=3000

DB_USERNAME=lowcodejs
DB_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD
DATABASE_URL=mongodb://${DB_USERNAME}:${DB_PASSWORD}@mongo:27017

APP_SERVER_PORT=3000
APP_CLIENT_PORT=5173
APP_SERVER_URL=http://localhost:3000
APP_CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000

EMAIL_PROVIDER_PASSWORD=
EMAIL_PROVIDER_USER=
EMAIL_PROVIDER_HOST=
EMAIL_PROVIDER_PORT=587

FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10

LOCALE=pt-br
LOGO_SMALL_URL=http://localhost:3000/storage/small.png
LOGO_LARGE_URL=http://localhost:3000/storage/large.png
PAGINATION_PER_PAGE=20

COOKIE_DOMAIN=localhost
JWT_PRIVATE_KEY=GENERATE_YOUR_OWN_PRIVATE_KEY
JWT_PUBLIC_KEY=GENERATE_YOUR_OWN_PUBLIC_KEY
COOKIE_SECRET=GENERATE_YOUR_OWN_COOKIE_SECRET
```

### credential-generator.sh

```bash
#!/bin/bash

openssl genrsa -out temp_private.pem 2048
openssl rsa -in temp_private.pem -pubout -out temp_public.pem

if [[ "$OSTYPE" == "darwin"* ]]; then
    JWT_PRIVATE_KEY=$(base64 < temp_private.pem | tr -d '\n')
    JWT_PUBLIC_KEY=$(base64 < temp_public.pem | tr -d '\n')
else
    JWT_PRIVATE_KEY=$(base64 -w 0 temp_private.pem 2>/dev/null || base64 temp_private.pem | tr -d '\n')
    JWT_PUBLIC_KEY=$(base64 -w 0 temp_public.pem 2>/dev/null || base64 temp_public.pem | tr -d '\n')
fi

COOKIE_SECRET=$(openssl rand -hex 32)

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/^JWT_PRIVATE_KEY=/d' "$ENV_FILE"
    sed -i '' '/^JWT_PUBLIC_KEY=/d' "$ENV_FILE"
    sed -i '' '/^COOKIE_SECRET=/d' "$ENV_FILE"
else
    sed -i '/^JWT_PRIVATE_KEY=/d' "$ENV_FILE"
    sed -i '/^JWT_PUBLIC_KEY=/d' "$ENV_FILE"
    sed -i '/^COOKIE_SECRET=/d' "$ENV_FILE"
fi

echo "JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY" >> "$ENV_FILE"
echo "JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY" >> "$ENV_FILE"
echo "COOKIE_SECRET=$COOKIE_SECRET" >> "$ENV_FILE"

rm temp_private.pem temp_public.pem

echo "Chaves geradas com sucesso!"
```

---

## Comandos

### Subir containers

```bash
docker compose -f docker-compose.oficial.yml up -d
```

### Parar containers

```bash
docker compose -f docker-compose.oficial.yml down
```

### Ver logs

```bash
docker compose -f docker-compose.oficial.yml logs -f
```

### Reconfigurar URL do frontend

```bash
./setup.sh --frontend-url
```

### Executar seed

```bash
docker exec lowcodejs-api node database/seeders/main.js
```

---

## Variaveis de Ambiente

| Variavel          | Descricao           | Default                 |
| ----------------- | ------------------- | ----------------------- |
| `APP_SERVER_URL`  | URL da API          | `http://localhost:3000` |
| `APP_CLIENT_URL`  | URL do frontend     | `http://localhost:5173` |
| `APP_SERVER_PORT` | Porta da API        | `3000`                  |
| `APP_CLIENT_PORT` | Porta do frontend   | `5173`                  |
| `DB_USERNAME`     | Usuario MongoDB     | `lowcodejs`             |
| `DB_PASSWORD`     | Senha MongoDB       | `lowcodejs`             |
| `COOKIE_DOMAIN`   | Dominio dos cookies | `localhost`             |
