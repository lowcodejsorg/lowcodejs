import { Datepicker } from '@/components/common/datepicker';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_FIELD_FORMAT } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowDateFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowDateField({
  field,
  disabled,
}: TableRowDateFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const formatString = field.configuration.format ?? E_FIELD_FORMAT.DD_MM_YYYY;
  const dateValue = formField.state.value
    ? new Date(formField.state.value)
    : null;

  console.log('isInvalid', isInvalid);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Datepicker
        value={dateValue}
        onChange={(date) => formField.handleChange(date?.toISOString() ?? '')}
        displayFormat={formatString}
        placeholder="Selecione uma data"
        disabled={disabled}
        className={cn(
          disabled && 'pointer-events-none opacity-50',
          isInvalid && 'border-destructive',
        )}
      />
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
