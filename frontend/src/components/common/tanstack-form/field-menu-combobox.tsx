import { FolderTreeIcon } from 'lucide-react';

import { MenuCombobox } from '@/components/common/menu-combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { cn } from '@/lib/utils';

interface FieldMenuComboboxProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  excludeId?: string;
}

export function FieldMenuCombobox({
  label,
  placeholder,
  disabled,
  excludeId,
}: FieldMenuComboboxProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <MenuCombobox
          disabled={disabled}
          value={field.state.value}
          onValueChange={(value) => {
            field.handleChange(value);
          }}
          placeholder={placeholder}
          excludeId={excludeId}
          className={cn(isInvalid && 'border-destructive')}
        />
        <InputGroupAddon>
          <FolderTreeIcon />
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
