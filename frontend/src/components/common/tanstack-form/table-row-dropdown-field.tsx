import { useFieldContext } from '@/integrations/tanstack-form/form-context';

import type { Option } from '@/components/common/-multi-selector';
import { MultipleSelector } from '@/components/common/-multi-selector';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IField } from '@/lib/interfaces';

interface TableRowDropdownFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowDropdownField({
  field,
  disabled,
}: TableRowDropdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<string | Array<Option>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const options =
    field.configuration.dropdown?.map((d) => ({
      value: d,
      label: d,
    })) ?? [];

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {field.configuration.multiple ? (
        <MultipleSelector
          disabled={disabled}
          value={(formField.state.value as Array<Option>) ?? []}
          onChange={(opts) => formField.handleChange(opts)}
          options={options}
          placeholder={`Selecione ${field.name.toLowerCase()}`}
          className="w-full"
        />
      ) : (
        <Select
          disabled={disabled}
          value={(formField.state.value as string) ?? ''}
          onValueChange={(value) => formField.handleChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={`Selecione ${field.name.toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
