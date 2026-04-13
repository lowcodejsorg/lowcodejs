# Row Context Service

Transforma dados de linha (IRow) aplicando regras de contexto baseadas nos campos da tabela.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `row-context-contract.service.ts` | Classe abstrata definindo interface |
| `row-context.service.ts` | Implementacao concreta |
| `in-memory-row-context.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `transform(row, fields, userId?)` | `IRow` | Transforma dados da linha aplicando resolucao de campos por tipo e contexto do usuario |

## Tipos

- `IRow` — registro da tabela dinamica
- `IField` — definicao de campo da tabela

## Registro DI

`injectablesHolder.injectService(RowContextContractService, RowContextService)`
