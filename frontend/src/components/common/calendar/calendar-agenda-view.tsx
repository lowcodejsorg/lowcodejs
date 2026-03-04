import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { formatEventTimeRange } from '@/lib/calendar-helpers';
import type { CalendarEventItem } from '@/lib/calendar-helpers';

interface CalendarAgendaViewProps {
  events: Array<CalendarEventItem>;
  onSelectEvent: (event: CalendarEventItem) => void;
}

export function CalendarAgendaView({
  events,
  onSelectEvent,
}: CalendarAgendaViewProps): React.JSX.Element {
  if (events.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nenhum agendamento com data válida para exibir.
      </div>
    );
  }

  let lastDay: Date | null = null;

  return (
    <div className="h-full overflow-auto">
      <div className="divide-y">
        {events.map((event) => {
          const day = startOfDay(event.start);
          const showHeader = !lastDay || !isSameDay(lastDay, day);
          lastDay = day;

          return (
            <div key={event.rowId}>
              {showHeader && (
                <div className="sticky top-0 z-10 border-y bg-background/95 px-4 py-2 text-sm font-medium backdrop-blur supports-[backdrop-filter]:bg-background/70">
                  {format(day, "EEE, dd 'de' MMMM", { locale: ptBR })}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full cursor-pointer justify-start rounded-none px-4 py-3 text-left hover:bg-muted/40"
                onClick={() => onSelectEvent(event)}
              >
                <div className="flex w-full items-start gap-3">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatEventTimeRange(event)}
                    </div>
                    {event.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
