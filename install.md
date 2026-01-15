# Guia de Instalação - LowCodeJS

## Pré-requisitos

- **Docker** e **Docker Compose** (recomendado)
- **Node.js** 18+ e **npm** (para desenvolvimento local)
- **Git Bash** (obrigatório no Windows)

---

## Configuração Inicial

Em todos os sistemas operacionais, execute na raiz do projeto:

```bash
chmod +x ./setup.sh
./setup.sh
```

> **Windows:** Use o Git Bash para executar os comandos.

O script `setup.sh` irá:
- Criar o arquivo `.env` a partir do `.env.example`
- Gerar credenciais JWT automaticamente
- Separar variáveis de ambiente para backend e frontend

---

## Opção 1: Docker (Recomendado)

### Subir todos os serviços

```bash
docker compose up -d
```

### Executar as seeds do banco

```bash
docker exec -it low-code-js-api npm run seed
```

### Acessos

| Serviço   | URL                                    |
|-----------|----------------------------------------|
| Frontend  | http://localhost:5173                  |
| Backend   | http://localhost:3000                  |
| Docs API  | http://localhost:3000/documentation    |

---

## Opção 2: Desenvolvimento Local

### Subir apenas o MongoDB

```bash
docker compose up -d mongo --build
```

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Variáveis de Ambiente

Copie o `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

### Principais variáveis

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta do backend | `3000` |
| `DB_USERNAME` | Usuário do MongoDB | `lowcodejs` |
| `DB_PASSWORD` | Senha do MongoDB | `lowcodejs` |
| `DB_NAME` | Nome do banco | `lowcodejs` |
| `DATABASE_URL` | URL de conexão MongoDB | `mongodb://...` |
| `APP_SERVER_URL` | URL pública do backend | `http://localhost:3000` |
| `APP_CLIENT_URL` | URL pública do frontend | `http://localhost:5173` |

### Segurança (JWT e Cookies)

As chaves JWT são geradas automaticamente pelo script `setup.sh`. Para gerar manualmente:

```bash
./credential-generator.sh
```

> ⚠️ **NUNCA** use as chaves padrão em produção!

---

## Deploy em Produção (VPS)

1. Configure `APP_SERVER_URL` no `.env` com o IP/domínio do servidor:

```env
APP_SERVER_URL=http://SEU_IP:3000
```

2. Suba os containers:

```bash
docker compose -f docker-compose.oficial.yml up -d
```

3. Configure a URL do frontend:

```bash
./setup.sh --frontend-url
```

4. Execute as seeds:

```bash
docker exec low-code-js-api npm run seed
```

---

## Troubleshooting

### Erro de permissão no setup.sh

```bash
chmod +x ./setup.sh ./credential-generator.sh
```

### Container não encontrado

Verifique se os containers estão rodando:

```bash
docker ps
```

### Erro de conexão com MongoDB

- Docker: use `mongo` como host
- Local: use `localhost`

```env
# Docker
DATABASE_URL=mongodb://lowcodejs:lowcodejs@mongo:27017/lowcodejs?authSource=admin

# Local
DATABASE_URL=mongodb://lowcodejs:lowcodejs@localhost:27017/lowcodejs?authSource=admin
```