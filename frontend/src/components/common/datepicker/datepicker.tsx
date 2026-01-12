import { CalendarIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { DatepickerCalendar } from './datepicker-calendar';
import { formatDate, isDateStringValid, parseDate } from './datepicker-utils';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function applyDateMask(value: string, format: string): string {
  const separator = format.includes('/') ? '/' : '-';
  const numbers = value.replace(/\D/g, '');
  const hasTime = format.includes('HH');
  const maxDigits = hasTime ? 14 : 8;
  const yearFirst = format.toLowerCase().startsWith('yyyy');

  let masked = '';
  for (let i = 0; i < Math.min(numbers.length, maxDigits); i++) {
    if (yearFirst) {
      if (i === 4 || i === 6) masked += separator;
    } else {
      if (i === 2 || i === 4) masked += separator;
    }
    if (hasTime && i === 8) masked += ' ';
    if (hasTime && (i === 10 || i === 12)) masked += ':';
    masked += numbers[i];
  }

  return masked;
}

export interface DatepickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  displayFormat?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
  className?: string;
}

export function Datepicker({
  value,
  onChange,
  displayFormat = 'dd/MM/yyyy',
  placeholder = 'Selecione uma data',
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatepickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(
    value ? formatDate(value, displayFormat) : '',
  );

  // Sync input value when external value changes
  useEffect(() => {
    setInputValue(value ? formatDate(value, displayFormat) : '');
  }, [value, displayFormat]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const masked = applyDateMask(raw, displayFormat);
      setInputValue(masked);

      if (masked === '') {
        onChange(null);
        return;
      }

      // Só faz parse quando a string tem o tamanho esperado do formato
      if (masked.length === displayFormat.length) {
        const parsed = parseDate(masked, displayFormat);
        if (parsed && isDateStringValid(masked, displayFormat)) {
          onChange(parsed);
        }
      }
    },
    [onChange, displayFormat],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setInputValue('');
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    // On blur, if the input doesn't match a valid date, reset to the current value
    if (inputValue === '') {
      onChange(null);
      return;
    }

    if (!isDateStringValid(inputValue, displayFormat)) {
      setInputValue(value ? formatDate(value, displayFormat) : '');
    }
  }, [inputValue, value, displayFormat, onChange]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      onChange(date);
      setInputValue(formatDate(date, displayFormat));
      setOpen(false);
    },
    [onChange, displayFormat],
  );

  return (
    <InputGroup
      data-disabled={disabled}
      className={className}
    >
      <InputGroupInput
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      <InputGroupAddon align="inline-end">
        {value && !disabled && (
          <InputGroupButton
            size="icon-xs"
            onClick={handleClear}
            aria-label="Limpar data"
          >
            <XIcon className="size-3.5" />
          </InputGroupButton>
        )}
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <InputGroupButton
              size="icon-xs"
              disabled={disabled}
              aria-label="Abrir calendário"
            >
              <CalendarIcon className="size-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="end"
            sideOffset={8}
          >
            <DatepickerCalendar
              selectedDate={value}
              onSelectDate={handleSelectDate}
              minDate={minDate}
              maxDate={maxDate}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
