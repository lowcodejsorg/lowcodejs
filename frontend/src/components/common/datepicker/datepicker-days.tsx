import {
  WEEKDAYS,
  getCalendarDays,
  isDateDisabled,
  isSameDay,
  isToday,
} from './datepicker-utils';

import { cn } from '@/lib/utils';

interface DatepickerDaysProps {
  currentMonth: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
}

export function DatepickerDays({
  currentMonth,
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: DatepickerDaysProps): React.JSX.Element {
  const { previous, current, next } = getCalendarDays(currentMonth);

  const renderDay = (
    date: Date,
    type: 'previous' | 'current' | 'next',
  ): React.JSX.Element => {
    const disabled = isDateDisabled(date, minDate, maxDate);
    const selected = isSameDay(date, selectedDate);
    const today = isToday(date);
    const isOutsideMonth = type !== 'current';

    return (
      <button
        key={`${type}-${date.getTime()}`}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onSelectDate(date)}
        className={cn(
          'flex items-center justify-center size-9 text-sm rounded-md transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-50 disabled:line-through',
          isOutsideMonth && 'text-muted-foreground',
          today &&
            !selected &&
            'border border-primary text-primary font-medium',
          selected &&
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        )}
      >
        {date.getDate()}
      </button>
    );
  };

  return (
    <div className="p-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center size-9 text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {previous.map((date) => renderDay(date, 'previous'))}
        {current.map((date) => renderDay(date, 'current'))}
        {next.map((date) => renderDay(date, 'next'))}
      </div>
    </div>
  );
}
