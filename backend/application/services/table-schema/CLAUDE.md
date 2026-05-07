# Table Schema Service

Gera o `_schema` (Mongoose schema) de uma tabela dinamica a partir dos
seus `fields` e `groups`, e materializa o modelo correspondente na conexao
**data** (`getDataConnection()`).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `table-schema-contract.service.ts` | Abstract class: `computeSchema(fields, groups?)`, `syncModel(table)` |
| `table-schema-mongoose.service.ts` | Implementacao default. Usa `application/core/builders/` para montar definicoes Mongoose a partir dos campos. |
| `table-schema-in-memory.service.ts` | Mock para testes |

## Contrato

```typescript
computeSchema(fields: IField[], groups?: IGroupConfiguration[]): ITableSchema
syncModel(table: ITable): Promise<void>
```

- `computeSchema`: funcao pura. Calcula a forma do schema a partir de
  campos e grupos sem tocar no banco. Retorno usado para persistir em
  `table._schema`.
- `syncModel`: registra/recompila o modelo Mongoose para a `table.slug`
  na conexao **data**. Necessario sempre que `_schema` muda (criar/deletar
  campo, alterar tipo, etc.) para que queries subsequentes vejam a forma
  nova.

## Uso

- `table-base/create.use-case.ts`: cria tabela, computa schema, sync.
- `table-fields/{create,update,delete}.use-case.ts`: apos alterar campos,
  recomputa schema da tabela e chama `syncModel`.
- `tools/import-table.use-case.ts`: idem, em batch.

DI: `injectablesHolder.injectService(TableSchemaContractService, TableSchemaMongooseService)`
