# Rotas de Tabelas (Base)

Este documento detalha as rotas base do modulo de tabelas, incluindo listagem, criacao, clonagem, detalhes, metodos e configuracoes.

**Diretorio base:** `frontend/src/routes/_private/tables/`

---

## Listagem de Tabelas

**Arquivo:** `tables/index.tsx`
**Rota:** `/_private/tables/`

A pagina principal exibe uma listagem paginada de todas as tabelas do sistema. Utiliza o hook `useTablesReadPaginated` para busca de dados e renderiza os resultados no componente `TableOfTables`.

### Search Params

| Parametro | Tipo     | Padrao | Descricao                    |
|-----------|----------|--------|------------------------------|
| `page`    | `number` | `1`    | Pagina atual                 |
| `perPage` | `number` | `50`   | Registros por pagina         |
| `name`    | `string` | -      | Filtro por nome              |
| `trashed` | `boolean`| -      | Exibir tabelas na lixeira    |
| `search`  | `string` | -      | Busca geral                  |

### Cabecalhos da Tabela

A listagem exibe as seguintes colunas: **Tabela**, **Link (slug)**, **Visibilidade** e **Criado em**.

### Componentes Integrados

- `SheetFilter` - Filtros laterais avancados
- `TrashButton` - Alterna visualizacao da lixeira
- `Pagination` - Navegacao entre paginas
- `TableOfTables` - Componente de listagem com badges de visibilidade

---

## Pagina de Nova Tabela

**Arquivo:** `tables/new/index.tsx`
**Rota:** `/_private/tables/new/`

Pagina intermediaria que oferece duas opcoes ao usuario:

1. **Usar um Modelo** - Navega para `/tables/clone`
2. **Criar nova Tabela** - Navega para `/tables/create`

Requer permissao `CREATE_TABLE`. Caso o usuario nao tenha permissao, exibe o componente `AccessDenied`.

---

## Criacao de Tabela

**Arquivo:** `tables/create/index.tsx` e `tables/create/-create-form.tsx`
**Rota:** `/_private/tables/create/`

### Schema de Validacao

```typescript
export const TableCreateSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(40),
  logo: z.string().nullable().default(null),
  style: z.enum(['LIST', 'GALLERY', 'DOCUMENT']),
  visibility: z.enum(['PUBLIC', 'RESTRICTED', 'OPEN', 'FORM', 'PRIVATE']),
});
```

### Campos do Formulario

| Campo        | Componente                  | Descricao                                     |
|--------------|-----------------------------|-----------------------------------------------|
| `logoFile`   | `FieldFileUpload`           | Upload de logo da tabela                      |
| `name`       | `FieldText`                 | Nome da tabela (1-40 caracteres)              |
| `style`      | `TableStyleSelectField`     | Estilo visual (LIST, GALLERY ou DOCUMENT)     |
| `visibility` | `TableVisibilitySelectField`| Visibilidade da tabela                        |

### Tratamento de Erros

| Codigo | Causa                      | Acao                                      |
|--------|----------------------------|-------------------------------------------|
| `409`  | `TABLE_EXISTS`             | Erro no campo nome                        |
| `400`  | `INVALID_PAYLOAD_FORMAT`   | Erro por campo (campo a campo)            |
| `500`  | `CREATE_TABLE_ERROR`       | Toast de erro generico                    |

### Fluxo Apos Sucesso

Apos criacao bem-sucedida, o formulario e resetado e o usuario e redirecionado para `/tables` com paginacao padrao.

---

## Clonagem de Tabela

**Arquivo:** `tables/clone/index.tsx` e `tables/clone/-clone-form.tsx`
**Rota:** `/_private/tables/clone/`

Permite criar uma nova tabela a partir de um modelo existente. Os modelos disponiveis sao definidos pela configuracao `MODEL_CLONE_TABLES` obtida via `useSettingRead()`.

### Schema de Validacao

```typescript
export const CloneTableBodySchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(40),
  MODEL_CLONE_TABLES: z.string().min(1, 'Modelo e obrigatorio'),
});
```

### Campos do Formulario

| Campo                | Componente                 | Descricao                              |
|----------------------|----------------------------|----------------------------------------|
| `MODEL_CLONE_TABLES` | `FieldSelectModelClone`    | Selecao do modelo base                |
| `name`               | `FieldText`                | Nome da nova tabela                    |

Quando nao ha modelos disponiveis, um componente `Alert` informa o usuario.

---

## Detalhes da Tabela

**Arquivo:** `tables/$slug/detail/index.tsx`, `-view.tsx` e `-update-form.tsx`
**Rota:** `/_private/tables/$slug/detail/`

Pagina de detalhes com alternancia entre modos **show** e **edit**. Requer permissao `UPDATE_TABLE` para edicao.

### Campos Disponiveis na Edicao

