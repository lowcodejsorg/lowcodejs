# Row Auto-Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Salvar automaticamente o conteúdo do formulário de registro toda vez que qualquer campo muda (debounce 500ms), eliminando perda de dados ao trocar de campo ou fechar o sidebar.

**Architecture:** Hook `useRowAutoSave` centraliza a lógica create/update automático. Componente render-null `AutoSaveController` observa `form.store` via `useStore` do `@tanstack/react-form` e dispara o save com debounce 500ms. No create form, o `_create` mutation existente é removido e substituído pelo hook. No edit form, o `_update` mutation é mantido para o botão "Salvar" explícito — o hook cuida apenas do auto-save (PUT via rowId fixo).

**Tech Stack:** React 19, TanStack Form v1, TanStack Query v5, `@tanstack/react-form` (`useStore`), TypeScript strict

---

## File Map

| Arquivo | Ação |
|---|---|
| `frontend/src/hooks/use-row-auto-save.ts` | **CRIAR** — hook `useRowAutoSave`, componentes `AutoSaveController` e `SaveStatusIndicator`, helper `hasAnyValue` |
| `frontend/src/routes/_private/tables/$slug/row/create/-create-row-form.tsx` | **MODIFICAR** — substituir `_create` pelo hook, remover botão "Criar", novo footer com indicador |
| `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx` | **MODIFICAR** — adicionar hook em edit mode, manter `_update` para Salvar explícito, novo footer com indicador |

---

## Task 1: Hook `useRowAutoSave` + componentes auxiliares

**Files:**
- Create: `frontend/src/hooks/use-row-auto-save.ts`

- [ ] **Step 1: Criar o arquivo com todos os exports**

```typescript
import type { AnyFormApi } from '@tanstack/form-core';
import { useStore } from '@tanstack/react-form';
import React from 'react';

import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import type { IField } from '@/lib/interfaces';
import { buildRowPayload } from '@/lib/table';
import { toastError } from '@/lib/toast';

// ─── helpers ────────────────────────────────────────────────────────────────

function hasAnyValue(values: Record<string, unknown>): boolean {
  return Object.values(values).some((v) => {
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (v !== null && typeof v === 'object' && 'storages' in v) {
      return (v as { storages: unknown[] }).storages.length > 0;
    }
    return false;
  });
}

// ─── hook ───────────────────────────────────────────────────────────────────

interface UseRowAutoSaveOptions {
  tableSlug: string;
  fields: IField[];
  // Undefined = modo create (primeiro save faz POST).
  // String = modo edit (todos os saves fazem PUT).
  rowId?: string;
  // Callback disparado uma vez após o primeiro POST (create mode).
  // Útil para navegação pós-criação em tabelas com FIELD_GROUP.
  onFirstSave?: (rowId: string) => void;
}

interface UseRowAutoSaveReturn {
  savedRowId: React.MutableRefObject<string | null>;
  isSaving: boolean;
  lastSavedAt: Date | null;
  save: (values: Record<string, unknown>) => Promise<void>;
}

export function useRowAutoSave({
  tableSlug,
  fields,
  rowId,
  onFirstSave,
}: UseRowAutoSaveOptions): UseRowAutoSaveReturn {
  const savedRowId = React.useRef<string | null>(rowId ?? null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  // Ref para o callback de primeira criação evitar dependência instável no useCallback.
  const onFirstSaveRef = React.useRef(onFirstSave);
  onFirstSaveRef.current = onFirstSave;

  const _create = useCreateTableRow({
    onSuccess(data) {
      const isFirst = savedRowId.current === null;
      savedRowId.current = data._id;
      setLastSavedAt(new Date());
      if (isFirst) {
        onFirstSaveRef.current?.(data._id);
      }
    },
    onError() {
      toastError('Erro ao salvar', 'Não foi possível salvar o registro automaticamente');
    },
  });

  const _update = useUpdateTableRow({
    onSuccess() {
      setLastSavedAt(new Date());
    },
    onError() {
      toastError('Erro ao salvar', 'Não foi possível salvar o registro automaticamente');
    },
  });

  // Refs para acessar as mutations sem tornar `save` instável.
  const createRef = React.useRef(_create);
  createRef.current = _create;
  const updateRef = React.useRef(_update);
  updateRef.current = _update;

  const save = React.useCallback(
    async (values: Record<string, unknown>): Promise<void> => {
      if (
        createRef.current.status === 'pending' ||
        updateRef.current.status === 'pending'
      ) {
        return;
      }
      const data = buildRowPayload(values, fields);
      if (savedRowId.current === null) {
        await createRef.current.mutateAsync({ slug: tableSlug, data });
      } else {
        await updateRef.current.mutateAsync({
          slug: tableSlug,
          rowId: savedRowId.current,
          data,
        });
      }
    },
    [tableSlug, fields],
  );

  const isSaving = _create.isPending || _update.isPending;

  return { savedRowId, isSaving, lastSavedAt, save };
}

// ─── AutoSaveController ─────────────────────────────────────────────────────
// Componente render-null. Observa form.store e dispara save com debounce 500ms.
// Desmontar este componente cancela qualquer timer pendente automaticamente.

interface AutoSaveControllerProps {
  formStore: AnyFormApi['store'];
  save: (values: Record<string, unknown>) => Promise<void>;
  isUploading: boolean;
}

export function AutoSaveController({
  formStore,
  save,
  isUploading,
}: AutoSaveControllerProps): null {
  const values = useStore(
    formStore,
    (s) => s.values as Record<string, unknown>,
  );
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (isUploading) return;
    if (!hasAnyValue(values)) return;

    const timer = setTimeout(() => {
      void save(values);
    }, 500);

    return () => clearTimeout(timer);
  }, [values, isUploading, save]);

  return null;
}

// ─── SaveStatusIndicator ─────────────────────────────────────────────────────

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export function SaveStatusIndicator({
  isSaving,
  lastSavedAt,
}: SaveStatusIndicatorProps): React.JSX.Element | null {
  const [showSaved, setShowSaved] = React.useState(false);

  React.useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  if (isSaving) {
    return (
      <span className="text-xs text-muted-foreground animate-pulse">
        Salvando...
      </span>
    );
  }
  if (showSaved) {
    return <span className="text-xs text-green-600">Salvo ✓</span>;
  }
  return null;
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "use-row-auto-save"
```

