import { useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import * as React from 'react';

import { TableRowFieldLabel } from './table-row-field-label';

import { ComboboxLoadMore } from '@/components/common/combobox-load-more';
import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import {
  useCascadeDropdownChildOptions,
  useCascadeDropdownConfig,
} from '@/hooks/tanstack-query/use-cascade-dropdown';
import type { CascadeDropdownConfig } from '@/hooks/tanstack-query/use-cascade-dropdown';
import { useConditionalFieldsRuntimeConfig } from '@/hooks/tanstack-query/use-conditional-fields-runtime-config';
import { useRelationshipRowsReadPaginatedInfinite } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated-infinite';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useReadTableRow } from '@/hooks/tanstack-query/use-table-row-read';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import {
  omitHiddenConditionalValues,
  resolveConditionalVisibility,
} from '@/lib/conditional-form-rules';
import { E_FIELD_FORMAT, E_FIELD_TYPE } from '@/lib/constant';
import { applyApiFieldErrors } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRow, ITable, SearchableOption } from '@/lib/interfaces';
import { resolveRelationshipLabel } from '@/lib/relationship-label';
import {
  buildCreateRowDefaultValues,
  buildFieldValidator,
  buildRowPayload,
} from '@/lib/table';
import { toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface TableRowRelationshipFieldProps {
  field: IField;
  disabled?: boolean;
  tableSlug?: string;
}

interface RelatedRowCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: ITable;
  onCreated: (row: IRow) => void;
}

function getFormFields(table: ITable): Array<IField> {
  const order = table.fieldOrderForm;
  return table.fields
    .filter((field) => !field.trashed && field.showInForm)
    .sort((a, b) => {
      const rawA = order.indexOf(a._id);
      const rawB = order.indexOf(b._id);
      let sortA: number = rawA;
      if (rawA === -1) sortA = Infinity;
      let sortB: number = rawB;
      if (rawB === -1) sortB = Infinity;
      return sortA - sortB;
    });
}

type AppFormInstance = ReturnType<typeof useAppForm>;

