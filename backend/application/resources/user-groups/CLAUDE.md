# User Groups Resource

Gerenciamento de grupos de usuarios com permissoes (CRUD + listagem).

## Entidade

`IGroup` - definida em `@application/core/entity.core`

## Repositorio

`UserGroupContractRepository` -> `UserGroupMongooseRepository`

## Endpoints

| Operacao | Metodo | Rota | Descricao |
|----------|--------|------|-----------|
| create | POST | `/user-group` | Criar novo grupo de usuarios |
| list | GET | `/user-group` | Listar todos os grupos (sem paginacao) |
| paginated | GET | `/user-group/paginated` | Listar grupos com paginacao |
| show | GET | `/user-group/:_id` | Buscar grupo por ID |
| update | PATCH | `/user-group/:_id` | Atualizar grupo |

## Auth

Todas as operacoes exigem autenticacao (`AuthenticationMiddleware({ optional: false })`).