Esperado: nenhuma linha de erro para esse arquivo.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/use-row-auto-save.ts
git commit -m "feat: add useRowAutoSave hook with AutoSaveController and SaveStatusIndicator"
```

---

## Task 2: Create Row Form — auto-save + remover botão Criar

**Files:**
- Modify: `frontend/src/routes/_private/tables/$slug/row/create/-create-row-form.tsx`

**Contexto do arquivo atual:** `CreateRowFormContent` tem `_create = useCreateTableRow(...)` e `_update` não existe. O botão "Criar" chama `form.handleSubmit()`. O `form.onSubmit` chama `_create.mutateAsync(...)` e navega após sucesso.

**Estratégia:** Substituir `_create` pelo hook `useRowAutoSave`. A navegação pós-criação (para tabelas com FIELD_GROUP) vai para o callback `onFirstSave`. Remover botão "Criar" e o `form.handleSubmit`. O `form.onSubmit` pode ser removido ou deixado como noop.

- [ ] **Step 1: Atualizar os imports**

Remover os imports de `useCreateTableRow`:
```typescript
// REMOVER esta linha:
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
```

Adicionar:
```typescript
import {
  AutoSaveController,
  SaveStatusIndicator,
  useRowAutoSave,
} from '@/hooks/use-row-auto-save';
```

- [ ] **Step 2: Substituir `_create` pelo hook e ajustar `form`**

Dentro de `CreateRowFormContent`, localizar e remover o bloco:
```typescript
const form = useAppForm({
  defaultValues: buildCreateRowDefaultValues(fields),
  onSubmit: async ({ value }) => {
    if (_create.status === 'pending') return;
    const _data = buildRowPayload(value, fields);
    await _create.mutateAsync({ slug: table.slug, data: _data });
  },
});
```

E o bloco:
```typescript
const _create = useCreateTableRow({
  onSuccess(data) { ... },
  onError(error) { ... },
});
```

Substituir pelos dois blocos abaixo (na mesma ordem: hook primeiro, form depois):

```typescript
const { save, isSaving, lastSavedAt } = useRowAutoSave({
  tableSlug: table.slug,
  fields,
  onFirstSave(newRowId) {
    const hasGroups = table.fields.some(
      (f) => f.type === E_FIELD_TYPE.FIELD_GROUP && !f.trashed,
    );
    if (hasGroups) {
      navigate({
        to: '/tables/$slug/row/$rowId',
        params: { slug: table.slug, rowId: newRowId },
      });
    }
  },
});

