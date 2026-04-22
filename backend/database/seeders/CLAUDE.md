# Seeders — Dados Iniciais do Banco

Scripts de seed para popular o MongoDB com permissões, grupos e Setting
singleton. Executados via `npm run seed` (em `docker exec`).

O usuário MASTER **não** é criado por seed — é criado pelo Setup Wizard
na primeira execução da UI.

## Arquivos

| Arquivo                           | Descrição                                                                   |
| --------------------------------- | --------------------------------------------------------------------------- |
| `main.ts`                         | Orquestrador: glob nos `*.seed.(ts|js)`, valida padrão de filename, ordena e executa sequencialmente. Em falha: log + `process.exit(1)` + `mongoose.disconnect()` |
| `1720448435-permissions.seed.ts`  | Cria 12 registros de permissão (CREATE_TABLE, VIEW_TABLE, etc.). Upsert por `slug` com `$set` |
| `1720448445-user-group.seed.ts`   | Cria 4 grupos: MASTER, ADMINISTRATOR, MANAGER, REGISTERED. Metadados via `$set`; array `permissions` via `$setOnInsert` (preserva customizações após a 1ª criação). Busca apenas permissões com `trashed: false` |
| `1720465893-settings.seed.ts`     | Setting singleton. Se já existe MASTER, marca `SETUP_COMPLETED=true`. Caso contrário, usa `$setOnInsert: {}` (não sobrescreve configs existentes) |

## Padrões

- **Idempotência**: usa upsert (`bulkWrite`/`findOneAndUpdate` com `upsert: true`)
  para executar múltiplas vezes sem duplicar dados. `_id` é preservado quando o
  filter encontra documento.
- **Sobrescrita controlada**: metadados do código usam `$set` (code é fonte da
  verdade). Dados customizáveis pelo usuário (ex.: array de permissions do grupo)
  usam `$setOnInsert` para preservar ajustes manuais.
- **Ordenação por timestamp**: prefixo numérico no nome do arquivo define a ordem
  de execução. Filenames fora do padrão `\d{10,}-<nome>.seed.(ts|js)` fazem o
  orquestrador abortar antes de rodar qualquer seeder.
- **Fail-fast**: cada seeder roda dentro de `try/catch` no `main.ts`. Qualquer erro
  propaga com log do arquivo que falhou, `process.exit(1)` e `mongoose.disconnect()`.
