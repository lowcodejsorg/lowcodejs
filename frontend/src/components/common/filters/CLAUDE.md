# Filters

Sistema de filtros dinamicos para tabelas, com suporte a texto, dropdown, data e
categoria. Persiste filtros na URL via search params.

## Arquivos

| Arquivo              | Descricao                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`           | Barrel de exports do modulo                                                                                                     |
| `filter-fields.tsx`  | Componentes de campo de filtro (FilterTextShort, FilterDropdown, FilterDate, FilterCategory), hook useFilterState e utilitarios |
| `filter-sidebar.tsx` | Sidebar de filtros responsiva -- usa Sheet no mobile e painel lateral no desktop                                                |
| `filter-trigger.tsx` | Botao trigger com badge de contagem de filtros ativos                                                                           |
| `sheet-filter.tsx`   | Variante Sheet (drawer lateral) com trigger integrado e botoes de pesquisar/limpar                                              |

## Dependencias principais

- `@tanstack/react-router` (useNavigate, useSearch) para persistir filtros na
  URL
- Componentes `Combobox`, `Select`, `Popover` de `@/components/ui`
- `TreeList` de `@/components/common/tree-editor` para filtro de categorias
  hierarquicas
- `Datepicker` de `@/components/common/datepicker` para filtro de datas

## Padroes importantes

- `useFilterState` sincroniza estado local com search params da URL,
  inicializando valores a partir da URL no mount
- Filtros de dropdown/categoria sao armazenados como string separada por virgula
  na URL
- Filtros de data usam dois params: `{slug}-initial` e `{slug}-final` no formato
  `yyyy-MM-dd`
- `handleClear` limpa todos os filtros mas preserva `page`, `perPage` e
  `trashed`
- `getActiveFiltersCount` conta filtros ativos sem necessidade do hook (funcao
  pura)
- FilterCategory converte categorias para TreeNode e exibe em Popover com
  TreeList
