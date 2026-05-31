# Design: Import de Linhas via CSV

**Data:** 2026-05-25  
**Contexto:** Exportação CSV de linhas já funciona (`GET /tables/:slug/rows/exports/csv`).  
Feedback recebido: ao importar, aparece apenas opção JSON (estrutura de tabela via `/tools`).  
Falta o par inverso: **import de linhas via CSV** por tabela dinâmica.

---

## Problema

| | Export CSV (linhas) | Import CSV (linhas) |
|---|---|---|
| Backend | ✅ `GET /tables/:slug/rows/exports/csv` | ❌ não existe |
| Frontend (view tabela) | ✅ `ExportCsvButton` | ❌ não existe |
| Frontend (tools page) | — | ❌ não existe |

O import JSON existente (`/tools/core/tables-import-export`) é para **estrutura de tabela** (schema + dados empacotados), não para importar linhas de um CSV avulso.

---

## Arquitetura: BullMQ + WebSocket

Import CSV pode levar 10–30s para 10k linhas. Usamos o padrão já existente de `storage-migration`:

```
POST /tables/:slug/rows/imports/csv
  → lê CSV (multipart, 5MB max)
  → enfileira job BullMQ com { slug, csvContent (base64), userId }
  → retorna { jobId }

Worker (in-process) consome job:
  → parseia CSV, cria rows em batch
  → emite progress via Socket.IO namespace /csv-import, room job:{jobId}

Frontend:
  → conecta a /csv-import, join room job:{jobId}
  → exibe barra de progresso
  → ao receber completed/error, desconecta
```

---

## Backend

### Resource `table-rows/import-csv` (novo)

**Diretório:** `backend/application/resources/table-rows/import-csv/`

#### 1. Template endpoint

`GET /tables/:slug/rows/imports/csv/template`  
Auth: MASTER ou ADMINISTRATOR

- Busca tabela por slug
- Filtra campos importáveis: `!f.native` (exclui `_id`, `creator`, `trashed`, etc.)
- Monta CSV com apenas a linha de header (campo `field.name` — mesmo label do export)
- Usa `buildCsvStream` com `Readable.from([])` (zero linhas de dado)
- Retorna com `Content-Disposition: attachment; filename="template-{slug}.csv"`

**Arquivo:** `import-csv.template.controller.ts`

#### 2. Import endpoint

`POST /tables/:slug/rows/imports/csv`  
Auth: MASTER ou ADMINISTRATOR + CREATE_ROW  
Content-Type: `multipart/form-data`, campo `file` (.csv, máx 5MB)

- Lê bytes do arquivo via `request.file()`
- Valida: tabela existe, arquivo não vazio
- Converte para base64 e enfileira job na fila `csv-import`
- Retorna `{ jobId }` (202 Accepted)

**Arquivo:** `import-csv.controller.ts`

#### 3. BullMQ Service (novo)

`backend/application/services/csv-import/`

Segue pattern de `services/storage-migration/`:

| Arquivo | Descrição |
|---|---|
| `csv-import-queue-contract.service.ts` | Abstract + tipos: `CsvImportJobPayload`, `CsvImportJobResult` |
| `bullmq-csv-import-queue.service.ts` | Implementação BullMQ, fila `csv-import` |
| `in-memory-csv-import-queue.service.ts` | Mock para testes |
| `worker.ts` | Worker in-process: parseia CSV, cria rows, emite progresso |

**Job payload:**
```ts
type CsvImportJobPayload = {
  slug: string;
  userId: string;
  csvContent: string; // base64
}
```

**Worker — fluxo:**
```
1. Decodifica csvContent → Buffer → parseia com csv-parser
2. Busca tabela por slug
3. Mapeia headers → fields:
   - match por field.slug (exact)
   - fallback match por field.name (case-insensitive)
   - ignora colunas não reconhecidas e nativos
4. Para cada linha:
   - Converte string → tipo do campo (number, boolean, date ISO)
   - validateRowPayload → se inválido: skipped++
   - rowPasswordService.hash()
   - rowRepository.create({ ...payload, slug, creator: userId })
   - imported++
   - a cada 100 rows: emite progress ao room job:{jobId}
5. Emite completed { imported, skipped, total }
6. Invalida cache (se necessário) via query key broadcast (não há Redis pub/sub para frontend query cache — frontend invalida ao receber completed)
```

**Limite:** `IMPORT_CSV_LIMIT = 10_000` linhas. Acima → job falha com `IMPORT_LIMIT_EXCEEDED`.

**Sem script de usuário** (beforeSave/afterSave) — performance. Sem notificações de menção.

#### 4. Socket.IO namespace `/csv-import` (novo)

`backend/application/resources/table-rows/import-csv/import-csv.socket.ts`

Eventos emitidos (server → client):
```ts
progress:   { job_id, processed, total }
completed:  { job_id, imported, skipped, total }
error:      { job_id, message, cause }
```

Auth: mesmo padrão de `/storage-migration` — JWT cookie no handshake, MASTER ou ADMINISTRATOR.  
Rooms: cada job usa room `job:{jobId}`. Worker emite para o room específico.

