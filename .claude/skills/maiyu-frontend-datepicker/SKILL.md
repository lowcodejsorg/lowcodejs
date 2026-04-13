---
name: maiyu:frontend-datepicker
description: |
  Generates datepicker components with single/range selection, dual calendar,
  masked input, and month/year navigation.
  Use when: user asks to create date pickers, date selectors, date range pickers,
  or mentions "datepicker", "date picker", "calendar input".
  Supports: Single/range mode, masked input, month/year navigation.
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

### DatepickerValue Type

```typescript
export interface DatepickerValue {
  startDate: Date | null
  endDate: Date | null
}
```

### Datepicker Component

```tsx
import { useState, useRef } from 'react'
import { format, parse, isValid } from 'date-fns'
import { Calendar } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatepickerProps {
  value?: DatepickerValue
  onChange?: (value: DatepickerValue) => void
  mode?: 'single' | 'range'
  displayFormat?: string
  placeholder?: string
  disabled?: boolean
}

export function Datepicker({
  value,
  onChange,
  mode = 'single',
  displayFormat = 'dd/MM/yyyy',
  placeholder,
  disabled,
}: DatepickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function handleDateSelect(date: Date) {
    if (mode === 'single') {
      onChange?.({ startDate: date, endDate: date })
      setOpen(false)
    } else {
      // range logic: first click = start, second click = end
      if (!value?.startDate || value.endDate) {
        onChange?.({ startDate: date, endDate: null })
      } else {
        let start = value.startDate
        let end = date
        if (date < value.startDate) {
          start = date
          end = value.startDate
        }
        onChange?.({ startDate: start, endDate: end })
        setOpen(false)
      }
    }
  }

  function getDisplayValue(): string {
    if (!value?.startDate) return ''
    if (mode === 'range' && value.endDate) {
      return `${format(value.startDate, displayFormat)} - ${format(value.endDate, displayFormat)}`
    }
    return format(value.startDate, displayFormat)
  }

  const displayValue = getDisplayValue()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={displayValue}
            placeholder={placeholder || displayFormat.toLowerCase()}
            readOnly
            disabled={disabled}
            className="pr-10"
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <DatepickerCalendar
          selected={value}
          onSelect={handleDateSelect}
          mode={mode}
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Calendar Grid (simplified)

```tsx
import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DatepickerCalendarProps {
  selected?: DatepickerValue
  onSelect: (date: Date) => void
  mode: 'single' | 'range'
}

export function DatepickerCalendar({ selected, onSelect, mode }: DatepickerCalendarProps): React.JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(selected?.startDate || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
          <div key={d} className="py-1 text-muted-foreground">{d}</div>
        ))}
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selected?.startDate && isSameDay(day, selected.startDate)
          const isEndSelected = selected?.endDate && isSameDay(day, selected.endDate)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={cn(
                'h-8 w-8 rounded text-sm',
                !isCurrentMonth && 'text-muted-foreground/50',
                (isSelected || isEndSelected) && 'bg-primary text-primary-foreground',
                isCurrentMonth && !isSelected && !isEndSelected && 'hover:bg-muted',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

## Checklist

- [ ] Single and range modes
- [ ] Month/year navigation
- [ ] Keyboard accessible
- [ ] Display format configurable
- [ ] Today highlighting
- [ ] Range hover preview (optional)
- [ ] date-fns for date operations
