import * as React from 'react';

import { ComboboxLoadMore } from '@/components/common/combobox-load-more';
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
import { useRelationshipRowsReadPaginatedInfinite } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated-infinite';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import type { IField, IRow, SearchableOption } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowRelationshipFieldProps {
  field: IField;
  disabled?: boolean;
}

export function TableRowRelationshipField({
  field,
  disabled,
}: TableRowRelationshipFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<SearchableOption>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const isRequired = field.required;
  const anchorRef = useComboboxAnchor();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IRow>>(
    () => new Map(),
  );

  const relConfig = field.relationship;
  const isMultiple = field.multiple;

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useRelationshipRowsReadPaginatedInfinite({
      tableSlug: relConfig?.table?.slug ?? '',
      fieldSlug: field.slug,
      search: debouncedQuery,
      perPage: 10,
    });

  const allItems: Array<IRow> = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data?.pages],
  );

  React.useEffect(() => {
    if (!allItems.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      for (const row of allItems) {
        next.set(row._id, row);
      }
      return next;
    });
  }, [allItems]);

  // Map selected options to IRow objects for the combobox, preferring cached
  // rows so chips persist while the search filters the visible list.
  const selectedItems = React.useMemo(() => {
    return (formField.state.value ?? [])
      .map((opt) => {
        const cached = selectedCache.get(opt.value);
        if (cached) return cached;
        return allItems.find((row) => row._id === opt.value) ?? null;
      })
      .filter((row): row is IRow => row !== null);
  }, [formField.state.value, selectedCache, allItems]);

  const items = React.useMemo(() => {
    const idsInList = new Set(allItems.map((row) => row._id));
    const extras = selectedItems.filter((row) => !idsInList.has(row._id));
    if (extras.length) {
      return [...allItems, ...extras];
    }
    return allItems;
  }, [allItems, selectedItems]);

  if (!relConfig || !relConfig.field || !relConfig.table) {
    return (
      <Field data-slot="table-row-relationship-field">
        <FieldLabel>{field.name}</FieldLabel>
        <p className="text-muted-foreground text-sm">
          Relacionamento não configurado
        </p>
      </Field>
    );
  }

  const handleValueChange = (newValue: IRow | Array<IRow> | null): void => {
    if (isMultiple) {
      let rowList: Array<IRow> = [];
      if (Array.isArray(newValue)) {
        rowList = newValue;
      }

      if (rowList.length > 0) {
        setSelectedCache((prev) => {
          const next = new Map(prev);
          for (const row of rowList) {
            next.set(row._id, row);
          }
          return next;
        });
      }

      const newValues = rowList.map((row) => ({
        value: row._id,
        label: String(row[relConfig.field.slug] ?? row._id),
      }));
      formField.handleChange(newValues);
      return;
    }

    let single: IRow | null = null;
    if (newValue !== null && !Array.isArray(newValue)) {
      single = newValue;
    }

    if (single === null) {
      formField.handleChange([]);
      return;
    }

    const picked = single;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(picked._id, picked);
      return next;
    });
    formField.handleChange([
      {
        value: picked._id,
        label: String(picked[relConfig.field.slug] ?? picked._id),
      },
    ]);
  };

  if (isMultiple) {
    return (
      <Field
        data-slot="table-row-relationship-field"
        data-test-id="table-row-relationship"
        data-invalid={isInvalid}
      >
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <div className="relative">
          <Combobox
            data-test-id="table-row-relationship"
            items={items}
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
                {(values: Array<IRow>): React.ReactNode => {
                  let chipsPlaceholder = `Selecione ${field.name.toLowerCase()}`;
                  if (values.length > 0) {
                    chipsPlaceholder = '';
                  }
                  return (
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
                      <ComboboxChipsInput placeholder={chipsPlaceholder} />
                    </React.Fragment>
                  );
                }}
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
                <React.Fragment>
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
                  <ComboboxLoadMore
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                  />
                </React.Fragment>
              )}
            </ComboboxContent>
          </Combobox>
          {isLoading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <Spinner className="opacity-50" />
            </div>
          )}
        </div>
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
      data-slot="table-row-relationship-field"
      data-test-id="table-row-relationship"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="relative">
        <Combobox
          data-test-id="table-row-relationship"
          items={items}
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
              (formField.state.value ?? [])[0]?.label ||
              `Selecione ${field.name.toLowerCase()}`
            }
            showClear={(formField.state.value ?? []).length > 0}
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
              <React.Fragment>
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
                <ComboboxLoadMore
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onLoadMore={() => fetchNextPage()}
                />
              </React.Fragment>
            )}
          </ComboboxContent>
        </Combobox>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Spinner className="opacity-50" />
          </div>
        )}
      </div>
      {isInvalid && (
        <FieldError
          id={errorId}
          errors={formField.state.meta.errors}
        />
      )}
    </Field>
  );
}
