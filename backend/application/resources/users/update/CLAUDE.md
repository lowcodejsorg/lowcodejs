# Update User

Atualiza um usuario existente com novos dados, incluindo troca de senha opcional.

## Endpoint
`PATCH /users/:_id` | Auth: Yes | Permission: -

## Fluxo
1. Middleware: `AuthenticationMiddleware({ optional: false })`
2. Validator: `UserUpdateParamsValidator` - campos: _id (string, required, trim, min 1). `UserUpdateBodyValidator` (extends UserBaseValidator.partial()) - campos: name (string, trim, optional), email (string, email, trim, optional), group (string, min 1, optional), password (string, trim, min 6, regex PASSWORD_REGEX, optional), status (enum ACTIVE/INACTIVE, optional)
3. UseCase: `UserUpdateUseCase`
   - Busca usuario por _id exato
   - Se nao encontrado, retorna 404
   - Se password informado, gera hash com bcrypt (salt 12)
   - Atualiza usuario via repositorio
   - Retorna usuario atualizado
4. Repository: `UserContractRepository` - `findBy({ _id, exact: true })`, `update()`

## Regras de Negocio
- Todos os campos do body sao opcionais (PATCH parcial)
- Se password informado, e hasheado com bcrypt salt 12 antes de salvar
- Pode alterar status entre ACTIVE e INACTIVE
- UserBaseValidator e usado em modo `.partial()` (campos nao obrigatorios)

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 400 | INVALID_PAYLOAD_FORMAT | Falha na validacao Zod |
| 401 | AUTHENTICATION_REQUIRED | Token JWT ausente ou invalido |
| 404 | USER_NOT_FOUND | Usuario com _id informado nao existe |
| 500 | UPDATE_USER_ERROR | Erro interno (banco, etc) |

## Testes
- Unit: `update.use-case.spec.ts`
- E2E: `update.controller.spec.ts`
