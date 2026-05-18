# Auto-Save Redesign — Estilo Google Drive

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o auto-save baseado em debounce de 500ms (que pisca a tela) por um sistema blur-first + intervalo 30s, com suporte a rascunho em lixeira quando campos obrigatórios estão incompletos.

**Architecture:** Três mudanças coordenadas: (1) backend aceita `trashed: true` no create com validação de campos obrigatórios pulada; (2) hook `useRowAutoSave` refatorado para expor `triggerSave(values)` e rastrear `isDraft`; (3) `RowFormFields` dispara `onAutoSave` no blur de campos de texto e no onChange de campos de seleção.

**Tech Stack:** Fastify + Zod (backend), React 19 + TanStack Form + TanStack Query (frontend), TanStack Router para navegação silenciosa.

---

## Mapa de Arquivos

| Arquivo | Operação | Responsabilidade |
|---------|----------|-----------------|
| `backend/application/core/row-payload-validator.core.ts` | Modificar | Adicionar `skipRequired` option |
| `backend/application/resources/table-rows/create/create.use-case.ts` | Modificar | Extrair `trashed` do payload, passar `skipRequired`, setar `trashedAt` |
| `frontend/src/hooks/use-row-auto-save.tsx` | Reescrever | Remover `useAutoSaveController`, adicionar `triggerSave`, `isDraft`, `_restore` mutation |
| `frontend/src/routes/_private/tables/$slug/row/create/-create-form.tsx` | Modificar | Adicionar prop `onAutoSave` em `RowFormFields` e wiring por tipo |
| `frontend/src/routes/_private/tables/$slug/row/create/-create-row-form.tsx` | Modificar | Usar `triggerSave`, 30s interval, navegação silenciosa com `replace: true` e `mode: 'edit'` |
| `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx` | Modificar | Usar `triggerSave`, 30s interval, passar `initialIsTrashed`, mostrar `isDraft` |

---

## Task 1: Backend — Adicionar `skipRequired` ao validador de payload

**Files:**
- Modify: `backend/application/core/row-payload-validator.core.ts`

- [ ] **Step 1: Adicionar `skipRequired` à interface de opções**

  No arquivo `row-payload-validator.core.ts`, linha 187-189, altere:
  ```typescript
  type ValidateRowPayloadOptions = {
    skipMissing?: boolean;
  };
  ```
  Para:
  ```typescript
  type ValidateRowPayloadOptions = {
    skipMissing?: boolean;
    skipRequired?: boolean;
  };
  ```

- [ ] **Step 2: Passar `skipRequired` para `validateFieldValue`**

  Na função `validateRowPayload` (linha ~214), altere a chamada:
  ```typescript
  const error = validateFieldValue(value, field, groups);
  ```
  Para:
  ```typescript
  const error = validateFieldValue(value, field, groups, options.skipRequired);
  ```

- [ ] **Step 3: Adicionar parâmetro `skipRequired` em `validateFieldValue`**

  Altere a assinatura da função `validateFieldValue` (linha ~68):
  ```typescript
  function validateFieldValue(
    value: unknown,
    field: IField,
    groups?: IGroupConfiguration[],
    skipRequired?: boolean,
  ): string | null {
    const { type } = field;
    const isRequired = field.required ?? false;

    // Check required
    if (value === null || value === undefined || value === '') {
      if (isRequired && !skipRequired) {
        return 'Este campo é obrigatório';
      }
      return null;
    }
    // ... resto inalterado
  ```

- [ ] **Step 4: Testar manualmente**

  Abrir `backend/application/core/row-payload-validator.core.ts` e confirmar:
  - Com `skipRequired: true` + campo required vazio → retorna `null` (sem erro)
  - Com `skipRequired: false` + campo required vazio → retorna `'Este campo é obrigatório'`
  - Com `skipRequired: true` + campo email com formato inválido → ainda retorna erro de formato

