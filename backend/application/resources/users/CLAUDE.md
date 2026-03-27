# Users Resource

Gerenciamento de usuarios da plataforma (CRUD).

## Entidade

`IUser` - definida em `@application/core/entity.core`

## Repositorio

`UserContractRepository` -> `UserMongooseRepository`

## Endpoints

| Operacao | Metodo | Rota | Descricao |
|----------|--------|------|-----------|
| create | POST | `/users` | Criar novo usuario |
| paginated | GET | `/users/paginated` | Listar usuarios com paginacao |
| show | GET | `/users/:_id` | Buscar usuario por ID |
| update | PATCH | `/users/:_id` | Atualizar usuario |

## Auth

Todas as operacoes exigem autenticacao (`AuthenticationMiddleware({ optional: false })`).

## Validator Base

`user-base.validator.ts` - Schema Zod reutilizado por create e update:
- `name`: string, required, trim, min 1
- `email`: string, email, trim
- `group`: string, required, min 1
