import * as React from 'react';

import { badgeStyleFromColor } from '../table-row-badge-list';

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
  color?: string | null;
}

export function TableRowDropdownField({
  field,
  disabled,
}: TableRowDropdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<string | Array<string> | null>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;
  const isMultiple = field.configuration.multiple;
  const anchorRef = useComboboxAnchor();

  const items: Array<DropdownOption> = React.useMemo(() => {
    return field.configuration.dropdown.map((d: any) => ({
      value: String(d.id),
      label: String(d.label),
      color: d.color ?? null,
    }));
  }, [field.configuration.dropdown]);

  const selectedIds = React.useMemo(() => {
    const v = formField.state.value;
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v) return [v];
    return [];
  }, [formField.state.value]);

  const selectedOptions = React.useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.value));
  }, [items, selectedIds]);

  const handleValueChange = (
    value: DropdownOption | Array<DropdownOption> | null,
  ): void => {
    if (isMultiple) {
      const values = Array.isArray(value) ? value : [];
      formField.handleChange(values.map((v) => v.value));
    } else {
      const v = !Array.isArray(value) && value ? value.value : null;
      formField.handleChange(v);
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
                <>
                  {values.map((opt) => (
                    <ComboboxChip
                      key={opt.value}
                      aria-label={opt.label}
                      style={badgeStyleFromColor(opt.color)}
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
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>

          <ComboboxContent anchor={anchorRef}>
            <ComboboxList>
              {(opt: DropdownOption): React.ReactNode => (
                <ComboboxItem
                  key={opt.value}
                  value={opt}
                  style={badgeStyleFromColor(opt.color)}
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
