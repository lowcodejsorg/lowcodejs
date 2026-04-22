# Database

Seeders para dados iniciais. Executados via `npm run seed`.

## Seeders (`seeders/`)

Executados em ordem pelo timestamp no nome do arquivo:

| Arquivo | Descricao |
|---------|-----------|
| `1720448435-permissions.seed.ts` | Cria 12 permissoes (E_TABLE_PERMISSION). Upsert por `slug` com `$set` (metadados seguem o codigo) |
| `1720448445-user-group.seed.ts` | Cria 4 grupos: MASTER (all), ADMINISTRATOR (all), MANAGER (CRUD+VIEW), REGISTERED (VIEW+CREATE_ROW). Filtra soft-delete ao buscar permissions. Upsert por `slug`: `$set` em metadados, `$setOnInsert` em `permissions` (preserva customizacoes apos 1a criacao) |
| `1720465893-settings.seed.ts` | Cria Setting singleton. Se existe MASTER, marca SETUP_COMPLETED=true. Caso contrario, `$setOnInsert` vazio (preserva configs existentes) |
| `main.ts` | Orquestrador: descobre `*.seed.(ts|js)`, valida padrao de filename, ordena por nome, roda sequencialmente. Em falha: log + exit 1 + disconnect |

Usuario MASTER **nao** tem seed: e criado via Setup Wizard na UI na primeira execucao.

## Execucao

```bash
npm run seed  # Executa todos seeders em ordem
```
