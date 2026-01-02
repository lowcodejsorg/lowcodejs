import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { useFieldContext } from '../form-context';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface RowDateFieldProps {
  field: IField;
  disabled?: boolean;
}

function getDateFormatString(dateFormat: string | null): string {
  switch (dateFormat) {
    case 'DD_MM_YYYY':
    case 'DD_MM_YYYY_DASH':
      return 'dd/MM/yyyy';
    case 'MM_DD_YYYY':
    case 'MM_DD_YYYY_DASH':
      return 'MM/dd/yyyy';
    case 'YYYY_MM_DD':
    case 'YYYY_MM_DD_DASH':
      return 'yyyy/MM/dd';
    case 'DD_MM_YYYY_HH_MM_SS':
    case 'DD_MM_YYYY_HH_MM_SS_DASH':
      return 'dd/MM/yyyy HH:mm:ss';
    case 'MM_DD_YYYY_HH_MM_SS':
    case 'MM_DD_YYYY_HH_MM_SS_DASH':
      return 'MM/dd/yyyy HH:mm:ss';
    case 'YYYY_MM_DD_HH_MM_SS':
    case 'YYYY_MM_DD_HH_MM_SS_DASH':
      return 'yyyy/MM/dd HH:mm:ss';
    default:
      return 'dd/MM/yyyy';
  }
}

export function RowDateField({
  field,
  disabled,
}: RowDateFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const formatString = getDateFormatString(field.configuration.format);
  const dateValue = formField.state.value
    ? new Date(formField.state.value)
    : undefined;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !formField.state.value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {formField.state.value
              ? format(dateValue!, formatString, { locale: ptBR })
              : 'Selecione uma data'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) =>
              formField.handleChange(date?.toISOString() ?? '')
            }
          />
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
