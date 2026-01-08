import type { ComboboxOption } from '@/components/ui/combobox';
import { Combobox } from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';

interface TableRowDropdownFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowDropdownField({
  field,
  disabled,
}: TableRowDropdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<string>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;

  const items: Array<ComboboxOption> =
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
      <Combobox
        disabled={disabled}
        value={formField.state.value}
        onChange={(ids) => formField.handleChange(ids)}
        items={items}
        placeholder={`Selecione ${field.name.toLowerCase()}`}
        multiple={field.configuration.multiple}
      />
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
