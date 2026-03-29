# Calendar

Componentes de visualizacao de calendario com tres modos (mes, semana, agenda),
dialogs de evento e toolbar de navegacao.

## Arquivos

| Arquivo                      | Descricao                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                   | Barrel export de todos os componentes                                                                                                              |
| `calendar-toolbar.tsx`       | Barra de navegacao com botoes prev/next/hoje e seletor de modo (agenda, mes, semana). Popover para selecao direta de mes/semana via inputs nativos |
| `calendar-month-view.tsx`    | Grade mensal 7 colunas, exibe ate 3 eventos por dia com indicador "+N mais"                                                                        |
| `calendar-week-view.tsx`     | Visao semanal com timeline de horas (HOUR_HEIGHT=56px), layout de lanes para eventos sobrepostos                                                   |
| `calendar-agenda-view.tsx`   | Lista linear de eventos agrupados por dia                                                                                                          |
| `calendar-event-dialog.tsx`  | Dialog para criar/editar agendamentos. Usa TanStack Form (useAppForm), suporta campos extras dinamicos, lembretes e participantes                  |
| `calendar-delete-dialog.tsx` | Dialog de confirmacao para exclusao de evento                                                                                                      |

## Dependencias principais

- `date-fns` + locale `ptBR` para formatacao e manipulacao de datas
- `@/lib/calendar-helpers` para tipos (`CalendarEventItem`,
  `CalendarResolvedFields`) e utilitarios
- `@/integrations/tanstack-form/form-hook` (useAppForm) no dialog de evento
- Componentes UI internos (`Button`, `Dialog`, `Input`, `Select`, `Popover`)
- Icones Lucide

## Padroes importantes

- Tipo `CalendarViewMode` exportado da toolbar: `'week' | 'month' | 'agenda'`
- Dialog de evento renderiza campos extras dinamicos via switch em
  `E_FIELD_TYPE`
- Lembretes usam FIELD_GROUP com sub-campos `valor` e `unidade`
- Semana comeca na segunda-feira (`weekStartsOn: 1`)
- UI em PT-BR (labels: Hoje, Agenda, Mes, Semana)
