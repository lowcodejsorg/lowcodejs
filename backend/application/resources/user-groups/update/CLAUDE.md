# Update User Group

Atualiza um grupo de usuarios existente com novos dados.

## Endpoint
`PATCH /user-group/:_id` | Auth: Yes | Permission: -

## Fluxo
1. Middleware: `AuthenticationMiddleware({ optional: false })`
2. Validator: `UserGroupUpdateParamsValidator` - campos: _id (string, required, trim, min 1). `UserGroupUpdateBodyValidator` - campos: name (string, trim, min 1, optional), description (string, trim, nullable, optional), permissions (array de strings, optional)
3. UseCase: `UserGroupUpdateUseCase`
   - Busca grupo por _id exato
   - Se nao encontrado, retorna 404
   - Se permissions informado e vazio (length === 0), retorna 400
   - Atualiza grupo via repositorio
   - Retorna grupo atualizado
4. Repository: `UserGroupContractRepository` - `findBy({ _id, exact: true })`, `update()`

## Regras de Negocio
- Todos os campos do body sao opcionais (PATCH parcial)
- Se permissions for enviado, nao pode ser array vazio (ao menos 1 obrigatoria)
- Description pode ser null

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 400 | INVALID_PAYLOAD_FORMAT | Falha na validacao Zod |
| 400 | - | Permissions enviado como array vazio |
| 401 | AUTHENTICATION_REQUIRED | Token JWT ausente ou invalido |
| 404 | USER_GROUP_NOT_FOUND | Grupo com _id informado nao existe |
| 500 | UPDATE_USER_GROUP_ERROR | Erro interno (banco, etc) |

## Testes
- Unit: `update.use-case.spec.ts`
- E2E: `update.controller.spec.ts`