- [ ] **Step 5: Commit**

  ```bash
  git add backend/application/core/row-payload-validator.core.ts
  git commit -m "feat: add skipRequired option to validateRowPayload"
  ```

---

## Task 2: Backend — Aceitar `trashed` no create de row

**Files:**
- Modify: `backend/application/resources/table-rows/create/create.use-case.ts`

**Contexto:** O `TableRowCreateBodyValidator` já usa `z.record(z.string(), z.union([..., z.boolean(), ...]))` — `trashed: true` já passa na validação Zod sem mudanças. O `validateRowPayload` ignora keys que não são campos da tabela. Só o use-case precisa mudar.

- [ ] **Step 1: Extrair `trashed` do payload antes de criar o registro**

  No `create.use-case.ts`, na função `execute`, após a linha `const table = await this.tableRepository.findBySlug(payload.slug);`, localize a chamada a `validateRowPayload` (linha ~53):

  ```typescript
  const errors = validateRowPayload(payload, table.fields, table.groups);
  ```

  Substitua por:

  ```typescript
  const isTrashed = payload.trashed === true;

  const errors = validateRowPayload(payload, table.fields, table.groups, {
    skipRequired: isTrashed,
  });
  ```

- [ ] **Step 2: Aplicar `trashed` e `trashedAt` ao registro criado**

  Localize onde `createData` é montado (~linha 67):

  ```typescript
  const createData: Record<string, any> = {
    ...payload,
    creator: payload.creator ?? null,
  };
  ```

  Substitua por:

  ```typescript
  const createData: Record<string, any> = {
    ...payload,
    creator: payload.creator ?? null,
    trashed: isTrashed,
    trashedAt: isTrashed ? new Date() : null,
  };
  ```

- [ ] **Step 3: Verificar no Postman/curl que criar com `trashed: true` funciona**

  ```bash
  # Criar row normal (campos obrigatórios preenchidos)
  curl -X POST http://localhost:3000/tables/SLUG/rows \
    -H "Content-Type: application/json" \
    -b "accessToken=..." \
    -d '{"titulo": "teste", "trashed": false}'

  # Criar row como lixeira (campos obrigatórios vazios)
  curl -X POST http://localhost:3000/tables/SLUG/rows \
    -H "Content-Type: application/json" \
    -b "accessToken=..." \
    -d '{"trashed": true}'
  # Esperado: 201 com { trashed: true, trashedAt: "...", _id: "..." }

  # Criar row como lixeira com email inválido (deve rejeitar)
  curl -X POST http://localhost:3000/tables/SLUG/rows \
    -H "Content-Type: application/json" \
    -b "accessToken=..." \
    -d '{"email": "nao-e-um-email", "trashed": true}'
  # Esperado: 400 INVALID_PAYLOAD_FORMAT com errors.email
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add backend/application/resources/table-rows/create/create.use-case.ts
  git commit -m "feat: support trashed flag in create row endpoint"
  ```

---

## Task 3: Frontend — Refatorar `useRowAutoSave`

**Files:**
- Rewrite: `frontend/src/hooks/use-row-auto-save.tsx`

**Contexto:** O arquivo atual tem 3 exports: `useRowAutoSave`, `useAutoSaveController` (REMOVER), `SaveStatusIndicator` (MANTER + adicionar `isDraft`). Os campos `_create` e `_update` viram mutations raw (sem `invalidateQueries`). Adicionar `_restore` mutation. Expor `triggerSave(values)` e `isDraft`.

