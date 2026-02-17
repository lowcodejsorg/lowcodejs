# Rotas de Tabelas (Registros)

Este documento detalha as rotas de criacao, visualizacao e edicao de registros (rows) das tabelas, incluindo a geracao dinamica de formularios e os renderizadores de celula.

**Diretorio base:** `frontend/src/routes/_private/tables/$slug/row/`

---

## Criacao de Registro

**Arquivos:**
- `tables/$slug/row/create/index.tsx` - Rota e carregamento
- `tables/$slug/row/create/-create-row-form.tsx` - Formulario com wrapper `UploadingProvider`
- `tables/$slug/row/create/-create-form.tsx` - Logica de defaults, payload e campos

**Rota:** `/_private/tables/$slug/row/create/`

### Search Params

| Parametro      | Tipo     | Descricao                                          |
|----------------|----------|-----------------------------------------------------|
| `categoryId`   | `string` | ID da categoria para pre-preencher (via Kanban)     |
| `categorySlug` | `string` | Slug do campo de categoria a pre-preencher          |

### Permissoes

Requer permissao `CREATE_ROW`. Caso contrario, exibe `AccessDenied`.

### Filtragem de Campos

Apenas campos que atendam as seguintes condicoes sao exibidos no formulario:

```typescript
const fields = React.useMemo(() => {
  return table.fields.filter((f) => !f.trashed && f.showInForm);
}, [table.fields]);
```

Campos nativos e campos do tipo `REACTION` e `EVALUATION` sao adicionalmente ignorados no componente `RowFormFields`.

---

## Geracao Dinamica de Valores Padrao

**Funcao:** `buildDefaultValues(fields)`

Gera os valores iniciais do formulario com base nos tipos de campo:

| Tipo de Campo     | Valor Padrao                                        |
|-------------------|-----------------------------------------------------|
| `TEXT_SHORT`      | `field.defaultValue ?? ''`                          |
| `TEXT_LONG`       | `field.defaultValue ?? ''`                          |
| `DROPDOWN`        | `[]` (array vazio)                                  |
| `DATE`            | `''` (string vazia)                                 |
| `FILE`            | `{ files: [], storages: [] }`                       |
| `RELATIONSHIP`    | `[]` (array vazio)                                  |
| `CATEGORY`        | `[]` (array vazio)                                  |
| `FIELD_GROUP`     | `[]` (array vazio)                                  |
| `USER`            | `[]` (array vazio)                                  |

```typescript
export function buildDefaultValues(fields: Array<IField>): Record<string, any> {
  const defaults: Record<string, any> = {};
  for (const field of fields) {
    if (field.trashed) continue;
    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
      case E_FIELD_TYPE.TEXT_LONG:
        defaults[field.slug] = field.defaultValue ?? '';
        break;
      case E_FIELD_TYPE.FILE:
        defaults[field.slug] = { files: [] as Array<File>, storages: [] as Array<IStorage> };
        break;
      // ... demais tipos
    }
  }
  return defaults;
}
```

---

## Construcao de Payload

**Funcao:** `buildPayload(values, fields)`

Converte os valores do formulario para o formato esperado pela API. Cada tipo tem logica especifica de normalizacao:

| Tipo de Campo     | Logica de Payload                                                     |
|-------------------|-----------------------------------------------------------------------|
| `TEXT_SHORT`      | Valor ou `null`                                                       |
| `TEXT_LONG`       | Valor ou `null`                                                       |
| `DROPDOWN`        | Array de IDs (multiplo) ou unico ID/null (singular)                   |
| `DATE`            | Valor ou `null`                                                       |
| `FILE`            | Array de IDs de storage (limitado a 1 se `multiple=false`)            |
| `RELATIONSHIP`    | Array de IDs de opcao (limitado a 1 se `multiple=false`)              |
| `CATEGORY`        | Array de IDs (limitado a 1 se `multiple=false`)                       |
| `FIELD_GROUP`     | Array de objetos (limitado a 1 se `multiple=false`)                   |
| `USER`            | Array de IDs de usuario (limitado a 1 se `multiple=false`)            |

Exemplo para campo `FILE`:

```typescript
case E_FIELD_TYPE.FILE: {
  const fileValue = value as { files: Array<File>; storages: Array<IStorage> };
  if (field.multiple) {
    payload[field.slug] = fileValue.storages.map((s) => s._id);
  } else {
    payload[field.slug] = fileValue.storages.slice(0, 1).map((s) => s._id);
  }
  break;
}
```

---

## Validacao de Campos Obrigatorios

**Funcao:** `createRequiredValidator(fieldName)`

Cria um validador que verifica obrigatoriedade para diferentes tipos de valor:

