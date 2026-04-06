# _types — Declarações de Tipos TypeScript

Augmentações de módulos (module augmentation) para estender tipos do framework
Fastify com propriedades customizadas injetadas pelos middlewares.

## Arquivos

| Arquivo                   | Descrição                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `fastify.d.ts`            | Estende `FastifyRequest` com `table?` (tabela dinâmica) e `ownership?` (ownership) |
| `fastify-jwt.d.ts`        | Stubs de tipos para `@fastify/jwt`                                                 |
| `fastify-multipart.d.ts`  | Stubs de tipos para `@fastify/multipart`                                           |

## Uso

O middleware `table-access.middleware.ts` injeta `request.table` com os dados da
tabela dinâmica após validar acesso. Controllers de tabelas dinâmicas consomem
`request.table` sem precisar rebuscar do banco.

`request.ownership` é injetado com informações de propriedade do recurso para
uso em verificações de permissão granular nos use-cases.
