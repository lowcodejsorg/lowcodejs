# Permission Repository

Repositorio da entidade Permission (permissoes RBAC do sistema).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `permission-contract.repository.ts` | Classe abstrata com interface e payload types |
| `permission-mongoose.repository.ts` | Implementacao com Mongoose |
| `permission-in-memory.repository.ts` | Implementacao em memoria para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `create(payload)` | `IPermission` | Cria permissao com name, slug, description |
| `findBy(payload)` | `IPermission \| null` | Busca por _id ou slug (exact flag) |
| `findMany(payload)` | `IPermission[]` | Query com paginacao e search |
| `update(payload)` | `IPermission` | Atualiza por _id (campos parciais) |
| `delete(_id)` | `void` | Remove permissao |
| `count(payload)` | `number` | Conta permissoes matchando query |

## Payloads

- `PermissionCreatePayload` - name, slug, description
- `PermissionQueryPayload` - page, perPage, search (sem filtros adicionais)
