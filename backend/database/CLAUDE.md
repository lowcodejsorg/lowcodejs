# Database

Seeders para dados iniciais (`seeders/`) e migrations one-time (`migrations/`).

## Seeders (`seeders/`)

Executados em ordem pelo timestamp no nome do arquivo:

| Arquivo | Descricao |
|---------|-----------|
| `1720448435-permissions.seed.ts` | Cria 19 permissoes: 12 de tabela (E_TABLE_PERMISSION) + 7 capacidades de area (E_AREA_CAPABILITY, inclui MANAGE_CHAT). Upsert por `slug` com `$set` (metadados seguem o codigo) |
| `1720448445-user-group.seed.ts` | Cria 4 grupos: MASTER (all), ADMINISTRATOR (all), MANAGER (CRUD+VIEW), REGISTERED (VIEW+CREATE_ROW). Filtra soft-delete ao buscar permissions. Upsert por `slug`: `$set` em metadados, `$setOnInsert` em `permissions` (preserva customizacoes apos 1a criacao) |
| `1720465893-settings.seed.ts` | Cria Setting singleton. Se existe MASTER, marca SETUP_COMPLETED=true. Caso contrario, `$setOnInsert` vazio (preserva configs existentes) |
| `1778025600-demo-users.seed.ts` | **Gated por `DEMO_MODE=true`**. Cria/atualiza 2 usuarios publicos (`admin@admin.com` → ADMINISTRATOR, `registered@registered.com` → REGISTERED) com `$set` em todos os campos. Password re-hashado a cada execucao. No-op silencioso quando `DEMO_MODE=false` |
| `main.ts` | Orquestrador: descobre `*.seed.(ts|js)`, valida padrao de filename, ordena por nome, roda sequencialmente. Em falha: log + exit 1 + disconnect |

Usuario MASTER **nao** tem seed: e criado via Setup Wizard na UI na primeira execucao.

## Migrations (`migrations/`)

One-time, idempotentes via marcadores persistidos no documento Setting
singleton. Diferente de seeders, NAO seguem o padrao `<timestamp>-<nome>` —
sao scripts manuais executados via npm script dedicado.

| Arquivo | Descricao |
|---------|-----------|
| `migrate-dual-connection.ts` | Copia collections dinamicas do DB system (`DB_DATABASE`) para o DB data (`DB_DATA_DATABASE`). Le `tables` no source, copia cada slug para o target via `insertMany` (ignora duplicatas). Marca `Setting.MIGRATION_DUAL_CONNECTION_AT` ao final. Skip silencioso se marcador ja setado (a menos que `--force`) |
| `migrate-backfill-relationship-create-records.ts` | Backfill de `allowCreateRelationshipRecords=false` em Field docs onde a propriedade ainda nao existe (nunca sobrescreve). Marcador `MIGRATION_RELATIONSHIP_CREATE_RECORDS_AT` |
| `migrate-backfill-row-slugs.ts` | Backfill de `sharedRowSlug` em rows dinamicas sem slug, usando o mesmo algoritmo do create/update; tabelas legadas sem `rowSlugFieldId` ganham fallback (primeiro TEXT_SHORT ativo, persistido na table) |
| `migrate-backfill-storage-location.ts` | Backfill de `location` e `migration_status` em Storage docs faltantes (driver lido do Setting, nao de env). Marcador `MIGRATION_STORAGE_LOCATION_AT` |
| `migrate-extension-slots.ts` | Renomeia `slot: string \| null` para `slots: string[]` em todos os docs da collection `extensions` e remove o campo antigo. Marcador `MIGRATION_EXTENSION_SLOTS_AT` |
| `migrate-group-native-fields.ts` | Garante os campos nativos no nivel raiz da tabela (`FIELD_NATIVE_LIST` + `fieldOrder*`) e em cada `Table.groups[*]` (`FIELD_GROUP_NATIVE_LIST`), criando os faltantes na collection `fields`. Idempotente por slug. Marcador versionado `MIGRATION_NATIVE_FIELDS_AT` (re-roda uma vez em bases que so tinham `MIGRATION_GROUP_NATIVE_FIELDS_AT`, p/ backfill de `updatedAt`/`updater`) |
| `migrate-relationship-table-id.ts` | Backfill de `relationship.table._id` em Fields RELATIONSHIP (lookup por slug), tornando refs slug-independentes. Marcador `MIGRATION_RELATIONSHIP_TABLE_ID_AT` |
| `migrate-row-status-trashed.ts` | Introduz `status`/`draftAt` em rows dinamicas (e itens FIELD_GROUP embedded) e remove o boolean `trashed` — trash passa a ser derivado de `trashedAt`. Roda no DB data |

### Execucao

```bash
# Copia (idempotente — skip se ja migrado)
npm run seed                                     # primeiro: seed
npm run migrate:dual-connection                  # depois: migracao
# Em container, ambos rodam automaticamente via docker-entrypoint.sh

# Re-executar copia mesmo com marcador setado
npm run migrate:dual-connection -- --force

# Apagar collections do DB system apos copia (MANUAL, apenas apos validacao em prod)
npm run migrate:dual-connection -- --drop-source

# Idem em producao (dentro do container)
docker exec -it low-code-js-api npm run migrate:dual-connection:prod -- --drop-source
```

Pre-requisitos para `--drop-source` em producao:
1. Backup completo do MongoDB (`mongodump` ou snapshot)
2. App rodando ha pelo menos alguns dias com dados sendo escritos no DB data
3. Validacao de que populate de USER/FILE/RELATIONSHIP funciona normalmente

A migracao recusa drop se `MIGRATION_DUAL_CONNECTION_AT` ainda nao foi setado
(ou seja, copia nunca completou) — protege contra perda de dados.
