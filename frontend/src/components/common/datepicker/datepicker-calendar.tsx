import { useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { DatepickerDays } from './datepicker-days';
import { DatepickerMonths } from './datepicker-months';
import { DatepickerYears } from './datepicker-years';
import { getMonthName, navigateMonth } from './datepicker-utils';

type View = 'days' | 'months' | 'years';

interface DatepickerCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
}

export function DatepickerCalendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: DatepickerCalendarProps): React.JSX.Element {
  const [view, setView] = useState<View>('days');
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate || new Date(),
  );
  const [yearRangeCenter, setYearRangeCenter] = useState<number>(
    currentMonth.getFullYear(),
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => navigateMonth(prev, 'prev'));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => navigateMonth(prev, 'next'));
  }, []);

  const handleSelectMonth = useCallback((month: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), month, 1));
    setView('days');
  }, []);

  const handleSelectYear = useCallback((year: number) => {
    setCurrentMonth((prev) => new Date(year, prev.getMonth(), 1));
    setView('months');
  }, []);

  const handleNavigateYears = useCallback((direction: 'prev' | 'next') => {
    setYearRangeCenter((prev) => prev + (direction === 'next' ? 12 : -12));
  }, []);

  const handleSelectDate = useCallback(
    (date: Date) => {
      onSelectDate(date);
    },
    [onSelectDate],
  );

  const minYear = minDate ? minDate.getFullYear() : null;
  const maxYear = maxDate ? maxDate.getFullYear() : null;

  return (
    <div className="w-[280px]">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        {view === 'days' && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => setView('months')}
              >
                {getMonthName(currentMonth.getMonth())}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => {
                  setYearRangeCenter(currentMonth.getFullYear());
                  setView('years');
                }}
              >
                {currentMonth.getFullYear()}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleNextMonth}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </>
        )}

        {view === 'months' && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setView('days')}
            >
              <ChevronLeftIcon className="size-4 mr-1" />
              Voltar
            </Button>

            <span className="text-sm font-medium">
              {currentMonth.getFullYear()}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                setYearRangeCenter(currentMonth.getFullYear());
                setView('years');
              }}
            >
              Ano
            </Button>
          </>
        )}

        {view === 'years' && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setView('months')}
            >
              <ChevronLeftIcon className="size-4 mr-1" />
              Voltar
            </Button>

            <span className="text-sm font-medium">Selecionar Ano</span>

            <div className="w-16" />
          </>
        )}
      </div>

      {/* Content */}
      {view === 'days' && (
        <DatepickerDays
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      )}

      {view === 'months' && (
        <DatepickerMonths
          currentMonth={currentMonth.getMonth()}
          onSelectMonth={handleSelectMonth}
        />
      )}

      {view === 'years' && (
        <DatepickerYears
          currentYear={currentMonth.getFullYear()}
          centerYear={yearRangeCenter}
          onSelectYear={handleSelectYear}
          onNavigateYears={handleNavigateYears}
          minYear={minYear}
          maxYear={maxYear}
        />
      )}
    </div>
  );
}
