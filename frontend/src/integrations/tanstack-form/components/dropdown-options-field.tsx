import { useFieldContext } from '../form-context';

import type { Option } from '@/components/common/-multi-selector';
import { MultipleSelector } from '@/components/common/-multi-selector';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface DropdownOptionsFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DropdownOptionsField({
  label,
  placeholder = 'Escreva e adicione',
  disabled,
  required,
}: DropdownOptionsFieldProps): React.JSX.Element {
  const field = useFieldContext<Array<Option>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <MultipleSelector
        disabled={disabled}
        onChange={(options) => field.handleChange(options)}
        value={field.state.value}
        creatable
        triggerSearchOnFocus
        allowReorder={true}
        placeholder={placeholder}
        emptyIndicator={null}
        className={cn('w-full', isInvalid && 'border-destructive')}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
