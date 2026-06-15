import type { AxiosError } from 'axios';
import React from 'react';
import { toast } from 'sonner';

import {
  getRelatedFormFields,
  renderRelationshipCardField,
} from './relationship-rows-inline';

import { ComboboxLoadMore } from '@/components/common/combobox-load-more';
import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/file-upload/uploading-context';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { useRelationshipLinkCreate } from '@/hooks/tanstack-query/use-relationship-link-create';
import { useRelationshipRowsReadPaginatedInfinite } from '@/hooks/tanstack-query/use-relationship-rows-read-paginated-infinite';
import { useCreateTableRow } from '@/hooks/tanstack-query/use-table-row-create';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { handleApiError } from '@/lib/handle-api-error';
import type { IField, IRow, ITable } from '@/lib/interfaces';
import { resolveRelationshipLabel } from '@/lib/relationship-label';
import type { CreateRowDefaultValue } from '@/lib/table';
import {
  buildCreateRowDefaultValues,
  buildFieldValidator,
  buildRowPayload,
  buildUpdateRowDefaultValues,
} from '@/lib/table';

interface RelationshipItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: IField;
  relatedTable: ITable;
  parentTableSlug: string;
  relationshipId: string;
  side: 'source' | 'target';
  recordId: string;
  linkedIds: Set<string>;
  editRow: IRow | null;
  onChanged: () => void;
}

export function RelationshipItemSheet(
  props: RelationshipItemSheetProps,
): React.JSX.Element {
  return (
    <Sheet
      data-slot="relationship-item-sheet"
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full overflow-y-auto px-4"
      >
        <UploadingProvider>
          <RelationshipItemSheetContent {...props} />
        </UploadingProvider>
      </SheetContent>
    </Sheet>
  );
}

function RelationshipItemSheetContent({
  onOpenChange,
  field,
  relatedTable,
  parentTableSlug,
  relationshipId,
  side,
  recordId,
  linkedIds,
  editRow,
  onChanged,
}: RelationshipItemSheetProps): React.JSX.Element {
  const isEdit = Boolean(editRow);
  const isUploading = useIsUploading();
  const otherTableSlug = relatedTable.slug;
  const relConfig = field.relationship;

  const fields = React.useMemo(
    (): Array<IField> => getRelatedFormFields(relatedTable),
    [relatedTable],
  );

  const defaultValues = React.useMemo((): CreateRowDefaultValue => {
    if (editRow) return buildUpdateRowDefaultValues(editRow, fields);
    return buildCreateRowDefaultValues(fields);
  }, [editRow, fields]);

  const [search, setSearch] = React.useState<string>('');
  const [pickerValue, setPickerValue] = React.useState<IRow | null>(null);

  const createLink = useRelationshipLinkCreate({
    tableSlug: parentTableSlug,
    relationshipId,
    side,
    recordId,
    onSuccess(): void {
      onChanged();
    },
    onError(): void {
      toast.error('Não foi possível vincular o registro');
    },
  });

  const createRow = useCreateTableRow({
    onError(error: AxiosError | Error): void {
      handleApiError(error, {
        context: 'Erro ao criar o registro relacionado',
      });
    },
  });

  const updateRow = useUpdateTableRow({
    onError(error: AxiosError | Error): void {
      handleApiError(error, {
        context: 'Erro ao salvar o registro relacionado',
      });
    },
  });

  const isPending =
    createRow.status === 'pending' ||
    updateRow.status === 'pending' ||
    createLink.status === 'pending';

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }): Promise<void> => {
      if (isPending) return;
      const payload = buildRowPayload(value, fields);
      if (editRow) {
        await updateRow.mutateAsync({
          slug: otherTableSlug,
          rowId: editRow._id,
          data: payload,
        });
        onChanged();
        onOpenChange(false);
        return;
      }
      const created = await createRow.mutateAsync({
        slug: otherTableSlug,
        data: payload,
      });
      await createLink.mutateAsync({ otherId: String(created._id) });
      onOpenChange(false);
    },
  });

  const pickerQuery = useRelationshipRowsReadPaginatedInfinite({
    tableSlug: otherTableSlug,
    fieldSlug: field.slug,
    search,
  });

  const pickerItems = React.useMemo((): Array<IRow> => {
    const rows = pickerQuery.data?.pages.flatMap((p) => p.data) ?? [];
    return rows.filter((row) => !linkedIds.has(String(row._id)));
  }, [pickerQuery.data?.pages, linkedIds]);

  function handlePick(row: IRow | null): void {
    setPickerValue(null);
    setSearch('');
    if (!row) return;
    createLink.mutate({ otherId: String(row._id) });
    onOpenChange(false);
  }

  return (
    <React.Fragment>
      <SheetHeader className="px-0">
        <SheetTitle>
          {isEdit && 'Editar item'}
          {!isEdit && 'Adicionar item'}
        </SheetTitle>
      </SheetHeader>

      {!isEdit && (
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-sm font-medium">Vincular existente</span>
          <Combobox
            items={pickerItems}
            value={pickerValue}
            onValueChange={handlePick}
            inputValue={search}
            onInputValueChange={setSearch}
            itemToStringLabel={(row: IRow): string =>
              resolveRelationshipLabel(row, relConfig, relatedTable.fields)
            }
            disabled={isPending}
          >
            <ComboboxInput
              placeholder={`Buscar ${field.name.toLowerCase()} existente`}
            />
            <ComboboxContent>
              <ComboboxEmpty>Nenhum resultado encontrado</ComboboxEmpty>
              {pickerQuery.isLoading && (
                <div className="flex items-center justify-center p-3">
                  <Spinner className="opacity-50" />
                </div>
              )}
              {!pickerQuery.isLoading && (
                <React.Fragment>
                  <ComboboxList>
                    {(row: IRow): React.ReactNode => (
                      <ComboboxItem
                        key={row._id}
                        value={row}
                      >
                        {resolveRelationshipLabel(
                          row,
                          relConfig,
                          relatedTable.fields,
                        )}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxLoadMore
                    hasNextPage={pickerQuery.hasNextPage}
                    isFetchingNextPage={pickerQuery.isFetchingNextPage}
                    onLoadMore={(): void => {
                      void pickerQuery.fetchNextPage();
                    }}
                  />
                </React.Fragment>
              )}
            </ComboboxContent>
          </Combobox>
          <span className="text-xs text-muted-foreground">
            Ou preencha abaixo para criar um novo registro.
          </span>
        </div>
      )}

      <form
        className="flex flex-wrap gap-4"
        onSubmit={(e: React.FormEvent<HTMLFormElement>): void => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        {fields.map((relatedField) => (
          <div
            key={relatedField._id}
            className="min-w-[200px]"
            style={{ width: `calc(${relatedField.widthInForm ?? 50}% - 1rem)` }}
          >
            <form.AppField
              name={relatedField.slug}
              validators={{
                onChange: ({ value }: { value: any }): string | undefined =>
                  buildFieldValidator(relatedField, value),
              }}
            >
              {(formField: any): React.JSX.Element | null =>
                renderRelationshipCardField(
                  formField,
                  relatedField,
                  otherTableSlug,
                )
              }
            </form.AppField>
          </div>
        ))}
      </form>

      <SheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={(): void => onOpenChange(false)}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={isPending || isUploading}
          onClick={(): void => {
            void form.handleSubmit();
          }}
        >
          {isPending && <Spinner />}
          <span>
            {isEdit && 'Salvar'}
            {!isEdit && 'Criar'}
          </span>
        </Button>
      </SheetFooter>
    </React.Fragment>
  );
}