```typescript
export function createRequiredValidator(fieldName: string): RequiredValidator {
  const validate = ({ value }: { value: any }) => {
    if (value === null || value === undefined || value === '') {
      return { message: `${fieldName} e obrigatorio` };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { message: `${fieldName} e obrigatorio` };
    }
    if (typeof value === 'object' && 'storages' in value) {
      const storageValue = value as { storages: Array<IStorage> };
      if (storageValue.storages.length === 0) {
        return { message: `${fieldName} e obrigatorio` };
      }
    }
    return undefined;
  };
  return { onChange: validate };
}
```

---

## Renderizacao Dinamica de Campos

**Componente:** `RowFormFields`

Renderiza os campos do formulario dinamicamente com base no tipo de cada campo. Cada campo e envolto em um `div` com largura responsiva:

```typescript
<div
  key={field._id}
  className="min-w-[200px]"
  style={{ width: `calc(${field.widthInForm ?? 50}% - 1rem)` }}
>
```

### Mapeamento Tipo -> Componente de Formulario

| Tipo de Campo     | Componente de Formulario               |
|-------------------|----------------------------------------|
| `TEXT_SHORT`      | `TableRowTextField`                    |
| `TEXT_LONG` (Rich)| `TableRowRichTextField`                |
| `TEXT_LONG` (Plain)| `TableRowTextareaField`               |
| `DROPDOWN`        | `TableRowDropdownField`                |
| `DATE`            | `TableRowDateField`                    |
| `FILE`            | `TableRowFileField`                    |
| `RELATIONSHIP`    | `TableRowRelationshipField`            |
| `CATEGORY`        | `TableRowCategoryField`                |
| `FIELD_GROUP`     | `TableRowFieldGroupField`              |
| `USER`            | `TableRowUserField`                    |

---

## Pre-preenchimento de Categoria

Quando os parametros `categoryId` e `categorySlug` estao presentes na URL (vindos de visualizacoes como Kanban), o campo de categoria correspondente e automaticamente pre-preenchido:

```typescript
React.useEffect(() => {
  if (!categoryId || !categorySlug) return;
  if (prefillApplied) return;

  const targetField = fields.find(
    (field) =>
      field.slug === categorySlug && field.type === E_FIELD_TYPE.CATEGORY,
  );

  if (!targetField) return;

  form.setFieldValue(categorySlug, [categoryId]);
  setPrefillApplied(true);
}, [fields, categoryId, categorySlug, form, prefillApplied]);
```

---

## Tratamento de Erros na Criacao

O formulario trata multiplos cenarios de erro HTTP:

| Codigo | Causa                       | Acao                                          |
|--------|-----------------------------|-----------------------------------------------|
| `400`  | `INVALID_PARAMETERS`        | Toast "Dados invalidos"                       |
| `400`  | `INVALID_PAYLOAD_FORMAT`    | Erros inline por campo via `setFieldError`    |
| `401`  | `AUTHENTICATION_REQUIRED`   | Toast "Autenticacao necessaria"               |
| `403`  | `ACCESS_DENIED`             | Toast "Permissoes insuficientes"              |
| `403`  | `OWNER_OR_ADMIN_REQUIRED`   | Toast "Apenas dono ou administradores"        |
| `403`  | `TABLE_PRIVATE`             | Toast "Tabela privada"                        |
| `403`  | `RESTRICTED_CREATE`         | Toast "Criacao restrita"                      |
| `422`  | `UNPROCESSABLE_ENTITY`      | Toast "Dados invalidos"                       |
| `500`  | `SERVER_ERROR`              | Toast "Erro interno do servidor"              |

---

## Detalhes do Registro

**Arquivos:**
- `tables/$slug/row/$rowId/index.tsx` - Rota e carregamento
- `tables/$slug/row/$rowId/-view.tsx` - Visualizacao somente-leitura
- `tables/$slug/row/$rowId/-update-row-form.tsx` - Formulario de edicao

**Rota:** `/_private/tables/$slug/row/$rowId/`

### Modo Visualizacao

Exibe os campos do registro filtrados por `showInDetail`. Cada tipo de campo utiliza um componente renderizador especifico (cell renderer).

### Renderizadores de Celula (Cell Renderers)

| Tipo de Campo     | Componente Renderizador          | Descricao                            |
|-------------------|----------------------------------|--------------------------------------|
| `TEXT_SHORT`      | `TableRowTextShortCell`          | Texto simples                        |
| `TEXT_LONG`       | `TableRowTextLongCell`           | Texto longo ou HTML rico             |
| `DATE`            | `TableRowDateCell`               | Data formatada                       |
| `DROPDOWN`        | `TableRowDropdownCell`           | Badge(s) com cor                     |
| `FILE`            | `TableRowFileCell`               | Preview de arquivos com download     |
| `RELATIONSHIP`    | `TableRowRelationshipCell`       | Link(s) para registros relacionados  |
| `CATEGORY`        | `TableRowCategoryCell`           | Badge(s) de categoria                |
| `EVALUATION`      | `TableRowEvaluationCell`         | Estrelas de avaliacao interativas    |
| `REACTION`        | `TableRowReactionCell`           | Botoes de reacao com contagem        |
| `FIELD_GROUP`     | `TableRowFieldGroupCell`         | Tabela aninhada de campos            |
| `USER`            | `TableRowUserCell`               | Avatar e nome do usuario             |

