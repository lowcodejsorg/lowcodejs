# Resource: Table Fields

## Visao Geral

O resource de campos de tabela (`table-fields`) gerencia os campos (colunas) das tabelas dinamicas do LowCodeJS. Cada campo define o tipo de dado, formato, opcoes de visualizacao e configuracoes especificas. Todas as operacoes utilizam o slug da tabela como parametro de rota e requerem `AuthenticationMiddleware` e `TableAccessMiddleware`.

**Diretorio**: `backend/application/resources/table-fields/`

**Prefixo de rota**: `tables` (definido em `@Controller({ route: 'tables' })`)

Todas as rotas sao sub-rotas de uma tabela: `/tables/:slug/fields/...`

## Endpoints

| Metodo | Rota | Auth | Permissao | Descricao |
|--------|------|------|-----------|-----------|
| GET | `/tables/:slug/fields/:_id` | Sim | `VIEW_FIELD` | Detalhes de um campo |
| POST | `/tables/:slug/fields` | Sim | `CREATE_FIELD` | Criar campo na tabela |
| PUT | `/tables/:slug/fields/:_id` | Sim | `UPDATE_FIELD` | Atualizar campo |
| PATCH | `/tables/:slug/fields/:_id/trash` | Sim | `UPDATE_FIELD` | Enviar campo para lixeira |
| PATCH | `/tables/:slug/fields/:_id/restore` | Sim | `UPDATE_FIELD` | Restaurar campo da lixeira |
| POST | `/tables/:slug/fields/:_id/category` | Sim | `UPDATE_FIELD` | Adicionar/atualizar categorias do campo |

---

## POST /tables/:slug/fields

Cria um novo campo na tabela especificada. Atualiza automaticamente o `_schema` dinamico da tabela.

### Estrutura de Arquivos

```
table-fields/create/
  create.controller.ts
  create.validator.ts
  create.use-case.ts
  create.schema.ts
```

### Controller

```typescript
@Controller({ route: 'tables' })
export default class {
  @POST({
    url: '/:slug/fields',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        TableAccessMiddleware({ requiredPermission: 'CREATE_FIELD' }),
      ],
      schema: TableFieldCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableFieldCreateBodyValidator.parse(request.body);
    const params = TableFieldCreateParamsValidator.parse(request.params);
    const result = await this.useCase.execute({ ...payload, ...params });
    // ...
    return response.status(201).send(result.value);
  }
}
```

### Validator (Zod)

