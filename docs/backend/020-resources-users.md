# Resource: Users

## Visao Geral

O resource de usuarios gerencia o CRUD administrativo de usuarios do sistema. Todas as operacoes requerem autenticacao.

**Diretorio**: `backend/application/resources/users/`

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/users/paginated` | Sim | Lista paginada de usuarios |
| GET | `/users/:_id` | Sim | Detalhes de um usuario |
| POST | `/users` | Sim | Criar novo usuario |
| PATCH | `/users/:_id` | Sim | Atualizar usuario |

---

## POST /users

Cria um novo usuario no sistema (operacao administrativa).

### Estrutura de Arquivos

```
users/create/
  create.controller.ts
  create.validator.ts
  create.use-case.ts
  create.schema.ts
  create.controller.spec.ts
```

### Controller

```typescript
@Controller()
export default class {
  @POST({
    url: '/users',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: UserCreateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = UserCreateBodyValidator.parse(request.body);
    const result = await this.useCase.execute(body);
    // ...
  }
}
```

### Validator (Zod)

O validator de criacao estende o `UserBaseValidator` com o campo de senha:

**UserBaseValidator** (`user-base.validator.ts`):

```typescript
export const UserBaseValidator = z.object({
  name: z.string({ message: 'O nome e obrigatorio' }).trim().min(1, 'O nome e obrigatorio'),
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
  group: z.string({ message: 'O grupo e obrigatorio' }).min(1, 'O grupo e obrigatorio'),
});
```

**UserCreateBodyValidator** (`create/create.validator.ts`):

```typescript
export const UserCreateBodyValidator = UserBaseValidator.extend({
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .trim()
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial'),
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do usuario |
| `email` | string (email) | Sim | Email do usuario |
| `password` | string | Sim | Senha (min. 6 chars, regex PASSWORD_REGEX) |
| `group` | string | Sim | ID do grupo de usuario |

### Fluxo do Use Case

1. Verifica se o grupo foi informado
2. Busca usuario existente pelo email
3. Se ja existir, retorna `Left(HTTPException.Conflict('User already exists', 'USER_ALREADY_EXISTS'))`
4. Gera hash da senha com `bcrypt.hash` (salt rounds: 12)
5. Cria o usuario com status `ACTIVE`
6. Retorna `Right(created)` com status 201

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 201 | - | Usuario criado com sucesso |
| 400 | `GROUP_NOT_INFORMED` | Grupo nao informado |
| 409 | `USER_ALREADY_EXISTS` | Email ja cadastrado |
| 500 | `CREATE_USER_ERROR` | Erro interno do servidor |

---

## GET /users/paginated

Lista usuarios de forma paginada.

### Estrutura de Arquivos

```
users/paginated/
  paginated.controller.ts
  paginated.validator.ts
  paginated.use-case.ts
  paginated.schema.ts
  paginated.controller.spec.ts
```

### Controller

O controller utiliza `@Controller({ route: '/users' })` e passa os dados do usuario autenticado para o use case:

```typescript
@GET({
  url: '/paginated',
  options: {
    onRequest: [AuthenticationMiddleware({ optional: false })],
    schema: UserPaginatedSchema,
  },
})
async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
  const query = UserPaginatedQueryValidator.parse(request.query);

  const result = await this.useCase.execute({
    ...query,
    user: {
      _id: request?.user?.sub,
      role: request?.user?.role,
    },
  });
  // ...
}
```

### Parametros de Query

Segue o padrao `ISearch` da aplicacao:

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `page` | number | Numero da pagina |
| `perPage` | number | Registros por pagina |
| `search` | string (opcional) | Termo de busca |

### Formato de Resposta

```typescript
{
  data: IUser[],
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

## GET /users/:_id

Retorna os detalhes de um usuario especifico. O campo `password` e removido da resposta.

### Estrutura de Arquivos

```
users/show/
  show.controller.ts
  show.validator.ts
  show.use-case.ts
  show.schema.ts
  show.controller.spec.ts
```

### Controller

```typescript
@Controller({ route: '/users' })
export default class {
  @GET({
    url: '/:_id',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: UserShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = UserShowParamValidator.parse(request.params);
    const result = await this.useCase.execute(params);

    if (result.isLeft()) { /* ... */ }

    return response.status(200).send({
      ...result?.value,
      password: undefined, // Remove o password da resposta
    });
  }
}
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Dados do usuario (sem password) |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `SHOW_USER_ERROR` | Erro interno do servidor |

---

## PATCH /users/:_id

Atualiza os dados de um usuario existente. Todos os campos sao opcionais (partial update).

### Estrutura de Arquivos

```
users/update/
  update.controller.ts
  update.validator.ts
  update.use-case.ts
  update.schema.ts
  update.controller.spec.ts
```

### Validator (Zod)

```typescript
export const UserUpdateBodyValidator = UserBaseValidator.partial().extend({
  password: z
    .string({ message: 'A senha deve ser um texto' })
    .trim()
    .min(6, 'A senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial')
    .optional(),
  status: z
    .enum([E_USER_STATUS.ACTIVE, E_USER_STATUS.INACTIVE], {
      message: 'O status deve ser ACTIVE ou INACTIVE',
    })
    .optional(),
});

export const UserUpdateParamsValidator = z.object({
  _id: z.string({ message: 'O ID e obrigatorio' }).trim().min(1, 'O ID e obrigatorio'),
});
```

### Campos do Body (todos opcionais)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `name` | string | Nome do usuario |
| `email` | string (email) | Email do usuario |
| `group` | string | ID do grupo de usuario |
| `password` | string | Nova senha (min. 6 chars, regex PASSWORD_REGEX) |
| `status` | `ACTIVE` \| `INACTIVE` | Status do usuario |

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Usuario atualizado com sucesso |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `UPDATE_USER_ERROR` | Erro interno do servidor |

---

## Modelo IUser

```typescript
type IUser = {
  _id: string;
  name: string;
  email: string;
  password: string;
  status: 'ACTIVE' | 'INACTIVE';
  group: IGroup;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

### Status do Usuario

| Status | Descricao |
|--------|-----------|
| `ACTIVE` | Usuario ativo, pode fazer login |
| `INACTIVE` | Usuario inativo, login bloqueado |

## Regex de Senha (PASSWORD_REGEX)

A senha deve conter obrigatoriamente:

- Pelo menos 1 letra maiuscula
- Pelo menos 1 letra minuscula
- Pelo menos 1 numero
- Pelo menos 1 caractere especial (`!@#$%^&*(),.?":{}|<>`)
- Minimo de 6 caracteres