**Tipos Nativos:**

| Tipo de Campo     | Componente Renderizador          |
|-------------------|----------------------------------|
| `IDENTIFIER`      | `TableRowTextShortCell`          |
| `CREATOR`         | `TableRowUserCell`               |
| `CREATED_AT`      | `TableRowDateCell`               |
| `TRASHED`         | `TableRowTextShortCell`          |
| `TRASHED_AT`      | `TableRowDateCell`               |

### Indicador de Lixeira

Quando o registro esta na lixeira, um alerta amarelo e exibido:

```typescript
{data.trashed && (
  <div className="rounded-md border border-amber-500 p-3 bg-amber-50">
    <p className="text-sm text-amber-700">
      Este registro esta na lixeira
    </p>
  </div>
)}
```

### Modo Edicao

O formulario de edicao reutiliza a mesma logica de `RowFormFields` da criacao, porem com os valores atuais do registro pre-carregados. A funcao `buildRowPayload` e usada para construir o payload de atualizacao.

---

## Dialogos de Lixeira (Registros)

**Arquivos:**
- `tables/$slug/row/-send-to-trash-dialog.tsx`
- `tables/$slug/row/-remove-from-trash-dialog.tsx`
- `tables/$slug/row/-delete-dialog.tsx`

### Enviar para Lixeira

Envia um registro para a lixeira via `PATCH /tables/{slug}/rows/{id}/trash`.

| Codigo | Causa                   | Mensagem                                |
|--------|-------------------------|-----------------------------------------|
| `404`  | `ROW_NOT_FOUND`         | Toast "Registro nao encontrado"         |
| `403`  | `ACCESS_DENIED`         | Toast "Permissao insuficiente"          |
| `500`  | `TRASH_ROW_ERROR`       | Toast "Erro interno"                    |

### Restaurar da Lixeira

Restaura um registro da lixeira via `PATCH /tables/{slug}/rows/{id}/restore`.

### Deletar Permanentemente

Exclui um registro permanentemente via `DELETE /tables/{slug}/rows/{id}`. Requer confirmacao do usuario.

---

## Operacoes em Massa (Bulk)

A visualizacao de lista (`TableListView`) suporta operacoes em massa via selecao com checkbox:

### Envio em Massa para Lixeira

```typescript
const bulkTrash = useMutation({
  mutationFn: async function (ids: Array<string>) {
    const route = '/tables/'.concat(slug).concat('/rows/bulk-trash');
    const response = await API.patch<{ modified: number }>(route, { ids });
    return response.data;
  },
});
```

### Restauracao em Massa

```typescript
const bulkRestore = useMutation({
  mutationFn: async function (ids: Array<string>) {
    const route = '/tables/'.concat(slug).concat('/rows/bulk-restore');
    const response = await API.patch<{ modified: number }>(route, { ids });
    return response.data;
  },
});
```

### Barra de Selecao

Quando ha registros selecionados, uma barra flutuante aparece na parte inferior com:

- Contagem de registros selecionados
- Botao "Enviar para lixeira" (modo normal) ou "Restaurar" (modo lixeira)
- Botao para limpar selecao

```typescript
{selectedCount > 0 && (
  <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
    <span className="text-sm font-medium">
      {selectedCount === 1
        ? '1 registro selecionado'
        : `${selectedCount} registros selecionados`}
    </span>
    {isTrashView ? (
      <Button variant="outline" size="sm" onClick={() => setShowConfirmDialog(true)}>
        <ArchiveRestoreIcon className="size-4" />
        <span>Restaurar</span>
      </Button>
    ) : (
      <Button variant="destructive" size="sm" onClick={() => setShowConfirmDialog(true)}>
        <Trash2Icon className="size-4" />
        <span>Enviar para lixeira</span>
      </Button>
    )}
  </div>
)}
```

---

## Fluxo Completo de Criacao

1. Usuario clica em "+Registro" na barra de ferramentas
2. Sidebar fecha e rota navega para `/tables/$slug/row/create`
3. `UploadingProvider` envolve o formulario para rastrear uploads em andamento
4. `buildDefaultValues` gera valores iniciais baseados nos tipos de campo
5. Se houver `categoryId`/`categorySlug` nos search params, campo e pre-preenchido
6. Usuario preenche os campos do formulario
7. Ao submeter, `buildPayload` converte valores para formato da API
8. `useCreateTableRow` envia a requisicao POST
9. Em caso de sucesso: toast verde, formulario resetado, sidebar fecha, navega de volta para a tabela
10. Em caso de erro: tratamento especifico por codigo/causa HTTP
