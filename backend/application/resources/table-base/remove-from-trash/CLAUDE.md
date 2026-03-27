# Remove Table from Trash

Restaura uma tabela da lixeira.

## Endpoint
`PATCH /tables/:slug/restore` | Auth: Sim | Permission: UPDATE_TABLE

## Fluxo
1. Middleware: AuthenticationMiddleware (required), TableAccessMiddleware (UPDATE_TABLE)
2. Validator: TableRemoveFromTrashParamsValidator - campos: slug (string, trim)
3. UseCase:
   - Busca tabela por slug exato
   - Verifica se esta na lixeira (trashed deve ser true)
   - Atualiza trashed=false e trashedAt=null
   - Retorna tabela atualizada
4. Repository: TableContractRepository.findBy, TableContractRepository.update

## Regras de Negocio
- Restaura tabela removendo marcacao de trashed
- Tabela que nao esta na lixeira gera conflito 409

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 409 | NOT_TRASHED | Tabela nao esta na lixeira |
| 500 | REMOVE_TABLE_FROM_TRASH_ERROR | Erro interno |

## Testes
- Unit: `remove-from-trash.use-case.spec.ts`
- E2E: `remove-from-trash.controller.spec.ts`
