# Kanban Log Noise — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suprimir logs de reordenação de posição kanban — registrar somente a mudança de coluna do card movido.

**Architecture:** Frontend marca chamadas de posição-apenas com header `X-Skip-Log: true` via Axios config. Backend hook `LoggerUserActionHook` verifica o header e retorna cedo, sem persistir log. Sem novo endpoint, sem breaking change.

**Tech Stack:** TypeScript, Fastify 5, React 19, Axios 1.13, `@dnd-kit/core + sortable`

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `backend/hooks/logger.hook.ts` | +1 early-return: verificar `X-Skip-Log` header |
| `frontend/src/components/common/table-views/table-kanban-view.tsx` | Tipo `updates`, função `applyOrder`, função `updateRowsOrder` |

---

## Task 1: Backend — Suprimir log quando `X-Skip-Log` presente

**Files:**
- Modify: `backend/hooks/logger.hook.ts:221-232`

- [ ] **Step 1: Adicionar supressão por header após os guards existentes**

Em `backend/hooks/logger.hook.ts`, após a linha `if (action === E_LOGGER_ACTION_TYPE.VIEW) return;` (linha ~232), adicionar:

```typescript
// Não loga operações de reordenação kanban (posicionamento sem mudança de coluna).
// Frontend envia X-Skip-Log: true em updates que só alteram `ordem-kanban`.
if (request.headers['x-skip-log']) return;
```

O bloco de supressão completo deve ficar assim:

```typescript
// Não loga rotas que não mapeiam para nenhum objeto conhecido
if (!object) return;

// Não loga requests sem usuário autenticado (SSR, endpoints públicos,
// healthchecks). Sem identidade o log vira ruído ("Anônimo") e polui o histórico.
if (!user_id) return;

// Não loga GETs (Visualização). Carregar uma página dispara várias requests
// em paralelo (menus, extensões, settings, tabelas...) e cada uma viraria um
// log separado. O histórico deve refletir AÇÕES do usuário — criar, editar,
// deletar — não cada chamada HTTP de leitura.
if (action === E_LOGGER_ACTION_TYPE.VIEW) return;

// Não loga operações de reordenação kanban (posicionamento sem mudança de coluna).
// Frontend envia X-Skip-Log: true em updates que só alteram `ordem-kanban`.
if (request.headers['x-skip-log']) return;
```

- [ ] **Step 2: Verificar compilação backend**

```bash
cd /home/jhollyfer/Documentos/lowcodejs/backend
npm run build 2>&1 | tail -20
```

Esperado: sem erros TypeScript. `tsc` passa, `tsup` gera `/build`.

- [ ] **Step 3: Commit**

```bash
cd /home/jhollyfer/Documentos/lowcodejs
git add backend/hooks/logger.hook.ts
git commit -m "fix(logs): suprimir log de reordenação kanban via header X-Skip-Log"
```

---

## Task 2: Frontend — Marcar updates de posição-apenas com `skipLog`

**Files:**
- Modify: `frontend/src/components/common/table-views/table-kanban-view.tsx:631-774`

Esta task tem 3 sub-mudanças no mesmo arquivo, todas dentro de `handleDragEnd` e `updateRowsOrder`.

- [ ] **Step 1: Atualizar tipo de `updateRowsOrder` — adicionar `skipLog?`**

Localizar a assinatura da função `updateRowsOrder` (~linha 631-634) e atualizar:

```typescript
// ANTES:
const updateRowsOrder = React.useCallback(
  async (
    updates: Array<{ rowId: string; data: Record<string, unknown> }>,
  ) => {

// DEPOIS:
const updateRowsOrder = React.useCallback(
  async (
    updates: Array<{ rowId: string; data: Record<string, unknown>; skipLog?: boolean }>,
  ) => {
```

- [ ] **Step 2: Atualizar corpo de `updateRowsOrder` — passar header quando `skipLog: true`**

Localizar o `API.put` dentro de `updateRowsOrder` (~linhas 636-645) e atualizar:

```typescript
// ANTES:
        await Promise.all(
          updates.map((update) =>
            API.put(
              '/tables/'
                .concat(tableSlug)
                .concat('/rows/')
                .concat(update.rowId),
              update.data,
            ),
          ),
        );

// DEPOIS:
        await Promise.all(
          updates.map((update) =>
            API.put(
              '/tables/'
                .concat(tableSlug)
                .concat('/rows/')
                .concat(update.rowId),
              update.data,
              update.skipLog ? { headers: { 'x-skip-log': 'true' } } : undefined,
            ),
          ),
        );
```

> **Nota:** Axios `put(url, data, config?)` aceita config como 3º argumento. Passar `undefined` é idêntico a omitir — sem efeito colateral.

- [ ] **Step 3: Atualizar tipo do array `updates` dentro de `handleDragEnd`**

Localizar a declaração de `updates` dentro de `handleDragEnd` (~linha 738) e atualizar:

```typescript
// ANTES:
      const updates: Array<{ rowId: string; data: Record<string, unknown> }> =
        [];

// DEPOIS:
      const updates: Array<{ rowId: string; data: Record<string, unknown>; skipLog?: boolean }> =
        [];
```

- [ ] **Step 4: Atualizar `applyOrder` — calcular `isColumnChange` e propagar `skipLog`**

