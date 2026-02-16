import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';

interface TableRowTextareaFieldProps {
  field: IField;
  disabled?: boolean;
  compact?: boolean;
}

export function TableRowTextareaField({
  field,
  disabled,
  compact = false,
}: TableRowTextareaFieldProps): React.JSX.Element {
  const formField = useFieldContext<string>();
  const isInvalid =
    formField.state.meta.isDirty && !formField.state.meta.isValid;
  const isRequired = field.required;

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
        value={formField.state.value || ''}
        onBlur={formField.handleBlur}
        onChange={(e) => formField.handleChange(e.target.value)}
        rows={compact ? 2 : 3}
        className={compact ? 'max-h-24 min-h-20' : undefined}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
