# Menu Bulk Trash

Envia múltiplos menus para a lixeira em uma única operação, aplicando cascata
para os descendentes de cada menu selecionado.

## Endpoint

`PATCH /menu/bulk-trash`

## Middleware

1. `AuthenticationMiddleware({ optional: false })`
2. `RoleMiddleware([E_ROLE.MASTER, E_ROLE.ADMINISTRATOR])`

## Body

```json
{ "ids": ["<menuId1>", "<menuId2>"] }
```

## Response

```json
{ "modified": 5 }
```

## Comportamento

- Para cada `id` informado, busca descendentes via `findDescendantIds` e
  inclui no batch antes do `updateMany`.
- Apenas menus com `trashed=false` são afetados (`filterTrashed: false`).
- Retorna a quantidade total efetivamente alterada.

## Erros

| Code | Cause | Quando |
|------|-------|--------|
| 401 | AUTHENTICATION_REQUIRED | Sem token |
| 403 | FORBIDDEN | Role insuficiente |
| 500 | BULK_TRASH_MENUS_ERROR | Erro interno |
