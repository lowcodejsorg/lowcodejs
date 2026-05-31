# Design: Supressão de Logs de Reordenação Kanban

**Data:** 2026-05-25  
**Status:** Aprovado  
**Branch alvo:** feat/import-csv-rows (ou nova branch a partir de main)

---

## Contexto

Ao mover um card no Kanban entre colunas, o frontend (`table-kanban-view.tsx`)
chama `applyOrder` em ambas as colunas (origem e destino). Todos os cards nas
duas colunas recebem novo valor de `ordem-kanban`, gerando N chamadas
`PUT /tables/:slug/rows/:id` em paralelo via `Promise.all`.

Cada chamada `PUT` dispara o hook `onResponse` do Fastify (`logger.hook.ts`),
que cria 1 log `action: UPDATE, object: ROW` por request. Resultado: mover 1
card entre 2 colunas com 3 cards cada gera **até 6 logs** quando só 1 é
significativo (a mudança de coluna do card movido).

**Feedback original:** "Quando o card do Kanban muda de lista, gera vários logs
de edição, pois acaba indiretamente alterando a posição dos outros cards."

**Requisito:** Registrar apenas mudanças de coluna — ignorar reordenação de
posição (campo `ordem-kanban`) em cards colaterais.

---

## Solução: Header `X-Skip-Log`

Frontend marca chamadas de posição-apenas com header `X-Skip-Log: true`. Hook
backend suprime log quando header presente. Mínima mudança, sem novo endpoint.

---

## Arquivos Modificados

### 1. Backend — `backend/hooks/logger.hook.ts`

**Onde:** após as 3 supressões existentes (linhas 222-232), antes de `repo.create`

**Adicionar:**
```typescript
// Não loga operações de reordenação kanban (posicionamento sem mudança de coluna).
// Frontend envia X-Skip-Log: true em updates que só alteram `ordem-kanban`.
if (request.headers['x-skip-log']) return;
```

### 2. Frontend — `frontend/src/components/common/table-views/table-kanban-view.tsx`

#### 2a. Tipo `updates` — linha ~738

```typescript
// Antes:
const updates: Array<{ rowId: string; data: Record<string, unknown> }> = [];

// Depois:
const updates: Array<{ rowId: string; data: Record<string, unknown>; skipLog?: boolean }> = [];
```

#### 2b. Função `applyOrder` — linha ~741

```typescript
const applyOrder = (ids: Array<string>, columnId: string): void => {
  ids.forEach((id, index) => {
    const row = rowById.get(id);
    if (!row) return;
    const patchData: Record<string, unknown> = {};
    
    // Card que muda de coluna — evento significativo, DEVE gerar log
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

> **Nota:** No fluxo de mesmo-coluna (`sourceColumn === targetColumn`),
> `isColumnChange` nunca é `true` → todos os cards recebem `skipLog: true`. ✓

#### 2c. Função `updateRowsOrder` — linha ~631

```typescript
const updateRowsOrder = React.useCallback(
  async (
    updates: Array<{ rowId: string; data: Record<string, unknown>; skipLog?: boolean }>,
  ) => {
    try {
      await Promise.all(
        updates.map((update) =>
          API.put(
            '/tables/'.concat(tableSlug).concat('/rows/').concat(update.rowId),
            update.data,
            update.skipLog ? { headers: { 'x-skip-log': 'true' } } : undefined,
          ),
        ),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(tableSlug),
      });
    } catch (error) {
      toastError('Erro ao reordenar cards', 'Não foi possível salvar a nova ordem');
    }
  },
  [queryClient, tableSlug],
);
```

> **Como funciona:** Axios `put(url, data, config?)` aceita config com `headers`
> como terceiro argumento. Sem `skipLog` → terceiro argumento `undefined` →
> comportamento idêntico ao atual.

---

## Comportamento Esperado Pós-Fix

| Ação | Logs gerados | Esperado |
|------|-------------|---------|
| Mover card entre colunas (col A:3 cards, col B:3 cards) | 1 (card movido) | ✓ |
| Reordenar card dentro da mesma coluna | 0 | ✓ |
| Editar campo normal via formulário | 1 | ✓ (sem header, comportamento inalterado) |
| Reordenar colunas kanban | 1 log `UPDATE FIELD` | ✓ (não impacto desta mudança) |

---

## Verificação

1. Subir stack: `docker compose up -d`
2. Abrir tabela com visualização Kanban
3. Mover card entre colunas — verificar em `/logs` ou MongoDB:
   - Exatamente 1 log gerado com `action: UPDATE, object: ROW, object_id: <id do card movido>`
   - Body do log contém o campo de lista (ex: `{ "lista": ["nova-coluna"] }`)
4. Reordenar cards dentro da mesma coluna — verificar: 0 logs
5. Editar campo de um card via dialog → verificar: 1 log (comportamento preservado)
6. Verificar que `PUT` sem header ainda loga normalmente (regressão)
