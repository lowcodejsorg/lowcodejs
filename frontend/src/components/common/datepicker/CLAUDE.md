# Datepicker

Date picker customizado com suporte a selecao de data unica ou range, calendario
dual, e input com mascara.

## Arquivos

| Arquivo                   | Descricao                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.tsx`               | Barrel export de Datepicker e seus tipos (DatepickerProps, DatepickerValue)                                                                                   |
| `datepicker.tsx`          | Componente principal. Input com mascara + Popover com calendario(s). Props: `asSingle` (data unica), `useRange` (calendario duplo), `separator` (default "~") |
| `datepicker-calendar.tsx` | Calendario individual com navegacao mes/ano, suporte a range selection (hover preview), min/max date                                                          |
| `datepicker-days.tsx`     | Grid de dias do mes com destaque para hoje, selecionados, e range hover                                                                                       |
| `datepicker-months.tsx`   | Grid de selecao de mes (12 meses)                                                                                                                             |
| `datepicker-years.tsx`    | Grid de selecao de ano                                                                                                                                        |
| `datepicker-utils.ts`     | Utilitarios de data: formatacao, parsing, navegacao de mes, constantes PT-BR (WEEKDAYS, MONTHS)                                                               |

## Dependencias principais

- `date-fns` + locale `ptBR` para manipulacao de datas
- Componentes UI: `InputGroup`, `Popover`
- Icones Lucide (CalendarIcon, XIcon)

## Padroes importantes

- `DatepickerValue = { startDate: Date | null, endDate: Date | null }` - sempre
  retorna par start/end (mesmo em modo single onde start === end)
- Mascara de input aplica formatacao automatica conforme `displayFormat`
  (default: `dd/MM/yyyy`)
- Modo range usa dois cliques: primeiro seleciona inicio, segundo seleciona fim
  (com swap automatico se invertido)
- Calendario dual mostra mes atual a esquerda e proximo mes a direita
- Labels PT-BR: dias da semana (Dom, Seg, Ter...), meses (Janeiro, Fevereiro...)