| Campo             | Componente                    | Descricao                                   |
|-------------------|-------------------------------|---------------------------------------------|
| `logoFile`        | `FieldFileUpload`             | Upload de novo logo                         |
| `name`            | `FieldText`                   | Nome da tabela                              |
| `description`     | `FieldTextarea`               | Descricao da tabela                         |
| `style`           | `TableStyleSelectField`       | Estilo visual (7 opcoes disponiveis)        |
| `visibility`      | `TableVisibilitySelectField`  | Visibilidade                                |
| `collaboration`   | `TableCollaborationSelect`    | Tipo de colaboracao (OPEN/RESTRICTED)       |
| `administrators`  | `FieldUserMultiSelect`        | Administradores da tabela                   |

Na edicao, o campo `style` permite todos os 7 estilos (`LIST`, `GALLERY`, `DOCUMENT`, `CARD`, `MOSAIC`, `KANBAN`, `FORUM`), diferente da criacao que permite apenas 3. Os estilos disponiveis sao determinados pela funcao `getAllowedTableStyles(tableData)`.

---

## Metodos da Tabela

**Arquivo:** `tables/$slug/methods.tsx` e `-methods-form.tsx`
**Rota:** `/_private/tables/$slug/methods/`

Permite configurar scripts JavaScript que sao executados em diferentes momentos do ciclo de vida de um registro. Utiliza o editor Monaco (`FieldCodeEditor`).

### Tabs de Metodos

| Tab               | Campo        | Descricao                                        |
|-------------------|--------------|--------------------------------------------------|
| **Ao Carregar**   | `onLoad`     | Executado quando o formulario e carregado         |
| **Antes de Salvar**| `beforeSave` | Executado antes de salvar o registro              |
| **Apos Salvar**   | `afterSave`  | Executado apos salvar o registro                  |

### Validacao IIFE

Todos os metodos devem estar no formato IIFE (Immediately Invoked Function Expression):

```typescript
function isValidIIFE(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return true; // vazio e valido
  return trimmed.startsWith('(async') && trimmed.endsWith('})();');
}
```

Exemplo de codigo valido:

```javascript
(async () => {
  // logica do metodo aqui
})();
```

### Schema de Validacao

```typescript
export const TableMethodsSchema = z.object({
  onLoad: iifeValidation.default(''),
  beforeSave: iifeValidation.default(''),
  afterSave: iifeValidation.default(''),
});
```

---

## Dropdown de Configuracao

**Arquivo:** `tables/$slug/-table-configuration.tsx`

Menu dropdown acessivel pela barra de ferramentas da tabela. Exibido apenas para usuarios com permissao de `CREATE_FIELD`, `UPDATE_FIELD` ou `UPDATE_TABLE`.

### Secoes do Menu

**Campos:**
- **Novo campo** - Navega para `/tables/$slug/field/create` (requer `CREATE_FIELD`)
- **Gerenciar campos** - Submenu com acesso a `/tables/$slug/field/management` e edicao individual de cada campo (requer `UPDATE_FIELD`)

**Grupo de campos** (apenas para tabelas do tipo `TABLE`):
- **Novo grupo** - Navega para criacao de campo com `field-type=FIELD_GROUP`
- **Gerenciar [nome do grupo]** - Submenu (`FieldGroupSubMenu`) com opcoes de novo campo no grupo, gerenciar campos do grupo e editar campos individuais do grupo

**Geral** (requer `UPDATE_TABLE`):
- **Editar tabela** - Navega para `/tables/$slug/detail`
- **Metodos** - Navega para `/tables/$slug/methods`
- **Informacoes da API** - Abre modal `ApiEndpointsModal`
- **Gerar codigo embed** - Copia iframe para clipboard

---

## Modal de API Endpoints

**Arquivo:** `tables/$slug/-api-endpoints-modal.tsx`

Modal que exibe os endpoints REST disponiveis para integracao com a tabela.

### Endpoints Disponiveis

| Metodo   | Caminho                                   | Descricao                        |
|----------|-------------------------------------------|----------------------------------|
| `GET`    | `/tables/{slug}`                          | Obter informacoes da tabela      |
| `GET`    | `/tables/{slug}/rows/paginated`           | Listar rows com paginacao        |
| `GET`    | `/tables/{slug}/rows/:id`                 | Obter row especifico por ID      |
| `POST`   | `/tables/{slug}/rows`                     | Criar novo row                   |
| `PUT`    | `/tables/{slug}/rows/:id`                 | Atualizar row existente          |
| `DELETE` | `/tables/{slug}/rows/:id`                 | Deletar row permanentemente      |
| `PATCH`  | `/tables/{slug}/rows/:id/trash`           | Enviar row para lixeira          |
| `PATCH`  | `/tables/{slug}/rows/:id/restore`         | Restaurar row da lixeira         |

Cada endpoint possui badge colorido por metodo HTTP e botao para copiar a URL completa.

