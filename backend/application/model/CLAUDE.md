# Models

Mongoose schemas. Todos usam timestamps e soft delete (`trashed` + `trashedAt`).

## Entidades

| Model | Collection | Campos Principais | Relacoes |
|-------|-----------|-------------------|----------|
| `user.model.ts` | users | name, email, password, status | group -> UserGroup |
| `user-group.model.ts` | user-groups | name, slug, description | permissions -> [Permission] |
| `permission.model.ts` | permissions | name, slug, description | - |
| `table.model.ts` | tables | name, slug, _schema, type, style, visibility, collaboration, methods, groups, order, layoutFields | fields -> [Field], logo -> Storage, owner -> User, administrators -> [User] |
| `field.model.ts` | fields | name, slug, type, required, multiple, format, showIn*, widthIn*, locked, native, defaultValue | relationship.table -> Table, relationship.field -> Field, group -> FieldGroup |
| `storage.model.ts` | storage | filename, mimetype, size, originalName | Virtual: url (SERVER_URL/storage/filename) |
| `validation-token.model.ts` | validation-tokens | code, status | user -> User |
| `menu.model.ts` | menus | name, slug, type, url, html, order | table -> Table (nullable), parent -> Menu (self-ref), owner -> User |
| `reaction.model.ts` | reactions | type (LIKE/UNLIKE) | user -> User |
| `evaluation.model.ts` | evaluations | value (number) | user -> User |
| `setting.model.ts` | - | DTO apenas (nao e Mongoose model). Campos: SYSTEM_NAME, LOCALE, STORAGE_DRIVER, etc. |

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