- [ ] **Step 1: Reescrever `use-row-auto-save.tsx`**

  Substitua o conteúdo completo do arquivo:

  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import {
    AlertCircleIcon,
    CheckCircleIcon,
    LoaderCircleIcon,
    FileTextIcon,
  } from 'lucide-react';
  import React from 'react';

  import { queryKeys } from './tanstack-query/_query-keys';

  import { API } from '@/lib/api';
  import type { IField, IRow } from '@/lib/interfaces';
  import { buildRowPayload } from '@/lib/table';
  import type { CreateRowDefaultValue } from '@/lib/table';
  import { toastError } from '@/lib/toast';

  // ─── helpers ────────────────────────────────────────────────────────────────

  function isFileValue(v: unknown): v is { storages: Array<unknown> } {
    return v !== null && typeof v === 'object' && 'storages' in v;
  }

  export function areRequiredFieldsFilled(
    fields: Array<IField>,
    values: CreateRowDefaultValue,
  ): boolean {
    return fields
      .filter((f) => f.required)
      .every((f) => {
        const v: unknown = values[f.slug];
        if (typeof v === 'string') return v.trim() !== '';
        if (Array.isArray(v)) return v.length > 0;
        if (isFileValue(v)) return v.storages.length > 0;
        return false;
      });
  }

  // ─── hook: useRowAutoSave ────────────────────────────────────────────────────

  interface UseRowAutoSaveOptions {
    tableSlug: string;
    fields: Array<IField>;
    // Undefined = modo create (primeiro save faz POST).
    // String = modo edit (todos os saves fazem PUT).
    rowId?: string;
    // Estado inicial de lixeira (relevante só no modo edit).
    initialIsTrashed?: boolean;
    // Callback disparado uma vez após o primeiro POST (create mode).
    onFirstSave?: (rowId: string) => void;
  }

  interface UseRowAutoSaveReturn {
    isSaving: boolean;
    isError: boolean;
    lastSavedAt: Date | null;
    isDraft: boolean;
    triggerSave: (values: CreateRowDefaultValue) => Promise<void>;
  }

  export function useRowAutoSave({
    tableSlug,
    fields,
    rowId,
    initialIsTrashed = false,
    onFirstSave,
  }: UseRowAutoSaveOptions): UseRowAutoSaveReturn {
    const queryClient = useQueryClient();
    const savedRowId = React.useRef<string | null>(rowId ?? null);
    const onFirstSaveRef = React.useRef(onFirstSave);
    onFirstSaveRef.current = onFirstSave;
    const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
    const [isError, setIsError] = React.useState(false);
    const [isTrashed, setIsTrashed] = React.useState(initialIsTrashed);

    const _create = useMutation({
      mutationFn: async (payload: { data: Record<string, unknown> }) => {
        const route = `/tables/${tableSlug}/rows`;
        const response = await API.post<IRow>(route, payload.data);
        return response.data;
      },
      onSuccess(data) {
        queryClient.setQueryData(
          queryKeys.rows.detail(tableSlug, data._id),
          data,
        );
        savedRowId.current = data._id;
        setIsTrashed(data.trashed);
        setLastSavedAt(new Date());
        setIsError(false);
      },
      onError() {
        setIsError(true);
        toastError(
          'Erro ao salvar',
          'Não foi possível salvar o registro automaticamente',
        );
      },
    });

    const _update = useMutation({
      mutationFn: async (payload: {
        rowId: string;
        data: Record<string, unknown>;
      }) => {
        const route = `/tables/${tableSlug}/rows/${payload.rowId}`;
        const response = await API.put<IRow>(route, payload.data);
        return response.data;
      },
      onSuccess(data) {
        queryClient.setQueryData(
          queryKeys.rows.detail(tableSlug, data._id),
          data,
        );
        setLastSavedAt(new Date());
        setIsError(false);
      },
      onError() {
        setIsError(true);
        toastError(
          'Erro ao salvar',
          'Não foi possível salvar o registro automaticamente',
        );
      },
    });

    const _restore = useMutation({
      mutationFn: async (payload: { rowId: string }) => {
        const route = `/tables/${tableSlug}/rows/${payload.rowId}/restore`;
        const response = await API.patch<IRow>(route);
        return response.data;
      },
      onSuccess(data) {
        queryClient.setQueryData(
          queryKeys.rows.detail(tableSlug, data._id),
          data,
        );
        setIsTrashed(false);
      },
      onError() {
        // Restore silencioso: não exibe toast, apenas loga
        console.warn('[useRowAutoSave] falha ao restaurar da lixeira');
      },
    });

    const triggerSave = React.useCallback(
      async (values: CreateRowDefaultValue): Promise<void> => {
        if (
          _create.status === 'pending' ||
          _update.status === 'pending' ||
          _restore.status === 'pending'
        ) {
          return;
        }

        const requiredFilled = areRequiredFieldsFilled(fields, values);
        const data = buildRowPayload(values, fields);

        if (savedRowId.current === null) {
          // Primeiro save: POST
          await _create.mutateAsync({
            data: { ...data, trashed: !requiredFilled },
          });
        } else {
          const currentRowId = savedRowId.current;
          // Saves subsequentes: PUT
          await _update.mutateAsync({ rowId: currentRowId, data });

          // Promover da lixeira se todos os obrigatórios estiverem preenchidos
          if (isTrashed && requiredFilled) {
            await _restore.mutateAsync({ rowId: currentRowId });
          }
        }
      },
      [fields, isTrashed, _create, _update, _restore],
    );

    const isSaving =
      _create.isPending || _update.isPending || _restore.isPending;

    return {
      savedRowId,
      isSaving,
      isError,
      lastSavedAt,
      isDraft: isTrashed,
      triggerSave,
    };
  }

  // ─── component: SaveStatusIndicator ─────────────────────────────────────────

  interface SaveStatusIndicatorProps {
    isSaving: boolean;
    isError: boolean;
    lastSavedAt: Date | null;
    isDraft?: boolean;
  }

  export function SaveStatusIndicator({
    isSaving,
    isError,
    lastSavedAt,
    isDraft = false,
  }: SaveStatusIndicatorProps): React.JSX.Element {
    const [showSaved, setShowSaved] = React.useState(false);

    React.useEffect(() => {
      if (!lastSavedAt) return;
      setShowSaved(true);
      const t = setTimeout((): void => setShowSaved(false), 2000);
      return (): void => clearTimeout(t);
    }, [lastSavedAt]);

    return (
      <span className="flex items-center gap-1 text-xs">
        {isSaving && (
          <React.Fragment>
            <LoaderCircleIcon className="size-3 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Salvando...</span>
          </React.Fragment>
        )}
        {!isSaving && showSaved && !isDraft && (
          <React.Fragment>
            <CheckCircleIcon className="size-3 text-green-600" />
            <span className="text-green-600">Salvo</span>
          </React.Fragment>
        )}
        {!isSaving && !showSaved && isDraft && (
          <React.Fragment>
            <FileTextIcon className="size-3 text-yellow-600" />
            <span className="text-yellow-600">Rascunho (lixeira)</span>
          </React.Fragment>
        )}
        {!isSaving && !showSaved && !isDraft && isError && (
          <React.Fragment>
            <AlertCircleIcon className="size-3 text-destructive" />
            <span className="text-destructive">Erro ao salvar</span>
          </React.Fragment>
        )}
      </span>
    );
  }
  ```

- [ ] **Step 2: Verificar que TypeScript compila sem erros**

  ```bash
  cd frontend && npx tsc --noEmit 2>&1 | grep "use-row-auto-save"
  ```
  Esperado: sem erros.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/hooks/use-row-auto-save.tsx
  git commit -m "feat: refactor useRowAutoSave to blur-first with draft support"
  ```

