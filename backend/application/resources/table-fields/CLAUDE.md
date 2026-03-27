# Table Fields

CRUD e gerenciamento de campos de uma tabela dinamica.

## Entidade

`IField` - Campo de tabela com tipo, formato, visibilidade, validacao e configuracoes (relationship, dropdown, category, group).

## Endpoints

| Operacao | Metodo | Rota | Auth | Permissao |
|----------|--------|------|------|-----------|
| create | POST | `/tables/:slug/fields` | Sim | CREATE_FIELD |
| show | GET | `/tables/:slug/fields/:_id` | Sim | VIEW_FIELD |
| update | PUT | `/tables/:slug/fields/:_id` | Sim | UPDATE_FIELD |
| delete | DELETE | `/tables/:slug/fields/:_id` | Sim | REMOVE_FIELD |
| send-to-trash | PATCH | `/tables/:slug/fields/:_id/trash` | Sim | UPDATE_FIELD |
| remove-from-trash | PATCH | `/tables/:slug/fields/:_id/restore` | Sim | UPDATE_FIELD |
| add-category | POST | `/tables/:slug/fields/:_id/category` | Sim | UPDATE_FIELD |

## Repositorios

- `TableContractRepository` - Acesso e atualizacao da tabela pai
- `FieldContractRepository` - CRUD de campos, createMany, update, delete

## Schema Base

Definido em `table-field-base.schema.ts`: required, multiple, format, showInFilter, showInForm, showInDetail, showInList, widthInForm, widthInList, widthInDetail, locked, defaultValue, relationship, dropdown, category, group.
