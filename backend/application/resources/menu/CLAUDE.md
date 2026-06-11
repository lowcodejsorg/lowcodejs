# Menu

CRUD completo de itens de menu com suporte a hierarquia (parent/children), send-to-trash, delete permanente, remove-from-trash e reordenacao.

## Base Route

`/menu`

## Operacoes

| Operacao | Metodo | Rota | Permissao |
|----------|--------|------|-----------|
| create | POST | `/menu` | Auth only |
| list | GET | `/menu` | Auth only |
| paginated | GET | `/menu/paginated` | Auth only |
| export-csv | GET | `/menu/exports/csv` | MASTER/ADMINISTRATOR (cap 500.000 linhas) |
| show | GET | `/menu/:_id` | Auth only |
| update | PATCH | `/menu/:_id` | Auth only |
| send-to-trash | PATCH | `/menu/:_id/trash` | Auth only (soft delete) |
| delete | DELETE | `/menu/:_id` | Auth only (exclusao permanente) |
| remove-from-trash | PATCH | `/menu/:_id/restore` | Auth only |
| reorder | PATCH | `/menu/reorder` | Auth only |

## Middlewares Comuns

1. `AuthenticationMiddleware({ optional: false })`

Nao usa TableAccessMiddleware (nao e recurso de tabela).

## Repositorios Utilizados

- `MenuContractRepository` - CRUD de menus
- `TableContractRepository` - validacao de tabela para tipos TABLE/FORM

## Tipos de Menu (E_MENU_ITEM_TYPE)

- TABLE - link para tabela (url auto-gerada: /tables/{slug})
- FORM - link para formulario (url auto-gerada: /tables/{slug}/row/create)
- PAGE - pagina HTML (url auto-gerada: /pages/{slug})
- EXTERNAL - link externo (url obrigatoria)
- SEPARATOR - separador visual
- SECTION - secao/agrupador

## Comportamento Chave

- Hierarquia: menus podem ter parent (referencia a outro menu)
- Slug e gerado automaticamente a partir do nome; se tiver parent, concatena com slug do pai
- Ordenacao: campo `order` (int) determina posicao entre irmaos
- Send-to-trash: marca trashed=true/trashedAt via update, nao permite enviar para lixeira menu com filhos ativos
- Delete: exclusao permanente, somente para menus ja na lixeira
- Remove-from-trash: restaura da lixeira via update (trashed=false, trashedAt=null)
- Protecao contra referencia circular no update
