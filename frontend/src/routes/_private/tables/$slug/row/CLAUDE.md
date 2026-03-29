# Gerenciamento de Registros (Rows)

Rotas para criar e editar registros de uma tabela. Suporta acesso publico para
tabelas com visibilidade adequada.

## Rotas

| Rota                       | Descricao                            |
| -------------------------- | ------------------------------------ |
| `/tables/:slug/row/create` | Criar novo registro                  |
| `/tables/:slug/row/:rowId` | Visualizar/editar registro existente |

## Subdiretorios

| Diretorio | Rota                       | Descricao                         |
| --------- | -------------------------- | --------------------------------- |
| `create/` | `/tables/:slug/row/create` | Formulario de criacao de registro |
| `$rowId/` | `/tables/:slug/row/:rowId` | Visualizacao e edicao de registro |

## Observacoes

- Nao ha arquivos na raiz do diretorio `row/`
- Os campos do formulario sao gerados dinamicamente com base nos campos da
  tabela (IField)
- Valores default construidos por `buildDefaultValues()` e
  `buildCreateRowDefaultValues()`
- Payload construido por `buildRowPayload()` (funcoes utilitarias em
  `@/lib/table`)
