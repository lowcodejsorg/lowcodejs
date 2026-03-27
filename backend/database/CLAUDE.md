# Database

Seeders para dados iniciais. Executados via `npm run seed`.

## Seeders (`seeders/`)

Executados em ordem pelo timestamp no nome do arquivo:

| Arquivo | Descricao |
|---------|-----------|
| `1720448435-permissions.seed.ts` | Cria 12 permissoes (E_TABLE_PERMISSION). Limpa e insere |
| `1720448445-user-group.seed.ts` | Cria 4 grupos: MASTER (all), ADMINISTRATOR (all), MANAGER (CRUD+VIEW), REGISTERED (VIEW+CREATE_ROW) |
| `1720465892-users.seed.ts` | Cria 5 usuarios seed (admin, master, administrator, manager, registered). Upsert com bcrypt (rounds: 6) |
| `main.ts` | Orquestrador: encontra todos `*.seed.ts`, ordena por filename, executa sequencialmente |

## Execucao

```bash
npm run seed  # Executa todos seeders em ordem
```
