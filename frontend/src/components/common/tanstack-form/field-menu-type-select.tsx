import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { MENU_ITEM_TYPE } from '@/lib/constant';
import { cn } from '@/lib/utils';

const MenuTypeOptions = [
  { value: MENU_ITEM_TYPE.TABLE, label: 'Tabela' },
  { value: MENU_ITEM_TYPE.PAGE, label: 'Página' },
  { value: MENU_ITEM_TYPE.FORM, label: 'Formulário' },
  { value: MENU_ITEM_TYPE.EXTERNAL, label: 'Link Externo' },
  { value: MENU_ITEM_TYPE.SEPARATOR, label: 'Separador' },
];

interface FieldMenuTypeSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FieldMenuTypeSelect({
  label,
  placeholder,
  disabled,
  required,
}: FieldMenuTypeSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label} {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <Select
        disabled={disabled}
        value={field.state.value}
        onValueChange={(value) => {
          field.handleChange(value as keyof typeof MENU_ITEM_TYPE);
        }}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MenuTypeOptions.map((option) => (
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
