# Migrations

Migracoes one-time para o MongoDB. Idempotentes via marcadores no documento
Setting (singleton). Rodam automaticamente em `docker-entrypoint.sh` antes do
servidor subir; no segundo boot em diante sao no-op com 1 query.

## Arquivos

| Arquivo | Marker no Setting | Proposito |
|---------|-------------------|-----------|
| `migrate-dual-connection.ts` | `MIGRATION_DUAL_CONNECTION_AT` (+ `MIGRATION_DUAL_CONNECTION_DROPPED_AT` se rodar com `--drop-source`) | Copia collections dinamicas do DB **system** (`DB_DATABASE`) para o DB **data** (`DB_DATA_DATABASE`). Habilita o split em 2 conexoes Mongoose. |
| `migrate-group-native-fields.ts` | `MIGRATION_NATIVE_FIELDS_AT` (idempotente por presenca dos campos nativos) | Garante os campos nativos esperados tanto no **nivel raiz** de cada tabela (`FIELD_NATIVE_LIST`, anexando aos `fieldOrder*`) quanto em cada subtabela de grupo de campos (`FIELD_GROUP_NATIVE_LIST`). Cobre os nativos de auditoria `updatedAt` (UPDATED_AT) e `updatedBy` (UPDATED_BY); o marker foi versionado p/ re-rodar uma vez em bases ja migradas. Nao toca nos dados das rows (`updatedAt` vem do `timestamps`; `updatedBy` e gravado na proxima edicao). |
| `migrate-backfill-storage-location.ts` | `MIGRATION_STORAGE_LOCATION_AT` | Popula o campo `location` em docs `Storage` existentes (necessario apos a feature `storage-migration`). |
| `migrate-backfill-row-slugs.ts` | `MIGRATION_ROW_SLUG_BACKFILL_AT` + `MIGRATION_ROW_SLUG_BACKFILL_FALLBACK_AT` | Gera `sharedRowSlug` em rows antigas, habilitando a URL amigavel (`/tables/:slug/:rowSlug`). Tabelas SEM `rowSlugFieldId` recebem fallback: pega o primeiro campo TEXT_SHORT ativo, seta `table.rowSlugFieldId` nele e faz o backfill. Vale para qualquer estilo de tabela (todo registro e uma row). Re-rodar com `--force` apos ativar o campo de slug numa tabela ja populada. |
| `migrate-backfill-logger-audit.ts` | `MIGRATION_LOGGER_AUDIT_AT` | Copia para os logs do historico (`/logs`) os dados do **registro referenciado**: para cada log de objeto `ROW`, le `creator`/`updatedBy`/`createdAt`/`updatedAt` da row referenciada e grava no proprio log (`creator`, `updatedBy`, `objectCreatedAt`, `objectUpdatedAt`). Reaproveita o resolver `application/core/logger/resolve-object-audit.ts` (mesma logica usada no `logger.hook`). Le `logs`+`tables` no DB system e as rows no DB data; objetos que nao sao ROW ficam null. Idempotente (re-rodar reproduz o mesmo resultado). |
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
