import { useRouter } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import React from 'react';

import { RowFormFields } from '../create/-create-form';

import { RowDeleteDialog } from './-delete-dialog';
import { RowRemoveFromTrashDialog } from './-remove-from-trash-dialog';
import { RowSendToTrashDialog } from './-send-to-trash-dialog';
import { RowView } from './-view';

import {
  UploadingProvider,
  useIsUploading,
} from '@/components/common/uploading-context';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { handleApiError } from '@/lib/handle-api-error';
import type { IRow, ITable } from '@/lib/interfaces';
import { buildRowPayload, buildUpdateRowDefaultValues } from '@/lib/table';
import { toastSuccess } from '@/lib/toast';

interface UpdateRowFormProps {
  table: ITable;
  data: IRow;
}

export function UpdateRowForm(props: UpdateRowFormProps): React.JSX.Element {
  return (
    <UploadingProvider>
      <UpdateRowFormContent {...props} />
    </UploadingProvider>
  );
}

function UpdateRowFormContent({
  table,
  data,
}: UpdateRowFormProps): React.JSX.Element {
  const sidebar = useSidebar();
  const isUploading = useIsUploading();
  const router = useRouter();
  const permission = useTablePermission(table);

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const slug = table.slug;
  const rowId = data._id;

  const goBack = (): void => {
    sidebar.setOpen(false);
    router.navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  const fields = React.useMemo(() => {
    const order = table.fieldOrderForm;
    const orderedFields = table.fields
      .filter((f) => !f.trashed)
      .sort((a, b) => {
        const idxA = order.indexOf(a._id);
        const idxB = order.indexOf(b._id);
        return (
          (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB)
        );
      });

    return orderedFields;
  }, [table.fields, table.fieldOrderForm]);

  const form = useAppForm({
    defaultValues: buildUpdateRowDefaultValues(data, fields),
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const payload = buildRowPayload(value, fields);

      await _update.mutateAsync({
        slug,
        rowId,
        data: payload,
      });
    },
  });

  const setFieldError = createFieldErrorSetter(form);

  const _update = useUpdateTableRow({
    onSuccess() {
      toastSuccess(
        'Registro atualizado',
        'O registro foi atualizado com sucesso',
      );

      form.reset();
      setMode('show');
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar o registro',
        onFieldErrors: (errors) => {
          for (const [field, msg] of Object.entries(errors)) {
            setFieldError(field, msg);
          }
        },
      });
    },
  });

  const isDisabled = mode === 'show' || _update.status === 'pending';

  return (
    <React.Fragment>
      <div className="shrink-0 px-2 pb-2 flex flex-row justify-end gap-1">
        {mode === 'show' && !data.trashed && permission.can('REMOVE_ROW') && (
          <RowSendToTrashDialog
            rowId={rowId}
            slug={slug}
          />
        )}

        {mode === 'show' && data.trashed && permission.can('REMOVE_ROW') && (
          <RowRemoveFromTrashDialog
            rowId={rowId}
            slug={slug}
          />
        )}

        {mode === 'show' && data.trashed && permission.can('REMOVE_ROW') && (
          <RowDeleteDialog
            rowId={rowId}
            slug={slug}
          />
        )}

        {mode === 'show' && permission.can('UPDATE_ROW') && (
          <Button
            type="button"
            className="px-2 cursor-pointer max-w-40 w-full"
            size="sm"
            onClick={() => setMode('edit')}
          >
            <PencilIcon className="size-4 mr-1" />
            <span>Editar</span>
          </Button>
        )}
      </div>

      {mode === 'show' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <RowView
            data={data}
            fields={fields}
            tableSlug={slug}
            table={table}
          />
        </div>
      )}

      {/* Footer - Show Mode */}
      {mode === 'show' && (
        <div className="shrink-0 border-t bg-sidebar p-2">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-2 cursor-pointer max-w-40 w-full"
              onClick={goBack}
            >
              <span>Voltar</span>
            </Button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <RowFormFields
            form={form}
            fields={fields}
            disabled={isDisabled}
            tableSlug={slug}
          />
        </form>
      )}

      {/* Footer - Edit Mode */}
      {mode === 'edit' && (
        <div className="shrink-0 border-t bg-sidebar p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={isSubmitting}
                  onClick={() => {
                    form.reset();
                    setMode('show');
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={!canSubmit || isUploading}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting && <Spinner />}
                  <span>Salvar</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </React.Fragment>
  );
}
