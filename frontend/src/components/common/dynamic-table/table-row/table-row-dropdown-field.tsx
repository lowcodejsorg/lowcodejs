import * as React from 'react';

import { badgeStyleFromColor } from '../table-cells/table-row-badge-list';

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

function normalizeDropdownValues(
  value: DropdownOption | Array<DropdownOption> | string | Array<string> | null,
): Array<string> {
  if (!value) return [];
  let values: Array<DropdownOption | string>;
  if (Array.isArray(value)) {
    values = value;
  } else {
    values = [value];
  }
  return values
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'value' in item) {
        return String(item.value);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

export function TableRowDropdownField({
  field,
  disabled,
}: TableRowDropdownFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<string>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;
  const isMultiple = field.multiple;
  const anchorRef = useComboboxAnchor();

  const items: Array<DropdownOption> = React.useMemo(() => {
    return field.dropdown.map((d: any) => ({
      value: String(d.id),
      label: String(d.label),
      color: d.color ?? null,
    }));
  }, [field.dropdown]);

  const selectedIds = React.useMemo(() => {
    return normalizeDropdownValues(formField.state.value as any);
  }, [formField.state.value]);

  React.useEffect(() => {
    if (!isMultiple) return;
    if (Array.isArray(formField.state.value)) return;
    formField.handleChange(selectedIds);
  }, [formField, isMultiple, selectedIds]);

  const selectedOptions = React.useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.value));
  }, [items, selectedIds]);

  const handleValueChange = (
    value:
      | DropdownOption
      | Array<DropdownOption>
      | string
      | Array<string>
      | null,
  ): void => {
    const nextValues = normalizeDropdownValues(value);
    if (nextValues.length === 0) {
      formField.handleChange([]);
      return;
    }
    formField.handleChange(nextValues);
  };

  if (isMultiple) {
    return (
      <Field
        data-slot="table-row-dropdown-field"
        data-invalid={isInvalid}
      >
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
              {(values: Array<DropdownOption>): React.ReactNode => {
                let chipsPlaceholder = `Selecione ${field.name.toLowerCase()}`;
                if (values.length > 0) {
                  chipsPlaceholder = '';
                }
                return (
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
                    <ComboboxChipsInput placeholder={chipsPlaceholder} />
                  </>
                );
              }}
            </ComboboxValue>
          </ComboboxChips>

          <ComboboxContent anchor={anchorRef}>
            <ComboboxList>
              {(opt: DropdownOption): React.ReactNode => (
                <ComboboxItem
                  key={opt.value}
                  value={opt}
                  className="mb-1 last:mb-0"
                  style={badgeStyleFromColor(opt.color)}
                >
                  {opt.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {isInvalid && (
          <FieldError
            id={errorId}
            errors={formField.state.meta.errors}
          />
        )}
      </Field>
    );
  }

  return (
    <Field
      data-slot="table-row-dropdown-field"
      data-invalid={isInvalid}
    >
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

      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
