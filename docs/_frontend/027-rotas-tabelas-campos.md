# Rotas de Tabelas (Campos)

Este documento detalha as rotas de gerenciamento de campos das tabelas, incluindo criacao, edicao, organizacao e os 11 tipos de campo suportados.

**Diretorio base:** `frontend/src/routes/_private/tables/$slug/field/`

---

## Gerenciamento de Campos

**Arquivo:** `tables/$slug/field/management.tsx` e `-field-order-form.tsx`
**Rota:** `/_private/tables/$slug/field/management`

Pagina de gerenciamento com 5 abas para controlar a visibilidade e ordem dos campos. Requer permissao `UPDATE_FIELD`.

### Search Params

| Parametro | Tipo     | Descricao                                         |
|-----------|----------|----------------------------------------------------|
| `group`   | `string` | Slug do grupo de campos (contexto de grupo)        |

### Abas de Gerenciamento

| Aba            | Valor          | `visibilityKey`  | Descricao                              |
|----------------|----------------|------------------|-----------------------------------------|
| **Lista**      | `display`      | `showInList`     | Campos visiveis na listagem             |
| **Filtros**    | `filter`       | `showInFilter`   | Campos usados como filtro               |
| **Formularios**| `form`         | `showInForm`     | Campos visiveis no formulario           |
| **Detalhes**   | `detail`       | `showInDetail`   | Campos visiveis na pagina de detalhes   |
| **Lixeira**    | `trashed`      | -                | Campos na lixeira                       |

```typescript
<Tabs defaultValue="display" className="w-full max-w-6xl mx-auto">
  <TabsList className="grid w-full grid-cols-5 mb-4">
    <TabsTrigger value="display">Lista</TabsTrigger>
    <TabsTrigger value="filter">Filtros</TabsTrigger>
    <TabsTrigger value="form">Formularios</TabsTrigger>
    <TabsTrigger value="detail">Detalhes</TabsTrigger>
    <TabsTrigger value="trashed" disabled={trashedCount === 0}>
      Lixeira{trashedCount > 0 && ` (${trashedCount})`}
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Componente FieldManagementList

Cada aba (exceto Lixeira) renderiza o componente `FieldManagementList` com as seguintes props:

| Prop             | Tipo                  | Descricao                                 |
|------------------|-----------------------|-------------------------------------------|
| `table`          | `ITable`              | Dados completos da tabela                 |
| `visibilityKey`  | `string`              | Chave de visibilidade a controlar         |
| `groupSlug`      | `string \| undefined` | Slug do grupo (contexto de grupo)         |
| `groupFields`    | `IField[] \| undefined`| Campos do grupo (quando em contexto)     |
| `excludeNative`  | `boolean`             | Excluir campos nativos (filtros/forms)    |

As abas de Filtros e Formularios utilizam `excludeNative` para ocultar campos nativos como `_id`, `creator`, `createdAt`.

### Contexto de Grupo

Quando o parametro `group` esta presente na URL, a pagina opera em contexto de grupo de campos:

```typescript
const isGroupContext = !!groupSlug;
const targetGroup = isGroupContext
  ? (table.data?.groups ?? []).find((g) => g.slug === groupSlug)
  : null;
