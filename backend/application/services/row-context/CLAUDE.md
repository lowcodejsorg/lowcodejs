# Row Context Service

Transforma documentos Row para inserir/expor contexto do usuario corrente
(autor, ultimo editor, etc.) em campos nativos de tabelas dinamicas.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `row-context-contract.service.ts` | Abstract class: `transform(row, fields, userId?)` |
| `row-context.service.ts` | Implementacao default. Preenche campos de USER/AUTHOR baseado em `userId` e nos `fields` da tabela. |
| `in-memory-row-context.service.ts` | Mock para testes |

## Contrato

```typescript
transform(row: IRow, fields: IField[], userId?: string): IRow
```

Retorna o `row` com campos nativos preenchidos quando aplicavel. Funcao
sincrona, sem side effects.

## Uso

Chamado em use-cases de `table-rows/create` e `table-rows/update` antes de
persistir, para garantir que metadados de autoria fiquem consistentes
mesmo quando o cliente nao envia esses campos.

DI: `injectablesHolder.injectService(RowContextContractService, RowContextService)`
