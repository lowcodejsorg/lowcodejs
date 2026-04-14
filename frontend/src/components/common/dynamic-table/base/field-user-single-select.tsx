import { UserMultiSelect } from '@/components/common/selectors/user-multi-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface FieldUserSingleSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Seletor de um unico usuario para campos semanticos (dono, responsavel).
 * Reusa UserMultiSelect mantendo o contrato de valor escalar (string).
 */
export function FieldUserSingleSelect({
  label,
  placeholder,
  disabled,
  required,
}: FieldUserSingleSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;

  const selected = field.state.value ? [field.state.value] : [];

  function handleSelect(next: Array<string>): void {
    if (next.length === 0) {
      field.handleChange('');
      return;
    }
    const newest = next[next.length - 1];
    field.handleChange(newest);
  }

  return (
    <Field
      data-slot="field-user-single-select"
      data-test-id="field-user-single-select"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <UserMultiSelect
        data-test-id="field-user-single-select"
        disabled={disabled}
        value={selected}
        onValueChange={handleSelect}
        placeholder={placeholder}
        className={cn(isInvalid && 'border-destructive')}
      />
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={field.state.meta.errors}
        />
      )}
    </Field>
  );
}
