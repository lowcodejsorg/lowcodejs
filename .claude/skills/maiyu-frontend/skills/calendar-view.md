---
name: maiyu:frontend-calendar-view
description: |
  Generates calendar visualization components with month, week, and agenda views.
  Use when: user asks to create calendar views, event calendars, schedule views,
  or mentions "calendar", "schedule", "month view", "week view", "agenda".
  Supports: Month/week/agenda views, event dialogs, date navigation.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Event Type

```typescript
export interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color?: string
  allDay?: boolean
}

export type CalendarView = 'month' | 'week' | 'agenda'
```

### Calendar Toolbar

```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface CalendarToolbarProps {
  currentDate: Date
  view: CalendarView
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
}

export function CalendarToolbar({
  currentDate,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: CalendarToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoje
        </Button>
        <h2 className="text-lg font-semibold ml-2">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
      </div>
      <div className="flex items-center gap-1 border rounded-md p-0.5">
        {(['month', 'week', 'agenda'] as const).map((v) => {
          let variant: 'secondary' | 'ghost' = 'ghost';
          if (view === v) {
            variant = 'secondary';
          }
          const VIEW_LABEL_MAP = { month: 'Mes', week: 'Semana', agenda: 'Agenda' } as const;
          return (
            <Button
              key={v}
              variant={variant}
              size="sm"
              onClick={() => onViewChange(v)}
            >
              {VIEW_LABEL_MAP[v]}
            </Button>
          );
        })}
      </div>
    </div>
  )
}
```

### Month View

```tsx
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { cn } from '@/lib/utils'

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarMonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarMonthViewProps): React.JSX.Element {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(e.startDate, day))
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
          <div key={d} className="px-2 py-1.5 text-xs font-medium text-muted-foreground text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[120px]">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border-b border-r p-1 cursor-pointer hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/20',
              )}
              onClick={() => onDateClick?.(day)}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday(day) && 'bg-primary text-primary-foreground font-bold',
                  !isCurrentMonth && 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    className="w-full text-left text-xs px-1 py-0.5 rounded truncate"
                    style={{ backgroundColor: event.color || 'hsl(var(--primary) / 0.1)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Week View

```tsx
import {
  startOfWeek, addDays, format, isSameDay, isToday,
  differenceInMinutes, setHours, setMinutes,
} from 'date-fns'
import { cn } from '@/lib/utils'

const HOUR_HEIGHT = 56
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onTimeClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarWeekView({
  currentDate,
  events,
  onTimeClick,
  onEventClick,
}: CalendarWeekViewProps): React.JSX.Element {
  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getEventStyle(event: CalendarEvent) {
    const startMinutes = event.startDate.getHours() * 60 + event.startDate.getMinutes()
    const duration = differenceInMinutes(event.endDate, event.startDate)
    return {
      top: `${(startMinutes / 60) * HOUR_HEIGHT}px`,
      height: `${Math.max((duration / 60) * HOUR_HEIGHT, HOUR_HEIGHT / 2)}px`,
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-background border-b">
        <div />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'text-center py-2 text-sm',
              isToday(day) && 'font-bold text-primary',
            )}
          >
            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
            <div>{format(day, 'd')}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div>
          {HOURS.map((hour) => (
            <div key={hour} className="border-b text-xs text-muted-foreground text-right pr-2" style={{ height: HOUR_HEIGHT }}>
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {weekDays.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(e.startDate, day))
          return (
            <div key={day.toISOString()} className="relative border-r">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => onTimeClick?.(setMinutes(setHours(day, hour), 0))}
                />
              ))}
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  className="absolute left-1 right-1 rounded px-1 text-xs overflow-hidden"
                  style={{
                    ...getEventStyle(event),
                    backgroundColor: event.color || 'hsl(var(--primary) / 0.15)',
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  {event.title}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Agenda View

```tsx
import { format, isSameDay } from 'date-fns'

interface CalendarAgendaViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarAgendaView({
  events,
  onEventClick,
}: CalendarAgendaViewProps): React.JSX.Element {
  const sortedEvents = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  let lastDate: Date | null = null

  return (
    <div className="flex-1 overflow-auto divide-y">
      {sortedEvents.map((event) => {
        const showDate = !lastDate || !isSameDay(lastDate, event.startDate)
        lastDate = event.startDate

        return (
          <div key={event.id}>
            {showDate && (
              <div className="px-4 py-2 bg-muted/50 text-sm font-medium sticky top-0">
                {format(event.startDate, 'EEEE, d MMMM yyyy')}
              </div>
            )}
            <button
              className="w-full text-left px-4 py-3 hover:bg-muted/30 flex items-center gap-3"
              onClick={() => onEventClick?.(event)}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                </p>
              </div>
            </button>
          </div>
        )
      })}
      {sortedEvents.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Nenhum evento encontrado
        </div>
      )}
    </div>
  )
}
```

### useCalendar Hook

```typescript
import { useState, useCallback } from 'react'
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  const goToPrev = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((d) => subMonths(d, 1))
    } else {
      setCurrentDate((d) => subWeeks(d, 1))
    }
  }, [view])

  const goToNext = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((d) => addMonths(d, 1))
    } else {
      setCurrentDate((d) => addWeeks(d, 1))
    }
  }, [view])

  return {
    currentDate,
    view,
    setView,
    goToToday,
    goToPrev,
    goToNext,
  }
}
```

## Checklist

- [ ] Three views: month, week, agenda
- [ ] Toolbar with navigation and view toggle
- [ ] Today highlighting
- [ ] Event click handler
- [ ] Date/time click handler (for creating events)
- [ ] Events limited per day (month view: max 3 + "more")
- [ ] Week view with hourly grid
- [ ] Agenda view with date grouping
- [ ] date-fns for date operations
- [ ] Responsive layout
