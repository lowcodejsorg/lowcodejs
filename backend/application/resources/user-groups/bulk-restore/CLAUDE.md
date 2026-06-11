# UserGroup Bulk Restore

Restaura múltiplos grupos da lixeira.

## Endpoint

`PATCH /user-group/bulk-restore`

## Middleware

1. `AuthenticationMiddleware({ optional: false })`
2. `RoleMiddleware([E_ROLE.MASTER])`

## Body

```json
{ "ids": ["<groupId1>", "<groupId2>"] }
```

## Erros

| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Sem token |
| 403 | FORBIDDEN | Não é MASTER |
| 500 | BULK_RESTORE_GROUPS_ERROR | Erro interno |