const form = useAppForm({
  defaultValues: buildCreateRowDefaultValues(fields),
});
```

Remover também o `useApiErrorAutoClear(form)` se existir neste arquivo (ele era para limpar erros do `_create` — não é mais necessário aqui).

- [ ] **Step 3: Adicionar `AutoSaveController` dentro do `<form>` e atualizar `disabled`**

Localizar o elemento `<form>` e substituir por:

```tsx
<form
  className="flex-1 flex flex-col min-h-0 overflow-auto relative"
  data-test-id="create-row-form"
  onSubmit={(e) => e.preventDefault()}
>
  <RowFormFields
    form={form}
    fields={fields}
    disabled={isSaving}
    tableSlug={table.slug}
  />
  <AutoSaveController
    formStore={form.store}
    save={save}
    isUploading={isUploading}
  />
</form>
```

**Nota:** `disabled` usa `isSaving` (substituindo `_create.status === 'pending'` que não existe mais).

- [ ] **Step 4: Substituir o footer**

Localizar o bloco `<div className="shrink-0 border-t p-2">` (que contém o `form.Subscribe` com os botões Cancelar e Criar) e substituir inteiramente por:

```tsx
<div className="shrink-0 border-t p-2">
  <div className="flex justify-between items-center">
    <SaveStatusIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />
    <Button
      type="button"
      variant="outline"
      className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
      data-test-id="create-row-cancel-btn"
      onClick={() => {
        sidebar.setOpen(false);
        navigate({
          to: '/tables/$slug',
          replace: true,
          params: { slug: table.slug },
        });
      }}
    >
      <span>Cancelar</span>
    </Button>
  </div>
</div>
```

- [ ] **Step 5: Remover imports não usados**

Após as alterações, os seguintes imports podem ter ficado sem uso — remover se for o caso:
- `buildRowPayload` (agora usado dentro do hook)
- `applyApiFieldErrors` (era do `_create.onError`)
- `toastSuccess` (era do `_create.onSuccess`)
- `handleApiError` (era do `_create.onError`)
- `Spinner` (estava no botão Criar)
- `useApiErrorAutoClear` (se estiver importado)

Rodar lint para identificar os não usados:
```bash
cd frontend && npm run lint 2>&1 | grep "create-row-form"
```

Remover os que o lint apontar como `no-unused-vars`.

- [ ] **Step 6: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "create-row-form"
```

Esperado: nenhum erro.

- [ ] **Step 7: Commit**

```bash
git add "frontend/src/routes/_private/tables/\$slug/row/create/-create-row-form.tsx"
git commit -m "feat: wire auto-save in create row form, remove Criar button"
```

---

## Task 3: Update Row Form — auto-save em edit mode + indicador

**Files:**
- Modify: `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx`

**Contexto do arquivo atual:** `UpdateRowFormContent` tem `_update = useUpdateTableRow(...)` usado no `form.onSubmit` (botão "Salvar") e no cálculo de `isDisabled`. O `AutoSaveController` é adicionado em paralelo — **`_update` não é removido**, pois o botão "Salvar" explícito continua usando-o.

**Estratégia:** Instanciar `useRowAutoSave` com `rowId` fixo (só fará PUT). Adicionar `AutoSaveController` dentro do edit mode JSX. Atualizar `isDisabled` para incluir `isSaving`. Novo footer com `SaveStatusIndicator`.

- [ ] **Step 1: Adicionar imports**

Adicionar junto aos imports existentes:

```typescript
import {
  AutoSaveController,
  SaveStatusIndicator,
  useRowAutoSave,
} from '@/hooks/use-row-auto-save';
```

- [ ] **Step 2: Instanciar o hook e atualizar `isDisabled`**

Dentro de `UpdateRowFormContent`, após a linha `const isUploading = useIsUploading();`, adicionar:

```typescript
const { save, isSaving, lastSavedAt } = useRowAutoSave({
  tableSlug: slug,
  fields: formFields,
  rowId,
});
```

Localizar a linha:
```typescript
const isDisabled = mode === 'show' || _update.status === 'pending';
```

