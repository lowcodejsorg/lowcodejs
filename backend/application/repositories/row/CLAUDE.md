# repositories/row — Repositório de Rows

Camada de acesso a dados para registros (rows) das tabelas dinâmicas. Os schemas
Mongoose são gerados em runtime com base nos campos configurados na tabela.

## Arquivos

| Arquivo                      | Descrição                                                               |
| ---------------------------- | ----------------------------------------------------------------------- |
| `row-contract.repository.ts` | Interface abstrata com todos os métodos de acesso a rows               |
| `row-in-memory.repository.ts`| Implementação in-memory para testes unitários                          |
| `row-mongoose.repository.ts` | Implementação Mongoose para produção (schema dinâmico por tabela)      |

## Responsabilidades

- CRUD básico: `create`, `findById`, `findPaginated`, `update`, `delete`
- Soft delete: `trash`, `restore` (flag `trashed`)
- Bulk: `bulkTrash`, `bulkRestore`, `bulkDelete`
- Group items (subdocumentos de campos tipo FIELD_GROUP): `addGroupItem`,
  `updateGroupItem`, `deleteGroupItem`
- Campo atomicamente: `setFieldAndSave()` — usado por reactions e evaluations
- Relacionamentos: `buildPopulate()` — popula campos do tipo RELATIONSHIP

## Contexto Dinâmico (`RowTableContext`)

Cada operação recebe `RowTableContext` com a definição completa da tabela
(`ITable` + `IField[]`), usado para:
- Construir o modelo Mongoose dinâmico correto para a coleção da tabela
- Aplicar populate nos campos de relacionamento
- Filtrar e ordenar por campos específicos da tabela
