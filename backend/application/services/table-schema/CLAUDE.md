# Table Schema Service

Constroi schemas Mongoose dinamicamente a partir da configuracao de campos de uma tabela e sincroniza o modelo no runtime.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `table-schema-contract.service.ts` | Classe abstrata definindo interface |
| `table-schema-mongoose.service.ts` | Implementacao com Mongoose |
| `table-schema-in-memory.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `computeSchema(fields, groups?)` | `ITableSchema` | Gera schema Mongoose a partir dos campos e grupos configurados |
| `syncModel(table)` | `Promise<void>` | Registra/atualiza o modelo Mongoose para a tabela no runtime |

## Tipos

- `IField` — definicao de campo com tipo, formato, validacoes
- `IGroupConfiguration` — configuracao de grupos de campos (field groups)
- `ITable` — tabela completa com slug, campos e configuracao
- `ITableSchema` — schema Mongoose gerado (Mixed)

## Registro DI

`injectablesHolder.injectService(TableSchemaContractService, TableSchemaMongooseService)`
