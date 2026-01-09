import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useRelationshipRowsReadPaginated } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField, IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowRelationshipFieldProps {
  field: IField;
  disabled?: boolean;
}

type SearchableOption = {
  value: string;
  label: string;
};

export function TableRowRelationshipField({
  field,
  disabled,
}: TableRowRelationshipFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<SearchableOption>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;
  const anchorRef = useComboboxAnchor();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  const relConfig = field.configuration.relationship;
  const isMultiple = field.configuration.multiple;

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useRelationshipRowsReadPaginated({
    tableSlug: relConfig?.table.slug ?? '',
    fieldSlug: field.slug,
    search: debouncedQuery,
    page: 1,
    perPage: 50,
    enabled: Boolean(relConfig),
  });

  if (!relConfig) {
    return (
      <Field>
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Relacionamento não configurado
        </p>
      </Field>
    );
  }

  const allItems: Array<IRow> = data?.data ?? [];

  // Map selected options to IRow objects for the combobox
  const selectedItems = React.useMemo(() => {
    return formField.state.value
      .map((opt) => allItems.find((row) => row._id === opt.value))
      .filter((row): row is IRow => row !== undefined);
  }, [formField.state.value, allItems]);

  const handleValueChange = (newValue: IRow | Array<IRow> | null): void => {
    if (isMultiple) {
      const items = newValue as Array<IRow>;
      const newValues = items.map((row) => ({
        value: row._id,
        label: String(row[relConfig.field.slug] ?? row._id),
      }));
      formField.handleChange(newValues);
    } else {
      const row = newValue as IRow | null;
      if (row) {
        formField.handleChange([
          {
            value: row._id,
            label: String(row[relConfig.field.slug] ?? row._id),
          },
        ]);
      } else {
        formField.handleChange([]);
      }
    }
  };

  if (isMultiple) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <div className="relative">
          <Combobox
            items={allItems}
            multiple
            value={selectedItems}
            onValueChange={handleValueChange}
            inputValue={searchQuery}
            onInputValueChange={setSearchQuery}
            itemToStringLabel={(row: IRow) =>
              String(row[relConfig.field.slug] ?? row._id)
            }
            disabled={disabled}
          >
            <ComboboxChips
              ref={anchorRef}
              className={cn(isInvalid && 'border-destructive')}
            >
              <ComboboxValue>
                {(values: Array<IRow>): React.ReactNode => (
                  <React.Fragment>
                    {values.slice(0, 2).map((row) => (
                      <ComboboxChip
                        key={row._id}
                        aria-label={String(
                          row[relConfig.field.slug] ?? row._id,
                        )}
                      >
                        {String(row[relConfig.field.slug] ?? row._id)}
                      </ComboboxChip>
                    ))}
                    {values.length > 2 && (
                      <span className="text-muted-foreground text-xs">
                        +{values.length - 2}
                      </span>
                    )}
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
              <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
              {isLoading && (
                <div className="flex items-center justify-center p-3">
                  <Spinner className="opacity-50" />
                </div>
              )}
              {!isLoading && (
                <ComboboxList>
                  {(row: IRow): React.ReactNode => (
                    <ComboboxItem
                      key={row._id}
                      value={row}
                    >
                      {String(row[relConfig.field.slug] ?? row._id)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              )}
            </ComboboxContent>
          </Combobox>
          {isLoading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <Spinner className="opacity-50" />
            </div>
          )}
        </div>
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
      <div className="relative">
        <Combobox
          items={allItems}
          value={selectedItems[0] ?? null}
          onValueChange={handleValueChange}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          itemToStringLabel={(row: IRow) =>
            String(row[relConfig.field.slug] ?? row._id)
          }
          disabled={disabled}
        >
          <ComboboxInput
            placeholder={
              formField.state.value[0]?.label ||
              `Selecione ${field.name.toLowerCase()}`
            }
            showClear={formField.state.value.length > 0}
            className={cn(isInvalid && 'border-destructive')}
          />
          <ComboboxContent>
            <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
            {isLoading && (
              <div className="flex items-center justify-center p-3">
                <Spinner className="opacity-50" />
              </div>
            )}
            {!isLoading && (
              <ComboboxList>
                {(row: IRow): React.ReactNode => (
                  <ComboboxItem
                    key={row._id}
                    value={row}
                  >
                    {String(row[relConfig.field.slug] ?? row._id)}
                  </ComboboxItem>
                )}
              </ComboboxList>
            )}
          </ComboboxContent>
        </Combobox>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Spinner className="opacity-50" />
          </div>
        )}
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