---

## Task 4: Frontend — Adicionar `onAutoSave` em `RowFormFields`

**Files:**
- Modify: `frontend/src/routes/_private/tables/$slug/row/create/-create-form.tsx`

**Contexto:** `RowFormFields` é o componente que renderiza todos os campos dinamicamente. Adicionar `onAutoSave?: () => void` que é chamado: nos campos de texto/data (`TEXT_SHORT`, `TEXT_LONG`, `DATE`) via `validators.onBlur`; nos campos de seleção (`DROPDOWN`, `CATEGORY`, `USER`, `RELATIONSHIP`, `FILE`) via `validators.onChange`. Os campos de seleção não têm "sair do campo" natural — a seleção em si é o commit point.

- [ ] **Step 1: Adicionar `onAutoSave` à interface `RowFormFieldsProps`**

  Localize a interface `RowFormFieldsProps` (~linha 217):

  ```typescript
  interface RowFormFieldsProps {
    form: any;
    fields: Array<IField>;
    disabled: boolean;
    tableSlug: string;
  }
  ```

  Adicione `onAutoSave`:

  ```typescript
  interface RowFormFieldsProps {
    form: any;
    fields: Array<IField>;
    disabled: boolean;
    tableSlug: string;
    onAutoSave?: () => void;
  }
  ```

