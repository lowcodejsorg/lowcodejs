# Row Password Service

Gerencia hash e mascaramento de campos do tipo PASSWORD em registros de tabelas dinamicas.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `row-password-contract.service.ts` | Classe abstrata definindo interface |
| `bcrypt-row-password.service.ts` | Implementacao com bcrypt |
| `in-memory-row-password.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `hash(payload, fields)` | `Promise<void>` | Aplica hash bcrypt nos campos PASSWORD do payload |
| `mask(row, fields)` | `void` | Substitui valores de campos PASSWORD por mascara (ex: `••••••`) |
| `stripMasked(payload, fields)` | `void` | Remove campos PASSWORD do payload quando o valor e a mascara (evita re-hash) |

## Tipos

- `IField` — definicao de campo (filtra por `format === E_FIELD_FORMAT.PASSWORD`)

## Registro DI

`injectablesHolder.injectService(RowPasswordContractService, BcryptRowPasswordService)`
