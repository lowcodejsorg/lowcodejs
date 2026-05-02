# Database

Seeders para dados iniciais (`seeders/`) e migrations one-time (`migrations/`).

## Seeders (`seeders/`)

Executados em ordem pelo timestamp no nome do arquivo:

| Arquivo | Descricao |
|---------|-----------|
| `1720448435-permissions.seed.ts` | Cria 12 permissoes (E_TABLE_PERMISSION). Upsert por `slug` com `$set` (metadados seguem o codigo) |
| `1720448445-user-group.seed.ts` | Cria 4 grupos: MASTER (all), ADMINISTRATOR (all), MANAGER (CRUD+VIEW), REGISTERED (VIEW+CREATE_ROW). Filtra soft-delete ao buscar permissions. Upsert por `slug`: `$set` em metadados, `$setOnInsert` em `permissions` (preserva customizacoes apos 1a criacao) |
| `1720465893-settings.seed.ts` | Cria Setting singleton. Se existe MASTER, marca SETUP_COMPLETED=true. Caso contrario, `$setOnInsert` vazio (preserva configs existentes) |
| `main.ts` | Orquestrador: descobre `*.seed.(ts|js)`, valida padrao de filename, ordena por nome, roda sequencialmente. Em falha: log + exit 1 + disconnect |

Usuario MASTER **nao** tem seed: e criado via Setup Wizard na UI na primeira execucao.

## Migrations (`migrations/`)

One-time, idempotentes via marcadores persistidos no documento Setting
singleton. Diferente de seeders, NAO seguem o padrao `<timestamp>-<nome>` —
sao scripts manuais executados via npm script dedicado.

| Arquivo | Descricao |
|---------|-----------|
| `migrate-dual-connection.ts` | Copia collections dinamicas do DB system (`DB_DATABASE`) para o DB data (`DB_DATA_DATABASE`). Le `tables` no source, copia cada slug para o target via `insertMany` (ignora duplicatas). Marca `Setting.MIGRATION_DUAL_CONNECTION_AT` ao final. Skip silencioso se marcador ja setado (a menos que `--force`) |

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
