# Visao Geral dos Resources do Backend

## Introducao

O backend do LowCodeJS utiliza **Fastify** com **TypeScript** e **Mongoose**, organizado em uma arquitetura modular baseada em *resources*. Cada resource representa uma funcionalidade do sistema e segue um padrao consistente de estrutura de arquivos e convencoes.

## Localizacao

Todos os resources estao localizados em:

```
backend/application/resources/
```

## Estrutura de Diretorios

Cada resource e um diretorio de feature que contem subdiretorios para cada operacao (create, show, update, delete, paginated, list, etc.):

```
application/resources/
  authentication/
    sign-in/
      sign-in.controller.ts
      sign-in.validator.ts
      sign-in.use-case.ts
      sign-in.schema.ts
      sign-in.controller.spec.ts
      sign-in.use-case.spec.ts
    sign-up/
    sign-out/
    refresh-token/
    request-code/
    validate-code/
    reset-password/
    magic-link/
  users/
    create/
    show/
    update/
    paginated/
    user-base.validator.ts
  user-groups/
    create/
    show/
    update/
    list/
    paginated/
  profile/
    show/
    update/
  permissions/
    list/
  table-base/
    create/
    show/
    update/
    delete/
    paginated/
    send-to-trash/
    remove-from-trash/
    table-base.schema.ts
  table-fields/
    create/
    show/
    update/
    send-to-trash/
    remove-from-trash/
    add-category/
    table-field-base.schema.ts
  table-rows/
    create/
    show/
    update/
    delete/
    paginated/
    send-to-trash/
    remove-from-trash/
    bulk-trash/
    bulk-restore/
    reaction/
    evaluation/
    forum-message/
  menu/
    create/
    show/
    update/
    delete/
    list/
    paginated/
  pages/
    show/
  storage/
    update/
    delete/
  locales/
    list/
    show/
  setting/
    show/
    update/
  tools/
    clone-table/
  welcome.controller.ts
  health-check.controller.ts
```

## Padrao por Operacao

Cada operacao dentro de um resource contem 4 arquivos principais:

### 1. Controller (`*.controller.ts`)

Responsavel por definir a rota HTTP, aplicar middlewares e orquestrar a chamada ao validator e use case.

- Utiliza decorators do `fastify-decorators`:
  - `@Controller({ route: 'prefix' })` - define o prefixo de rota do resource
  - `@GET()`, `@POST()`, `@PUT()`, `@PATCH()`, `@DELETE()` - define o metodo HTTP
- Cada decorator de metodo recebe `url` e `options` (schema, onRequest)

```typescript
import { Controller, POST } from 'fastify-decorators';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: SignInUseCase = getInstanceByToken(SignInUseCase),
  ) {}

  @POST({
    url: '/sign-in',
    options: {
      schema: SignInSchema,
      onRequest: [AuthenticationMiddleware({ optional: false })],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = SignInBodyValidator.parse(request.body);
    const result = await this.useCase.execute(payload);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

### 2. Validator (`*.validator.ts`)

Define schemas de validacao utilizando **Zod** para body, params e query da requisicao.

```typescript
import z from 'zod';

export const SignInBodyValidator = z.object({
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
  password: z.string({ message: 'A senha e obrigatoria' }).min(1, 'A senha e obrigatoria').trim(),
});

export type SignInPayload = z.infer<typeof SignInBodyValidator>;
```

### 3. Use Case (`*.use-case.ts`)

Contem a logica de negocio. Retorna um tipo `Either<HTTPException, T>`:

- `Left` para erros (encapsula um `HTTPException`)
- `Right` para sucesso (encapsula o resultado)

```typescript
import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

type Response = Either<HTTPException, Entity>;

@Service()
export default class SignInUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await this.userRepository.findBy({ email: payload.email, exact: true });

      if (!user)
        return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

      // ... logica de negocio ...

      return right(user);
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'SIGN_IN_ERROR'));
    }
  }
}
```

### 4. Schema (`*.schema.ts`)

Define o schema OpenAPI/Swagger (FastifySchema) para documentacao automatica da rota.

```typescript
import type { FastifySchema } from 'fastify';

