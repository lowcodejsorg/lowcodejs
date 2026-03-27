# Table Base

CRUD e gerenciamento de tabelas dinamicas da plataforma low-code.

## Entidade

`ITable` - Tabela dinamica com campos, schema, visibilidade, estilo e colaboracao.

## Endpoints

| Operacao | Metodo | Rota | Auth | Permissao |
|----------|--------|------|------|-----------|
| create | POST | `/tables` | Sim | CREATE_TABLE |
| paginated | GET | `/tables/paginated` | Sim | - |
| show | GET | `/tables/:slug` | Opcional | VIEW_TABLE |
| update | PUT | `/tables/:slug` | Sim | UPDATE_TABLE |
| delete | DELETE | `/tables/:slug` | Sim | REMOVE_TABLE |
| send-to-trash | PATCH | `/tables/:slug/trash` | Sim | UPDATE_TABLE |
| remove-from-trash | PATCH | `/tables/:slug/restore` | Sim | UPDATE_TABLE |

## Repositorios

- `TableContractRepository` - CRUD de tabelas, renameSlug, dropCollection, findByFieldIds, updateMany
- `FieldContractRepository` - CRUD de campos, createMany, deleteMany, updateRelationshipTableSlug
- `UserContractRepository` - Validacao de administradores ativos (usado no update)

## Schema Base

Definido em `table-base.schema.ts`: TableStyleSchema, TableVisibilitySchema, TableCollaborationSchema, TableAdministratorsSchema, TableFieldOrderListSchema, TableFieldOrderFormSchema, TableOrderSchema, TableLayoutFieldsSchema, TableMethodSchema.