- [ ] **Step 2: Desestruturar `onAutoSave` na função `RowFormFields`**

  Localize a assinatura da função (~linha 224):

  ```typescript
  export function RowFormFields({
    form,
    fields,
    disabled,
    tableSlug,
  }: RowFormFieldsProps): React.JSX.Element {
  ```

  Adicione `onAutoSave`:

  ```typescript
  export function RowFormFields({
    form,
    fields,
    disabled,
    tableSlug,
    onAutoSave,
  }: RowFormFieldsProps): React.JSX.Element {
  ```

- [ ] **Step 3: Wiring `onAutoSave` por tipo de campo**

  Substitua o bloco `<form.AppField ...>` (~linha 254-336) com o seguinte. A chave é:
  - Campos de texto/data: `validators.onBlur` chama `onAutoSave?.()` antes de retornar validação
  - Campos de seleção: `validators.onChange` chama `onAutoSave?.()` antes de retornar validação

  ```typescript
  return (
    <div
      key={field._id}
      className="min-w-[200px]"
      style={{ width: `calc(${field.widthInForm ?? 50}% - 1rem)` }}
    >
      <form.AppField
        name={field.slug}
        validators={(() => {
          const isSelectionField =
            field.type === E_FIELD_TYPE.DROPDOWN ||
            field.type === E_FIELD_TYPE.CATEGORY ||
            field.type === E_FIELD_TYPE.USER ||
            field.type === E_FIELD_TYPE.RELATIONSHIP ||
            field.type === E_FIELD_TYPE.FILE;

          if (isSelectionField) {
            return {
              onChange: ({ value }: { value: any }) => {
                onAutoSave?.();
                return buildFieldValidator(field, value);
              },
              onBlur: ({ value }: { value: any }) => {
                return buildFieldValidator(field, value);
              },
            };
          }

          // TEXT_SHORT, TEXT_LONG, DATE: onBlur dispara save
          return {
            onChange: ({ value }: { value: any }) => {
              return buildFieldValidator(field, value);
            },
            onBlur: ({ value }: { value: any }) => {
              onAutoSave?.();
              return buildFieldValidator(field, value);
            },
          };
        })()}
      >
        {(formField: any) => {
          switch (field.type) {
            case E_FIELD_TYPE.TEXT_SHORT:
              return (
                <formField.TableRowTextField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.TEXT_LONG:
              if (field.format === E_FIELD_FORMAT.RICH_TEXT) {
                return (
                  <formField.TableRowRichTextField
                    field={field}
                    disabled={disabled}
                  />
                );
              }
              return (
                <formField.TableRowTextareaField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.DROPDOWN:
              return (
                <formField.TableRowDropdownField
                  field={field}
                  disabled={disabled}
                  tableSlug={tableSlug}
                />
              );
            case E_FIELD_TYPE.DATE:
              return (
                <formField.TableRowDateField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.FILE:
              return (
                <formField.TableRowFileField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.RELATIONSHIP:
              return (
                <formField.TableRowRelationshipField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.CATEGORY:
              return (
                <formField.TableRowCategoryField
                  field={field}
                  disabled={disabled}
                />
              );
            case E_FIELD_TYPE.USER:
              return (
                <formField.TableRowUserField
                  field={field}
                  disabled={disabled}
                />
              );
            default:
              return null;
          }
        }}
      </form.AppField>
    </div>
  );
  ```

