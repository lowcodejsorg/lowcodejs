# Tools

Ferramentas utilitarias para manipulacao de tabelas: clonar, exportar e importar.

## Base Route

`/tools`

## Operacoes

| Operacao | Metodo | Rota | Auth |
|----------|--------|------|------|
| clone-table | POST | `/tools/clone-table` | Obrigatorio |
| export-table | POST | `/tools/export-table` | Obrigatorio |
| import-table | POST | `/tools/import-table` | Obrigatorio (bodyLimit 50MB) |

## Repositorios Utilizados

- `TableContractRepository` - CRUD de tabelas
- `FieldContractRepository` - CRUD de campos

## Comportamento Chave

- Clone: duplica estrutura da tabela (campos, grupos, schema) mas NAO duplica dados
- Clone suporta templates built-in (Kanban, Cards, Mosaico, Documento, Forum, Calendario)
- Export: serializa estrutura e/ou dados de uma tabela em formato JSON
- Import: reconstroi tabela a partir de JSON exportado (estrutura + dados opcionais)
- Campos nativos sao recriados em clone/import (nao reaproveitados)
- Campos de referencia (RELATIONSHIP, FILE, USER, etc.) sao ignorados na exportacao de dados
