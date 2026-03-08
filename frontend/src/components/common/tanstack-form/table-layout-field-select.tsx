import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface TableLayoutFieldSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
}

export function TableLayoutFieldSelect({
  label,
  placeholder = 'Automático (primeiro campo)',
  disabled,
  options,
}: TableLayoutFieldSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        disabled={disabled}
        value={field.state.value || '__auto__'}
        onValueChange={(value) =>
          field.handleChange(value === '__auto__' ? '' : value)
        }
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__auto__">
            Automático (primeiro campo)
          </SelectItem>
          {options.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
