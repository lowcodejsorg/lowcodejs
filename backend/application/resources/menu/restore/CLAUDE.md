# Restore Menu

Restaura um menu que esta na lixeira.

## Endpoint
`PATCH /menu/:_id/restore` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: MenuRestoreParamValidator - campos: _id (string, required, min 1)
3. UseCase:
   - Busca o menu pelo _id (trashed: true)
   - Verifica se o menu esta na lixeira (trashed=true)
   - Atualiza trashed=false e trashedAt=null via menuRepository.update
   - Retorna null
4. Repository: MenuContractRepository (findBy, update)

## Regras de Negocio
- Somente menus que estao na lixeira (trashed=true) podem ser restaurados
- Limpa os campos trashed e trashedAt
- Retorna 200 com body null

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | MENU_NOT_FOUND | Menu nao encontrado (busca com trashed: true) |
| 409 | NOT_TRASHED | Menu nao esta na lixeira |
| 500 | RESTORE_MENU_ERROR | Erro interno |

## Testes
- Unit: `restore.use-case.spec.ts` (nao existe ainda)
- E2E: `restore.controller.spec.ts` (nao existe ainda)
