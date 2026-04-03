import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useRelationshipRowsReadPaginated } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableFieldRelationshipDefaultValueProps {
  label?: string;
  disabled?: boolean;
  tableSlug: string;
  fieldSlug: string;
}

export function TableFieldRelationshipDefaultValue({
  label = 'Valor padrão',
  disabled,
  tableSlug,
  fieldSlug,
}: TableFieldRelationshipDefaultValueProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const value = field.state.value ?? '';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useRelationshipRowsReadPaginated({
    tableSlug,
    fieldSlug,
    search: debouncedQuery,
    page: 1,
    perPage: 50,
    enabled: Boolean(tableSlug && fieldSlug),
  });

  const allItems: Array<IRow> = data?.data ?? [];

  const selectedItem = React.useMemo(() => {
    if (!value) return null;
    return allItems.find((row) => row._id === value) ?? null;
  }, [value, allItems]);

  const getRowLabel = (row: IRow): string => {
    return String(row[fieldSlug] ?? row._id);
  };

  const handleValueChange = (newValue: IRow | null): void => {
    if (newValue) {
      field.handleChange(newValue._id);
    } else {
      field.handleChange('');
    }
    field.handleBlur();
  };

  if (!tableSlug || !fieldSlug) {
    return (
      <Field data-slot="table-field-relationship-default-value">
        <FieldLabel>{label}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Configure o relacionamento primeiro
        </p>
      </Field>
    );
  }

  return (
    <Field
      data-slot="table-field-relationship-default-value"
      data-test-id="table-field-relationship-default-value"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="relative">
        <Combobox
          data-test-id="table-field-relationship-default-value-combobox"
          items={allItems}
          value={selectedItem}
          onValueChange={handleValueChange}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          itemToStringLabel={getRowLabel}
          disabled={disabled}
        >
          <ComboboxInput
            placeholder={
              selectedItem ? getRowLabel(selectedItem) : 'Sem valor padrão'
            }
            showClear={!!value}
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
                  <ComboboxItem key={row._id} value={row}>
                    {getRowLabel(row)}
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
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
