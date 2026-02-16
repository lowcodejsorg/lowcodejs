# Resource: Table Base

## Visao Geral

O resource de tabelas (`table-base`) e o nucleo do sistema LowCodeJS. Gerencia o CRUD completo de tabelas dinamicas, incluindo sistema de lixeira (soft delete) e exclusao permanente. Utiliza tanto `AuthenticationMiddleware` quanto `TableAccessMiddleware` para controle de acesso baseado em permissoes.

**Diretorio**: `backend/application/resources/table-base/`

**Prefixo de rota**: `tables` (definido em `@Controller({ route: 'tables' })`)

## Endpoints

| Metodo | Rota | Auth | Permissao | Descricao |
|--------|------|------|-----------|-----------|
| GET | `/tables/paginated` | Sim | - | Lista paginada de tabelas |
| GET | `/tables/:slug` | Sim/Opt | `VIEW_TABLE` | Detalhes de uma tabela |
| POST | `/tables` | Sim | `CREATE_TABLE` | Criar nova tabela |
| PUT | `/tables/:slug` | Sim | `UPDATE_TABLE` | Atualizar tabela |
| PATCH | `/tables/:slug/trash` | Sim | `UPDATE_TABLE` | Enviar para lixeira |
| PATCH | `/tables/:slug/restore` | Sim | `UPDATE_TABLE` | Restaurar da lixeira |
| DELETE | `/tables/:slug` | Sim | `REMOVE_TABLE` | Deletar permanentemente |

---

## POST /tables

Cria uma nova tabela no sistema. Automaticamente gera o slug, cria os campos nativos (FIELD_NATIVE_LIST) e monta o schema dinamico.

### Estrutura de Arquivos

```
table-base/create/
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
    url: '',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        TableAccessMiddleware({ requiredPermission: 'CREATE_TABLE' }),
      ],
      schema: TableCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = TableCreateBodyValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...payload,
      owner: request.user.sub, // Define o owner a partir do usuario autenticado
    });
    // ...
    return response.status(201).send(result.value);
  }
}
```

### Validator (Zod)

```typescript
export const TableCreateBodyValidator = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome e obrigatorio')
    .max(40, 'Nome deve ter no maximo 40 caracteres')
    .regex(
      /^[a-zA-ZaaaaeeeiioooouceAAAAEEEIIOOOOUC0-9\s\-_]+$/,
      'Nome pode conter apenas letras, numeros, espacos, hifen, underscore e c',
    ),
  logo: z.string().trim().nullable().optional(),
  style: TableStyleSchema.optional(),
  visibility: TableVisibilitySchema.optional(),
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome da tabela (max. 40 chars, alfanumerico com acentos) |
| `logo` | string \| null | Nao | URL da logo da tabela |
| `style` | TableStyle | Nao | Estilo de visualizacao (default: `LIST`) |
| `visibility` | TableVisibility | Nao | Visibilidade da tabela (default: `RESTRICTED`) |

### Fluxo do Use Case

1. Verifica se o `owner` foi informado (extraido do JWT no controller)
2. Gera o `slug` a partir do nome usando `slugify` (lowercase, trimmed)
3. Verifica se ja existe uma tabela com o mesmo slug
4. Se existir, retorna `Left(HTTPException.Conflict('Table already exists', 'TABLE_ALREADY_EXISTS'))`
5. Cria os **5 campos nativos** (`FIELD_NATIVE_LIST`) via `fieldRepository.createMany()`
6. Gera o `_schema` Mongoose dinamico com `buildSchema(nativeFields)`
7. Cria a tabela com os campos nativos, schema e configuracoes padrao:
   - `type`: `TABLE`
   - `collaboration`: `RESTRICTED`
   - `style`: valor informado ou `LIST`
   - `visibility`: valor informado ou `RESTRICTED`
   - `administrators`: `[]`
   - `fieldOrderForm`: `[]`
   - `fieldOrderList`: `[]`
8. Atualiza a tabela com os IDs dos campos nativos em `fields`, `fieldOrderList` e `fieldOrderForm`
9. Retorna `Right(created)` com status 201

### Campos Nativos (FIELD_NATIVE_LIST)

Toda tabela criada recebe automaticamente 5 campos nativos:

| Campo | Slug | Tipo | Descricao |
|-------|------|------|-----------|
| ID | `_id` | `IDENTIFIER` | Identificador unico do registro |
| Criador | `creator` | `CREATOR` | Usuario que criou o registro |
| Criado em | `createdAt` | `CREATED_AT` | Data de criacao do registro |
| Lixeira | `trashed` | `TRASHED` | Flag de soft delete |
| Enviado para lixeira em | `trashedAt` | `TRASHED_AT` | Data de envio para lixeira |

Todos os campos nativos possuem `native: true` e `locked: true`.

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 201 | - | Tabela criada com sucesso |
| 400 | `OWNER_REQUIRED` | Owner nao informado |
| 403 | - | Sem permissao `CREATE_TABLE` |
| 409 | `TABLE_ALREADY_EXISTS` | Tabela com o mesmo slug ja existe |
| 500 | `CREATE_TABLE_ERROR` | Erro interno do servidor |

---

## GET /tables/paginated

Lista tabelas de forma paginada. A autenticacao e obrigatoria, mas o `TableAccessMiddleware` nao e aplicado nesta rota (nao ha slug especifico).

### Estrutura de Arquivos

```
table-base/paginated/
  paginated.controller.ts
  paginated.validator.ts
  paginated.use-case.ts
  paginated.schema.ts
