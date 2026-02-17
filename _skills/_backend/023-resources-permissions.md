# Resource: Permissions

## Visao Geral

O resource de permissoes e um resource simples que lista todas as permissoes disponiveis no sistema. As permissoes sao utilizadas para controlar o acesso a operacoes sobre tabelas, campos e registros, e sao atribuidas a grupos de usuarios.

**Diretorio**: `backend/application/resources/permissions/`

**Prefixo de rota**: `permissions` (definido em `@Controller({ route: 'permissions' })`)

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/permissions` | Sim | Lista todas as permissoes do sistema |

---

## GET /permissions

Retorna a lista completa de todas as permissoes cadastradas no sistema.

### Estrutura de Arquivos

```
permissions/list/
  list.controller.ts
  list.use-case.ts
  list.schema.ts
  list.controller.spec.ts
```

### Controller

```typescript
@Controller({ route: 'permissions' })
export default class {
  @GET({
    url: '',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: PermissionListSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const result = await this.useCase.execute();

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

O use case e direto e simples:

```typescript
@Service()
export default class PermissionListUseCase {
  constructor(
    private readonly permissionRepository: PermissionContractRepository,
  ) {}

  async execute(): Promise<Response> {
    try {
      const permissions = await this.permissionRepository.findMany();
      return right(permissions);
    } catch (error) {
      return left(
        HTTPException.InternalServerError('Internal server error', 'LIST_PERMISSION_ERROR'),
      );
    }
  }
}
```

1. Busca todas as permissoes via `PermissionContractRepository.findMany()`
2. Retorna `Right(permissions)` com a lista completa

### Codigos de Resposta

| Codigo | Causa | Descricao |
|--------|-------|-----------|
| 200 | - | Lista de permissoes retornada com sucesso |
| 401 | `AUTHENTICATION_REQUIRED` | Usuario nao autenticado |
| 500 | `LIST_PERMISSION_ERROR` | Erro interno do servidor |

---

## Permissoes do Sistema

O sistema possui **12 permissoes** organizadas em 3 categorias (TABLE, FIELD, ROW), com 4 acoes cada (CREATE, UPDATE, REMOVE, VIEW):

### Permissoes de Tabela

| Slug | Descricao |
|------|-----------|
| `CREATE_TABLE` | Permite criar novas tabelas |
| `UPDATE_TABLE` | Permite atualizar tabelas existentes |
| `REMOVE_TABLE` | Permite remover tabelas (lixeira e exclusao permanente) |
| `VIEW_TABLE` | Permite visualizar tabelas |

### Permissoes de Campo

| Slug | Descricao |
|------|-----------|
| `CREATE_FIELD` | Permite criar novos campos em tabelas |
| `UPDATE_FIELD` | Permite atualizar campos existentes |
| `REMOVE_FIELD` | Permite remover campos (lixeira e restauracao) |
| `VIEW_FIELD` | Permite visualizar campos |

### Permissoes de Registro

| Slug | Descricao |
|------|-----------|
| `CREATE_ROW` | Permite criar novos registros em tabelas |
| `UPDATE_ROW` | Permite atualizar registros existentes |
| `REMOVE_ROW` | Permite remover registros (lixeira e exclusao permanente) |
| `VIEW_ROW` | Permite visualizar registros |

### Enum no Codigo

As permissoes sao definidas no enum `E_TABLE_PERMISSION` em `application/core/entity.core.ts`:

```typescript
export const E_TABLE_PERMISSION = {
  // TABLE
  CREATE_TABLE: 'CREATE_TABLE',
  UPDATE_TABLE: 'UPDATE_TABLE',
  REMOVE_TABLE: 'REMOVE_TABLE',
  VIEW_TABLE: 'VIEW_TABLE',

  // FIELD
  CREATE_FIELD: 'CREATE_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  VIEW_FIELD: 'VIEW_FIELD',

  // ROW
  CREATE_ROW: 'CREATE_ROW',
  UPDATE_ROW: 'UPDATE_ROW',
  REMOVE_ROW: 'REMOVE_ROW',
  VIEW_ROW: 'VIEW_ROW',
} as const;
```

## Modelo IPermission

```typescript
type IPermission = {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  trashedAt: Date | null;
  trashed: boolean;
};
```

## Uso das Permissoes

As permissoes sao atribuidas a grupos de usuarios (resource `user-groups`) e verificadas pelo `TableAccessMiddleware` nas rotas de tabelas, campos e registros:

```typescript
// Exemplo: criar tabela requer permissao CREATE_TABLE
@POST({
  url: '',
  options: {
    onRequest: [
      AuthenticationMiddleware({ optional: false }),
      TableAccessMiddleware({ requiredPermission: 'CREATE_TABLE' }),
    ],
  },
})
```

O middleware verifica se o grupo do usuario autenticado possui a permissao necessaria antes de permitir o acesso a rota.

### Exemplo de Resposta

```json
[
  {
    "_id": "64c1a2b3...",
    "name": "Criar Tabela",
    "slug": "CREATE_TABLE",
    "description": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "64c1a2b4...",
    "name": "Atualizar Tabela",
    "slug": "UPDATE_TABLE",
    "description": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```
