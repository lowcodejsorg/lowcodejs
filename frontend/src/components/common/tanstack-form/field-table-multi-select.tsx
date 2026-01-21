import { TableMultiSelect } from '@/components/common/table-multi-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface FieldTableMultiSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowedTableIds?: Array<string>;
}

export function FieldTableMultiSelect({
  label,
  placeholder,
  disabled,
  required,
  allowedTableIds,
}: FieldTableMultiSelectProps): React.JSX.Element {
  const field = useFieldContext<Array<string>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <TableMultiSelect
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        placeholder={placeholder}
        className={cn(isInvalid && 'border-destructive')}
        allowedTableIds={allowedTableIds}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
