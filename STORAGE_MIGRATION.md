# Migração de Storage entre Drivers (Local ↔ S3)

Este documento descreve como funciona a migração resiliente de arquivos quando
o usuário MASTER troca o driver de storage (`local` ↔ `s3`) pela UI de
configurações em `/settings`.

## Por que existe

Antes desta feature, trocar `STORAGE_DRIVER` no Settings:

1. Sincronizava `process.env.STORAGE_DRIVER` imediatamente.
2. Uploads novos iam para o driver novo.
3. **Arquivos antigos ficavam órfãos no driver anterior** — invisíveis para a
   aplicação após qualquer cleanup periódico.

Agora a plataforma detecta arquivos no driver antigo, oferece migrar em
background com progresso em tempo real, e permite limpar fisicamente o driver
antigo após confirmação. Zero downtime — uploads e downloads continuam
funcionando durante a operação.

## Visão geral do fluxo

```
┌─ MASTER troca STORAGE_DRIVER em /settings (PUT /setting)
│   └─ syncStorageEnv → driver atual muda na hora
│       └─ Uploads novos vão para o driver novo (location=novo)
│
├─ UI faz GET /storage/migration/status
│   └─ Se by_location[anterior] > 0 → exibe banner "Migrar agora"
│
├─ MASTER clica "Migrar agora" → POST /storage/migration/start
│   └─ Backend enfileira BullMQ job
│       └─ Worker (in-process) processa Storage.find({location: anterior})
│           ├─ Pra cada arquivo (concurrency configurável):
│           │   ├─ read origem → writeRaw destino → verifica size
│           │   ├─ updateLocation(_id, novo, 'idle') no Mongo
│           │   └─ invalida cache de meta no kernel
│           ├─ 3 retries com backoff linear; falhas → 'failed'
│           └─ Emite eventos via Socket.IO /storage-migration
│
├─ Reads durante migração: kernel hook lê doc.location e roteia para o
│   driver correto. Se o arquivo não estiver lá (cache stale), tenta o
│   driver oposto antes de retornar 404.
│
└─ Após 100% migrado e zero falhas → UI exibe "Limpar driver antigo"
    └─ POST /storage/migration/cleanup → enfileira job
        └─ Worker apaga fisicamente os arquivos do driver antigo
```

## Para o usuário MASTER

### Banner "Migrar agora"

Aparece em `/settings` quando o backend detecta arquivos no driver
**anterior** (oposto ao driver atual). O banner mostra a contagem e dois
botões:

- **Migrar agora** — dispara o job de cópia em background.
- **Tentar novamente (N)** — aparece quando há `N` arquivos com falha de
  migração anterior. Reprocessa apenas os falhos.

### Modal de progresso

Abre automaticamente quando há um job ativo (mesmo após reload da página).
Mostra em tempo real:

- Barra de progresso (X de Y, %).
- Arquivo atual sendo migrado.
- Contagem de falhas.
- ETA estimado.
- Tabela colapsável com falhas individuais (nome, erro, número de tentativas)
  e botão "Tentar novamente".

Pode ser fechado a qualquer momento — a migração continua no servidor.

### Card "Limpar driver antigo"

Aparece quando:
- Todos os arquivos estão no driver atual (`by_location[anterior] === 0`).
- Zero falhas pendentes (`by_status.failed === 0`).
- Nenhum job em andamento.
- Existe pelo menos 1 arquivo no sistema.

Clicar abre dialog de confirmação. Após confirmar, dispara job que **apaga
permanentemente** os arquivos físicos do driver antigo. Esta operação é
irreversível.

### Fluxo recomendado de uso

1. Configure as credenciais do novo driver no Settings (ex: S3 endpoint,
   bucket, access/secret keys).
2. Troque `STORAGE_DRIVER` no select e clique em **Salvar**.
3. Banner aparece — clique em **Migrar agora**.
4. Acompanhe o progresso no modal (pode fechar e reabrir).
5. Quando concluir, valide manualmente alguns arquivos no driver novo.
6. Clique em **Limpar driver antigo** para liberar espaço.

## Para o desenvolvedor

### Schema e modelos

Cada documento `Storage` ganhou dois campos
(`backend/application/model/storage.model.ts`):

| Campo | Valores | Descrição |
|-------|---------|-----------|
| `location` | `'local'` \| `'s3'` | Onde o arquivo fisicamente reside |
| `migration_status` | `'idle'` \| `'pending'` \| `'in_progress'` \| `'failed'` | Estado de migração por arquivo |

`Setting` ganhou:
- `MIGRATION_STORAGE_LOCATION_AT` — marker de idempotência da migration de backfill.
- `STORAGE_MIGRATION_LAST_RUN_AT` — timestamp do último job concluído.

### Backfill obrigatório