- [ ] **Step 4: Verificar TypeScript**

  ```bash
  cd frontend && npx tsc --noEmit 2>&1 | grep "create-form"
  ```
  Esperado: sem erros.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/routes/_private/tables/\$slug/row/create/-create-form.tsx
  git commit -m "feat: add onAutoSave blur trigger to RowFormFields"
  ```

---

## Task 5: Frontend — Atualizar `CreateRowFormContent`

**Files:**
- Modify: `frontend/src/routes/_private/tables/$slug/row/create/-create-row-form.tsx`

**Contexto:** Remover `useAutoSaveController`. Criar `handleAutoSave` que lê valores do form e chama `triggerSave`. Adicionar 30s interval. Navegação no `onFirstSave` passa para o modo edit com `replace: true`.

- [ ] **Step 1: Remover import `useAutoSaveController` e adicionar `useNavigate`**

  Localize a linha de import:
  ```typescript
  import {
    SaveStatusIndicator,
    useAutoSaveController,
    useRowAutoSave,
  } from '@/hooks/use-row-auto-save';
  ```

  Substitua por:
  ```typescript
  import {
    SaveStatusIndicator,
    useRowAutoSave,
  } from '@/hooks/use-row-auto-save';
  ```

  O `useNavigate` já está importado no topo do arquivo.

- [ ] **Step 2: Substituir `useRowAutoSave` + `useAutoSaveController` por novo padrão**

  Localize o bloco (~linha 67-78):
  ```typescript
  const { isSaving, isError, lastSavedAt, save } = useRowAutoSave({
    tableSlug: table.slug,
    fields,
    onFirstSave(rowId) {
      navigate({
        to: '/tables/$slug/row/$rowId',
        params: { slug: table.slug, rowId },
      });
    },
  });

  useAutoSaveController({ form, save, isUploading, fields });
  ```

  Substitua por:
  ```typescript
  const { isSaving, isError, lastSavedAt, isDraft, triggerSave, savedRowId } =
    useRowAutoSave({
      tableSlug: table.slug,
      fields,
    });

  // Navegar para rota de edição após primeiro save (silenciosamente)
  const navigateToEditRef = React.useRef(false);
  React.useEffect(() => {
    if (savedRowId.current && !navigateToEditRef.current) {
      navigateToEditRef.current = true;
      navigate({
        to: '/tables/$slug/row/$rowId',
        params: { slug: table.slug, rowId: savedRowId.current },
        search: { mode: 'edit' },
        replace: true,
      });
    }
  });

  const handleAutoSave = React.useCallback((): void => {
    if (isUploading) return;
    void triggerSave(form.store.state.values as any);
  }, [isUploading, triggerSave, form]);

  // Intervalo de 30s como fallback silencioso
  React.useEffect(() => {
    const timer = setInterval((): void => {
      if (!isUploading) {
        void triggerSave(form.store.state.values as any);
      }
    }, 30_000);
    return (): void => clearInterval(timer);
  }, [isUploading, triggerSave, form]);
  ```

- [ ] **Step 3: Passar `handleAutoSave` e `isDraft` para os componentes filhos**

  Localize `<RowFormFields ...>` (~linha 110-115):
  ```typescript
  <RowFormFields
    form={form}
    fields={fields}
    disabled={isSaving}
    tableSlug={table.slug}
  />
  ```

  Adicione `onAutoSave`:
  ```typescript
  <RowFormFields
    form={form}
    fields={fields}
    disabled={isSaving}
    tableSlug={table.slug}
    onAutoSave={handleAutoSave}
  />
  ```

  Localize `<SaveStatusIndicator ...>` (~linha 121-125):
  ```typescript
  <SaveStatusIndicator
    isSaving={isSaving}
    isError={isError}
    lastSavedAt={lastSavedAt}
  />
  ```

  Adicione `isDraft`:
  ```typescript
  <SaveStatusIndicator
    isSaving={isSaving}
    isError={isError}
    lastSavedAt={lastSavedAt}
    isDraft={isDraft}
  />
  ```

- [ ] **Step 4: Verificar TypeScript**

  ```bash
  cd frontend && npx tsc --noEmit 2>&1 | grep "create-row-form"
  ```
  Esperado: sem erros.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/routes/_private/tables/\$slug/row/create/-create-row-form.tsx
  git commit -m "feat: update CreateRowForm to use blur-based auto-save"
  ```

