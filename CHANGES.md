# O que mudou: MinIO e Assistente IA agora sao opcionais

## Resumo

MinIO (S3 storage) e MCP (Assistente IA) deixaram de ser servicos obrigatorios. Agora sao **opcionais via Docker Compose profiles** e **configuraveis pela Settings UI**.

---

## Antes vs Depois

### Docker Compose

| Aspecto | Antes | Depois |
| ------- | ----- | ------ |
| `docker compose up -d` | Subia 6 servicos (mongo, redis, api, app, **minio**, **mcp**) | Sobe 4 servicos core (mongo, redis, api, app) |
| MinIO | Obrigatorio — api nao subia sem minio healthy | Opcional — profile `s3` |
| MCP | Obrigatorio — sempre subia | Opcional — profile `ai` |
| api depends_on | mongo + minio + redis | mongo + redis |

### Storage (MinIO/S3)

| Aspecto | Antes | Depois |
| ------- | ----- | ------ |
| Configuracao | Apenas via `.env` (variaveis de ambiente) | Via `.env` **ou** Settings UI (como MASTER) |
| STORAGE_DRIVER | Precisava editar `.env` e reiniciar | Toggle na UI: ativo = S3, inativo = local |
| Credenciais S3 | Apenas `.env` | Campos na UI: endpoint, regiao, bucket, access key, secret key |
| Default | Dependia do `.env` | `local` (filesystem `_storage/`) |
| Runtime | Mudanca exigia restart completo | Upload/delete funciona em runtime. Servir arquivos exige restart |

### Assistente IA (Chat)

| Aspecto | Antes | Depois |
| ------- | ----- | ------ |
| Container MCP | Sempre subia | Opcional — profile `ai` |
| Ativacao | Apenas via Settings UI (ja existia) | Mesmo — Settings UI com toggle |
| API Key | Via `.env` ou Settings UI | Mesmo — ambos caminhos funcionam |

---

## Como usar

### Instalacao minima (padrao)

```bash
docker compose up -d
# Sobe: mongo, redis, api, app
```

Tudo funciona com storage local e sem Assistente IA.

### Ativar MinIO

```bash
docker compose --profile s3 up -d
```

Depois, na UI: Settings > Armazenamento > Ativar toggle > Preencher credenciais > Salvar.

### Ativar Assistente IA

```bash
docker compose --profile ai up -d
```

Depois, na UI: Settings > Assistente IA > Ativar toggle > Preencher chave OpenAI > Salvar.

### Ativar tudo

```bash
docker compose --profile s3 --profile ai up -d
```

Ou no `.env`:
```env
COMPOSE_PROFILES=s3,ai
```

---

## Settings UI (como MASTER)

### Card "Armazenamento"

- **Toggle**: Ativo (S3/MinIO) / Inativo (Local)
- Quando ativo, campos aparecem:
  - Endpoint (ex: `http://minio:9000`)
  - Regiao (ex: `us-east-1`)
  - Bucket (ex: `lowcodejs`)
  - Access Key (com toggle de visibilidade)
  - Secret Key (com toggle de visibilidade)
- Nota: alterar o driver requer reinicio do servidor para servir arquivos

### Card "Assistente IA"

- **Toggle**: Habilitar/Desabilitar
- Chave da API OpenAI (com toggle de visibilidade)
- Ja existia antes — sem mudancas na UI

---

## Deploy (CI/CD)

### Novo secret: `COMPOSE_PROFILES`

Adicionar no GitHub Repository Secrets:
- `COMPOSE_PROFILES` = `s3,ai` (para ativar ambos no deploy)
- `COMPOSE_PROFILES` = `s3` (so MinIO)
- `COMPOSE_PROFILES` = `ai` (so MCP)
- Vazio ou nao definido = nenhum servico opcional

### Novos secrets opcionais

- `MINIO_ROOT_USER` — usuario root do MinIO (default: lowcodejs)
- `MINIO_ROOT_PASSWORD` — senha root do MinIO (default: lowcodejs123)

---

## Arquivos modificados

### Docker / Infra
- `docker-compose.yml` — profiles em minio/mcp, api sem depends_on minio
- `docker-compose.production.yml` — idem
- `.env.example` — documentacao de profiles e servicos opcionais
- `install.md` — guia atualizado com servicos opcionais
- `CLAUDE.md` (raiz) — criado, visao geral do monorepo
- `.github/workflows/deployment.yml` — novos secrets
- `.github/workflows/deployment-deploy-vps.yml` — novos secrets + variaveis no .env do VPS

### Backend (configuracao S3 via Settings)
- `backend/application/core/entity.core.ts` — 5 campos S3 no ISetting
- `backend/application/model/setting.model.ts` — 5 campos S3 no Schema Mongoose
- `backend/bin/server.ts` — 5 chaves S3 no SETTING_SYNC_KEYS
- `backend/application/resources/setting/update/update.validator.ts` — 5 campos S3 opcionais
- `backend/config/storage.config.ts` — factory S3 le process.env (dinamico em runtime)
- `backend/application/services/storage/flydrive-storage.service.ts` — disk getter dinamico

### Frontend (UI de configuracao S3)
- `frontend/src/lib/interfaces.ts` — 5 campos S3 no ISetting
- `frontend/src/lib/payloads.ts` — 6 campos no SettingUpdatePayload
- `frontend/src/routes/_private/settings/-update-form.tsx` — toggle Switch + campos S3 condicionais
- `frontend/src/routes/_private/settings/-view.tsx` — card Armazenamento no modo view
- `frontend/src/routes/_private/settings/index.lazy.tsx` — defaultValues + payload com campos S3
