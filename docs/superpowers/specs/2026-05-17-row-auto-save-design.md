# Row Auto-Save Design

**Data**: 2026-05-17  
**Scope**: Frontend only  
**Status**: Aprovado

## Contexto

Atualmente, criar ou editar um registro de tabela requer um clique explícito no
botão "Criar" (create) ou "Salvar" (edit). Se o usuário trocar de aba,
fechar o sidebar ou perder conexão sem clicar o botão, todo o conteúdo digitado é
perdido. O objetivo é salvar automaticamente o conteúdo sempre que o usuário
trocar de campo, eliminando a perda de dados.

---

## Requisitos

- **Create**: Primeiro blur/change em qualquer campo → POST cria o row. Blurs
  seguintes → PUT atualiza. Botão "Criar" removido. Botão "Cancelar" navega de
  volta (row já persistido se auto-save disparou).
- **Edit**: Cada mudança de campo → debounce 500ms → PUT atualiza row existente.
  Botão "Salvar" mantido como fallback explícito. "Cancelar" cancela debounce
  pendente + reseta form + volta ao modo show.
- FILE fields: skip auto-save enquanto `isUploading === true`; salva após upload
  completar (quando storages mudam, o valor do form muda → debounce dispara).
- Indicador visual: `Salvando...` (isSaving) / `Salvo ✓` (some após 2s) / idle.
- Erros de auto-save: `toast.error(...)` — não bloqueiam o form.

---

## Arquitetura

### Estratégia de observação

Usa `useStore(form.store, selector)` do `@tanstack/react-store` para observar
mudanças de `state.values` do TanStack Form. Qualquer mudança → debounce 500ms →
save. Sem prop drilling em `RowFormFields`. Sem alterações nos field components.

### Componentes afetados

| Arquivo | Modificação |
|---|---|
| `hooks/use-row-auto-save.ts` | **NOVO** — hook central de auto-save |
| `routes/.../row/create/-create-row-form.tsx` | Usa hook, remove botão "Criar", adiciona `AutoSaveController` e indicador |
| `routes/.../row/$rowId/-update-row-form.tsx` | Usa hook, adiciona `AutoSaveController` e indicador, mantém botão Salvar |

---

## Hook `useRowAutoSave`

```
Arquivo: frontend/src/hooks/use-row-auto-save.ts

interface UseRowAutoSaveOptions {
  tableSlug: string
  fields: IField[]
  rowId?: string          // undefined = modo create; string = modo edit
}

returns: {
  savedRowId: React.MutableRefObject<string | null>
  isSaving: boolean
  lastSavedAt: Date | null
  save: (values: Record<string, any>) => Promise<void>
}
```

**Lógica de save:**
1. Chama `buildRowPayload(values, fields)` para normalizar valores
2. Se `savedRowId.current === null` → `POST /tables/:slug/rows` → seta `savedRowId.current = data._id`
3. Senão → `PUT /tables/:slug/rows/:savedRowId.current`
4. Em ambos: `queryClient.setQueryData(queryKeys.rows.detail(...), data)` +
   `queryClient.invalidateQueries(queryKeys.rows.lists(slug))`
5. Seta `lastSavedAt = new Date()`

Internamente usa `useCreateTableRow` e `useUpdateTableRow` diretamente via
`useMutation` para ter controle do `isSaving`.

---

## Componente `AutoSaveController`

Componente render-null, colocado dentro do JSX do form:

```tsx
function AutoSaveController({ formStore, save, isUploading }) {
  const values = useStore(formStore, (s) => s.values);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; } // skip mount
    if (isUploading) return;
    if (!hasAnyValue(values)) return;

    const timer = setTimeout(() => void save(values), 500);
    return () => clearTimeout(timer);
  }, [values, isUploading, save]);

  return null;
}
```

`hasAnyValue(values)`: retorna `true` se pelo menos 1 campo tem string não-vazia,
array não-vazio ou FILE com `storages.length > 0`.

---

## Indicador Visual

Footer dos forms — à esquerda do botão Cancelar:

```
[Cancelar]  •  Salvando...    ← isSaving = true
[Cancelar]  •  Salvo ✓        ← lastSavedAt !== null (some após 2s via useEffect)
[Cancelar]                    ← idle
```

Implementado como `SaveStatusIndicator` (componente simples no próprio arquivo do
form).

---

## Create Form — Mudanças

**`-create-row-form.tsx`**:
- Instancia `useRowAutoSave({ tableSlug: table.slug, fields, rowId: undefined })`
- Renderiza `<AutoSaveController formStore={form.store} save={save} isUploading={isUploading} />`
- Remove botão "Criar"
- Botão "Cancelar" → navega para `/tables/:slug` (sem alterações — row já foi
  salvo automaticamente se houve qualquer mudança; se não houve, row não existe)
- Footer mostra `<SaveStatusIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />`

---

## Edit Form — Mudanças

**`-update-row-form.tsx`**:
- Instancia `useRowAutoSave({ tableSlug: slug, fields: formFields, rowId })`
- Renderiza `<AutoSaveController .../>` dentro do `{mode === 'edit' && ...}`
- Botão "Salvar" mantido → `form.handleSubmit()` (comportamento atual, agora é fallback)
- Botão "Cancelar" → cancela debounce pendente (via `cancelSave()` exposto pelo hook)
  + `form.reset()` + `setMode('show')`
- Footer mostra `<SaveStatusIndicator .../>` ao lado dos botões

---

## Fluxo de Dados

```
User changes field
  → form.store values change
  → useStore reactive update
  → useEffect detects change
  → clearTimeout(prev timer)
  → setTimeout 500ms
  → save(values)
    → buildRowPayload(values, fields)
    → POST or PUT API
    → setQueryData + invalidateQueries
    → setLastSavedAt(new Date())
```

---

## Casos de Borda

| Caso | Comportamento |
|---|---|
| Upload em progresso | `isUploading = true` → skip save até upload completar |
| Todos os campos vazios | `hasAnyValue = false` → skip save |
| Usuário cancela antes de qualquer save | `savedRowId = null` → nenhum POST feito → nenhum row criado |
| Erro na API | `toast.error(...)`, `isSaving = false`, form continua editável |
| Usuário clica Cancelar no edit com save pendente | Cancela setTimeout pendente, `form.reset()`, volta ao show mode |
| Create com campo FILE: upload lento | debounce só dispara após upload (storages muda → form value muda → debounce) |

---

## Verificação

1. Abrir create form → preencher campo → esperar 500ms → verificar row criado via devtools de rede
2. Preencher segundo campo → verificar PUT (não POST) disparado
3. Clicar Cancelar sem preencher nada → verificar nenhum POST
4. Edit mode: mudar campo → esperar 500ms → verificar PUT
5. Edit mode: mudar campo → clicar Cancelar antes de 500ms → verificar sem PUT, form resetado
6. Create com FILE: fazer upload → verificar auto-save dispara após storage change
7. Upload em progresso: mudar campo de texto → verificar que auto-save não dispara enquanto uploading
