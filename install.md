# Guia de Instalacao - LowCodeJS

## Pre-requisitos

- **Docker** e **Docker Compose** (recomendado)
- **Node.js** 18+ e **npm** (para desenvolvimento local)
- **Git Bash** (obrigatorio no Windows)

---

## Configuracao Inicial

Em todos os sistemas operacionais, execute na raiz do projeto:

```bash
chmod +x ./setup.sh
./setup.sh
```

> **Windows:** Use o Git Bash para executar os comandos.

O script `setup.sh` ira:

- Criar o arquivo `.env` a partir do `.env.example`
- Gerar credenciais JWT automaticamente
- Separar variaveis de ambiente para backend e frontend

---

## Opcao 1: Docker (Recomendado)

### Subir servicos principais

```bash
docker compose up -d
```

Isso sobe os servicos **essenciais**: MongoDB, Redis, Backend (API) e Frontend (App).

### Executar as seeds do banco

```bash
docker exec -it low-code-js-api npm run seed
```

### Acessos

| Servico  | URL                                 |
| -------- | ----------------------------------- |
| Frontend | http://localhost:5173               |
| Backend  | http://localhost:3000               |
| Docs API | http://localhost:3000/documentation |

---

## Servicos Opcionais

O Assistente IA (Chat com MCP/OpenAI) e **opcional**. Nao sobe por padrao.

> **Armazenamento S3**: configurado durante o Setup Wizard ou via **Settings** na UI (como MASTER). Nenhum container adicional necessario.

### Assistente IA (Chat)

Para usar o chat com inteligencia artificial:

```bash
docker compose --profile ai up -d
```

Apos subir o container, configure a **chave OpenAI** e ative o toggle nas **Settings** na UI (como MASTER).

### Subir tudo (com IA)

```bash
docker compose --profile ai up -d
```

Ou defina no `.env`:

```env
COMPOSE_PROFILES=ai
```

E depois:

```bash
docker compose up -d
```

---

## Opcao 2: Desenvolvimento Local

### Subir apenas o MongoDB e Redis

```bash
docker compose up -d mongo redis --build
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

## Variaveis de Ambiente

Copie o `.env.example` para `.env` e ajuste conforme necessario:

```bash
cp .env.example .env
```

### Principais variaveis

| Variavel         | Descricao                | Padrao                  |
| ---------------- | ------------------------ | ----------------------- |
| `NODE_ENV`       | Ambiente de execucao     | `development`           |
| `PORT`           | Porta do backend         | `3000`                  |
| `DB_USERNAME`      | Usuario do MongoDB             | `lowcodejs`             |
| `DB_PASSWORD`      | Senha do MongoDB               | `lowcodejs`             |
| `DB_DATABASE`      | Nome do banco system           | `lowcodejs`             |
| `DB_DATA_DATABASE` | Nome do banco data (dinamicas) | `lowcodejs_data`        |
| `DATABASE_URL`     | URL de conexao MongoDB         | `mongodb://...`         |
| `APP_SERVER_URL` | URL publica do backend   | `http://localhost:3000` |
| `APP_CLIENT_URL` | URL publica do frontend  | `http://localhost:5173` |

### Assistente IA (opcional)

| Variavel          | Descricao                    | Padrao                   |
| ----------------- | ---------------------------- | ------------------------ |
| `MCP_SERVER_URL`  | URL do servidor MCP          | `http://mcp:3000/mcp`   |

> A chave da API OpenAI e o toggle "Habilitar Assistente IA" sao
> configurados pelo usuario MASTER em **Configuracoes** na UI
> (`/settings`), nao via variavel de ambiente.

### Seguranca (JWT e Cookies)

As chaves JWT sao geradas automaticamente pelo script `setup.sh`. Para gerar manualmente:

```bash
./credential-generator.sh
```

> **NUNCA** use as chaves padrao em producao!

---

## Limpeza Completa (Reset)

Para remover todos os containers, imagens e volumes do projeto:

```bash
# Parar os containers
docker compose --profile s3 --profile ai down

# Remover containers, imagens e cache
docker system prune -f -a --volumes

# Remover o volume do MongoDB
docker volume rm low-code-js_mongo-volume
```

> **Atencao:** Isso apagara todos os dados do banco de dados!

---

## Troubleshooting

### Erro de permissao no setup.sh

```bash
chmod +x ./setup.sh ./credential-generator.sh
```

### Container nao encontrado

Verifique se os containers estao rodando:

```bash
docker ps
```

### Erro de conexao com MongoDB

- Docker: use `mongo` como host
- Local: use `localhost`

```env
# Docker
DATABASE_URL=mongodb://lowcodejs:lowcodejs@mongo:27017/lowcodejs?authSource=admin

# Local
DATABASE_URL=mongodb://lowcodejs:lowcodejs@localhost:27017/lowcodejs?authSource=admin
```
