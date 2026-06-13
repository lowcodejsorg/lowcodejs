# Migrations

Migracoes one-time para o MongoDB. Idempotentes via marcadores no documento
Setting (singleton). Rodam automaticamente em `docker-entrypoint.sh` antes do
servidor subir; no segundo boot em diante sao no-op com 1 query.

## Arquivos

| Arquivo | Marker no Setting | Proposito |
|---------|-------------------|-----------|
| `migrate-dual-connection.ts` | `MIGRATION_DUAL_CONNECTION_AT` (+ `MIGRATION_DUAL_CONNECTION_DROPPED_AT` se rodar com `--drop-source`) | Copia collections dinamicas do DB **system** (`DB_DATABASE`) para o DB **data** (`DB_DATA_DATABASE`). Habilita o split em 2 conexoes Mongoose. |
| `migrate-group-native-fields.ts` | (idempotente por presenca dos campos nativos) | Garante que cada `Field` de tipo `FIELD_GROUP` tenha os campos nativos esperados em sua subtabela. |
| `migrate-backfill-storage-location.ts` | `MIGRATION_STORAGE_LOCATION_AT` | Popula o campo `location` em docs `Storage` existentes (necessario apos a feature `storage-migration`). |
| `migrate-backfill-row-slugs.ts` | `MIGRATION_ROW_SLUG_BACKFILL_AT` + `MIGRATION_ROW_SLUG_BACKFILL_FALLBACK_AT` | Gera `sharedRowSlug` em rows antigas, habilitando a URL amigavel (`/tables/:slug/:rowSlug`). Tabelas SEM `rowSlugFieldId` recebem fallback: pega o primeiro campo TEXT_SHORT ativo, seta `table.rowSlugFieldId` nele e faz o backfill. Vale para qualquer estilo de tabela (todo registro e uma row). Re-rodar com `--force` apos ativar o campo de slug numa tabela ja populada. |
| `migrate-table-permissions.ts` | `MIGRATION_TABLE_PERMISSIONS_AT` | Backfill do mapa `permissions` (10 acoes) + `members` (owner→OWNER, administrators→ADMIN) a partir dos campos legados `visibility`/`owner`/`administrators`. Acesso raw a `tables`. |
| `migrate-field-permissions.ts` | `MIGRATION_FIELD_PERMISSIONS_AT` | Backfill de `permissions.{list,form,detail}` a partir dos booleans legados `showInList/showInForm/showInDetail` (true→PUBLIC, false→NOBODY). Nao toca em `showInFilter`. |
| `migrate-menu-visibility.ts` | `MIGRATION_MENU_VISIBILITY_AT` | Define `visibility=PUBLIC` (binding visivel) nos menus sem o campo. |
| `migrate-drop-legacy-permission-fields.ts` | `MIGRATION_DROP_LEGACY_PERMISSION_FIELDS_AT` | `$unset` **permanente** dos campos legados (`visibility`/`collaboration`/`administrators` das tabelas; `showInList`/`showInForm`/`showInDetail` dos campos — **nao** `showInFilter`). Roda depois dos backfills 09/10/11. Como o dual-write dos legados foi removido, o drop e coerente e definitivo. Acesso raw (independente do schema Mongoose). |

## Comandos

```bash
npm run migrate:dual-connection                 # copia (skip se ja marcado)
npm run migrate:dual-connection -- --force      # re-executa ignorando marker
npm run migrate:dual-connection -- --drop-source  # apaga collections do DB system
                                                  # apos copia (manual; rodar
                                                  # apenas apos validar producao)
```

## Pattern de Migration

1. Abrir as 2 conexoes Mongoose (`MongooseConnect()`).
2. Checar marker no Setting; se ja setado, retornar no-op.
3. Executar mudanca (idempotente sempre que possivel).
4. Setar marker no Setting (timestamp).
5. Fechar conexoes.

## Quando criar nova migration

- Renomear/mover collection.
- Backfill de novo campo em docs existentes.
- Reestruturar dados que nao podem ser feitos em runtime via codigo
  defensivo.

Para alteracoes triviais idempotentes que rodam em todo boot, prefira
`database/seeders/`.
