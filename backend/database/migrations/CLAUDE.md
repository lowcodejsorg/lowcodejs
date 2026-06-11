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
| `migrate-backfill-row-slugs.ts` | `MIGRATION_ROW_SLUG_BACKFILL_AT` | Gera `sharedRowSlug` em rows antigas de tabelas com `rowSlugFieldId` configurado, habilitando a URL amigavel (`/tables/:slug/:rowSlug`) nos registros retroativos. Re-rodar com `--force` apos ativar o campo de slug numa tabela ja populada. |

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