```

### Controller

```typescript
@GET({
  url: '/paginated',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      // Sem TableAccessMiddleware - nao tem slug especifico
    ],
    schema: TablePaginatedSchema,
  },
})
```

### Formato de Resposta

```typescript
{
  data: ITable[],
  meta: {
    total: number,
    page: number,
    perPage: number,
    lastPage: number,
    firstPage: number,
  }
}
```

---

## GET /tables/:slug

Retorna os detalhes de uma tabela especifica pelo slug. A autenticacao e **opcional** (permite acesso a tabelas publicas).

### Estrutura de Arquivos

```
table-base/show/
  show.controller.ts
  show.validator.ts
  show.use-case.ts
  show.schema.ts
```

### Controller

Nota: `AuthenticationMiddleware` com `optional: true` permite acesso sem autenticacao para tabelas publicas:

```typescript
@GET({
  url: '/:slug',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: true }),
      TableAccessMiddleware({ requiredPermission: 'VIEW_TABLE' }),
    ],
    schema: TableShowSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Dados completos da tabela |
| 403 | - | Sem permissao `VIEW_TABLE` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `SHOW_TABLE_ERROR` | Erro interno do servidor |

---

## PUT /tables/:slug

Atualiza uma tabela existente.

### Estrutura de Arquivos

```
table-base/update/
  update.controller.ts
  update.validator.ts
  update.use-case.ts
  update.schema.ts
```

### Validator (Zod)

```typescript
export const TableUpdateBodyValidator = z.object({
  name: z.string().trim().min(1).max(40).regex(/^[a-zA-Z...0-9\s\-_]+$/),
  description: z.string().trim().nullable(),
  logo: z.string().trim().nullable(),
  style: TableStyleSchema,
  visibility: TableVisibilitySchema,
  collaboration: TableCollaborationSchema,
  administrators: TableAdministratorsSchema,
  fieldOrderList: TableFieldOrderListSchema,
  fieldOrderForm: TableFieldOrderFormSchema,
  methods: TableMethodSchema,
});

export const TableUpdateParamsValidator = z.object({
  slug: z.string().trim(),
});
```

### Campos do Body

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | string | Nome da tabela (max. 40 chars) |
| `description` | string \| null | Descricao da tabela |
| `logo` | string \| null | URL da logo |
| `style` | TableStyle | Estilo de visualizacao |
| `visibility` | TableVisibility | Visibilidade |
| `collaboration` | TableCollaboration | Tipo de colaboracao |
| `administrators` | string[] | IDs dos administradores |
| `fieldOrderList` | string[] | Ordem dos campos na lista |
| `fieldOrderForm` | string[] | Ordem dos campos no formulario |
| `methods` | TableMethod | Metodos customizados (hooks) |

### Objeto Methods

```typescript
{
  beforeSave: { code: string | null },
  afterSave: { code: string | null },
  onLoad: { code: string | null },
}
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Tabela atualizada com sucesso |
| 403 | - | Sem permissao `UPDATE_TABLE` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `UPDATE_TABLE_ERROR` | Erro interno do servidor |

---

## PATCH /tables/:slug/trash

Envia uma tabela para a lixeira (soft delete).

### Estrutura de Arquivos

```
table-base/send-to-trash/
  send-to-trash.controller.ts
  send-to-trash.validator.ts
  send-to-trash.use-case.ts
  send-to-trash.schema.ts
```

### Controller

```typescript
@PATCH({
  url: '/:slug/trash',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'UPDATE_TABLE' }),
    ],
    schema: TableSendToTrashSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Tabela enviada para a lixeira |
| 403 | - | Sem permissao `UPDATE_TABLE` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `SEND_TO_TRASH_ERROR` | Erro interno do servidor |

---

## PATCH /tables/:slug/restore

Restaura uma tabela da lixeira.

### Estrutura de Arquivos

```
table-base/remove-from-trash/
  remove-from-trash.controller.ts
  remove-from-trash.validator.ts
  remove-from-trash.use-case.ts
  remove-from-trash.schema.ts
```

### Controller

