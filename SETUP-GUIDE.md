# Instalacao do LowCodeJS

Guia para instalar e configurar o LowCodeJS com Docker.

## Pre-requisitos

- Docker e Docker Compose
- OpenSSL (para gerar credenciais)

## Instalacao Rapida

### 1. Baixar arquivos

```bash
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/docker-compose.oficial.yml
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/.env.example
curl -O https://raw.githubusercontent.com/lowcodejsorg/lowcodejs/main/credential-generator.sh

chmod +x credential-generator.sh
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com seu IP ou dominio:

```env
# Substitua SEU_IP pelo IP do servidor ou dominio
APP_SERVER_URL=http://SEU_IP:3000
APP_CLIENT_URL=http://SEU_IP:5173
VITE_API_BASE_URL=http://SEU_IP:3000
COOKIE_DOMAIN=SEU_IP

# Defina uma senha segura para o MongoDB
DB_PASSWORD=sua_senha_segura
```

### 3. Gerar credenciais de seguranca

```bash
./credential-generator.sh
```

Este script gera automaticamente:
- JWT_PRIVATE_KEY e JWT_PUBLIC_KEY (chaves RSA)
- COOKIE_SECRET (string aleatoria)

### 4. Iniciar os containers

```bash
docker compose -f docker-compose.oficial.yml up -d
```

Aguarde os containers iniciarem (pode levar 1-2 minutos na primeira vez).

### 5. Executar seed inicial

```bash
docker exec lowcodejs-api node database/seeders/main.js
```

### 6. Acessar a aplicacao

- Frontend: `http://SEU_IP:5173`
- API: `http://SEU_IP:3000`
- Documentacao: `http://SEU_IP:3000/documentation`

Credenciais padrao:
- Email: `admin@lowcodejs.org`
- Senha: `admin123`

---

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `docker compose -f docker-compose.oficial.yml up -d` | Iniciar containers |
| `docker compose -f docker-compose.oficial.yml down` | Parar containers |
| `docker compose -f docker-compose.oficial.yml logs -f` | Ver logs em tempo real |
| `docker compose -f docker-compose.oficial.yml logs -f api` | Ver logs apenas da API |
| `docker compose -f docker-compose.oficial.yml pull` | Atualizar imagens |
| `docker exec lowcodejs-api node database/seeders/main.js` | Executar seed |

---

## Variaveis de Ambiente

### Obrigatorias

| Variavel | Descricao |
|----------|-----------|
| `DB_PASSWORD` | Senha do MongoDB |
| `APP_SERVER_URL` | URL publica da API |
| `APP_CLIENT_URL` | URL publica do frontend |
| `VITE_API_BASE_URL` | URL da API para o frontend |
| `COOKIE_DOMAIN` | Dominio para cookies |

### Geradas automaticamente

| Variavel | Descricao |
|----------|-----------|
| `JWT_PRIVATE_KEY` | Chave privada RSA (base64) |
| `JWT_PUBLIC_KEY` | Chave publica RSA (base64) |
| `COOKIE_SECRET` | Secret para assinatura de cookies |

### Opcionais

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `DB_USERNAME` | Usuario do MongoDB | `lowcodejs` |
| `DB_NAME` | Nome do banco | `lowcodejs` |
| `APP_SERVER_PORT` | Porta da API no host | `3000` |
| `APP_CLIENT_PORT` | Porta do frontend no host | `5173` |
| `LOCALE` | Idioma | `pt-br` |
| `PAGINATION_PER_PAGE` | Itens por pagina | `20` |
| `FILE_UPLOAD_MAX_SIZE` | Tamanho max de upload (bytes) | `10485760` |

---

## Atualizacao

Para atualizar para a versao mais recente:

```bash
docker compose -f docker-compose.oficial.yml pull
docker compose -f docker-compose.oficial.yml up -d
```

---

## Troubleshooting

### Container nao inicia

Verifique os logs:
```bash
docker compose -f docker-compose.oficial.yml logs -f
```

### Erro de conexao com MongoDB

Certifique-se que a senha no `.env` nao contem caracteres especiais que precisam de escape.

### Frontend nao conecta na API

Verifique se `VITE_API_BASE_URL` esta correto e acessivel externamente.
