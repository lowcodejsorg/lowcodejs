# Seeders — Dados Iniciais do Banco

Scripts de seed para popular o MongoDB com permissões, grupos e usuários de
teste. Executados via `npm run seed` (em `docker exec`).

## Arquivos

| Arquivo                           | Descrição                                                                   |
| --------------------------------- | --------------------------------------------------------------------------- |
| `main.ts`                         | Orquestrador: glob nos arquivos `.seed.ts`, ordena por nome e executa sequencialmente |
| `1720448435-permissions.seed.ts`  | Cria 12 registros de permissão (CREATE_TABLE, VIEW_TABLE, etc.)            |
| `1720448445-user-group.seed.ts`   | Cria 4 grupos: MASTER, ADMINISTRATOR, MANAGER, REGISTERED com permissões   |
| `1720465892-users.seed.ts`        | Cria 5 usuários de teste com senhas bcrypt (rounds: 6)                     |

## Padrões

- **Idempotência**: usa upsert (`findOneAndUpdate` com `upsert: true`) para
  executar múltiplas vezes sem duplicar dados
- **Ordenação por timestamp**: prefixo numérico no nome do arquivo define a ordem
  de execução (dependências respeitadas)
- **Usuários de teste**: cada usuário recebe um grupo diferente para testar os 4
  níveis de role (MASTER > ADMINISTRATOR > MANAGER > REGISTERED)
- Senhas com baixo custo de bcrypt (rounds: 6) para performance em dev/test
