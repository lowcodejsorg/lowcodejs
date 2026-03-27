# Delete Menu (Soft Delete)

Envia um menu para a lixeira (soft delete).

## Endpoint
`DELETE /menu/:_id` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: MenuDeleteParamValidator - campos: _id (string, required, min 1)
3. UseCase:
   - Busca o menu pelo _id (nao-trashed)
   - Conta filhos ativos (nao-trashed) do menu
   - Se tem filhos ativos, bloqueia a exclusao
   - Marca trashed=true e trashedAt=now via menuRepository.update
   - Retorna null
4. Repository: MenuContractRepository (findBy, count, update)

## Regras de Negocio
- NAO permite deletar menu que possui filhos ativos (nao-trashed)
- E um soft delete: marca trashed=true e trashedAt com data atual
- Retorna 200 com body null

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | MENU_NOT_FOUND | Menu nao encontrado ou ja esta na lixeira |
| 409 | MENU_HAS_CHILDREN | Menu possui filhos ativos |
| 500 | DELETE_MENU_ERROR | Erro interno |

## Testes
- Unit: `delete.use-case.spec.ts`
- E2E: `delete.controller.spec.ts`
