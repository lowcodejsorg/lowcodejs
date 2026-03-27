# Hard Delete Menu

Remove permanentemente um menu que ja esta na lixeira.

## Endpoint
`DELETE /menu/:_id/permanent` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: MenuHardDeleteParamValidator - campos: _id (string, required, min 1)
3. UseCase:
   - Busca o menu pelo _id (trashed: true)
   - Verifica se o menu esta na lixeira (trashed=true)
   - Remove permanentemente via menuRepository.delete
   - Retorna null
4. Repository: MenuContractRepository (findBy, delete)

## Regras de Negocio
- Somente menus que ja estao na lixeira (trashed=true) podem ser hard-deleted
- Remove o documento permanentemente do banco de dados
- Retorna 200 com body null

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | MENU_NOT_FOUND | Menu nao encontrado (busca com trashed: true) |
| 409 | NOT_TRASHED | Menu nao esta na lixeira |
| 500 | HARD_DELETE_MENU_ERROR | Erro interno |

## Testes
- Unit: `hard-delete.use-case.spec.ts` (nao existe ainda)
- E2E: `hard-delete.controller.spec.ts` (nao existe ainda)
