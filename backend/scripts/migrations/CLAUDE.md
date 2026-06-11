# scripts/migrations — Wrappers Shell das Migrations

Wrappers `.sh` numerados que executam, em ordem, as migrations one-time do
backend. São o ponto de entrada usado no boot do container: o
`docker-entry-point.sh` faz um loop sobre `scripts/migrations/*.sh` **antes**
de rodar os seeders e iniciar o servidor.

Cada `.sh` apenas localiza e invoca o arquivo TS irmão em
`backend/database/migrations/` (via `node --import @swc-node/register/esm-register`,
ou o `.js` compilado em produção) sob o usuário non-root `1001:1001`
(`su-exec` quando disponível). A **lógica e a idempotência** vivem no TS — o
shell é só orquestração e ordenação. Ver `backend/database/CLAUDE.md` para o
mecanismo de marcadores no documento Setting singleton.

## Passos

| Ordem | Script | Migration TS | O que faz |
| ----- | ------ | ------------ | --------- |
| 01 | `01-dual-connection.sh` | `migrate-dual-connection.ts` | Copia collections dinâmicas do DB system (`DB_DATABASE`) para o DB data (`DB_DATA_DATABASE`), habilitando o split em 2 conexões. Marker `MIGRATION_DUAL_CONNECTION_AT` |
| 02 | `02-group-native-fields.sh` | `migrate-group-native-fields.ts` | Garante os 5 campos nativos (`_id`, `creator`, `createdAt`, `trashed`, `trashedAt`) em cada subtabela `FIELD_GROUP`. Verifica presença antes de inserir |
| 03 | `03-backfill-storage-location.sh` | `migrate-backfill-storage-location.ts` | Popularia `location`/`migration_status` em docs Storage. **Atualmente desativado** (corpo comentado no `.sh`); o backfill roda pela própria feature de storage-migration. Marker `MIGRATION_STORAGE_LOCATION_AT` |
| 04 | `04-backfill-relationship-create-records.sh` | `migrate-backfill-relationship-create-records.ts` | Backfilla registros de criação em campos de relacionamento existentes |
| 05 | `05-extension-slots.sh` | `migrate-extension-slots.ts` | Renomeia o campo `slot` → `slots` (array) nos documentos de extensão (após refatoração da API) |
| 06 | `06-relationship-table-id.sh` | `migrate-relationship-table-id.ts` | Backfilla `relationship.table._id` em Fields `RELATIONSHIP` sem `_id`, tornando refs slug-independentes. Marker `MIGRATION_RELATIONSHIP_TABLE_ID_AT` |
| 07 | `07-row-status-trashed.sh` | `migrate-row-status-trashed.ts` | Backfilla `status`/`draftAt` e remove o boolean `trashed` das rows e itens de grupo; lixeira passa a ser só `trashedAt`. Marker `MIGRATION_ROW_STATUS_TRASHED_AT` |
| 08 | `08-backfill-row-slugs.sh` | `migrate-backfill-row-slugs.ts` | Gera `sharedRowSlug` para rows antigas de tabelas com `rowSlugFieldId`, habilitando a URL amigável retroativa. Marker `MIGRATION_ROW_SLUG_BACKFILL_AT` |

## Fluxo

```
docker-entry-point.sh:
  for script in scripts/migrations/*.sh; do sh "$script"; done   # ordem 01→08
  npm run seed                                                    # seeders idempotentes
  exec <server>                                                   # inicia a API
```

Cada `.sh` resolve `MIGRATION_DIR` (`/app/database/migrations` no container, ou
caminho relativo em dev) e prefere o `.ts` quando presente, caindo para o `.js`
compilado.

## Convenções

- **Numeração = ordem de execução**: o loop usa glob ordenado. Novas migrations
  ganham o próximo número (`09-...`).
- **Idempotência sempre no TS**: skip via marker no Setting (ou checagem de
  presença). Rodar o loop N vezes deve ser no-op a partir da 2ª.
- **`set -e`**: qualquer falha aborta o boot do container.

## Gotchas

- Estes `.sh` **não** são os `npm run migrate:*` documentados no CLAUDE.md raiz
  — aqueles são atalhos manuais para a `dual-connection` (com flags `--force`,
  `--drop-source`). Os wrappers aqui chamam o `node` direto, sem npm script.
- `03-backfill-storage-location.sh` está com o corpo comentado: o `.sh` imprime
  o aviso mas não executa nada. Não reative sem confirmar que a feature de
  storage-migration não cobre o backfill.
- Comentários no topo de cada `.sh` documentam propósito, marker e
  idempotência — mantenha-os ao editar.
