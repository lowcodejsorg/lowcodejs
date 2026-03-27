# List User Groups

Lista todos os grupos de usuarios sem paginacao.

## Endpoint
`GET /user-group` | Auth: Yes | Permission: -

## Fluxo
1. Middleware: `AuthenticationMiddleware({ optional: false })`
2. Validator: nenhum (sem parametros de entrada)
3. UseCase: `UserGroupListUseCase`
   - Passa user._id e user.role do token JWT para o repositorio
   - Busca todos os grupos via `findMany({ user })`
   - Retorna array de grupos
4. Repository: `UserGroupContractRepository` - `findMany()`

## Regras de Negocio
- Retorna array direto (nao paginado)
- Filtragem pode variar por role do usuario (delegada ao repositorio)

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Token JWT ausente ou invalido |
| 500 | LIST_USER_GROUP_ERROR | Erro interno (banco, etc) |

## Testes
- Unit: `list.use-case.spec.ts`
- E2E: `list.controller.spec.ts`
