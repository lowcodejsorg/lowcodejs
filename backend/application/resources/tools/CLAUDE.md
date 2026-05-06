# Tools

Ferramentas utilitarias para manipulacao de tabelas: exportar e importar.

> **Nota**: `clone-table` foi migrada para uma extensão e agora vive em
> `backend/extensions/core/tools/clone-table/`. O endpoint
> `POST /tools/clone-table` continua o mesmo, mas é blindado por
> `ExtensionActiveMiddleware` — só responde se a extensão estiver ativa
> (vem ativada por padrão para o pacote `core`).

## Base Route

`/tools`

## Operacoes

| Operacao | Metodo | Rota | Auth |
|----------|--------|------|------|
| export-table | POST | `/tools/export-table` | Obrigatorio |
| import-table | POST | `/tools/import-table` | Obrigatorio (bodyLimit 50MB) |

## Repositorios Utilizados

- `TableContractRepository` - CRUD de tabelas
- `FieldContractRepository` - CRUD de campos

## Comportamento Chave

- Export: serializa estrutura e/ou dados de uma tabela em formato JSON
- Import: reconstroi tabela a partir de JSON exportado (estrutura + dados opcionais)
- Campos nativos sao recriados em import (nao reaproveitados)
- Campos de referencia (RELATIONSHIP, FILE, USER, etc.) sao ignorados na exportacao de dados
