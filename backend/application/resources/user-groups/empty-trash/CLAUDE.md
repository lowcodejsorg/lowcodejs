# UserGroup Empty Trash

Esvazia a lixeira de grupos, excluindo permanentemente todos os grupos
não-sistema sem usuários atribuídos.

## Endpoint

`DELETE /user-group/empty-trash`

## Middleware

1. `AuthenticationMiddleware({ optional: false })`
2. `RoleMiddleware([E_ROLE.MASTER])`

## Erros

| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Sem token |
| 403 | FORBIDDEN | Não é MASTER |
| 500 | EMPTY_TRASH_GROUPS_ERROR | Erro interno |
