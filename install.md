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
- Criar `.env.test` a partir do `.env.test.example`
- Gerar credenciais JWT automaticamente
- Separar variaveis para `backend/.env` (sem `VITE_*`) e `frontend/.env` (so `VITE_*`)

> Apos subir a aplicacao pela primeira vez, o **Setup Wizard** na UI guia a
> configuracao de branding, logos, locale, storage (local/S3), upload, paginacao,
> SMTP e Assistente IA — tudo persistido no documento Setting do MongoDB.
> Nao ha variaveis de ambiente para esses itens.

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

O `setup.sh` ja copia `.env.example` -> `.env`. Para fazer manualmente:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

> Os defaults em `.env.example` apontam para hosts nativos (`127.0.0.1`,
> `localhost`) porque o cenario padrao e dev local com mongo + redis em
> Docker e backend/frontend rodando direto na maquina. Quando o stack
> inteiro sobe via `docker compose up -d`, o proprio compose sobrescreve
> `DATABASE_URL`, `REDIS_URL` e `MCP_SERVER_URL` para usar os hosts
> internos da rede Docker (`mongo`, `redis`, `mcp`). Nao precisa editar
> nada para alternar entre os modos.

### Principais variaveis

| Variavel           | Descricao                      | Padrao                  |
| ------------------ | ------------------------------ | ----------------------- |
| `NODE_ENV`         | Ambiente de execucao           | `development`           |
| `PORT`             | Porta do backend               | `3000`                  |
| `DB_USERNAME`      | Usuario do MongoDB             | `lowcodejs`             |
| `DB_PASSWORD`      | Senha do MongoDB               | `lowcodejs`             |
| `DB_DATABASE`      | Nome do banco system           | `lowcodejs`             |
| `DB_DATA_DATABASE` | Nome do banco data (dinamicas) | `lowcodejs_data`        |
| `DATABASE_URL`     | URL de conexao MongoDB         | `mongodb://...`         |
| `APP_SERVER_URL`   | URL publica do backend         | `http://localhost:3000` |
| `APP_CLIENT_URL`   | URL publica do frontend        | `http://localhost:5173` |

> **Configuracoes de dominio** (branding, locale, logos, upload, paginacao,
> storage S3, SMTP, IA) **nao** vivem em `.env` — sao editadas via UI
> `/settings` (usuario MASTER) ou pelo Setup Wizard no primeiro acesso.

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

O `.env` ja vem com `DATABASE_URL` apontando para `127.0.0.1:27017` (host
nativo). Quando o backend roda dentro de `docker compose up -d`, o proprio
compose sobrescreve para usar host interno `mongo`. Voce nao precisa editar
o `.env` ao alternar entre rodar local vs container.

Se mesmo assim houver erro:

- Confira que o container `mongo` esta saudavel: `docker compose ps`
- Confira credenciais no `.env` (`DB_USERNAME` / `DB_PASSWORD`)
- Em testes (`npm run test:e2e`), `127.0.0.1` e obrigatorio — testes nunca
  rodam em container
