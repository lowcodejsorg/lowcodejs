import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField } from '@/lib/interfaces';

interface TableRowDropdownFieldProps {
  field: IField;
  disabled?: boolean;
}

interface DropdownOption {
  value: string;
  label: string;
}

export function TableRowDropdownField({
  field,
  disabled,
}: TableRowDropdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<string>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;
  const isMultiple = field.configuration.multiple;
  const anchorRef = useComboboxAnchor();

  const items: Array<DropdownOption> = field.configuration.dropdown.map(
    (d) => ({
      value: d,
      label: d,
    }),
  );

  // Find selected options
  const selectedOptions = React.useMemo(() => {
    return items.filter((item) => formField.state.value.includes(item.value));
  }, [items, formField.state.value]);

  const handleValueChange = (
    newValue: DropdownOption | Array<DropdownOption> | null,
  ): void => {
    if (isMultiple) {
      const values = newValue as Array<DropdownOption>;
      formField.handleChange(values.map((v) => v.value));
    } else {
      const value = newValue as DropdownOption | null;
      formField.handleChange(value ? [value.value] : []);
    }
  };

  if (isMultiple) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <Combobox
          items={items}
          multiple
          value={selectedOptions}
          onValueChange={handleValueChange}
          itemToStringLabel={(opt: DropdownOption) => opt.label}
          disabled={disabled}
        >
          <ComboboxChips ref={anchorRef}>
            <ComboboxValue>
              {(values: Array<DropdownOption>): React.ReactNode => (
                <React.Fragment>
                  {values.map((opt) => (
                    <ComboboxChip
                      key={opt.value}
                      aria-label={opt.label}
                    >
                      {opt.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder={
                      values.length > 0
                        ? ''
                        : `Selecione ${field.name.toLowerCase()}`
                    }
                  />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchorRef}>
            <ComboboxList>
              {(opt: DropdownOption): React.ReactNode => (
                <ComboboxItem
                  key={opt.value}
                  value={opt}
                >
                  {opt.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {isInvalid && <FieldError errors={formField.state.meta.errors} />}
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Combobox
        items={items}
        value={selectedOptions[0] ?? null}
        onValueChange={handleValueChange}
        itemToStringLabel={(opt: DropdownOption) => opt.label}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={
            selectedOptions[0]?.label || `Selecione ${field.name.toLowerCase()}`
          }
          showClear={selectedOptions.length > 0}
        />
        <ComboboxContent>
          <ComboboxList>
            {(opt: DropdownOption): React.ReactNode => (
              <ComboboxItem
                key={opt.value}
                value={opt}
              >
                {opt.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
