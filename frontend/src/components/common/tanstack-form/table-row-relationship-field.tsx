import React from 'react';

import { Combobox } from '@/components/ui/combobox';
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

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

  const relConfig = field.configuration.relationship;
  const isMultiple = field.configuration.multiple;
  const selectedValues = formField.state.value;

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

  const handleValueChange = (_ids: Array<string>, items: Array<IRow>): void => {
    const newValues = items.map((row) => ({
      value: row._id,
      label: String(row[relConfig.field.slug] ?? row._id),
    }));
    formField.handleChange(newValues);
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="relative">
        <Combobox
          value={selectedValues.map((v) => v.value)}
          onChange={handleValueChange}
          items={allItems}
          loading={isLoading}
          getItemId={(row) => row._id}
          getItemLabel={(row) => String(row[relConfig.field.slug] ?? row._id)}
          multiple={isMultiple}
          showCheckboxes={isMultiple}
          maxBadges={2}
          onSearch={setSearchQuery}
          placeholder={`Selecione ${field.name.toLowerCase()}`}
          emptyMessage="Nenhum resultado encontrado"
          disabled={disabled}
          className={cn(isInvalid && 'border-destructive')}
        />
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