`backend/database/migrations/migrate-backfill-storage-location.ts` popula
`location` em todos os docs Storage existentes usando o `STORAGE_DRIVER`
gravado no Setting (não o `process.env`, pois roda antes do server). Idempotente
via marker `MIGRATION_STORAGE_LOCATION_AT`. Roda automaticamente no
`docker-entrypoint.sh`.

### Endpoints REST

Todos restritos ao role MASTER via `RoleMiddleware([E_ROLE.MASTER])`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/storage/migration/status` | Contagens por driver/status, job ativo, `can_cleanup` |
| POST | `/storage/migration/start` | Enfileira migração; body: `{concurrency?, retry_failed_only?}` |
| POST | `/storage/migration/cleanup` | Enfileira limpeza; body: `{confirm: true}` |

Erros principais:
- `409 MIGRATION_ALREADY_RUNNING` — outro job ativo.
- `400 NO_FILES_TO_MIGRATE` — nada a fazer.
- `409 CLEANUP_NOT_READY` — ainda há arquivos pendentes ou falhas.
- `400 CONFIRM_REQUIRED` — body sem `confirm: true`.

### WebSocket

Namespace `/storage-migration` no mesmo Socket.IO server do chat. Auth via
cookie JWT no handshake; rejeita conexões sem `role === MASTER`.

| Evento | Payload |
|--------|---------|
| `progress` | `{ job_id, processed, total, current_filename, failed_count, eta_seconds }` |
| `file_migrated` | `{ _id, filename, from, to }` |
| `file_failed` | `{ _id, filename, error, attempts }` |
| `completed` | `{ job_id, total, succeeded, failed, duration_ms }` |
| `error` | `{ job_id, message }` |

### Worker e fila

- Fila: BullMQ usando o `redis` já configurado em `config/redis.config.ts`.
  Nome: `storage-migration`. Dois job names: `migrate` e `cleanup`.
- Worker: in-process, iniciado em `bin/server.ts` após `kernel.ready()`.
  BullMQ `concurrency: 1` (um job por vez); paralelismo por arquivo via
  `processInBatches` com semáforo configurável (`STORAGE_MIGRATION_CONCURRENCY`,
  default 5, max 20).
- Lock único: BullMQ rejeita 2º job ativo via `getActiveJob()` no use-case
  `start.use-case.ts`.

### Estado por arquivo (job migrate)

```
1. Worker pega doc por _id do job.data.file_ids
2. Skip se doc.location === target_driver (idempotente)
3. Mark migration_status = 'in_progress'
4. Para cada tentativa (até 3):
   a. sourceImpl.read(filename) → Readable
   b. Buffer concat
   c. targetImpl.writeRaw(filename, buffer, mimetype)
   d. Verifica written.size === doc.size; se não, deleta cópia ruim e relança
5. Sucesso: updateLocation(target, 'idle') + invalidateStorageMeta + emite eventos
6. Falha após 3 tentativas: updateLocation(source, 'failed') + emite file_failed
```

### Dual-read fallback no kernel

`backend/start/kernel.ts` (hook `onRequest` em `/storage/:filename`):

1. `resolveStorageMeta(filename)` lê doc do Mongo (cache em memória 5min com
   `originalName + mimetype + location`).
2. Driver primário = `meta.location`; secundário = oposto.
3. Tenta servir do primário; se falhar, tenta do secundário; senão 404.

Worker invalida o cache via `invalidateStorageMeta(filename)` após cada
`updateLocation` para evitar serve incorreto pós-migração.

### Storage service

Contract (`backend/application/services/storage/storage-contract.service.ts`)
expõe:

- `upload(part, staticName?)` — multipart (uploads via API).
- `delete(filename)` — apaga.
- `exists(filename)` — verifica.
- `ensureBucket()` — cria bucket S3 se ausente.
- `read(filename) → { stream, size, mimetype }` — leitura streaming (kernel
  hook + worker).
- `writeRaw(filename, body, mimetype) → { size }` — escrita direta sem
  reprocessamento (worker).

Facade `storage.service.ts` expõe `forDriver(driver)` para acesso explícito a
um driver específico (necessário para o worker copiar entre drivers
independente do `STORAGE_DRIVER` global).

### Recovery após crash

- BullMQ persiste jobs no Redis. Worker reiniciado retoma jobs ativos.
- Sweeper de boot em `bin/server.ts`: `markInProgressAsFailed()` marca
  qualquer doc órfão `migration_status='in_progress'` como `failed` (caso o
  Redis tenha perdido o job).
- Como o estado per-arquivo é idempotente (`location === target` → skip),
  re-rodar o mesmo job é seguro.

### Variáveis de ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `STORAGE_MIGRATION_CONCURRENCY` | 5 | Arquivos copiados em paralelo (1-20) |

## Estrutura de arquivos

### Backend

```
backend/application/
├── model/
│   ├── storage.model.ts                                # +location +migration_status
│   └── setting.model.ts                                # +MIGRATION_STORAGE_LOCATION_AT +STORAGE_MIGRATION_LAST_RUN_AT
├── repositories/storage/
│   ├── storage-contract.repository.ts                  # +5 métodos
│   ├── storage-mongoose.repository.ts                  # impl
│   └── storage-in-memory.repository.ts                 # impl testes
├── services/
│   ├── storage/
│   │   ├── storage-contract.service.ts                 # +read +writeRaw
│   │   ├── local-storage.service.ts                    # impl read/writeRaw
│   │   ├── s3-storage.service.ts                       # impl read/writeRaw
│   │   ├── in-memory-storage.service.ts                # impl testes
│   │   ├── storage.service.ts                          # +forDriver(driver)
│   │   └── storage-meta-cache.ts                       # +location no cache
│   └── storage-migration/
│       ├── storage-migration-queue-contract.service.ts
│       ├── bullmq-storage-migration-queue.service.ts
│       ├── in-memory-storage-migration-queue.service.ts
│       └── worker.ts                                   # BullMQ Worker
└── resources/storage-migration/
    ├── status/{controller,validator,schema,use-case,use-case.spec}.ts
    ├── start/{controller,validator,schema,use-case,use-case.spec}.ts
    ├── cleanup/{controller,validator,schema,use-case,use-case.spec}.ts
    └── storage-migration.socket.ts                     # namespace WS

