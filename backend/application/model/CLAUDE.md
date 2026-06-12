# Models

Mongoose schemas. Todos usam timestamps e soft delete (`trashed` + `trashedAt`).
Os 11 models vivem na **conexao system** (database `DB_DATABASE`, default
`lowcodejs`). Collections de dados de tabelas dinamicas (criadas pelo usuario
no low-code) vivem na **conexao data** (`DB_DATA_DATABASE`, default
`lowcodejs_data`) e sao registradas em runtime via `buildTable(table, getDataConnection())`,
NAO neste diretorio.

## Entidades

| Model | Collection | Campos Principais | Relacoes |
|-------|-----------|-------------------|----------|
| `user.model.ts` | users | name, email, password, status, groups | group -> UserGroup (legado), groups -> [UserGroup] |
| `user-group.model.ts` | user-groups | name, slug, description, encompasses | permissions -> [Permission], encompasses -> [UserGroup] (fecho transitivo) |
| `permission.model.ts` | permissions | name, slug, description | - |
| `table.model.ts` | tables | name, slug, _schema, type, style, permissions (mapa acao→binding), members, methods, groups, order, layoutFields, visibility/collaboration/administrators (legados) | fields -> [Field], logo -> Storage, owner -> User, members[].user -> User |
| `field.model.ts` | fields | name, slug, type, required, multiple, format, permissions ({list,form,detail}), widthIn*, locked, native, defaultValue, showIn* (legados) | relationship.table -> Table, relationship.field -> Field, group -> FieldGroup |
| `storage.model.ts` | storage | filename, mimetype, size, originalName | Virtual: url (SERVER_URL/storage/filename) |
| `validation-token.model.ts` | validation-tokens | code, status | user -> User |
| `menu.model.ts` | menus | name, slug, type, url, html, order, visibility (binding {kind,group}; null = legado/visivel) | table -> Table (nullable), parent -> Menu (self-ref), owner -> User |
| `reaction.model.ts` | reactions | type (LIKE/UNLIKE) | user -> User |
| `evaluation.model.ts` | evaluations | value (number) | user -> User |
| `setting.model.ts` | settings | Singleton com configuracoes globais: SYSTEM_NAME, LOCALE, STORAGE_DRIVER, EMAIL_PROVIDER_*, OPENAI_API_KEY, SETUP_COMPLETED, MIGRATION_DUAL_CONNECTION_AT, MIGRATION_DUAL_CONNECTION_DROPPED_AT, etc. | MODEL_CLONE_TABLES -> [Table] |

## Campos Base (todas as entidades)

```typescript
{
  _id: ObjectId (auto),
  createdAt: Date (auto),
  updatedAt: Date (auto),
  trashed: Boolean (default: false),
  trashedAt: Date (default: null)
}
```

## Campos Nativos de Tabelas Dinamicas

Toda tabela criada no low-code recebe automaticamente 5 campos nativos:
- `_id` (IDENTIFIER), `creator` (CREATOR), `createdAt` (CREATED_AT), `trashed` (TRASHED), `trashedAt` (TRASHED_AT)

## Modelo de Permissoes (campos por entidade)

O RBAC foi reescrito. Os campos abaixo materializam o novo modelo; ver
`services/permission/` e `middlewares/` para o enforcement.

- **user**: `groups[]` (varios grupos). `group` (singular) **mantido** como
  legado/fallback.
- **user-group**: `encompasses[]` — grupos englobados (fecho transitivo).
- **table**: `permissions` (mapa das 10 acoes → binding `{ kind, group }` com
  `kind ∈ PUBLIC|NOBODY|GROUP`), `members[]` (`{ user, profile }`,
  `profile ∈ owner|admin|editor|contributor|viewer`), `owner`.
- **field**: `permissions: { list, form, detail }` — binding por contexto.
- **menu**: `visibility` — binding por opcao de menu.

### Campos legados (deprecated, mantidos para compat/fallback)

`table.visibility`, `table.collaboration`, `table.administrators[]`,
`field.showInList/showInForm/showInFilter/showInDetail`. O enforcement so cai
no modelo legado quando o campo novo correspondente esta ausente (ex:
`table.permissions == null`). As migrations 09/10/11 (idempotentes) fazem o
backfill no `docker-entrypoint.sh`.