```typescript
export const TableFieldCreateBodyValidator = z
  .object({
    name: z.string().trim(),
    type: z.enum(E_FIELD_TYPE),
  })
  .merge(TableFieldBaseSchema);

export const TableFieldCreateParamsValidator = z.object({
  slug: z.string().trim(), // slug da tabela
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Default | Descricao |
|-------|------|-------------|---------|-----------|
| `name` | string | Sim | - | Nome do campo |
| `type` | E_FIELD_TYPE | Sim | - | Tipo do campo |
| `required` | boolean | Nao | `false` | Se o campo e obrigatorio |
| `multiple` | boolean | Nao | `false` | Se aceita multiplos valores |
| `format` | E_FIELD_FORMAT \| null | Nao | `null` | Formato do campo |
| `showInFilter` | boolean | Nao | `false` | Exibir no filtro |
| `showInForm` | boolean | Nao | `false` | Exibir no formulario |
| `showInDetail` | boolean | Nao | `false` | Exibir no detalhe |
| `showInList` | boolean | Nao | `false` | Exibir na lista |
| `widthInForm` | number \| null | Nao | `50` | Largura no formulario (0-100%) |
| `widthInList` | number \| null | Nao | `10` | Largura na lista (0-100%) |
| `locked` | boolean | Nao | `false` | Se o campo esta bloqueado |
| `defaultValue` | string \| null | Nao | `null` | Valor padrao |
| `relationship` | Relationship \| null | Nao | `null` | Configuracao de relacionamento |
| `dropdown` | Dropdown[] | Nao | `[]` | Opcoes de dropdown |
| `category` | Category[] | Nao | `[]` | Categorias |
| `group` | string \| GroupObj \| null | Nao | `null` | Slug do grupo ou objeto do grupo |

### Fluxo do Use Case

1. Busca a tabela pelo `slug`
2. Se nao encontrar, retorna `Left(HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'))`
3. **Se um grupo foi especificado**: delega para `addFieldToGroup()` (ver abaixo)
4. Gera o `slug` do campo a partir do nome com `slugify`
5. Verifica se ja existe um campo com o mesmo slug na tabela
6. Cria o campo via `fieldRepository.create()`
7. **Se o tipo for `FIELD_GROUP`**: cria uma nova configuracao de grupo na tabela
8. Reconstroi o `_schema` da tabela com `buildSchema(fields, groups)`
9. Atualiza a tabela com os novos campos e schema
10. Executa `buildTable()` para atualizar o modelo Mongoose dinamico
11. Retorna `Right(field)` com status 201

### Logica de Adicao a Grupo

Quando o campo especifica um `group` (slug de um grupo existente):

1. Verifica se o grupo existe na tabela
2. Gera o slug do campo
3. Verifica se ja existe um campo com o mesmo slug dentro do grupo
4. Cria o campo
5. Atualiza o grupo com o novo campo e reconstroi o `_schema` do grupo
6. Reconstroi o `_schema` da tabela pai
7. Atualiza a tabela e executa `buildTable()`

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 201 | - | Campo criado com sucesso |
| 403 | - | Sem permissao `CREATE_FIELD` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 404 | `GROUP_NOT_FOUND` | Grupo nao encontrado (quando informado) |
| 409 | `FIELD_ALREADY_EXIST` | Campo com o mesmo slug ja existe |
| 500 | `CREATE_FIELD_ERROR` | Erro interno do servidor |

---

## GET /tables/:slug/fields/:_id

Retorna os detalhes de um campo especifico.

### Estrutura de Arquivos

```
table-fields/show/
  show.controller.ts
  show.validator.ts
  show.use-case.ts
  show.schema.ts
```

### Controller

```typescript
@GET({
  url: '/:slug/fields/:_id',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'VIEW_FIELD' }),
    ],
    schema: TableFieldShowSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Dados do campo |
| 403 | - | Sem permissao `VIEW_FIELD` |
| 404 | `FIELD_NOT_FOUND` | Campo nao encontrado |
| 500 | `SHOW_FIELD_ERROR` | Erro interno do servidor |

---

## PUT /tables/:slug/fields/:_id

Atualiza um campo existente.

### Estrutura de Arquivos

```
table-fields/update/
  update.controller.ts
  update.validator.ts
  update.use-case.ts
  update.schema.ts
```

### Validator (Zod)

```typescript
export const TableFieldUpdateBodyValidator = z
  .object({
    name: z.string().trim(),
    type: z.enum(E_FIELD_TYPE),
    trashed: z.boolean().default(false),
    trashedAt: z.string().nullable().default(null).transform((value) => {
      return value ? new Date(value) : null;
    }),
  })
  .merge(TableFieldBaseSchema);

export const TableFieldUpdateParamsValidator = z.object({
  slug: z.string().trim(),  // slug da tabela
  _id: z.string().trim(),   // ID do campo
});
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Campo atualizado com sucesso |
| 403 | - | Sem permissao `UPDATE_FIELD` |
| 404 | `FIELD_NOT_FOUND` | Campo nao encontrado |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `UPDATE_FIELD_ERROR` | Erro interno do servidor |

---

## PATCH /tables/:slug/fields/:_id/trash

Envia um campo para a lixeira (soft delete).

### Estrutura de Arquivos

```
table-fields/send-to-trash/
  send-to-trash.controller.ts
  send-to-trash.validator.ts
  send-to-trash.use-case.ts
  send-to-trash.schema.ts
```

### Controller

```typescript
@PATCH({
  url: '/:slug/fields/:_id/trash',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'UPDATE_FIELD' }),
    ],
    schema: TableFieldSendToTrashSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Campo enviado para a lixeira |
| 403 | - | Sem permissao `UPDATE_FIELD` |
| 404 | `FIELD_NOT_FOUND` | Campo nao encontrado |
| 500 | `SEND_TO_TRASH_ERROR` | Erro interno do servidor |

---

## PATCH /tables/:slug/fields/:_id/restore

Restaura um campo da lixeira.

### Estrutura de Arquivos

```
table-fields/remove-from-trash/
  remove-from-trash.controller.ts
  remove-from-trash.validator.ts
  remove-from-trash.use-case.ts
  remove-from-trash.schema.ts
```

### Controller

```typescript
@PATCH({
  url: '/:slug/fields/:_id/restore',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'UPDATE_FIELD' }),
    ],
    schema: TableFieldRemoveFromTrashSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Campo restaurado da lixeira |
