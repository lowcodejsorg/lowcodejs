# UserGroup Bulk Delete (Hard Delete em Lote)

Exclui permanentemente múltiplos grupos que estejam na lixeira.

## Endpoint

`DELETE /user-group/bulk-delete`

## Middleware

1. `AuthenticationMiddleware({ optional: false })`
2. `RoleMiddleware([E_ROLE.MASTER])`

## Body

```json
{ "ids": ["<groupId1>", "<groupId2>"] }
```

## Regras

- Apenas `trashed=true`.
- Ignora grupos do sistema.
- Ignora grupos com usuários atribuídos.

## Erros

| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Sem token |
| 403 | FORBIDDEN | Não é MASTER |
| 500 | BULK_DELETE_GROUPS_ERROR | Erro interno |
