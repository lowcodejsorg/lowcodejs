import { GroupMultiSelect } from '@/components/common/selectors/group-multi-select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface FieldGroupMultiSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeIds?: Array<string>;
}

export function FieldGroupMultiSelect({
  label,
  placeholder,
  disabled,
  required,
  excludeIds,
}: FieldGroupMultiSelectProps): React.JSX.Element {
  const field = useFieldContext<Array<string>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const errorId = `${field.name}-error`;

  return (
    <Field
      data-slot="field-group-multi-select"
      data-test-id="field-group-multi-select"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <GroupMultiSelect
        data-test-id="field-group-multi-select"
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value);
        }}
        placeholder={placeholder}
        className={cn(isInvalid && 'border-destructive')}
        aria-label={label}
        excludeIds={excludeIds}
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
