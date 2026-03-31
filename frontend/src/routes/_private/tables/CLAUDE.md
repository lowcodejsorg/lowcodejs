# Tabelas - Funcionalidade Central da Plataforma Low-Code

Gerenciamento de tabelas dinamicas. Rota base `/tables` com listagem paginada,
filtros, importacao/exportacao e acoes de lixeira.

## Rota

| Rota      | Descricao                                            |
| --------- | ---------------------------------------------------- |
| `/tables` | Listagem paginada de tabelas com filtros e ordenacao |

## Arquivos

| Arquivo                      | Tipo               | Descricao                                                                                                      |
| ---------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `index.tsx`                  | Loader             | Valida search params (page, perPage, search, trashed, visibility, owner, order-\*), carrega `tableListOptions` |
| `index.lazy.tsx`             | Componente         | Layout com header, FilterSidebar, TableTables, ChatSidebar e Pagination                                        |
| `-table-tables.tsx`          | Componente privado | DataTable com colunas: nome, slug, visibilidade, criado por, criado em, acoes                                  |
| `-table-tables-skeleton.tsx` | Skeleton           | Skeleton da tabela de listagem                                                                                 |
| `-export-dialog.tsx`         | Dialog             | Exportar tabela como JSON (estrutura, dados ou ambos) via POST `/tools/export-table`                           |
| `-import-dialog.tsx`         | Dialog             | Importar tabela de arquivo JSON exportado via POST `/tools/import-table`                                       |

## Visibilidades (E_TABLE_VISIBILITY)

| Valor      | Label      |
| ---------- | ---------- |
| PRIVATE    | Privada    |
| RESTRICTED | Restrita   |
| OPEN       | Aberta     |
| PUBLIC     | Publica    |
| FORM       | Formulario |

## Modos de Visualizacao (E_TABLE_STYLE)

Os modos de visualizacao sao configurados por tabela e renderizados em `$slug/`:

LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM, CALENDAR, GANTT

## Subdiretorios

| Diretorio | Rota             | Descricao                                       |
| --------- | ---------------- | ----------------------------------------------- |
| `create/` | `/tables/create` | Formulario de criacao de tabela                 |
| `clone/`  | `/tables/clone`  | Formulario de clonagem a partir de modelo       |
| `new/`    | `/tables/new`    | Wizard com opcoes: criar do zero ou usar modelo |
| `$slug/`  | `/tables/:slug`  | Visualizacao de tabela com multiplos modos      |

## Padroes

- Permissoes via `usePermission()` e `useTablePermission(table)` com metodo
  `can()`
- Dialogs de confirmacao usam `useMutation` com invalidacao de query keys
- Filtros persistidos em `localStorage` (filter-sidebar-open)
- Componentes privados prefixados com `-`