---

## Task 6: Frontend — Atualizar `UpdateRowFormContent`

**Files:**
- Modify: `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx`

**Contexto:** Remover `useAutoSaveController`. Passar `initialIsTrashed: data.trashed` ao hook. Criar `handleAutoSave` e 30s interval. Mostrar `isDraft` no indicador.

- [ ] **Step 1: Atualizar import de `use-row-auto-save`**

  Localize:
  ```typescript
  import {
    SaveStatusIndicator,
    useAutoSaveController,
    useRowAutoSave,
  } from '@/hooks/use-row-auto-save';
  ```

  Substitua por:
  ```typescript
  import {
    SaveStatusIndicator,
    useRowAutoSave,
  } from '@/hooks/use-row-auto-save';
  ```

- [ ] **Step 2: Substituir `useRowAutoSave` + `useAutoSaveController` no edit mode**

  Localize o bloco (~linha 116-128):
  ```typescript
  const { isSaving, isError, lastSavedAt, save } = useRowAutoSave({
    tableSlug: slug,
    fields: formFields,
    rowId,
  });

  useAutoSaveController({
    form,
    save,
    isUploading,
    fields: formFields,
    enabled: mode === 'edit',
  });
  ```

  Substitua por:
  ```typescript
  const { isSaving, isError, lastSavedAt, isDraft, triggerSave } =
    useRowAutoSave({
      tableSlug: slug,
      fields: formFields,
      rowId,
      initialIsTrashed: data.trashed,
    });

  const handleAutoSave = React.useCallback((): void => {
    if (mode !== 'edit') return;
    if (isUploading) return;
    void triggerSave(form.store.state.values as any);
  }, [mode, isUploading, triggerSave, form]);

  // Intervalo de 30s como fallback silencioso
  React.useEffect(() => {
    if (mode !== 'edit') return;
    const timer = setInterval((): void => {
      if (!isUploading) {
        void triggerSave(form.store.state.values as any);
      }
    }, 30_000);
    return (): void => clearInterval(timer);
  }, [mode, isUploading, triggerSave, form]);
  ```

- [ ] **Step 3: Passar `handleAutoSave` e `isDraft` nos componentes**

  Localize `<RowFormFields ...>` no edit mode (~linha 256-261):
  ```typescript
  <RowFormFields
    form={form}
    fields={formFields}
    disabled={isDisabled}
    tableSlug={slug}
  />
  ```

  Adicione `onAutoSave`:
  ```typescript
  <RowFormFields
    form={form}
    fields={formFields}
    disabled={isDisabled}
    tableSlug={slug}
    onAutoSave={handleAutoSave}
  />
  ```

  Localize `<SaveStatusIndicator ...>` (~linha 269-273):
  ```typescript
  <SaveStatusIndicator
    isSaving={isSaving}
    isError={isError}
    lastSavedAt={lastSavedAt}
  />
  ```

  Adicione `isDraft`:
  ```typescript
  <SaveStatusIndicator
    isSaving={isSaving}
    isError={isError}
    lastSavedAt={lastSavedAt}
    isDraft={isDraft}
  />
  ```

