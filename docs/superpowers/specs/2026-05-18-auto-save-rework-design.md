# Auto-Save Rework — Design Spec

**Data:** 2026-05-18  
**Status:** Aprovado

## Contexto

O auto-save atual tem comportamento instável que prejudica a experiência do
usuário ao preencher formulários de registro (rows). Os problemas reportados:

1. **Flicker ao digitar**: campos ficam `disabled` durante o save, interrompendo a digitação
2. **Dropdown navega imediatamente**: `onChange` dispara save no modo create, que navega para rota de edição sem aviso
3. **Skeleton aparece durante auto-save**: condição de skeleton na rota não diferencia "sem dados" de "refetching"
4. **SaveStatusIndicator no footer**: cliente quer o indicador e botão Salvar no header/topo do formulário, não no rodapé

## Solução: Debounce + Salvar no header

### Princípios

- Campos de texto (TEXT_SHORT, TEXT_LONG, DATE): **salvar no blur** (sem debounce)
- Campos de seleção (DROPDOWN, CATEGORY, USER, RELATIONSHIP, FILE): **debounce de 600ms no onChange**
- Campos nativos e não-editáveis: **nunca disparam save**
- Formulário permanece **sempre interativo** durante save (remover `disabled={isSaving}`)
- **SaveStatusIndicator + botão Salvar** sobem para o topo do formulário (top bar de ações)

---

## Arquitetura

### 1. `use-row-auto-save.tsx` — Adicionar debounce interno

Interface `UseRowAutoSaveReturn` ganha três métodos:
- `triggerSaveImmediate(values)` — salva agora (cancela debounce pendente)
- `triggerSaveDebounced(values)` — agenda save com 600ms de delay (substitui `triggerSave` para campos de seleção)
- `cancelDebounce()` — cancela timer pendente sem executar

**Implementação interna:**
- `debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`
- `pendingValuesRef = useRef<CreateRowDefaultValue | null>(null)`
- `triggerSaveDebounced`: salva valores em `pendingValuesRef`, cancela timer anterior, agenda novo timer de 600ms que chama `triggerSaveImmediate`
- `triggerSaveImmediate`: cancela qualquer timer pendente antes de salvar
- O `useEffect` do timer de 30s chama `triggerSaveImmediate` (não debounced)
- Manter o guard `if (_create.isPending || _update.isPending || _restore.isPending) return`

> Manter `triggerSave` como alias de `triggerSaveImmediate` para compatibilidade com outros usos.

---

### 2. `-create-form.tsx` — Separar triggers por tipo de campo

**`buildValidators`** recebe dois handlers separados:
```
buildValidators(field, onBlurSave?, onSelectionChange?)
```

- Campos de seleção (`isSelectionField`): `onChange` chama `onSelectionChange?.()`, `onBlur` só valida
- Campos de texto: `onChange` só valida, `onBlur` chama `onBlurSave?.()`
- DATE: tratado como campo de texto (blur-based)

**`RowFormFields`** props mudam:
- Remove `onAutoSave?: () => void`
- Adiciona `onBlurSave?: () => void` e `onSelectionChange?: () => void`
- O `disabled` prop **permanece** mas serve apenas para modo `show` (não para `isSaving`)

---

### 3. `-create-row-form.tsx` — Handlers + mover indicador para topo

**Dois handlers:**
```tsx
const handleBlurSave = useCallback(() => {
  if (isUploading) return;
  triggerSaveImmediate(form.store.state.values);
}, [...]);

const handleSelectionChange = useCallback(() => {
  if (isUploading) return;
  triggerSaveDebounced(form.store.state.values);
}, [...]);
```

**Timer 30s:** chama `triggerSaveImmediate` (inalterado)

**Layout:** remover o footer com `SaveStatusIndicator` e `Cancelar`. Mover para o topo:
```
[CreateRowForm top bar]
  ← esquerda: SaveStatusIndicator
  → direita: [Cancelar] [Salvar]
```

Botão **Salvar** chama `cancelDebounce()` + `triggerSaveImmediate(values)`.

**`disabled={isSaving}`** em `RowFormFields` → removido. Campos sempre editáveis.

---

### 4. `-update-row-form.tsx` — Handlers + mover para top bar + fix disabled

**`isDisabled`** muda:
```tsx
// Antes:
const isDisabled = mode === 'show' || isSaving || _update.status === 'pending';

// Depois:
const isDisabled = mode === 'show' || _update.status === 'pending';
```

**Handlers:** mesmo padrão que create form (`handleBlurSave`, `handleSelectionChange`).

**Layout — modo edit:** mover `SaveStatusIndicator` + `Cancelar` + `Salvar` do footer para o top bar (a `div.shrink-0.px-2.pb-2`):