```

O titulo muda para "Gerenciar campos do grupo" e os campos exibidos sao filtrados pelo grupo especificado.

---

## Criacao de Campo

**Arquivo:** `tables/$slug/field/create/index.tsx` e `-create-form.tsx`
**Rota:** `/_private/tables/$slug/field/create`

### Search Params

| Parametro     | Tipo     | Descricao                                    |
|---------------|----------|----------------------------------------------|
| `group`       | `string` | Slug do grupo (criacao dentro de grupo)      |
| `field-type`  | `string` | Tipo de campo pre-definido (ex: FIELD_GROUP) |

### Schema de Validacao

```typescript
export const FieldCreateSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(40),
  type: z.string().min(1, 'Tipo e obrigatorio'),
  format: z.string().default(''),
  defaultValue: z.string().default(''),
  dropdown: z.array(z.custom<DropdownOption>()).default([]),
  relationship: z.object({
    tableId: z.string().default(''),
    tableSlug: z.string().default(''),
    fieldId: z.string().default(''),
    fieldSlug: z.string().default(''),
    order: z.string().default(''),
  }),
  category: z.array(z.custom<TreeNode>()).default([]),
  multiple: z.boolean().default(false),
  showInFilter: z.boolean().default(true),
  showInForm: z.boolean().default(true),
  showInDetail: z.boolean().default(true),
  showInList: z.boolean().default(true),
  required: z.boolean().default(false),
  widthInForm: z.number().default(50),
  widthInList: z.number().default(10),
});
```

### Renderizacao Condicional por Tipo

O formulario exibe campos diferentes de acordo com o tipo selecionado:

| Tipo de Campo     | Campos Condicionais Exibidos                                          |
|-------------------|-----------------------------------------------------------------------|
| `TEXT_SHORT`      | Formato (format), Valor padrao (defaultValue)                         |
| `TEXT_LONG`       | Formato (format), Valor padrao (editor rico ou textarea)              |
| `DROPDOWN`        | Opcoes do dropdown (dropdown)                                         |
| `DATE`            | Formato da data (format)                                              |
| `RELATIONSHIP`    | Tabela de relacionamento, Campo, Ordem                                |
| `CATEGORY`        | Estrutura de categoria (arvore)                                       |
| `FILE`            | Multiplos                                                             |
| `FIELD_GROUP`     | Multiplos                                                             |
| `USER`            | Multiplos                                                             |
| `REACTION`        | Nenhum campo adicional                                                |
| `EVALUATION`      | Nenhum campo adicional                                                |

### Tipos Bloqueados em Contexto de Grupo

Quando criando campos dentro de um grupo, os seguintes tipos sao bloqueados:

```typescript
const blockedTypes = [
  E_FIELD_TYPE.FIELD_GROUP,
  E_FIELD_TYPE.REACTION,
  E_FIELD_TYPE.EVALUATION,
];
```

### Opcao Multiplos

O switch "Permitir multiplos" aparece para os tipos:

- `DROPDOWN`
- `FILE`
- `RELATIONSHIP`
- `FIELD_GROUP`
- `CATEGORY`
- `USER`

### Obrigatoriedade

O switch "Obrigatoriedade" aparece para todos os tipos exceto:

- `REACTION`
- `EVALUATION`

---

## Detalhes do Campo

**Arquivo:** `tables/$slug/field/$fieldId/index.tsx`, `-view.tsx` e `-update-form.tsx`
**Rota:** `/_private/tables/$slug/field/$fieldId`

Pagina de detalhes do campo com alternancia entre modos **show** e **edit**. Requer permissao `UPDATE_FIELD` para edicao.

### Search Params

| Parametro | Tipo     | Descricao                                    |
|-----------|----------|----------------------------------------------|
| `group`   | `string` | Slug do grupo (contexto de grupo)            |

### Modo Visualizacao

Exibe informacoes do campo em modo somente-leitura, incluindo nome, tipo, formato, opcoes do dropdown, configuracao de relacionamento e flags de visibilidade.

### Modo Edicao

Permite editar as mesmas propriedades da criacao, porem o tipo do campo e fixo (nao pode ser alterado apos criacao). A rota tambem permite enviar o campo para a lixeira atraves de um dialog de confirmacao.

---

## Tipos de Campo

### Visao Geral

O sistema suporta 11 tipos de campo configuravel e 5 tipos nativos:

| Tipo             | Constante        | Editavel | Descricao                              |
|------------------|------------------|----------|----------------------------------------|
| `TEXT_SHORT`     | Texto Curto      | Sim      | Texto de uma linha com formatos        |
| `TEXT_LONG`      | Texto Longo      | Sim      | Texto multiplas linhas ou rich text     |
| `DROPDOWN`       | Dropdown         | Sim      | Lista de opcoes com label e cor        |
| `DATE`           | Data             | Sim      | Data com formato configuravel          |
| `FILE`           | Arquivo          | Sim      | Upload de arquivos                     |
| `RELATIONSHIP`   | Relacionamento   | Sim      | Referencia a outra tabela              |
| `FIELD_GROUP`    | Grupo de Campos  | Sim      | Agrupamento de campos                  |
| `CATEGORY`       | Categoria        | Sim      | Estrutura hierarquica em arvore        |
| `REACTION`       | Reacao           | Nao      | Reacoes de usuarios (emoji)            |
| `EVALUATION`     | Avaliacao        | Nao      | Avaliacoes com nota                    |
| `USER`           | Usuario          | Sim      | Referencia a usuarios do sistema       |

**Tipos Nativos (nao editaveis):**

| Tipo          | Constante    | Descricao                          |
|---------------|-------------|------------------------------------|
| `IDENTIFIER`  | Identificador| ID interno do registro             |
| `CREATOR`     | Criador      | Usuario que criou o registro       |
| `CREATED_AT`  | Criado Em    | Data de criacao                    |
| `TRASHED`     | Lixeira      | Flag de lixeira                    |
| `TRASHED_AT`  | Excluido Em  | Data de exclusao                   |

---

### Configuracao: TEXT_SHORT

Formatos disponiveis para texto curto:

| Formato          | Constante        | Descricao                  |
|------------------|------------------|-----------------------------|
| `ALPHA_NUMERIC`  | Alfanumerico     | Texto livre                 |
| `INTEGER`        | Inteiro          | Numeros inteiros            |
| `DECIMAL`        | Decimal          | Numeros decimais            |
| `URL`            | URL              | Enderecos web               |
| `EMAIL`          | E-mail           | Enderecos de email          |

---

### Configuracao: TEXT_LONG

Formatos disponiveis para texto longo:

| Formato      | Constante    | Editor no Formulario             |
|--------------|-------------|----------------------------------|
| `RICH_TEXT`  | Texto Rico  | `FieldEditor` (editor WYSIWYG)   |
| `PLAIN_TEXT` | Texto Plano | `FieldTextarea` (textarea simples)|

Quando o formato e `RICH_TEXT`, o valor padrao e editado com um editor rich text. Para `PLAIN_TEXT`, utiliza uma textarea simples.

---

### Configuracao: DROPDOWN

```typescript
interface DropdownOption {
  id: string;
  label: string;
  color: string | null;
}
```

Cada opcao possui um ID unico, label exibido ao usuario e cor opcional. O componente `TableFieldDropdownOptions` permite adicionar, remover e reordenar opcoes.

---

### Configuracao: DATE

Formatos de data disponiveis:

| Formato                        | Exemplo                  |
|--------------------------------|--------------------------|
| `dd/MM/yyyy`                   | 16/02/2026               |
| `MM/dd/yyyy`                   | 02/16/2026               |
| `yyyy/MM/dd`                   | 2026/02/16               |
| `dd/MM/yyyy HH:mm:ss`         | 16/02/2026 14:30:00      |
| `MM/dd/yyyy HH:mm:ss`         | 02/16/2026 14:30:00      |
| `yyyy/MM/dd HH:mm:ss`         | 2026/02/16 14:30:00      |
| `dd-MM-yyyy`                   | 16-02-2026               |
| `MM-dd-yyyy`                   | 02-16-2026               |
| `yyyy-MM-dd`                   | 2026-02-16               |
| `dd-MM-yyyy HH:mm:ss`         | 16-02-2026 14:30:00      |
| `MM-dd-yyyy HH:mm:ss`         | 02-16-2026 14:30:00      |
| `yyyy-MM-dd HH:mm:ss`         | 2026-02-16 14:30:00      |

---

### Configuracao: RELATIONSHIP

A configuracao de relacionamento envolve 3 campos em cascata:

1. **Tabela de relacionamento** (`relationship.tableId`) - Selecao da tabela destino (excluindo a tabela atual)
2. **Campo de relacionamento** (`relationship.fieldId`) - Selecao do campo da tabela destino a exibir
3. **Ordem** (`relationship.order`) - Ordem de exibicao dos registros relacionados

```typescript
relationship: z.object({
  tableId: z.string().default(''),
  tableSlug: z.string().default(''),
  fieldId: z.string().default(''),
  fieldSlug: z.string().default(''),
  order: z.string().default(''),
}),
```

Ao trocar a tabela, os campos de relacionamento e slug sao resetados:

```typescript
onTableChange={(slug) => {
  form.setFieldValue('relationship.tableSlug', slug);
  form.setFieldValue('relationship.fieldId', '');
  form.setFieldValue('relationship.fieldSlug', '');
}}
```

---

### Configuracao: CATEGORY

Utiliza uma estrutura de arvore (`TreeNode`) para definir a hierarquia de categorias. O componente `TableFieldCategoryTree` permite criar e organizar nos hierarquicos.

```typescript
category: z.array(z.custom<TreeNode>()).default([]),
```

---

### Propriedades de Visibilidade

Cada campo possui 4 flags de visibilidade configuradas durante a criacao e editaveis no gerenciamento:

| Flag           | Padrao | Descricao                                |
|----------------|--------|------------------------------------------|
| `showInList`   | `true` | Exibir na visualizacao de lista          |
| `showInFilter` | `true` | Usar como filtro                         |
| `showInForm`   | `true` | Exibir no formulario de criacao/edicao   |
| `showInDetail` | `true` | Exibir na pagina de detalhes             |

---

### Propriedades de Layout

| Propriedade    | Padrao | Descricao                                |
|----------------|--------|------------------------------------------|
| `widthInForm`  | `50`   | Largura no formulario (percentual)       |
| `widthInList`  | `10`   | Largura na listagem (pixels)             |

A largura no formulario e aplicada via CSS inline:

```typescript
style={{ width: `calc(${field.widthInForm ?? 50}% - 1rem)` }}
```