- [ ] **Step 4: Verificar TypeScript sem erros**

  ```bash
  cd frontend && npx tsc --noEmit 2>&1 | grep -E "update-row-form|use-row-auto"
  ```
  Esperado: sem erros.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/routes/_private/tables/\$slug/row/\$rowId/-update-row-form.tsx
  git commit -m "feat: update UpdateRowForm to use blur-based auto-save"
  ```

---

## Task 7: Verificação End-to-End

- [ ] **Step 1: Subir o ambiente de desenvolvimento**

  ```bash
  # Terminal 1 — Backend
  cd backend && npm run dev

  # Terminal 2 — Frontend
  cd frontend && npm run dev
  ```

- [ ] **Step 2: Testar — sem piscar ao digitar**

  1. Abrir um formulário de criação com campo `TEXT_LONG`
  2. Digitar um texto longo sem parar
  3. Parar de digitar
  4. **Esperado:** tela NÃO pisca ao pausar; piscar só ocorre se salvar (spinner breve)

- [ ] **Step 3: Testar — dropdown não navega para view**

  1. Abrir formulário de criação
  2. Selecionar uma opção em um campo DROPDOWN
  3. **Esperado:** save ocorre, URL muda para `/row/:id?mode=edit`, formulário permanece em modo edição

- [ ] **Step 4: Testar — lixeira no create**

  1. Abrir formulário de criação com campos obrigatórios
  2. Preencher só campos opcionais
  3. Clicar fora de um campo (blur)
  4. **Esperado:** indicador mostra "Rascunho (lixeira)"; row aparece na lixeira da tabela

- [ ] **Step 5: Testar — promoção da lixeira**

  1. Continuar do Step 4 (form em modo edit, row na lixeira)
  2. Preencher todos os campos obrigatórios
  3. Clicar fora de um campo
  4. **Esperado:** indicador muda para "Salvo ✓"; row sai da lixeira

- [ ] **Step 6: Testar — timer de 30s**

  1. Abrir formulário de edição
  2. Digitar em um campo mas NÃO sair do campo (sem blur)
  3. Aguardar 30 segundos
  4. **Esperado:** Network tab mostra PUT request após 30s

- [ ] **Step 7: Testar — campo email inválido com trashed=true**

  1. Criar tabela com campo email (required=false)
  2. Abrir form, digitar email inválido, clicar fora
  3. **Esperado:** auto-save falha com mensagem de formato inválido; NÃO cria row

- [ ] **Step 8: Testar — edição de row existente na lixeira**

  1. Abrir uma row que já está na lixeira em modo edit
  2. Preencher todos os campos obrigatórios
  3. Clicar fora de um campo
  4. **Esperado:** indicador mostra "Salvo ✓"; row é restaurada da lixeira automaticamente

---

## Notas de Implementação

### Por que `form.store.state.values` e não `useStore`

`useStore(form.store)` é reativo — re-renderiza o componente a cada mudança de valor, causando o piscar. `form.store.state.values` lê o estado atual no momento do callback (snapshot), sem criar subscription reativa. Isso é intencional.

### Por que sem `invalidateQueries` no auto-save

`invalidateQueries` força refetch de todas as queries de lista (`rows.lists`), causando re-render do componente pai (a tabela). Auto-save usa `setQueryData` para atualizar apenas o cache do detalhe. A lista fica "stale" até o usuário navegar para fora — comportamento aceitável e idêntico ao Google Drive.

### `isTrashed` state no hook vs `data.trashed`

`data.trashed` dos props do `UpdateRowFormContent` reflete o estado inicial. Após promoção via auto-save (restore), o `isTrashed` do hook atualiza imediatamente via `setIsTrashed(false)`. O `queryClient.setQueryData` no `_restore.onSuccess` atualiza o cache, mas o re-render do componente pai com novos props ocorre após a invalidação das listas (no `useRowUpdateRestore` existente) — que não usamos aqui. Por isso o estado local no hook é a fonte de verdade durante a sessão de edição.

### Rich Text (TIPTAP) e o `onBlur`

`TableRowRichTextField` usa Tiptap. O `onBlur` via TanStack Form (`validators.onBlur`) deve disparar quando o editor perde foco — verificar se o Tiptap propaga o blur corretamente. Se não propagar, pode ser necessário adicionar um listener no editor. Testar no Step 2.