function RelatedRowFormFields({
  form,
  fields,
  disabled,
  tableSlug,
}: {
  form: AppFormInstance;
  fields: Array<IField>;
  disabled: boolean;
  tableSlug: string;
}): React.JSX.Element {
  return (
    <section className="flex flex-wrap gap-4 p-1">
      {fields.map((rowField) => {
        if (rowField.native) return null;

        if (
          rowField.type === E_FIELD_TYPE.REACTION ||
          rowField.type === E_FIELD_TYPE.EVALUATION ||
          rowField.type === E_FIELD_TYPE.FIELD_GROUP
        ) {
          return null;
        }

        return (
          <div
            key={rowField._id}
            className="min-w-[200px]"
            style={{ width: `calc(${rowField.widthInForm ?? 50}% - 1rem)` }}
          >
            <form.AppField
              name={rowField.slug}
              validators={{
                onChange: ({
                  value,
                }: {
                  value: Parameters<typeof buildFieldValidator>[1];
                }) => buildFieldValidator(rowField, value),
              }}
            >
              {(formRowField) => {
                switch (rowField.type) {
                  case E_FIELD_TYPE.TEXT_SHORT:
                    return (
                      <formRowField.TableRowTextField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  case E_FIELD_TYPE.TEXT_LONG:
                    if (rowField.format === E_FIELD_FORMAT.RICH_TEXT) {
                      return (
                        <formRowField.TableRowRichTextField
                          field={rowField}
                          disabled={disabled}
                        />
                      );
                    }
                    return (
                      <formRowField.TableRowTextareaField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  case E_FIELD_TYPE.DROPDOWN:
                    return (
                      <formRowField.TableRowDropdownField
                        field={rowField}
                        disabled={disabled}
                        tableSlug={tableSlug}
                      />
                    );
                  case E_FIELD_TYPE.DATE:
                    return (
                      <formRowField.TableRowDateField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  case E_FIELD_TYPE.FILE:
                    return (
                      <formRowField.TableRowFileField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  case E_FIELD_TYPE.RELATIONSHIP:
                    return (
                      <formRowField.TableRowRelationshipField
                        field={rowField}
                        disabled={disabled}
                        tableSlug={tableSlug}
                      />
                    );
                  case E_FIELD_TYPE.CATEGORY:
                    return (
                      <formRowField.TableRowCategoryField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  case E_FIELD_TYPE.USER:
                    return (
                      <formRowField.TableRowUserField
                        field={rowField}
                        disabled={disabled}
                      />
                    );
                  default:
                    return null;
                }
              }}
            </form.AppField>
          </div>
        );
      })}
    </section>
  );
}

function RelatedRowCreateDialogContent({
  table,
  onCreated,
  onOpenChange,
}: Omit<RelatedRowCreateDialogProps, 'open'>): React.JSX.Element {
  const isUploading = useIsUploading();
  const fields = React.useMemo(() => getFormFields(table), [table]);
  const conditionalConfig = useConditionalFieldsRuntimeConfig(table.slug, true);

  const create = useCreateTableRow({
    onSuccess(row: IRow): void {
      toastSuccess('Registro criado', 'O registro relacionado foi criado');
      onCreated(row);
      form.reset();
      onOpenChange(false);
    },
    onError(error: unknown): void {
      handleApiError(error, {
        context: 'Erro ao criar o registro relacionado',
        onFieldErrors: (errors) => applyApiFieldErrors(form, errors),
      });
    },
  });

  const form = useAppForm({
    defaultValues: buildCreateRowDefaultValues(fields),
    onSubmit: async ({ value }): Promise<void> => {
      if (create.status === 'pending') return;
      const currentVisibility = resolveConditionalVisibility(
        fields,
        conditionalConfig.data?.rules ?? [],
        value,
      );
      const values = omitHiddenConditionalValues(
        value,
        fields,
        currentVisibility.hiddenFieldIds,
      );
      const data = buildRowPayload(values, currentVisibility.visibleFields);
      await create.mutateAsync({ slug: table.slug, data });
    },
  });

  const formValues = useStore(form.store, (state) => state.values);
  const conditionalVisibility = React.useMemo(() => {
    return resolveConditionalVisibility(
      fields,
      conditionalConfig.data?.rules ?? [],
      formValues,
    );
  }, [fields, conditionalConfig.data?.rules, formValues]);

  return (
    <React.Fragment>
      <DialogHeader>
        <DialogTitle>Novo registro em {table.name}</DialogTitle>
      </DialogHeader>
      <form
        className="max-h-[65vh] overflow-auto"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        {conditionalConfig.status === 'pending' && (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner className="opacity-50" />
          </div>
        )}

        {conditionalConfig.status !== 'pending' && (
          <RelatedRowFormFields
            form={form}
            fields={conditionalVisibility.visibleFields}
            disabled={create.status === 'pending'}
            tableSlug={table.slug}
          />
        )}
      </form>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={create.status === 'pending'}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={create.status === 'pending' || isUploading}
          onClick={() => form.handleSubmit()}
        >
          {create.status === 'pending' && <Spinner />}
          Salvar
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
}

function RelatedRowCreateDialog(
  props: RelatedRowCreateDialogProps,
): React.JSX.Element {
  return (
    <Dialog
      modal={false}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent className="sm:max-w-3xl">
        <UploadingProvider>
          <RelatedRowCreateDialogContent {...props} />
        </UploadingProvider>
      </DialogContent>
    </Dialog>
  );
}

function readCascadeValue(value: unknown): string {
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'number') return String(first);
    if (first && typeof first === 'object') {
      const itemValue = (first as { _id?: unknown; value?: unknown }).value;
      if (typeof itemValue === 'string') return itemValue;
      if (typeof itemValue === 'number') return String(itemValue);

      const itemId = (first as { _id?: unknown; value?: unknown })._id;
      if (typeof itemId === 'string') return itemId;
      if (typeof itemId === 'number') return String(itemId);
    }
    return '';
  }

  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const itemValue = (value as { _id?: unknown; value?: unknown }).value;
    if (typeof itemValue === 'string') return itemValue;
    if (typeof itemValue === 'number') return String(itemValue);

    const itemId = (value as { _id?: unknown; value?: unknown })._id;
    if (typeof itemId === 'string') return itemId;
    if (typeof itemId === 'number') return String(itemId);
  }
  return '';
}

function CascadeRelationshipField({
  field,
  disabled,
  tableSlug,
  config,
}: TableRowRelationshipFieldProps & {
  tableSlug: string;
  config: CascadeDropdownConfig;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const formField = useFieldContext<Array<SearchableOption>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;

  const relConfig = field.relationship;
  const relatedTable = useReadTable({ slug: config.sourceTableSlug });
  const relatedPermission = useTablePermission(relatedTable.data);
  const [childSearchQuery, setChildSearchQuery] = React.useState('');
  const [debouncedChildQuery, setDebouncedChildQuery] = React.useState('');
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IRow>>(
    () => new Map(),
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const previousParentValueRef = React.useRef<string | null>(null);

  const selectedChildId = (formField.state.value ?? [])[0]?.value ?? '';
  const selectedChildRow = useReadTableRow({
    slug: config.sourceTableSlug,
    rowId: selectedChildId,
  });

  const parentValue = useStore(
    formField.form.store,
    (state: { values: unknown }) => {
      const values = state.values as Record<string, unknown>;
      return readCascadeValue(values[config.parentFieldSlug]);
    },
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChildQuery(childSearchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [childSearchQuery]);

  React.useEffect(() => {
    if (!selectedChildRow.data) return;

    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(selectedChildRow.data._id, selectedChildRow.data);
      return next;
    });
  }, [selectedChildRow.data]);

  React.useEffect(() => {
    if (previousParentValueRef.current === null) {
      previousParentValueRef.current = parentValue;
      return;
    }

    if (previousParentValueRef.current === parentValue) return;

    previousParentValueRef.current = parentValue;
    setChildSearchQuery('');
    formField.handleChange([]);
  }, [formField, parentValue]);

  const childOptions = useCascadeDropdownChildOptions({
    sourceTableSlug: config.sourceTableSlug,
    targetTableSlug: tableSlug,
    fieldId: field._id,
    parentValue,
    search: debouncedChildQuery,
    perPage: 10,
    enabled: config.enabled && Boolean(parentValue),
  });

  const childRows: Array<IRow> = React.useMemo(
    () => childOptions.data?.pages.flatMap((page) => page.data) ?? [],
    [childOptions.data?.pages],
  );

  React.useEffect(() => {
    if (!childRows.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      for (const row of childRows) {
        next.set(row._id, row);
      }
      return next;
    });
  }, [childRows]);

  if (!relConfig || !relConfig.field || !relConfig.table) {
    return (
      <Field data-slot="table-row-relationship-field">
        <TableRowFieldLabel field={field} />
        <p className="text-muted-foreground text-sm">
          Relacionamento não configurado
        </p>
      </Field>
    );
  }

  const getRowLabel = (row: IRow): string =>
    resolveRelationshipLabel(row, relConfig);

  const selectedChild = React.useMemo(() => {
    if (!selectedChildId) return null;
    const cached = selectedCache.get(selectedChildId);
    if (cached) return cached;
    return childRows.find((row) => row._id === selectedChildId) ?? null;
  }, [childRows, selectedCache, selectedChildId]);

  const childItems = React.useMemo(() => {
    if (!selectedChild) return childRows;
    if (childRows.some((row) => row._id === selectedChild._id)) {
      return childRows;
    }
    return [...childRows, selectedChild];
  }, [childRows, selectedChild]);

  const selectedSingleLabel =
    (formField.state.value ?? [])[0]?.label ??
    (selectedChild ? getRowLabel(selectedChild) : '');

  const selectedParentLabel = parentValue || config.parentFieldSlug;

  const canCreateRelatedRecord =
    Boolean(field.allowCreateRelationshipRecords) &&
    !disabled &&
    Boolean(relatedTable.data) &&
    relatedPermission.can('CREATE_ROW');

  const handleChildChange = (newValue: IRow | Array<IRow> | null): void => {
    let row: IRow | null = null;
    if (newValue !== null && !Array.isArray(newValue)) {
      row = newValue;
    }

    if (!row) {
      formField.handleChange([]);
      setChildSearchQuery('');
      return;
    }

    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(row._id, row);
      return next;
    });
    formField.handleChange([{ value: row._id, label: getRowLabel(row) }]);
    setChildSearchQuery('');
  };

  const handleCreatedRelatedRow = (row: IRow): void => {
    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(row._id, row);
      return next;
    });
    formField.handleChange([{ value: row._id, label: getRowLabel(row) }]);
    formField.handleBlur();
    queryClient.invalidateQueries({
      queryKey: queryKeys.relationships.all,
    });
  };

  let createRelatedRecordContent: React.ReactNode = null;
  if (canCreateRelatedRecord) {
    createRelatedRecordContent = (
      <div className="border-t p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsCreateDialogOpen(true);
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsCreateDialogOpen(true);
          }}
        >
          <PlusIcon className="size-4" />
          <span>Novo registro</span>
        </Button>
      </div>
    );
  }

  let createDialog: React.ReactNode = null;
  if (canCreateRelatedRecord && relatedTable.data) {
    createDialog = (
      <RelatedRowCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        table={relatedTable.data}
        onCreated={handleCreatedRelatedRow}
      />
    );
  }

  return (
    <React.Fragment>
      <Field
        data-slot="table-row-relationship-field"
        data-test-id="table-row-relationship-cascade"
        data-invalid={isInvalid}
      >
        <TableRowFieldLabel
          field={field}
          htmlFor={formField.name}
        />
        <div className="relative">
          <Combobox
            data-test-id="table-row-relationship"
            items={childItems}
            value={selectedChild}
            onValueChange={handleChildChange}
            inputValue={childSearchQuery}
            onInputValueChange={setChildSearchQuery}
            itemToStringLabel={(row: IRow) => getRowLabel(row)}
            disabled={disabled || !parentValue}
          >
            <ComboboxInput
              placeholder={
                selectedSingleLabel ||
                (parentValue
                  ? `Selecione ${field.name.toLowerCase()}`
                  : `Selecione ${selectedParentLabel} primeiro`)
              }
              showClear={(formField.state.value ?? []).length > 0}
              className={cn(
                selectedSingleLabel &&
                  !childSearchQuery &&
                  '[&_input]:text-transparent',
                isInvalid && 'border-destructive',
              )}
            />
            {selectedSingleLabel && !childSearchQuery && (
              <span className="pointer-events-none absolute top-1/2 left-3 max-w-[calc(100%-4rem)] -translate-y-1/2 truncate text-sm">
                {selectedSingleLabel}
              </span>
            )}
            <ComboboxContent>
              <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
              {childOptions.isLoading && (
                <div className="flex items-center justify-center p-3">
                  <Spinner className="opacity-50" />
                </div>
              )}
              {!childOptions.isLoading && (
                <React.Fragment>
                  <ComboboxList>
                    {(row: IRow): React.ReactNode => (
                      <ComboboxItem
                        key={row._id}
                        value={row}
                      >
                        {getRowLabel(row)}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxLoadMore
                    hasNextPage={childOptions.hasNextPage}
                    isFetchingNextPage={childOptions.isFetchingNextPage}
                    onLoadMore={() => childOptions.fetchNextPage()}
                  />
                </React.Fragment>
              )}
              {createRelatedRecordContent}
            </ComboboxContent>
          </Combobox>
          {childOptions.isLoading && (
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
      {createDialog}
    </React.Fragment>
  );
}

function DefaultRelationshipField({
  field,
  disabled,
}: TableRowRelationshipFieldProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const formField = useFieldContext<Array<SearchableOption>>();
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const errorId = `${formField.name}-error`;
  const anchorRef = useComboboxAnchor();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IRow>>(
    () => new Map(),
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const relConfig = field.relationship;
  const isMultiple = field.multiple;
  const relatedTable = useReadTable({ slug: relConfig?.table?.slug ?? '' });
  const relatedPermission = useTablePermission(relatedTable.data);

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

  const canCreateRelatedRecord =
    Boolean(field.allowCreateRelationshipRecords) &&
    !disabled &&
    Boolean(relatedTable.data) &&
    relatedPermission.can('CREATE_ROW');

  if (!relConfig || !relConfig.field || !relConfig.table) {
    return (
      <Field data-slot="table-row-relationship-field">
        <TableRowFieldLabel field={field} />
        <p className="text-muted-foreground text-sm">
          Relacionamento não configurado
        </p>
      </Field>
    );
  }

  const getRowLabel = (row: IRow): string =>
    resolveRelationshipLabel(row, relConfig);

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
        label: getRowLabel(row),
      }));
      formField.handleChange(newValues);
      setSearchQuery('');
      return;
    }

    let single: IRow | null = null;
    if (newValue !== null && !Array.isArray(newValue)) {
      single = newValue;
    }

    if (single === null) {
      formField.handleChange([]);
      setSearchQuery('');
      return;
    }

    const picked = single;
    const label = getRowLabel(picked);
    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(picked._id, picked);
      return next;
    });
    formField.handleChange([
      {
        value: picked._id,
        label,
      },
    ]);
    setSearchQuery('');
  };

  const handleCreatedRelatedRow = (row: IRow): void => {
    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(row._id, row);
      return next;
    });

    const option = {
      value: row._id,
      label: getRowLabel(row),
    };

    if (isMultiple) {
      const currentValue = formField.state.value ?? [];
      let nextValue = [...currentValue, option];
      if (currentValue.some((item) => item.value === option.value)) {
        nextValue = currentValue;
      }
      formField.handleChange(nextValue);
    } else {
      formField.handleChange([option]);
      setSearchQuery('');
    }

    // Nao dispara blur aqui: forcar o auto-save do form pai no momento em que a
    // modal de "novo registro" fecha causava um refresh que fechava a modal.
    // O valor ja foi aplicado via handleChange e sera salvo no proximo blur
    // natural ou no intervalo do auto-save.
    queryClient.invalidateQueries({
      queryKey: queryKeys.relationships.all,
    });
  };

  let createRelatedRecordContent: React.ReactNode = null;
  if (canCreateRelatedRecord) {
    createRelatedRecordContent = (
      <div className="border-t p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsCreateDialogOpen(true);
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsCreateDialogOpen(true);
          }}
        >
          <PlusIcon className="size-4" />
          <span>Novo registro</span>
        </Button>
      </div>
    );
  }

  let createDialog: React.ReactNode = null;
  if (canCreateRelatedRecord && relatedTable.data) {
    createDialog = (
      <RelatedRowCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        table={relatedTable.data}
        onCreated={handleCreatedRelatedRow}
      />
    );
  }

  let selectedSingleLabel = (formField.state.value ?? [])[0]?.label ?? '';
  if (!selectedSingleLabel && selectedItems[0]) {
    selectedSingleLabel = getRowLabel(selectedItems[0]);
  }
  const singleInputValue = searchQuery;

  if (isMultiple) {
    return (
      <React.Fragment>
        <Field
          data-slot="table-row-relationship-field"
          data-test-id="table-row-relationship"
          data-invalid={isInvalid}
        >
          <TableRowFieldLabel
            field={field}
            htmlFor={formField.name}
          />
          <div className="relative">
            <Combobox
              data-test-id="table-row-relationship"
              items={items}
              multiple
              value={selectedItems}
              onValueChange={handleValueChange}
              inputValue={searchQuery}
              onInputValueChange={setSearchQuery}
              itemToStringLabel={(row: IRow) => getRowLabel(row)}
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
                            aria-label={getRowLabel(row)}
                          >
                            {getRowLabel(row)}
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
                          {getRowLabel(row)}
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
                {createRelatedRecordContent}
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
        {createDialog}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Field
        data-slot="table-row-relationship-field"
        data-test-id="table-row-relationship"
        data-invalid={isInvalid}
      >
        <TableRowFieldLabel
          field={field}
          htmlFor={formField.name}
        />
        <div className="relative">
          <Combobox
            data-test-id="table-row-relationship"
            items={items}
            value={selectedItems[0] ?? null}
            onValueChange={handleValueChange}
            inputValue={singleInputValue}
            onInputValueChange={setSearchQuery}
            itemToStringLabel={(row: IRow) => getRowLabel(row)}
            disabled={disabled}
          >
            <ComboboxInput
              placeholder={
                selectedSingleLabel || `Selecione ${field.name.toLowerCase()}`
              }
              showClear={(formField.state.value ?? []).length > 0}
              className={cn(
                selectedSingleLabel &&
                  !singleInputValue &&
                  '[&_input]:text-transparent',
                isInvalid && 'border-destructive',
              )}
            />
            {selectedSingleLabel && !singleInputValue && (
              <span className="pointer-events-none absolute top-1/2 left-3 max-w-[calc(100%-4rem)] -translate-y-1/2 truncate text-sm">
                {selectedSingleLabel}
              </span>
            )}
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
                        {getRowLabel(row)}
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
              {createRelatedRecordContent}
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
      {createDialog}
    </React.Fragment>
  );
}

export function TableRowRelationshipField({
  field,
  disabled,
  tableSlug,
}: TableRowRelationshipFieldProps): React.JSX.Element {
  const cascadeConfig = useCascadeDropdownConfig({
    tableSlug: tableSlug ?? '',
    fieldId: field._id,
    enabled:
      Boolean(tableSlug) &&
      field.type === E_FIELD_TYPE.RELATIONSHIP &&
      !field.multiple,
  });

  if (
    cascadeConfig.isLoading &&
    tableSlug &&
    field.type === E_FIELD_TYPE.RELATIONSHIP &&
    !field.multiple
  ) {
    return (
      <Field data-slot="table-row-relationship-field">
        <TableRowFieldLabel field={field} />
        <div className="flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
          <Spinner className="opacity-50" />
          <span>Carregando configuração...</span>
        </div>
      </Field>
    );
  }

  if (cascadeConfig.data?.enabled && tableSlug && !field.multiple) {
    return (
      <CascadeRelationshipField
        field={field}
        disabled={disabled}
        tableSlug={tableSlug}
        config={cascadeConfig.data}
      />
    );
  }

  return (
    <DefaultRelationshipField
      field={field}
      disabled={disabled}
      tableSlug={tableSlug}
    />
  );
}
