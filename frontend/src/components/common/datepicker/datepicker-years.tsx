import { ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react';

import { generateYearRange } from './datepicker-utils';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatepickerYearsProps {
  currentYear: number;
  centerYear: number;
  onSelectYear: (year: number) => void;
  onNavigateYears: (direction: 'prev' | 'next') => void;
  minYear?: number | null;
  maxYear?: number | null;
}

export function DatepickerYears({
  currentYear,
  centerYear,
  onSelectYear,
  onNavigateYears,
  minYear,
  maxYear,
}: DatepickerYearsProps): React.JSX.Element {
  const years = generateYearRange(centerYear);

  return (
    <div className="p-2">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onNavigateYears('prev')}
        >
          <ChevronsLeftIcon className="size-4" />
        </Button>

        <span className="text-sm font-medium text-muted-foreground">
          {years[0]} - {years[years.length - 1]}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onNavigateYears('next')}
        >
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>

      {/* Years grid */}
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => {
          const isSelected = currentYear === year;
          const isDisabled =
            (minYear !== null && minYear !== undefined && year < minYear) ||
            (maxYear !== null && maxYear !== undefined && year > maxYear);

          return (
            <button
              key={year}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelectYear(year)}
              className={cn(
                'flex items-center justify-center py-3 px-2 text-sm rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected &&
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