#### 5. Inicialização em `bin/server.ts`

Adicionar:
```ts
const csvImportNamespace = initCsvImportSocket(io, jwtDecode);
startCsvImportWorker({ namespace: csvImportNamespace, ... });
```

#### Erros

| Cause | HTTP | Quando |
|---|---|---|
| TABLE_NOT_FOUND | 404 | Tabela não existe |
| IMPORT_LIMIT_EXCEEDED | 422 | > 10.000 linhas (no worker → evento `error`) |
| INVALID_CSV_FILE | 400 | Arquivo vazio / sem header válido |
| IMPORT_CSV_ERROR | 500 | Erro inesperado |

---

## Frontend

### Hook

**`src/hooks/tanstack-query/use-table-rows-import-csv.tsx`** (novo)

```ts
useMutation:
  mutationFn: async ({ slug, file }) => {
    const form = new FormData()
    form.append('file', file)
    const res = await API.post(`/tables/${slug}/rows/imports/csv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data  // { jobId }
  }
```

### Dialog na view da tabela

**`src/routes/_private/tables/$slug/-import-csv-dialog.tsx`** (novo)

Estado interno:
- `phase`: `idle` | `uploading` | `processing` | `done` | `error`
- `progress`: `{ processed, total }` (atualizado via WS)
- `result`: `{ imported, skipped, total }` (ao receber `completed`)

Fluxo:
1. Botão **"Baixar Template"** → `GET /tables/:slug/rows/imports/csv/template` via `downloadCsvFromApi`
2. Input `accept=".csv"` → mostra nome do arquivo
3. Submit → `importCsv.mutate()` → recebe `{ jobId }` → conecta ao Socket.IO `/csv-import`, join `job:{jobId}`
4. Exibe barra de progresso (`processed / total`)
5. `completed` → toast "X importadas, Y ignoradas" → invalida `queryKeys.rows.lists(slug)` → `phase = done`
6. `error` → exibe mensagem de erro

**`src/routes/_private/tables/$slug/index.lazy.tsx`** (modificar)

Adicionar ao lado de `ExportCsvButton`:
```tsx
{canExportCsv && (
  <ImportCsvDialog slug={slug} table={table} />
)}
```
Mesma guarda `canExportCsv` (MASTER/ADMINISTRATOR).

### Seção na tools page

**`frontend/extensions/core/tools/tables-import-export/import-csv-section.tsx`** (novo)

Card com:
- `TableMultiSelect` em modo single (padrão de `clone-table/index.tsx`)
- Botão "Baixar Template" (habilitado após selecionar tabela) → `GET /tables/{slug}/rows/imports/csv/template`
- Input `.csv` + progresso via WS (mesma lógica do dialog)
- Resultado ao completar

**`frontend/extensions/core/tools/tables-import-export/index.tsx`** (modificar)

Adicionar `<ImportCsvSection />` ao layout (nova linha, `col-span-full`).

---

## Arquivos a Criar / Modificar

### Backend (11 novos + 1 modificado)
```
backend/application/resources/table-rows/import-csv/
  import-csv.controller.ts             ← POST /:slug/rows/imports/csv
  import-csv.template.controller.ts    ← GET  /:slug/rows/imports/csv/template
  import-csv.use-case.ts               ← valida e enfileira
  import-csv.validator.ts              ← params (slug)
  import-csv.schema.ts                 ← OpenAPI docs
  import-csv.socket.ts                 ← namespace /csv-import + eventos

backend/application/services/csv-import/
  csv-import-queue-contract.service.ts
  bullmq-csv-import-queue.service.ts
  in-memory-csv-import-queue.service.ts
  worker.ts

backend/bin/server.ts                  [MODIFICAR — init namespace + worker]
```

### Frontend (5 arquivos: 3 novos + 2 modificados)
```
frontend/src/hooks/tanstack-query/
  use-table-rows-import-csv.tsx                              [NOVO]

frontend/src/routes/_private/tables/$slug/
  -import-csv-dialog.tsx                                     [NOVO]
  index.lazy.tsx                                             [MODIFICAR]

frontend/extensions/core/tools/tables-import-export/
  import-csv-section.tsx                                     [NOVO]
  index.tsx                                                  [MODIFICAR]
```

---

## Verificação

1. `GET /tables/:slug/rows/imports/csv/template` → baixa CSV com headers dos campos não-nativos
2. `POST /tables/:slug/rows/imports/csv` → retorna `{ jobId }`, worker processa e emite progresso via WS
3. Frontend (view tabela): botão "Importar CSV" ao lado do "Exportar CSV" para MASTER/ADMINISTRATOR
4. Frontend: "Baixar Template" baixa CSV com campos da tabela específica
5. Frontend: barra de progresso atualiza em tempo real via Socket.IO
6. Roundtrip: baixar template → preencher dados → importar → linhas criadas corretamente
7. Roundtrip: exportar CSV → importar mesmo CSV → linhas duplicadas criadas
8. Limite: CSV com > 10.000 linhas → erro claro no frontend
