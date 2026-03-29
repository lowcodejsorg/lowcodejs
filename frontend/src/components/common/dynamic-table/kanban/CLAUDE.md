# Kanban

Visualizacao kanban completa com colunas, cards, drag-drop e dialogs de edicao.
As colunas representam opcoes de dropdown e os cards representam rows da tabela.

## Arquitetura

O kanban usa `@dnd-kit` para drag-drop de cards entre colunas e reordenacao de
colunas. Os campos do card sao mapeados via `FieldMap` (title, description,
members, startDate, dueDate, progress, tasks, comments, attachments). Helpers e
tipos ficam em `@/lib/kanban-helpers` e `@/lib/kanban-types`.

## Arquivos

| Arquivo                         | Componente                         | Descricao                                                                                                                                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kanban-card.tsx`               | `KanbanCard`, `KanbanSortableCard` | Card do kanban com titulo, datas, membros (avatares) e barra de progresso. Versao sortable usa `useSortable`.                                                 |
| `kanban-column.tsx`             | `KanbanColumn`                     | Coluna sortable com header editavel (double-click para renomear, color picker). Usa `useSortable` com tipo `column`. Aplica estilos de cor no fundo e scroll. |
| `kanban-row-dialog.tsx`         | `KanbanRowDialog`                  | Dialog principal de edicao de card. Exibe descricao, tarefas, comentarios, anexos e campos extras em layout de 2 colunas.                                     |
| `kanban-create-card-dialog.tsx` | `KanbanCreateCardDialog`           | Dialog de criacao com formulario completo. Layout 2 colunas (form + sidebar com lista). Renderiza campos extras dinamicamente por tipo.                       |
| `kanban-add-list-dialog.tsx`    | `KanbanAddListDialog`              | Dialog simples para adicionar nova coluna (nome + cor).                                                                                                       |
| `kanban-row-description.tsx`    | `KanbanRowDescriptionSection`      | Secao de descricao com click-to-edit. Usa `TableRowTextLongCell` para exibicao.                                                                               |
| `kanban-row-tasks.tsx`          | `KanbanRowTasksSection`            | Lista de tarefas com checkbox (sim/nao), edicao inline por double-click, adicao e remocao.                                                                    |
| `kanban-row-comments.tsx`       | `KanbanRowCommentsSection`         | Secao de comentarios com autor, data, edicao e exclusao. Permite gerenciar se autor ou criador da row.                                                        |
| `kanban-row-extra-fields.tsx`   | `KanbanRowExtraFieldsSection`      | Campos adicionais com click-to-edit inline. Verifica editabilidade por campo.                                                                                 |
| `kanban-row-quick-actions.tsx`  | `KanbanRowQuickActions`            | Acoes rapidas: membros, data inicio, data vencimento. Exibe formulario inline ao clicar.                                                                      |
| `kanban-field-group-editor.tsx` | `KanbanFieldGroupEditor`           | Editor de grupos de campos no contexto kanban. Modo "attachment" para grupos com arquivo+autor+data. Modo generico para outros grupos.                        |
| `kanban-unassigned-column.tsx`  | `KanbanUnassignedColumn`           | Coluna especial "Sem lista" para cards sem dropdown atribuido. Nao e sortable.                                                                                |
| `index.ts`                      | -                                  | Barrel export dos componentes principais                                                                                                                      |

## Dependencias internas

- `table-cells/` - `TableRowDateCell`, `TableRowTextLongCell`,
  `TableRowBadgeList`, etc.
- `table-row/` - componentes de formulario via `form.AppField`
- `@/lib/kanban-helpers` - `getTitleValue`, `getProgressValue`,
  `getMembersFromRow`, `normalizeRowValue`, `normalizeIdList`
- `@/lib/kanban-types` - `FieldMap`
- `@dnd-kit/core` + `@dnd-kit/sortable` - drag-drop
