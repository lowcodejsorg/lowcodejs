# Table Selectors

Componentes de selecao de tabela reutilizaveis. Comboboxes e multi-selects que
buscam tabelas via API paginada.

## Arquivos

| Arquivo                        | Componente                  | Descricao                                                                                                                                                                                               |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `table-combobox.tsx`           | `TableCombobox`             | Combobox simples para selecao de uma tabela. Usa `useTablesReadPaginated`. Suporta `excludeSlug` para filtrar. Retorna `(value, slug)` no `onValueChange`.                                              |
| `table-combobox-paginated.tsx` | `TableComboboxPaginated`    | Combobox com scroll infinito (`useInfiniteQuery`). Botao "Carregar mais" no final da lista. Busca com debounce de 300ms.                                                                                |
| `table-combobox-filtered.tsx`  | `TableComboboxFilteredSafe` | Combobox que recebe opcoes ja filtradas como prop. Nao faz fetch proprio. Suporta `subLabel` nas opcoes.                                                                                                |
| `table-multi-select.tsx`       | `TableMultiSelect`          | Multi-select com chips para selecao de multiplas tabelas. Suporta `allowedTableIds` para restringir opcoes.                                                                                             |
| `table-style-view.tsx`         | `TableStyleViewDropdown`    | Dropdown para alternar estilo de visualizacao da tabela (lista, galeria, documento, card, mosaico, kanban, forum, calendario, gantt). Persiste via `useUpdateTable`. Verifica permissao `UPDATE_TABLE`. |
| `index.ts`                     | -                           | Barrel export                                                                                                                                                                                           |

## Interfaces

- `TableCombobox` e `TableComboboxPaginated` retornam
  `(value: string, slug?: string)` no callback
- `TableMultiSelect` retorna `Array<string>` de IDs
- `TableComboboxFilteredSafe` trabalha com `{ value, label, subLabel? }`

## Dependencias

- `@/hooks/tanstack-query/use-tables-read-paginated`
- `@/components/ui/combobox` - sistema de Combobox
- `@/lib/table-style` - `getAllowedTableStyles`
- `@/hooks/use-table-permission` - controle de permissao
