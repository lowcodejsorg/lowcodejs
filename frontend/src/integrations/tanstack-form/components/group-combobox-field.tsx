import { useFieldContext } from '../form-context';

import { GroupCombobox } from '@/components/common/group-combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface GroupComboboxFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function GroupComboboxField({
  label,
  placeholder,
  disabled,
  required,
}: GroupComboboxFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <GroupCombobox
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        placeholder={placeholder}
        className={cn(isInvalid && 'border-destructive')}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
