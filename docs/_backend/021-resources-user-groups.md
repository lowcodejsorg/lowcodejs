# Resource: User Groups

## Visao Geral

O resource de grupos de usuarios gerencia os grupos (roles) do sistema. Cada usuario pertence a um grupo que define suas permissoes. Todas as operacoes requerem autenticacao.

**Diretorio**: `backend/application/resources/user-groups/`

**Prefixo de rota**: `user-group` (definido em `@Controller({ route: 'user-group' })`)

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/user-group/paginated` | Sim | Lista paginada de grupos |
| GET | `/user-group` | Sim | Lista completa de grupos |
| GET | `/user-group/:_id` | Sim | Detalhes de um grupo |
| POST | `/user-group` | Sim | Criar novo grupo |
| PATCH | `/user-group/:_id` | Sim | Atualizar grupo |

---

## POST /user-group

Cria um novo grupo de usuarios.

### Estrutura de Arquivos

```
user-groups/create/
  create.controller.ts
  create.validator.ts
  create.use-case.ts
  create.schema.ts
  create.controller.spec.ts
  create.use-case.spec.ts
```

### Controller

O controller de criacao utiliza `@Controller()` sem prefixo e define a URL diretamente:

```typescript
@Controller()
export default class {
  @POST({
    url: '/user-group',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: UserGroupCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UserGroupCreateBodyValidator.parse(request.body);
    const result = await this.useCase.execute(body);
    // ...
    return response.status(201).send(result.value);
  }
}
```

### Validator (Zod)

```typescript
export const UserGroupCreateBodyValidator = z.object({
  name: z
    .string({ message: 'O nome e obrigatorio' })
    .trim()
    .min(1, 'O nome e obrigatorio'),
  description: z
    .string({ message: 'A descricao deve ser um texto' })
    .trim()
    .nullable(),
  permissions: z
    .array(z.string({ message: 'Cada permissao deve ser um texto' }))
    .min(1, 'Pelo menos uma permissao e obrigatoria'),
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do grupo |
| `description` | string \| null | Sim (aceita null) | Descricao do grupo |
| `permissions` | string[] | Sim (min. 1) | Array de IDs de permissoes |

### Fluxo do Use Case

1. Gera o `slug` automaticamente a partir do `name` usando `slugify` (lowercase, trimmed)
2. Verifica se ja existe um grupo com o mesmo slug
3. Se existir, retorna `Left(HTTPException.Conflict('Group already exists', 'GROUP_EXISTS'))`
4. Valida que pelo menos uma permissao foi informada
5. Cria o grupo com `name`, `description`, `permissions` e `slug` gerado
6. Retorna `Right(created)` com status 201

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 201 | - | Grupo criado com sucesso |
| 400 | - | Nenhuma permissao informada |
| 409 | `GROUP_EXISTS` | Grupo com o mesmo slug ja existe |
| 500 | `CREATE_USER_GROUP_ERROR` | Erro interno do servidor |

---

## GET /user-group

Lista todos os grupos de usuarios (lista completa, sem paginacao).

### Estrutura de Arquivos

```
user-groups/list/
  list.controller.ts
  list.use-case.ts
  list.schema.ts
  list.controller.spec.ts
  list.use-case.spec.ts
```

### Controller

O controller passa informacoes do usuario autenticado para o use case (para filtro por role):

```typescript
@GET({
  url: '',
  options: {
    onRequest: [AuthenticationMiddleware({ optional: false })],
    schema: UserGroupListSchema,
  },
})
async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
  const result = await this.useCase.execute({
    user: {
      _id: request?.user?.sub,
      role: request?.user?.role,
    },
  });
  // ...
}
```

---

## GET /user-group/paginated

Lista grupos de usuarios de forma paginada.

### Estrutura de Arquivos

```
user-groups/paginated/
  paginated.controller.ts
  paginated.validator.ts
  paginated.use-case.ts
  paginated.schema.ts
  paginated.controller.spec.ts
  paginated.use-case.spec.ts
```

### Controller

```typescript
@Controller({ route: 'user-group' })
export default class {
  @GET({
    url: '/paginated',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: UserGroupPaginatedSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = UserGroupPaginatedQueryValidator.parse(request.query);

    const result = await this.useCase.execute({
      ...query,
      user: {
        _id: request?.user?.sub,
        role: request?.user?.role,
      },
    });
    // ...
  }
}
```

### Formato de Resposta

```typescript
{
  data: IGroup[],
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

## GET /user-group/:_id

Retorna os detalhes de um grupo especifico.

### Estrutura de Arquivos

```
user-groups/show/
  show.controller.ts
  show.validator.ts
  show.use-case.ts
  show.schema.ts
  show.controller.spec.ts
  show.use-case.spec.ts
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Dados do grupo com permissoes |
| 404 | `GROUP_NOT_FOUND` | Grupo nao encontrado |
| 500 | `SHOW_USER_GROUP_ERROR` | Erro interno do servidor |

---

## PATCH /user-group/:_id

Atualiza um grupo de usuarios existente. Todos os campos do body sao opcionais.

### Estrutura de Arquivos

```
user-groups/update/
  update.controller.ts
  update.validator.ts
  update.use-case.ts
  update.schema.ts
  update.controller.spec.ts
  update.use-case.spec.ts
```

### Validator (Zod)

```typescript
export const UserGroupUpdateParamsValidator = z.object({
  _id: z.string({ message: 'O ID e obrigatorio' }).trim().min(1, 'O ID e obrigatorio'),
});

export const UserGroupUpdateBodyValidator = z.object({
  name: z
    .string({ message: 'O nome deve ser um texto' })
    .trim()
    .min(1, 'O nome e obrigatorio')
    .optional(),
  description: z
    .string({ message: 'A descricao deve ser um texto' })
    .trim()
    .nullable()
    .optional(),
  permissions: z
    .array(z.string({ message: 'Cada permissao deve ser um texto' }))
    .optional(),
});
```

### Campos do Body (todos opcionais)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | string | Nome do grupo |
| `description` | string \| null | Descricao do grupo |
| `permissions` | string[] | Array de IDs de permissoes |

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Grupo atualizado com sucesso |
| 404 | `GROUP_NOT_FOUND` | Grupo nao encontrado |
| 500 | `UPDATE_USER_GROUP_ERROR` | Erro interno do servidor |

---

## Modelo IGroup

```typescript
type IGroup = {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

## Grupos Padrao do Sistema

O sistema possui 4 grupos padrao definidos no enum `E_ROLE`:

| Grupo | Slug | Descricao |
|-------|------|-----------|
| Master | `MASTER` | Acesso total ao sistema |
| Administrator | `ADMINISTRATOR` | Administrador do sistema |
| Manager | `MANAGER` | Gerente com permissoes intermediarias |
| Registered | `REGISTERED` | Usuario comum registrado (grupo padrao no sign-up) |

## Geracao Automatica de Slug

O slug e gerado automaticamente a partir do nome do grupo utilizando a biblioteca `slugify`:

```typescript
const slug = slugify(payload.name, { trim: true, lower: true });
```

Exemplo: `"Meu Grupo Customizado"` gera o slug `"meu-grupo-customizado"`.
