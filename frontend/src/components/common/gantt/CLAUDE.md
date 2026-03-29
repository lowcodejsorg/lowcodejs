# Gantt

Componentes para grafico de Gantt interativo com barras arrastaveis, timeline
configuravel, painel lateral e filtros de status/membro.

## Arquivos

| Arquivo                     | Descricao                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `index.ts`                  | Barrel de exports com tipos e constantes                                                                        |
| `gantt-types.ts`            | Tipos (GanttRow, GanttGroup, DragState, CreateDragState, ZoomLevel) e constantes (DAY_WIDTH, ROW_HEIGHT)        |
| `gantt-hooks.ts`            | Hooks useBarDrag (mover/resize barras com troca de grupo) e useCreateDrag (criar tarefa arrastando no timeline) |
| `gantt-helpers.ts`          | Funcoes parseDate, getStatusLabel, getBarStyle para calculo de posicao/tamanho das barras                       |
| `gantt-bar.tsx`             | Barra do Gantt com drag handles, progresso visual, tooltip detalhado e indicador de atraso                      |
| `gantt-left-panel.tsx`      | Painel lateral com grupos colapsaveis, avatares de membros e contagem de tarefas                                |
| `gantt-timeline-header.tsx` | Header da timeline com meses e dias, formatacao por zoom level (day/week/month)                                 |
| `gantt-toolbar.tsx`         | Toolbar com navegacao temporal, zoom (dia/semana/mes), filtros de status e membro                               |

## Dependencias principais

- `date-fns` para manipulacao de datas (addDays, differenceInDays, format,
  parseISO)
- `date-fns/locale/ptBR` para formatacao em portugues
- Tipos `IRow`, `IField`, `IDropdown` de `@/lib/interfaces`
- `FieldMap` de `@/lib/kanban-types` para mapeamento de campos

## Padroes importantes

- Tres modos de drag: `move` (mover barra), `resize-left` e `resize-right`
  (redimensionar)
- Drag vertical no modo `move` permite trocar de grupo (status) baseado em
  GroupYRange
- useCreateDrag permite criar tarefas arrastando diretamente no timeline
  (minimum drag de dayWidth/2)
- Zoom levels controlam DAY_WIDTH: day=40px, week=18px, month=6px
- ROW_HEIGHT fixo em 36px
- Barras com isOverdue recebem ring vermelho com glow
- Barra distingue click de drag por delta de 3px
- Commit de mudancas usa callback onCommit com update otimista (recebe funcao de
  rollback)
