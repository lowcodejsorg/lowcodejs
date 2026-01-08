import type { ComboboxOption } from '@/components/ui/combobox';
import { Combobox } from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface TableFieldDropdownOptionsProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function TableFieldDropdownOptions({
  label,
  placeholder = 'Escreva e adicione',
  disabled,
  required,
}: TableFieldDropdownOptionsProps): React.JSX.Element {
  const field = useFieldContext<Array<ComboboxOption>>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  // Extrair IDs dos items para o Combobox
  const selectedIds = field.state.value?.map((item) => item.value) ?? [];

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Combobox
        disabled={disabled}
        items={field.state.value}
        onChange={(_ids, items) => field.handleChange(items)}
        value={selectedIds}
        creatable
        allowReorder
        multiple
        placeholder={placeholder}
        emptyMessage=""
        className={cn('w-full', isInvalid && 'border-destructive')}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