Localizar a função `applyOrder` dentro de `handleDragEnd` (~linhas 741-763) e substituir:

```typescript
// ANTES:
      const applyOrder = (ids: Array<string>, columnId: string): void => {
        ids.forEach((id, index) => {
          const row = rowById.get(id);
          if (!row) return;
          const patchData: Record<string, unknown> = {};
          if (sourceColumn !== targetColumn && id === activeId) {
            patchData[fields.list!.slug] = [columnId];
          }
          if (orderSlug) {
            patchData[orderSlug] = String(index + 1);
          }
          if (Object.keys(patchData).length > 0) {
            updates.push({ rowId: id, data: patchData });
          }
          rowById.set(id, {
            ...row,
            ...(sourceColumn !== targetColumn && id === activeId
              ? { [fields.list!.slug]: [columnId] }
              : {}),
            ...(orderSlug ? { [orderSlug]: String(index + 1) } : {}),
          });
        });
      };

// DEPOIS:
      const applyOrder = (ids: Array<string>, columnId: string): void => {
        ids.forEach((id, index) => {
          const row = rowById.get(id);
          if (!row) return;
          const patchData: Record<string, unknown> = {};
          // true somente para o card que efetivamente muda de coluna
          const isColumnChange = sourceColumn !== targetColumn && id === activeId;
          if (isColumnChange) {
            patchData[fields.list!.slug] = [columnId];
          }
          if (orderSlug) {
            patchData[orderSlug] = String(index + 1);
          }
          if (Object.keys(patchData).length > 0) {
            // skipLog: true para updates de posição-apenas (sem mudança de coluna)
            updates.push({ rowId: id, data: patchData, skipLog: !isColumnChange });
          }
          rowById.set(id, {
            ...row,
            ...(isColumnChange ? { [fields.list!.slug]: [columnId] } : {}),
            ...(orderSlug ? { [orderSlug]: String(index + 1) } : {}),
          });
        });
      };
```

> **Lógica dos casos:**
> - Mover card entre colunas: card movido → `isColumnChange=true` → `skipLog=false` → 1 log. Demais cards → `skipLog=true` → 0 logs.
> - Reordenar dentro da mesma coluna: `sourceColumn === targetColumn` → `isColumnChange` nunca `true` → todos `skipLog=true` → 0 logs.

- [ ] **Step 5: Verificar compilação frontend**

```bash
cd /home/jhollyfer/Documentos/lowcodejs/frontend
npx tsc --noEmit 2>&1 | tail -30
```

Esperado: sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
cd /home/jhollyfer/Documentos/lowcodejs
git add frontend/src/components/common/table-views/table-kanban-view.tsx
git commit -m "fix(kanban): marcar updates de posição com X-Skip-Log para suprimir logs colaterais"
```

---

## Task 3: Verificação Manual

- [ ] **Step 1: Subir stack**

```bash
cd /home/jhollyfer/Documentos/lowcodejs
docker compose up -d
```

Aguardar containers `api` e `app` ficarem healthy.

- [ ] **Step 2: Abrir tabela com visualização Kanban**

Acessar `http://localhost:5173` → abrir uma tabela com estilo Kanban.
Se não houver, criar uma tabela, configurar campo DROPDOWN como lista kanban e alterar estilo para Kanban.

- [ ] **Step 3: Testar mover card entre colunas**

Arrastar um card de uma coluna para outra.

Verificar via MongoDB (ou endpoint de logs se disponível):

```bash
docker exec -it low-code-js-api node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { dbName: process.env.DB_DATABASE }).then(async () => {
  const logs = await mongoose.connection.collection('logs').find({}).sort({ createdAt: -1 }).limit(10).toArray();
  console.log(JSON.stringify(logs.map(l => ({ action: l.action, object: l.object, object_id: l.object_id, url: l.url, createdAt: l.createdAt })), null, 2));
  mongoose.disconnect();
});
"
```

**Esperado:** Exatamente 1 log com `action: "UPDATE"`, `object: "ROW"`, `object_id: <id do card movido>`.
Body do log contém o campo de lista (ex: `{ "lista": ["nova-coluna-id"] }`).

- [ ] **Step 4: Testar reordenar card dentro da mesma coluna**

Arrastar card para cima/baixo dentro da mesma coluna.

Verificar logs: **0 novos logs** gerados.

- [ ] **Step 5: Testar edição normal via dialog de card**

Abrir dialog de um card, editar um campo de texto qualquer, salvar.

Verificar logs: **1 log** gerado normalmente (sem regressão — o dialog usa `PUT` sem header `X-Skip-Log`).

- [ ] **Step 6: Verificar no DevTools (opcional)**

Abrir DevTools → Network → filtrar por `/rows/`.

Ao mover card entre colunas:
- 1 request **sem** `X-Skip-Log` (o card que muda coluna)
- N requests **com** `X-Skip-Log: true` (cards colaterais)

---

## Resumo de Mudanças

| # | Arquivo | Linhas alteradas | Descrição |
|---|---------|-----------------|-----------|
| 1 | `backend/hooks/logger.hook.ts` | +3 linhas | Early-return quando `X-Skip-Log` presente |
| 2 | `frontend/src/components/common/table-views/table-kanban-view.tsx` | ~15 linhas | Tipo + lógica `skipLog` + header Axios |
