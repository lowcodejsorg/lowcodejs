import { useFieldContext } from '../form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { IField } from '@/lib/interfaces';

interface RowTextareaFieldProps {
  field: IField;
  disabled?: boolean;
}

export function RowTextareaField({
  field,
  disabled,
}: RowTextareaFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Textarea
        disabled={disabled}
        id={formField.name}
        name={formField.name}
        placeholder={`Digite ${field.name.toLowerCase()}`}
        value={formField.state.value ?? ''}
        onBlur={formField.handleBlur}
        onChange={(e) => formField.handleChange(e.target.value)}
        rows={3}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