Substituir por:
```typescript
const isDisabled = mode === 'show' || isSaving || _update.status === 'pending';
```

- [ ] **Step 3: Adicionar `AutoSaveController` dentro do form em edit mode**

Localizar o bloco `{mode === 'edit' && (<form ...>...</form>)}` e adicionar o controller como último filho do `<form>`:

```tsx
{mode === 'edit' && (
  <form
    className="flex-1 flex flex-col min-h-0 overflow-auto"
    data-test-id="update-row-form"
    onSubmit={(e) => {
      e.preventDefault();
      form.handleSubmit();
    }}
  >
    <RowFormFields
      form={form}
      fields={formFields}
      disabled={isDisabled}
      tableSlug={slug}
    />
    <AutoSaveController
      formStore={form.store}
      save={save}
      isUploading={isUploading}
    />
  </form>
)}
```

- [ ] **Step 4: Substituir o footer do edit mode**

Localizar o bloco `{/* Footer - Edit Mode */}` e substituir pelo novo footer que inclui `SaveStatusIndicator`:

```tsx
{/* Footer - Edit Mode */}
{mode === 'edit' && (
  <div className="shrink-0 border-t bg-sidebar p-2">
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <div className="flex justify-between items-center gap-2">
          <SaveStatusIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
              data-test-id="update-row-cancel-btn"
              disabled={isSubmitting}
              onClick={() => {
                form.reset();
                setMode('show');
              }}
            >
              <span>Cancelar</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
              data-test-id="update-row-submit-btn"
              disabled={!canSubmit || isUploading}
              onClick={() => form.handleSubmit()}
            >
              {isSubmitting && <Spinner />}
              <span>Salvar</span>
            </Button>
          </div>
        </div>
      )}
    />
  </div>
)}
```

**Nota:** O botão "Salvar" mantém o comportamento original — chama `form.handleSubmit()` que vai para `form.onSubmit` que chama `_update.mutateAsync(...)`, mostra toast "Registro atualizado" e volta ao show mode. O auto-save é um mecanismo paralelo e independente.

- [ ] **Step 5: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "update-row-form"
```

Esperado: nenhum erro.

- [ ] **Step 6: Verificar lint**

```bash
cd frontend && npm run lint 2>&1 | tail -20
```

Esperado: `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add "frontend/src/routes/_private/tables/\$slug/row/\$rowId/-update-row-form.tsx"
git commit -m "feat: wire auto-save in edit row form with status indicator"
```

---

## Verificação Manual

Após todos os commits, testar no browser (`npm run dev` ou docker compose up):

- [ ] **Create — auto-save dispara**: Abrir create form → preencher campo de texto → aguardar 500ms → verificar POST em Network tab (DevTools)
- [ ] **Create — segundo campo → PUT**: Preencher segundo campo → aguardar 500ms → verificar PUT (não POST) na Network tab
- [ ] **Create — cancelar sem preencher**: Abrir form → clicar Cancelar sem preencher → verificar que nenhum POST foi feito
- [ ] **Create — indicador visual**: Preencher campo → ver "Salvando..." aparecer → depois "Salvo ✓" → some após 2s
- [ ] **Create — tabela com FIELD_GROUP**: Em tabela que tem campo do tipo FIELD_GROUP, preencher primeiro campo → aguardar auto-save → verificar redirecionamento para `/tables/:slug/row/:rowId`
- [ ] **Edit — auto-save dispara**: Abrir registro → clicar Editar → mudar campo → aguardar 500ms → verificar PUT via auto-save
- [ ] **Edit — Salvar manual**: Mudar campo → clicar Salvar imediatamente (sem esperar 500ms) → verificar PUT via form.handleSubmit + toast "Registro atualizado"
- [ ] **Edit — Cancelar cancela debounce**: Mudar campo → clicar Cancelar antes de 500ms → verificar que o PUT pendente foi cancelado → form resetado
- [ ] **FILE field**: Fazer upload → verificar que auto-save dispara somente após upload completar (storages.length > 0)
- [ ] **Upload em progresso**: Iniciar upload → mudar campo de texto → verificar que auto-save NÃO dispara enquanto `isUploading = true`
- [ ] **Erro de rede**: Simular falha (DevTools → Network → Offline) → verificar toast "Erro ao salvar" aparece sem travar o form
