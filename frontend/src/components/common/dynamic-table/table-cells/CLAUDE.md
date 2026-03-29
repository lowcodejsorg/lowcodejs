# Table Cells

Componentes de exibicao somente-leitura para celulas de tabela/grid. Recebem
`{ row: IRow; field: IField }` e renderizam o valor formatado.

## Padrao

Todos sao componentes puros (sem estado de formulario). Extraem o valor via
`row[field.slug]` e formatam conforme o tipo de campo.

## Arquivos

| Arquivo                           | Componente                 | Descricao                                                                                                                  |
| --------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `table-row-text-short-cell.tsx`   | `TableRowTextShortCell`    | Texto curto. Trata formatos: password (mascara), email (mailto link), url (link externo).                                  |
| `table-row-text-long-cell.tsx`    | `TableRowTextLongCell`     | Texto longo. Se formato RICH_TEXT, usa `ContentViewer` do Tiptap.                                                          |
| `table-row-date-cell.tsx`         | `TableRowDateCell`         | Data formatada com `date-fns` + locale ptBR.                                                                               |
| `table-row-dropdown-cell.tsx`     | `TableRowDropdownCell`     | Lista de badges coloridos para opcoes de dropdown. Usa `TableRowBadgeList`.                                                |
| `table-row-category-cell.tsx`     | `TableRowCategoryCell`     | Lista de badges para categorias. Usa `getCategoryItem` + `TableRowBadgeList`.                                              |
| `table-row-relationship-cell.tsx` | `TableRowRelationshipCell` | Lista de badges com valores do campo de relacionamento.                                                                    |
| `table-row-user-cell.tsx`         | `TableRowUserCell`         | Exibe nomes de usuarios separados por virgula.                                                                             |
| `table-row-file-cell.tsx`         | `TableRowFileCell`         | Links para arquivos. Suporta galeria de imagens e modo card/mosaico com thumbnails.                                        |
| `table-row-reaction-cell.tsx`     | `TableRowReactionCell`     | Botoes de like/unlike com contagem. Usa `useRowUpdateReaction` para persistir.                                             |
| `table-row-evaluation-cell.tsx`   | `TableRowEvaluationCell`   | Estrelas de avaliacao (1-5) com media. Usa `useRowUpdateEvaluation` para persistir.                                        |
| `table-row-field-group-cell.tsx`  | `TableRowFieldGroupCell`   | Variante cell: badge com contagem de itens. Variante detail: `GroupRowsDataTable` completo.                                |
| `table-row-badge-list.tsx`        | `TableRowBadgeList`        | Componente generico de lista de badges. Exporta `hexToRgb` e `badgeStyleFromColor` (usados por varios outros componentes). |
| `index.ts`                        | -                          | Barrel export com re-export de `hexToRgb` e `badgeStyleFromColor`                                                          |

## Utilitarios exportados

- `hexToRgb(hex)` - converte hex para RGB
- `badgeStyleFromColor(color)` - gera CSSProperties com cor de fundo em 20% de
  opacidade

## Dependencias internas

- `@/components/common/rich-editor` - `ContentViewer`
- `../group-rows/group-rows-data-table` - `GroupRowsDataTable`
- `@/lib/table` - `getDropdownItem`, `getCategoryItem`
- `@/hooks/tanstack-query/use-row-update-reaction` e `use-row-update-evaluation`
