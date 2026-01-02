import { FolderTreeIcon } from 'lucide-react';

import { useFieldContext } from '../form-context';

import { MenuCombobox } from '@/components/common/menu-combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

interface MenuComboboxFieldProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  excludeId?: string;
}

export function MenuComboboxField({
  label,
  placeholder,
  disabled,
  excludeId,
}: MenuComboboxFieldProps): React.JSX.Element {
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
