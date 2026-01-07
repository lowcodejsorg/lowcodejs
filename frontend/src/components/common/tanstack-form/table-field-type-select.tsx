import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_FIELD_TYPE } from '@/lib/constant';
import { cn } from '@/lib/utils';

const COLUMN_TYPE_LIST = [
  { label: 'Texto', value: E_FIELD_TYPE.TEXT_SHORT },
  { label: 'Texto longo', value: E_FIELD_TYPE.TEXT_LONG },
  { label: 'Dropdown', value: E_FIELD_TYPE.DROPDOWN },
  { label: 'Arquivo', value: E_FIELD_TYPE.FILE },
  { label: 'Data', value: E_FIELD_TYPE.DATE },
  { label: 'Relacionamento', value: E_FIELD_TYPE.RELATIONSHIP },
  { label: 'Grupo de campos', value: E_FIELD_TYPE.FIELD_GROUP },
  { label: 'Categoria', value: E_FIELD_TYPE.CATEGORY },
  { label: 'Reação', value: E_FIELD_TYPE.REACTION },
  { label: 'Avaliação', value: E_FIELD_TYPE.EVALUATION },
];

interface TableFieldTypeSelectProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  blockedTypes?: Array<string>;
  required?: boolean;
}

export function TableFieldTypeSelect({
  label,
  placeholder = 'Selecione o tipo do campo',
  disabled,
  blockedTypes = [],
  required,
}: TableFieldTypeSelectProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const typeOptions = COLUMN_TYPE_LIST.filter(
    (item) => !blockedTypes.includes(item.value),
  );

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
          field.handleChange(value);
        }}
      >
        <SelectTrigger className={cn(isInvalid && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((item) => (
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
