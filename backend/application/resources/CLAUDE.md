# Resources

16 recursos REST organizados por dominio. Cada recurso possui subdiretorios por operacao.

## Estrutura por Operacao

Cada operacao (ex: `users/create/`) contem:
- `{op}.controller.ts` - Roteamento HTTP + middleware stack
- `{op}.use-case.ts` - Logica de negocio (Either pattern)
- `{op}.validator.ts` - Validacao Zod
- `{op}.schema.ts` - Documentacao OpenAPI
- `{op}.use-case.spec.ts` - Teste unitario
- `{op}.controller.spec.ts` - Teste e2e

## Recursos

| Recurso | Base Route | Operacoes | Auth | Entidade |
|---------|-----------|-----------|------|----------|
| `authentication/` | `/authentication` | sign-in, sign-up, sign-out, magic-link, refresh-token, request-code, validate-code, reset-password | Misto | User, ValidationToken |
| `users/` | `/users` | create, paginated, show, update | Sim | User |
| `user-groups/` | `/user-group` | create, paginated, list, show, update | Sim | UserGroup |
| `table-base/` | `/tables` | create, paginated, show, update, delete, send-to-trash, remove-from-trash | Misto | Table |
| `table-fields/` | `/tables/:slug/fields` | create, show, update, delete, send-to-trash, remove-from-trash, add-category | Sim | Field |
| `table-rows/` | `/tables/:slug/rows` | create, paginated, show, update, delete, send-to-trash, remove-from-trash, bulk-trash, bulk-restore, reaction, evaluation, forum-message | Misto | Row (dinamico) |
| `group-fields/` | `/tables/:slug/groups/:groupSlug/fields` | create, list, show, update, send-to-trash | Sim | Field (embedded) |
| `group-rows/` | `/tables/:slug/rows/:rowId/groups/:groupSlug` | create, list, show, update, delete | Sim | Row (embedded) |
| `menu/` | `/menu` | create, list, paginated, show, update, delete, hard-delete, restore, reorder | Sim | Menu |
| `permissions/` | `/permissions` | list | Sim | Permission |
| `profile/` | `/profile` | show, update | Sim | User |
| `setting/` | `/setting` | show, update | Misto | Setting |
| `pages/` | `/pages` | show | Sim | Menu (type=PAGE) |
| `storage/` | `/storage` | upload (POST), delete | Sim | Storage |
| `tools/` | `/tools` | clone-table, export-table, import-table | Sim | Table |
| `chat/` | `/chat` | upload | Sim | - (WebSocket) |

## Middleware Stack Padrao

```
1. AuthenticationMiddleware({ optional: true/false })
2. TableAccessMiddleware({ requiredPermission: E_TABLE_PERMISSION.* })  // quando envolve tabela
```

## Formato de Resposta Padrao

- **Create**: 201, body com entidade criada
- **Read**: 200, body com entidade ou Paginated
- **Update**: 200, body com entidade atualizada
- **Delete/Trash**: 200 ou null
- **Erro**: `{ message, code, cause, errors? }` — mensagens sempre em PT-BR

## Padrao de Erros

- Mensagens de HTTPException devem ser em PT-BR
- Controllers propagam errors via `...(error.errors && { errors: error.errors })`
- Response schemas (`*.schema.ts`) incluem `errors: { type: 'object', additionalProperties: { type: 'string' } }` em todos os blocos de erro para evitar que o Fastify remova a propriedade na serializacao
- `errors` e um mapa campo→mensagem usado pelo frontend para exibir erros nos formularios
