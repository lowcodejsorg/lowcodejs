# Resource: Profile

## Visao Geral

O resource de perfil permite que o usuario autenticado visualize e atualize seus proprios dados. Diferente do resource `users` (que e administrativo), o `profile` opera sobre o usuario logado, identificado pelo token JWT (`request.user.sub`).

**Diretorio**: `backend/application/resources/profile/`

**Prefixo de rota**: `profile` (definido em `@Controller({ route: 'profile' })`)

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/profile` | Sim | Dados do usuario autenticado |
| PUT | `/profile` | Sim | Atualizar perfil do usuario autenticado |

---

## GET /profile

Retorna os dados do usuario autenticado, incluindo o grupo com suas permissoes populadas.

### Estrutura de Arquivos

```
profile/show/
  show.controller.ts
  show.use-case.ts
  show.schema.ts
  show.controller.spec.ts
  show.use-case.spec.ts
```

### Controller

O ID do usuario e extraido do token JWT (`request.user.sub`):

```typescript
@Controller({ route: 'profile' })
export default class {
  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: ProfileShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute({
      _id: request.user.sub,
    });

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

### Fluxo do Use Case

1. Busca o usuario pelo `_id` (extraido do JWT)
2. Se nao encontrar, retorna `Left(HTTPException.NotFound('User not found', 'USER_NOT_FOUND'))`
3. Retorna `Right(user)` - o usuario e retornado com o campo `group` populado (incluindo permissoes)

### Exemplo de Resposta

```json
{
  "_id": "64a...",
  "name": "Joao Silva",
  "email": "joao@exemplo.com",
  "status": "ACTIVE",
  "group": {
    "_id": "64b...",
    "name": "Administrator",
    "slug": "ADMINISTRATOR",
    "description": null,
    "permissions": [
      {
        "_id": "64c...",
        "name": "Criar Tabela",
        "slug": "CREATE_TABLE"
      }
    ]
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-02-20T14:00:00.000Z"
}
```

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Dados do usuario autenticado |
| 401 | `AUTHENTICATION_REQUIRED` | Usuario nao autenticado |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `GET_USER_PROFILE_ERROR` | Erro interno do servidor |

---

## PUT /profile

Atualiza o perfil do usuario autenticado. Suporta atualizacao de dados basicos e troca de senha (com verificacao da senha atual).

### Estrutura de Arquivos

```
profile/update/
  update.controller.ts
  update.validator.ts
  update.use-case.ts
  update.schema.ts
  update.controller.spec.ts
```

### Controller

```typescript
@Controller({ route: 'profile' })
export default class {
  @PUT({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: ProfileUpdateSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = ProfileUpdateBodyValidator.parse(request.body);

    const result = await this.useCase.execute({
      ...body,
      _id: request.user.sub,
    });
    // ...
  }
}
```

### Validator (Zod)

```typescript
export const ProfileUpdateBodyValidator = z.object({
  name: z.string({ message: 'O nome e obrigatorio' }).min(1, 'O nome e obrigatorio').trim(),
  email: z.string({ message: 'O email e obrigatorio' }).email('Digite um email valido').trim(),
  group: z.string({ message: 'O grupo e obrigatorio' }).min(1, 'O grupo e obrigatorio').trim(),

  currentPassword: z
    .string({ message: 'A senha atual deve ser um texto' })
    .trim()
    .optional(),
  newPassword: z
    .string({ message: 'A nova senha deve ser um texto' })
    .min(6, 'A nova senha deve ter no minimo 6 caracteres')
    .regex(PASSWORD_REGEX, 'A nova senha deve conter ao menos: 1 maiuscula, 1 minuscula, 1 numero e 1 especial')
    .trim()
    .optional(),
  allowPasswordChange: z.coerce.boolean().default(false),
});
```

### Campos do Body

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | Sim | Nome do usuario |
| `email` | string (email) | Sim | Email do usuario |
| `group` | string | Sim | ID do grupo |
| `currentPassword` | string | Nao | Senha atual (obrigatoria se `allowPasswordChange` = true) |
| `newPassword` | string | Nao | Nova senha (min. 6 chars, regex PASSWORD_REGEX) |
| `allowPasswordChange` | boolean | Nao | Flag para habilitar troca de senha (default: false) |

### Fluxo do Use Case

O fluxo se divide em dois caminhos baseado na flag `allowPasswordChange`:

#### Sem troca de senha (`allowPasswordChange = false`)

1. Verifica se o grupo foi informado
2. Busca o usuario pelo `_id`
3. Se nao encontrar, retorna `Left(HTTPException.NotFound(...))`
4. Atualiza `name`, `email` e `group`
5. Retorna `Right(updated)`

#### Com troca de senha (`allowPasswordChange = true`)

1. Verifica se o grupo foi informado
2. Busca o usuario pelo `_id`
3. Se nao encontrar, retorna `Left(HTTPException.NotFound(...))`
4. Verifica a senha atual com `isPasswordMatch` (compara hash)
5. Se a senha atual nao conferir, retorna `Left(HTTPException.Unauthorized('Invalid credentials', 'INVALID_CREDENTIALS'))`
6. Gera hash da nova senha com `bcryptjs` (salt rounds: 6)
7. Atualiza `name`, `email`, `group` e `password`
8. Retorna `Right(updated)`

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Perfil atualizado com sucesso |
| 400 | `GROUP_NOT_INFORMED` | Grupo nao informado |
| 401 | `AUTHENTICATION_REQUIRED` | Usuario nao autenticado |
| 401 | `INVALID_CREDENTIALS` | Senha atual incorreta (ao tentar trocar senha) |
| 404 | `USER_NOT_FOUND` | Usuario nao encontrado |
| 500 | `UPDATE_USER_PROFILE_ERROR` | Erro interno do servidor |

---

## Diferenca entre Profile e Users

| Aspecto | Profile | Users |
|---------|---------|-------|
| **Escopo** | Apenas o usuario autenticado | Qualquer usuario (admin) |
| **Identificacao** | `request.user.sub` (do JWT) | `request.params._id` |
| **Troca de senha** | Requer senha atual (`currentPassword`) | Define senha diretamente |
| **Permissoes** | Qualquer usuario autenticado | Requer autenticacao (admin) |
