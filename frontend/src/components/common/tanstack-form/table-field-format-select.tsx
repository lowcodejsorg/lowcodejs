import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { E_FIELD_FORMAT } from '@/lib/constant';
import { cn } from '@/lib/utils';

const TEXT_SHORT_FORMAT_LIST = [
  { label: 'Alfanumérico', value: E_FIELD_FORMAT.ALPHA_NUMERIC },
  { label: 'Inteiro', value: E_FIELD_FORMAT.INTEGER },
  { label: 'Decimal', value: E_FIELD_FORMAT.DECIMAL },
  { label: 'URL', value: E_FIELD_FORMAT.URL },
  { label: 'E-mail', value: E_FIELD_FORMAT.EMAIL },
];

const DATE_FORMAT_LIST = [
  { label: 'DD/MM/AAAA', value: E_FIELD_FORMAT['DD_MM_YYYY'] },
  { label: 'MM/DD/AAAA', value: E_FIELD_FORMAT['MM_DD_YYYY'] },
  { label: 'AAAA/MM/DD', value: E_FIELD_FORMAT['YYYY_MM_DD'] },
  { label: 'DD/MM/AAAA hh:mm:ss', value: E_FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS'] },
  { label: 'MM/DD/AAAA hh:mm:ss', value: E_FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS'] },
  { label: 'AAAA/MM/DD hh:mm:ss', value: E_FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS'] },
  { label: 'DD-MM-AAAA', value: E_FIELD_FORMAT['DD_MM_YYYY_DASH'] },
  { label: 'MM-DD-AAAA', value: E_FIELD_FORMAT['MM_DD_YYYY_DASH'] },
  { label: 'AAAA-MM-DD', value: E_FIELD_FORMAT['YYYY_MM_DD_DASH'] },
  {
    label: 'DD-MM-AAAA hh:mm:ss',
    value: E_FIELD_FORMAT['DD_MM_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'MM-DD-AAAA hh:mm:ss',
    value: E_FIELD_FORMAT['MM_DD_YYYY_HH_MM_SS_DASH'],
  },
  {
    label: 'AAAA-MM-DD hh:mm:ss',
    value: E_FIELD_FORMAT['YYYY_MM_DD_HH_MM_SS_DASH'],
  },
];

interface TableFieldFormatSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  fieldType: 'TEXT_SHORT' | 'DATE';
  required?: boolean;
}

export function TableFieldFormatSelect({
  label,
  placeholder = 'Selecione um formato',
  disabled,
  fieldType,
  required,
}: TableFieldFormatSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const formatList =
    fieldType === 'TEXT_SHORT' ? TEXT_SHORT_FORMAT_LIST : DATE_FORMAT_LIST;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {formatList.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
