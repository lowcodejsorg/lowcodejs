# Menu

CRUD completo de itens de menu com suporte a hierarquia (parent/children), soft delete, hard delete, restore e reordenacao.

## Base Route

`/menu`

## Operacoes

| Operacao | Metodo | Rota | Permissao |
|----------|--------|------|-----------|
| create | POST | `/menu` | Auth only |
| list | GET | `/menu` | Auth only |
| paginated | GET | `/menu/paginated` | Auth only |
| show | GET | `/menu/:_id` | Auth only |
| update | PATCH | `/menu/:_id` | Auth only |
| delete | DELETE | `/menu/:_id` | Auth only (soft delete) |
| hard-delete | DELETE | `/menu/:_id/permanent` | Auth only |
| restore | PATCH | `/menu/:_id/restore` | Auth only |
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
- Soft delete: marca trashed=true/trashedAt, nao permite deletar menu com filhos ativos
- Hard delete: somente para menus ja na lixeira, remove permanentemente
- Protecao contra referencia circular no update
