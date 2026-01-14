import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TABLE_COLLABORATION_OPTIONS } from '@/lib/constant';
import { cn } from '@/lib/utils';

interface TableCollaborationSelectFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TableCollaborationSelectField({
  label,
  placeholder = 'Selecione o modo de colaboração',
  disabled,
  required,
}: TableCollaborationSelectFieldProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value as 'open' | 'restricted');
        }}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {TABLE_COLLABORATION_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