### Cores por Metodo

```typescript
const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET':    return 'bg-green-100 text-green-800 ...';
    case 'POST':   return 'bg-blue-100 text-blue-800 ...';
    case 'PUT':    return 'bg-orange-100 text-orange-800 ...';
    case 'PATCH':  return 'bg-yellow-100 text-yellow-800 ...';
    case 'DELETE': return 'bg-red-100 text-red-800 ...';
  }
};
```

---

## Dialogos de Lixeira (Tabelas)

**Arquivos:**
- `tables/-send-to-trash-dialog.tsx`
- `tables/-remove-from-trash-dialog.tsx`
- `tables/-delete-dialog.tsx`

### Enviar para Lixeira

Dialog de confirmacao para mover tabela para a lixeira. Trata os seguintes erros:

| Codigo | Causa              | Mensagem                                    |
|--------|--------------------|---------------------------------------------|
| `404`  | `TABLE_NOT_FOUND`  | Toast de tabela nao encontrada              |
| `403`  | `ACCESS_DENIED`    | Toast de permissao insuficiente             |
| `500`  | `TRASH_TABLE_ERROR`| Toast de erro interno                       |

### Restaurar da Lixeira

Dialog para restaurar tabela da lixeira. Trata erros similares com causas `TABLE_NOT_FOUND`, `ACCESS_DENIED` e `RESTORE_TABLE_ERROR`.

### Deletar Permanentemente

Dialog para exclusao permanente da tabela. Requer confirmacao do usuario. Trata erros com causas `TABLE_NOT_FOUND`, `ACCESS_DENIED` e `DELETE_TABLE_ERROR`.

---

## Componente de Listagem de Tabelas

**Arquivo:** `tables/-table-tables.tsx`

Componente `TableOfTables` que renderiza a listagem de tabelas com:

- Colunas: Nome (com logo), Slug, Visibilidade (badge colorido), Data de criacao
- Acoes: Enviar para lixeira, Restaurar, Deletar permanentemente
- Badge de visibilidade com cores diferenciadas por tipo
- Navegacao para detalhes ao clicar em uma linha

---

## Pagina Principal da Tabela (Orquestrador)

**Arquivo:** `tables/$slug/index.tsx`
**Rota:** `/_private/tables/$slug/`

Ponto de entrada que orquestra o carregamento e exibicao dos dados de uma tabela. Seleciona o componente de visualizacao correto com base no `style` da tabela.

### Search Params

```typescript
validateSearch: z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  trashed: z.coerce.boolean().optional(),
}).catchall(
  z.union([z.enum(['asc', 'desc']).optional(), z.string().optional()])
)
```

O `catchall` permite parametros dinamicos para ordenacao de campos (ex: `order-nome=asc`).

### Desabilitacao de Paginacao

Para os estilos `KANBAN`, `DOCUMENT` e `FORUM`, a paginacao e desabilitada e o `perPage` e fixado em 100:

```typescript
const shouldDisablePagination =
  tableStyle === E_TABLE_STYLE.KANBAN ||
  tableStyle === E_TABLE_STYLE.DOCUMENT ||
  tableStyle === E_TABLE_STYLE.FORUM;
```

### Mapeamento de Views

| Estilo     | Componente           | Skeleton                      |
|------------|----------------------|-------------------------------|
| `LIST`     | `TableListView`      | `TableListViewSkeleton`       |
| `GALLERY`  | `TableGridView`      | `TableGridViewSkeleton`       |
| `DOCUMENT` | `TableDocumentView`  | `TableDocumentViewSkeleton`   |
| `CARD`     | `TableCardView`      | `TableCardViewSkeleton`       |
| `MOSAIC`   | `TableMosaicView`    | `TableMosaicViewSkeleton`     |
| `KANBAN`   | `TableKanbanView`    | `TableKanbanViewSkeleton`     |
| `FORUM`    | `TableForumView`     | `TableForumViewSkeleton`      |

### Barra de Ferramentas

A barra superior contem:

- Botao de voltar (para usuarios autenticados)
- Nome da tabela
- Botao de compartilhar (copia URL)
- `SheetFilter` com campos filtrados por `showInFilter`
- `TrashButton`
- `TableStyleViewDropdown` para troca rapida de estilo
- `TableConfigurationDropdown`
- Botao "+Registro" (requer `CREATE_ROW` e campos nao-nativos)

### Tratamento de Erros de Permissao

```typescript
if (cause === 'TABLE_PRIVATE') {
  // "Esta tabela e privada"
} else if (cause === 'FORM_VIEW_RESTRICTED') {
  // "Apenas o dono pode visualizar tabelas de formulario"
} else {
  // "Voce nao tem permissao para acessar esta tabela"
}
```

Erros de permissao (status 403) exibem componente `Empty` sem botao de refetch. Outros erros exibem `LoadError` com opcao de tentar novamente.