backend/database/migrations/
└── migrate-backfill-storage-location.ts

backend/start/kernel.ts                                 # dual-read no /storage hook
backend/bin/server.ts                                   # worker + WS namespace + sweeper
```

### Frontend

```
frontend/src/
├── hooks/
│   ├── use-storage-migration-socket.ts                 # WS client
│   └── tanstack-query/
│       ├── use-storage-migration-status.tsx            # GET (refetch 10s)
│       ├── use-storage-migration-start.tsx             # POST start
│       └── use-storage-migration-cleanup.tsx           # POST cleanup
└── routes/_private/settings/
    ├── -storage-migration-card.tsx                     # banner + modal + cleanup card
    └── index.lazy.tsx                                  # integração
```

## Comandos úteis

```bash
# Backfill manual (idempotente — skip se já rodou)
docker exec -it low-code-js-api npm run migrate:backfill-storage-location:prod

# Re-executar backfill
docker exec -it low-code-js-api npm run migrate:backfill-storage-location:prod -- --force

# Rodar testes do recurso
cd backend && npm run test:unit -- --run application/resources/storage-migration

# Subir stack para teste manual
docker compose up -d
```

## Checklist de validação manual

1. `docker compose up -d`.
2. Login como MASTER.
3. Configurar driver `local`. Subir 5 arquivos via tabela com campo FILE.
4. Verificar `_storage/` populado e docs Mongo com `location: 'local'`.
5. Trocar driver para `s3` (creds válidas — minio/LocalStack para teste local).
6. Banner "5 arquivos no driver `local`. [Migrar agora]" deve aparecer.
7. Clicar — modal abre, WS emite progress, todos migram.
8. Após completed: docs com `location: 's3'`, arquivos no bucket, `_storage/`
   ainda preenchido (cleanup pendente).
9. Clicar **Limpar driver antigo** → confirmar → `_storage/` esvaziado.
10. Repetir invertido (s3 → local) para cobrir caminho oposto.
11. Forçar falha: parar S3 mid-job → BullMQ retoma após reconexão; docs
    `in_progress` órfãos viram `failed` no boot sweeper.
12. Tentar cleanup com `failed > 0` → 409 esperado.
13. Clicar **Tentar novamente** nos failed → migra restantes → cleanup libera.

## Limitações conhecidas

- **Multi-replica**: o sweeper de boot e o worker rodam em todas as réplicas
  do API. Em produção com múltiplas instâncias, o BullMQ distribui jobs entre
  workers automaticamente, mas o sweeper de boot pode marcar como `failed`
  arquivos `in_progress` legítimos de outro worker. Recomendação: rodar
  apenas 1 réplica do API durante migrações ativas, ou desabilitar o sweeper
  via config (não implementado — requer ajuste).
- **Cache de meta**: o cache em memória do kernel hook tem TTL de 5 minutos.
  Em deployments multi-replica, o `invalidateStorageMeta` chamado pelo worker
  só atinge a réplica que rodou o job. Outras réplicas só atualizam após o
  TTL expirar — pode causar 404 transientes (mitigado pelo cross-driver
  fallback).
- **Cleanup atômico**: o job de cleanup tenta apagar todos os arquivos do
  driver antigo. Se o driver antigo retornar erro, o job continua para o
  próximo arquivo (best effort) — não há retry específico de cleanup.

## Referências cruzadas

- Plano de implementação: `~/.claude/plans/precisamos-implementar-um-script-resilient-minsky.md`
- Documentação técnica de cada camada: `backend/CLAUDE.md` (seção Storage),
  `backend/application/services/storage-migration/` (sem CLAUDE.md próprio
  ainda — adicionar quando estabilizar).
