# Menu Empty Trash (Esvaziar Lixeira)

Remove permanentemente todos os menus que estão na lixeira.

## Endpoint

`DELETE /menu/empty-trash`

## Middleware

1. `AuthenticationMiddleware({ optional: false })`
2. `RoleMiddleware([E_ROLE.MASTER])`

## Response

```json
{ "deleted": 5 }
```

## Comportamento

- Carrega todos os menus com `trashed=true` via `findManyTrashed`.
- Aplica `deleteMany` sobre todos os IDs.
- Operação irreversível.

## Erros

| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Sem token |
| 403 | FORBIDDEN | Não é MASTER |
| 500 | EMPTY_TRASH_MENUS_ERROR | Erro interno |