```typescript
@PATCH({
  url: '/:slug/restore',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'UPDATE_TABLE' }),
    ],
    schema: TableRemoveFromTrashSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Tabela restaurada da lixeira |
| 403 | - | Sem permissao `UPDATE_TABLE` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `REMOVE_FROM_TRASH_ERROR` | Erro interno do servidor |

---

## DELETE /tables/:slug

Exclui permanentemente uma tabela do sistema.

### Estrutura de Arquivos

```
table-base/delete/
  delete.controller.ts
  delete.validator.ts
  delete.use-case.ts
  delete.schema.ts
```

### Controller

```typescript
@DELETE({
  url: '/:slug',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'REMOVE_TABLE' }),
    ],
    schema: TableDeleteSchema,
  },
})
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Tabela excluida permanentemente |
| 403 | - | Sem permissao `REMOVE_TABLE` |
| 404 | `TABLE_NOT_FOUND` | Tabela nao encontrada |
| 500 | `DELETE_TABLE_ERROR` | Erro interno do servidor |

---

## Enums e Tipos

### Tipos de Tabela (E_TABLE_TYPE)

| Valor | Descricao |
|-------|-----------|
| `TABLE` | Tabela padrao |
| `FIELD_GROUP` | Grupo de campos (sub-tabela) |

### Estilos de Visualizacao (E_TABLE_STYLE)

| Valor | Descricao |
|-------|-----------|
| `LIST` | Visualizacao em lista (padrao) |
| `GALLERY` | Visualizacao em galeria |
| `DOCUMENT` | Visualizacao de documento |
| `CARD` | Visualizacao em cards |
| `MOSAIC` | Visualizacao em mosaico |
| `KANBAN` | Visualizacao kanban |
| `FORUM` | Visualizacao em forum |

### Visibilidade (E_TABLE_VISIBILITY)

| Valor | Descricao |
|-------|-----------|
| `PUBLIC` | Acessivel publicamente sem autenticacao |
| `RESTRICTED` | Acessivel apenas para usuarios autenticados com permissao |
| `OPEN` | Aberta para qualquer usuario autenticado |
| `FORM` | Modo formulario (publico para submissao) |
| `PRIVATE` | Privada (apenas owner e administradores) |

### Colaboracao (E_TABLE_COLLABORATION)

| Valor | Descricao |
|-------|-----------|
| `OPEN` | Qualquer usuario autenticado pode colaborar |
| `RESTRICTED` | Apenas owner e administradores podem colaborar |

## Modelo ITable

```typescript
type ITable = {
  _id: string;
  _schema: ITableSchema;       // Schema Mongoose dinamico
  name: string;
  description: string | null;
  logo: IStorage | null;
  slug: string;
  fields: IField[];
  type: 'TABLE' | 'FIELD_GROUP';
  style: 'LIST' | 'GALLERY' | 'DOCUMENT' | 'CARD' | 'MOSAIC' | 'KANBAN' | 'FORUM';
  visibility: 'PUBLIC' | 'RESTRICTED' | 'OPEN' | 'FORM' | 'PRIVATE';
  collaboration: 'OPEN' | 'RESTRICTED';
  administrators: IUser[];
  owner: IUser;
  fieldOrderList: string[];    // Ordem dos campos na lista
  fieldOrderForm: string[];    // Ordem dos campos no formulario
  methods: ITableMethod;       // Hooks customizados
  groups: IGroupConfiguration[]; // Grupos de campos (sub-schemas)
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

## Schema Dinamico (_schema)

O campo `_schema` armazena a definicao do schema Mongoose dinamico gerado a partir dos campos da tabela. Ele e reconstruido automaticamente toda vez que campos sao adicionados ou modificados, usando a funcao `buildSchema()`.

```typescript
// Exemplo de _schema gerado
{
  "titulo": { type: "String", required: true },
  "data_criacao": { type: "Date", required: false },
  "criador": { type: "ObjectId", ref: "User", required: false },
}
```

## Schemas Zod Compartilhados (table-base.schema.ts)

O arquivo `table-base.schema.ts` define schemas Zod reutilizaveis:

```typescript
export const TableStyleSchema = z.enum([...]).default('LIST');
export const TableVisibilitySchema = z.enum([...]).default('PUBLIC');
export const TableCollaborationSchema = z.enum([...]).default('OPEN');
export const TableAdministratorsSchema = z.array(z.string()).default([]);
export const TableFieldOrderListSchema = z.array(z.string().trim()).default([]);
export const TableFieldOrderFormSchema = z.array(z.string().trim()).default([]);
export const TableMethodSchema = z.object({
  beforeSave: z.object({ code: z.string().trim().nullable() }),
  afterSave: z.object({ code: z.string().trim().nullable() }),
  onLoad: z.object({ code: z.string().trim().nullable() }),
});
```
