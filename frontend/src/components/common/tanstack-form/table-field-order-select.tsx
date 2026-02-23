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

const ORDER_LIST = [
  { label: 'Nenhuma', value: 'none' },
  { label: 'Ascendente', value: 'asc' },
  { label: 'Descendente', value: 'desc' },
];

interface TableFieldOrderSelectProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

export function TableFieldOrderSelect({
  label,
  description,
  disabled,
}: TableFieldOrderSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Select
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder="Selecione uma ordenação" />
        </SelectTrigger>
        <SelectContent>
          {ORDER_LIST.map((item) => (
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