```
[Top bar — modo edit]
  ← esquerda: SaveStatusIndicator (isSaving / Salvo / Rascunho / Erro)
  → direita: [Cancelar] [Salvar]
```

O footer em modo edit pode ser removido.

**Botão Salvar manual** (mode=edit) chama:
1. `cancelDebounce()` — cancela qualquer debounce pendente
2. `void form.handleSubmit()` — usa `_update` mutation com toast de sucesso

O `_update.onSuccess` já chama `form.reset()` + `setMode('show')`.

---

### 5. `index.lazy.tsx` (rota `$rowId`) — Fix skeleton

Condição atual:
```tsx
if (table.status === 'pending' || row.status === 'pending') {
  return <UpdateRowFormSkeleton />;
}
```

Nova condição:
```tsx
if ((!table.data && table.status === 'pending') || (!row.data && row.status === 'pending')) {
  return <UpdateRowFormSkeleton />;
}
```

Skeleton apenas quando **não há dado em cache** + status pending. Durante refetch com cache disponível, o formulário permanece visível.

---

## Tipos de campo e comportamento esperado

| E_FIELD_TYPE | E_FIELD_FORMAT | Trigger save | Notas |
|---|---|---|---|
| TEXT_SHORT | todos | blur | Inclui INTEGER, DECIMAL, URL, EMAIL, etc. |
| TEXT_LONG | PLAIN_TEXT | blur | Textarea |
| TEXT_LONG | RICH_TEXT | blur | Tiptap — blur via onBlur do editor |
| DATE | todos | blur | Datepicker — blur ao fechar |
| DROPDOWN | — | onChange (600ms debounce) | |
| CATEGORY | — | onChange (600ms debounce) | |
| USER | — | onChange (600ms debounce) | |
| RELATIONSHIP | — | onChange (600ms debounce) | |
| FILE | — | onChange (600ms debounce) | `isUploading` guard já protege durante upload |
| REACTION | — | nunca | Não renderizado no form |
| EVALUATION | — | nunca | Não renderizado no form |
| FIELD_GROUP | — | nunca | Não renderizado no form |
| nativos | — | nunca | CREATOR, IDENTIFIER, CREATED_AT, TRASHED, TRASHED_AT |

---

## Lixeira e campos obrigatórios (mantido)

Comportamento atual permanece inalterado:
- Campos obrigatórios não preenchidos → salva com `trashed: true`
- Após preencher todos os obrigatórios → `_restore` mutation
- `SaveStatusIndicator` mostra "Rascunho (lixeira)" quando `isDraft=true`

---

## Compatibilidade

`RowFormFields` é reutilizado em:
- `kanban-row-dialog.tsx` — usa `form.AppField` direto, não passa `onAutoSave`
- `calendar-event-dialog.tsx` — idem
- `group-row-form-dialog.tsx` — idem
- `document-row.tsx` — somente leitura

Nenhum desses contextos é afetado pela mudança de props (`onAutoSave` → `onBlurSave` + `onSelectionChange`), pois nenhum passa `onAutoSave`.

---

## Verificação

1. **Flicker**: Abrir form create, digitar em campo TEXT_SHORT — sem piscar
2. **Dropdown**: Abrir form create, selecionar DROPDOWN — salva após 600ms, sem navegação imediata
3. **Skeleton**: Editar registro existente — auto-save ocorre sem skeleton aparecer
4. **Header**: Em modo edit, SaveStatusIndicator e botão Salvar visíveis no topo
5. **Botão Salvar manual**: Clicar Salvar cancela debounce e salva imediatamente
6. **Lixeira**: Criar registro sem campos obrigatórios — aparece em lixeira; preencher campos — sai da lixeira
7. **Timer 30s**: Aguardar 30s com form aberto e modificado — save automático ocorre
8. **Formulários longos (Chamados, Casos de Teste)**: Testar preenchimento completo sem instabilidade

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `frontend/src/hooks/use-row-auto-save.tsx` | Debounce interno, `triggerSaveImmediate`, `triggerSaveDebounced`, `cancelDebounce` |
| `frontend/src/routes/_private/tables/$slug/row/create/-create-form.tsx` | `buildValidators` com `onBlurSave`/`onSelectionChange`; `RowFormFields` props |
| `frontend/src/routes/_private/tables/$slug/row/create/-create-row-form.tsx` | Dois handlers; mover SaveStatusIndicator + Salvar para topo |
| `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx` | Dois handlers; mover indicador/salvar para top bar; fix `isDisabled` |
| `frontend/src/routes/_private/tables/$slug/row/$rowId/index.lazy.tsx` | Fix condição de skeleton |