| 403 | - | Sem permissao `UPDATE_FIELD` |
| 404 | `FIELD_NOT_FOUND` | Campo nao encontrado |
| 500 | `REMOVE_FROM_TRASH_ERROR` | Erro interno do servidor |

---

## POST /tables/:slug/fields/:_id/category

Adiciona ou atualiza categorias de um campo do tipo `CATEGORY`.

### Estrutura de Arquivos

```
table-fields/add-category/
  add-category.controller.ts
  add-category.validator.ts
  add-category.use-case.ts
  add-category.schema.ts
```

### Validator (Zod)

```typescript
export const TableFieldAddCategoryParamsValidator = z.object({
  slug: z.string().trim(),  // slug da tabela
  _id: z.string().trim(),   // ID do campo
});

export const TableFieldAddCategoryBodyValidator = z.object({
  label: z.string().trim().min(1),
  parentId: z.string().trim().nullable().optional(),
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `label` | string | Sim | Rotulo da categoria |
| `parentId` | string \| null | Nao | ID da categoria pai (para subcategorias) |

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Categoria adicionada/atualizada |
| 403 | - | Sem permissao `UPDATE_FIELD` |
| 404 | `FIELD_NOT_FOUND` | Campo nao encontrado |
| 500 | `ADD_CATEGORY_ERROR` | Erro interno do servidor |

---

## Tipos de Campo (E_FIELD_TYPE)

### Tipos Customizaveis

| Tipo | Descricao |
|------|-----------|
| `TEXT_SHORT` | Texto curto (linha unica) |
| `TEXT_LONG` | Texto longo (multi-linha) |
| `DROPDOWN` | Selecao de opcoes pre-definidas |
| `DATE` | Campo de data |
| `RELATIONSHIP` | Relacionamento com outra tabela |
| `FILE` | Upload de arquivo |
| `FIELD_GROUP` | Grupo de campos (cria sub-schema) |
| `REACTION` | Reacoes (like/unlike) |
| `EVALUATION` | Avaliacao numerica |
| `CATEGORY` | Categorias hierarquicas |
| `USER` | Referencia a um usuario |

### Tipos Nativos (automaticos, locked)

| Tipo | Slug | Descricao |
|------|------|-----------|
| `CREATOR` | `creator` | Usuario criador do registro |
| `IDENTIFIER` | `_id` | Identificador unico do registro |
| `CREATED_AT` | `createdAt` | Data de criacao |
| `TRASHED` | `trashed` | Flag de lixeira |
| `TRASHED_AT` | `trashedAt` | Data de envio para lixeira |

---

## Formatos de Campo (E_FIELD_FORMAT)

### Formatos para TEXT_SHORT

| Formato | Descricao |
|---------|-----------|
| `ALPHA_NUMERIC` | Alfanumerico |
| `INTEGER` | Numero inteiro |
| `DECIMAL` | Numero decimal |
| `URL` | URL |
| `EMAIL` | Email |

### Formatos para TEXT_LONG

| Formato | Descricao |
|---------|-----------|
| `RICH_TEXT` | Texto rico (HTML) |
| `PLAIN_TEXT` | Texto puro |

### Formatos de Data

| Formato | Exemplo |
|---------|---------|
| `dd/MM/yyyy` | 15/01/2024 |
| `MM/dd/yyyy` | 01/15/2024 |
| `yyyy/MM/dd` | 2024/01/15 |
| `dd/MM/yyyy HH:mm:ss` | 15/01/2024 10:30:00 |
| `MM/dd/yyyy HH:mm:ss` | 01/15/2024 10:30:00 |
| `yyyy/MM/dd HH:mm:ss` | 2024/01/15 10:30:00 |
| `dd-MM-yyyy` | 15-01-2024 |
| `MM-dd-yyyy` | 01-15-2024 |
| `yyyy-MM-dd` | 2024-01-15 |
| `dd-MM-yyyy HH:mm:ss` | 15-01-2024 10:30:00 |
| `MM-dd-yyyy HH:mm:ss` | 01-15-2024 10:30:00 |
| `yyyy-MM-dd HH:mm:ss` | 2024-01-15 10:30:00 |

---

## Modelo IField

```typescript
type IField = {
  _id: string;
  name: string;
  slug: string;
  type: ValueOf<typeof E_FIELD_TYPE>;
  required: boolean;
  multiple: boolean;
  format: ValueOf<typeof E_FIELD_FORMAT> | null;
  showInFilter: boolean;
  showInForm: boolean;
  showInDetail: boolean;
  showInList: boolean;
  widthInForm: number | null;
  widthInList: number | null;
  defaultValue: string | null;
  locked?: boolean;
  native?: boolean;
  relationship: IFieldConfigurationRelationship | null;
  dropdown: IDropdown[];
  category: ICategory[];
  group: IFieldConfigurationGroup | null;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

## Tipos Auxiliares

### IFieldConfigurationRelationship

Configuracao de relacionamento com outra tabela:

```typescript
type IFieldConfigurationRelationship = {
  table: { _id: string; slug: string };
  field: { _id: string; slug: string };
  order: 'asc' | 'desc';
};
```

### IDropdown

Opcao de dropdown:

```typescript
type IDropdown = {
  id: string;
  label: string;
  color?: string | null;
};
```

### ICategory

Categoria hierarquica:

```typescript
type ICategory = {
  id: string;
  label: string;
  children: unknown[];
};
```

### IGroupConfiguration

Configuracao de grupo de campos na tabela:

```typescript
type IGroupConfiguration = {
  slug: string;
  name: string;
  fields: IField[];
  _schema: ITableSchema;
};
```

## Schema Base de Campos (table-field-base.schema.ts)

O arquivo `table-field-base.schema.ts` define o schema Zod reutilizavel com todas as propriedades configuracoes de um campo:

```typescript
export const TableFieldBaseSchema = z.object({
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  format: z.enum(E_FIELD_FORMAT).nullable().default(null),
  showInFilter: z.boolean().default(false),
  showInForm: z.boolean().default(false),
  showInDetail: z.boolean().default(false),
  showInList: z.boolean().default(false),
  widthInForm: z.number().min(0).max(100).nullable().default(50),
  widthInList: z.number().min(0).max(100).nullable().default(10),
  locked: z.boolean().default(false),
  defaultValue: z.string().nullable().default(null),
  relationship: Relationship.nullable().default(null),
  dropdown: z.array(Dropdown).default([]),
  category: z.array(Category).default([]),
  group: z.union([z.string().trim(), z.object({ _id: z.string().trim().optional(), slug: z.string().trim() })]).nullable().default(null),
});
```

## Impacto no Schema da Tabela

Sempre que um campo e criado ou atualizado, o sistema:

1. Reconstroi o `_schema` da tabela com `buildSchema()`
2. Atualiza o modelo Mongoose dinamico com `buildTable()`

Isso garante que o schema do banco de dados reflita sempre a estrutura atual dos campos da tabela.