export const SignInSchema: FastifySchema = {
  tags: ['Autenticacao'],
  summary: 'User authentication sign in',
  description: 'Authenticates a user with email and password',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: { description: 'Successful authentication', type: 'object' },
    401: { description: 'Unauthorized', type: 'object' },
  },
};
```

## Middlewares

Os middlewares sao aplicados via `options.onRequest` no decorator de metodo HTTP:

### AuthenticationMiddleware

Verifica se o usuario esta autenticado via JWT (cookies httpOnly).

```typescript
onRequest: [
  AuthenticationMiddleware({
    optional: false, // true permite acesso sem autenticacao
  }),
]
```

Quando `optional: true`, a rota aceita tanto requisicoes autenticadas quanto anonimas. Quando `optional: false`, a autenticacao e obrigatoria.

### TableAccessMiddleware

Verifica se o usuario tem a permissao necessaria para acessar o recurso de tabela.

```typescript
onRequest: [
  AuthenticationMiddleware({ optional: false }),
  TableAccessMiddleware({
    requiredPermission: 'CREATE_TABLE',
  }),
]
```

Permissoes disponiveis: `CREATE_TABLE`, `UPDATE_TABLE`, `REMOVE_TABLE`, `VIEW_TABLE`, `CREATE_FIELD`, `UPDATE_FIELD`, `REMOVE_FIELD`, `VIEW_FIELD`, `CREATE_ROW`, `UPDATE_ROW`, `REMOVE_ROW`, `VIEW_ROW`.

## Padrao Either

O sistema utiliza o padrao **Either** (definido em `application/core/either.core.ts`) para tratamento funcional de erros:

```typescript
export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
```

- `Left<HTTPException, T>` - representa um erro com codigo HTTP, mensagem e causa
- `Right<HTTPException, T>` - representa o resultado de sucesso

Os controllers verificam o resultado usando `isLeft()` e `isRight()`:

```typescript
if (result.isLeft()) {
  const error = result.value;
  return response.status(error.code).send({
    message: error.message,
    code: error.code,
    cause: error.cause,
  });
}

return response.status(200).send(result.value);
```

## Controllers Especiais

### welcome.controller.ts

Controller sem prefixo de rota. Redireciona `GET /` para `/documentation` (Swagger UI):

```typescript
@Controller()
export default class {
  @GET({ url: '' })
  async handle(_: FastifyRequest, response: FastifyReply): Promise<void> {
    return response.redirect('/documentation').send({ message: 'LowCodeJs API' });
  }
}
```

### health-check.controller.ts

Endpoint de verificacao de saude da aplicacao em `GET /health-check`:

```typescript
@Controller()
export default class {
  @GET({ url: '/health-check' })
  async handle(_: FastifyRequest, response: FastifyReply): Promise<void> {
    return response.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Lista Completa de Resources

| Resource | Diretorio | Descricao |
|----------|-----------|-----------|
| authentication | `authentication/` | Cadastro, login, logout, refresh token, recuperacao de senha, magic link |
| users | `users/` | CRUD de usuarios (admin) |
| user-groups | `user-groups/` | CRUD de grupos de usuarios |
| profile | `profile/` | Visualizar e atualizar perfil do usuario autenticado |
| permissions | `permissions/` | Listar permissoes do sistema |
| table-base | `table-base/` | CRUD de tabelas (com lixeira) |
| table-fields | `table-fields/` | CRUD de campos de tabela (com lixeira e categorias) |
| table-rows | `table-rows/` | CRUD de registros de tabela (com lixeira, reacoes, avaliacoes, forum) |
| menu | `menu/` | CRUD de itens de menu |
| pages | `pages/` | Visualizacao de paginas |
| storage | `storage/` | Upload e exclusao de arquivos |
| locales | `locales/` | Listagem e visualizacao de idiomas |
| setting | `setting/` | Visualizar e atualizar configuracoes do sistema |
| tools | `tools/` | Ferramentas auxiliares (clonagem de tabela) |

## Convencoes de Nomenclatura

- **Arquivos**: `<operacao>.<tipo>.ts` (ex: `create.controller.ts`, `sign-in.validator.ts`)
- **Validators**: `<Resource><Operacao>BodyValidator`, `<Resource><Operacao>ParamsValidator`, `<Resource><Operacao>QueryValidator`
- **Use Cases**: `<Resource><Operacao>UseCase` (ex: `SignInUseCase`, `UserCreateUseCase`)
- **Schemas**: `<Resource><Operacao>Schema` (ex: `SignInSchema`, `UserCreateSchema`)
- **Testes**: `*.controller.spec.ts` e `*.use-case.spec.ts`

## Tipos Base (entity.core.ts)

O arquivo `application/core/entity.core.ts` define todas as interfaces e enums compartilhados:

- `IUser`, `IGroup`, `IPermission`, `ITable`, `IField`, `IRow`, `IStorage`, `IMenu`, `ISetting`
- Enums: `E_USER_STATUS`, `E_ROLE`, `E_TABLE_TYPE`, `E_TABLE_STYLE`, `E_TABLE_VISIBILITY`, `E_FIELD_TYPE`, `E_FIELD_FORMAT`, `E_TABLE_PERMISSION`
- Tipos utilitarios: `Either`, `Paginated<T>`, `IMeta`, `ISearch`
