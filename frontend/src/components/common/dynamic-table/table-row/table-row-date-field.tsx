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
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;

  const formatString = field.format ?? E_FIELD_FORMAT.DD_MM_YYYY;
  let dateValue = null;
  if (formField.state.value) {
    dateValue = {
      startDate: new Date(formField.state.value),
      endDate: new Date(formField.state.value),
    };
  }

  return (
    <Field
      data-slot="table-row-date-field"
      data-test-id="table-row-date-input"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Datepicker
        data-test-id="table-row-date-input"
        value={dateValue}
        onChange={(value) =>
          formField.handleChange(value?.startDate?.toISOString() ?? '')
        }
        displayFormat={formatString}
        placeholder={(field.format ?? E_FIELD_FORMAT.DD_MM_YYYY).toUpperCase()}
        disabled={disabled}
        useRange={false}
        asSingle
        className={cn(
          disabled && 'pointer-events-none opacity-50',
          isInvalid && 'border-destructive',
        )}
      />
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
