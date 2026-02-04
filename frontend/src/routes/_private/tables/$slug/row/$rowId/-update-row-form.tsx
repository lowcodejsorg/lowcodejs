import { useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { PencilIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { RowFormFields } from '../create/-create-form';

import { RowRemoveFromTrashDialog } from './-remove-from-trash-dialog';
import { RowSendToTrashDialog } from './-send-to-trash-dialog';
import { RowView } from './-view';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import type { IHTTPExeptionError, IRow, ITable } from '@/lib/interfaces';
import { buildRowPayload, buildUpdateRowDefaultValues } from '@/lib/table';

interface UpdateRowFormProps {
  table: ITable;
  data: IRow;
}

export function UpdateRowForm({
  table,
  data,
}: UpdateRowFormProps): React.JSX.Element {
  const sidebar = useSidebar();
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
    const order = table.fieldOrderList;
    const orderedFields = table.fields
      .filter((f) => !f.trashed)
      .sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id));

    return orderedFields;
  }, [table.fields, table.fieldOrderList]);

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

  function setFieldError(field: string, message: string): void {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  }

  const _update = useUpdateTableRow({
    onSuccess() {
      toast('Registro atualizado', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'O registro foi atualizado com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<
          Record<string, string>
        >;

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PARAMETERS'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 400 &&
          errorData?.cause === 'INVALID_PAYLOAD_FORMAT'
        ) {
          for (const [field, message] of Object.entries(errorData.errors)) {
            setFieldError(field, message);
          }
          return;
        }

        if (
          errorData?.code === 401 &&
          errorData?.cause === 'AUTHENTICATION_REQUIRED'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Autenticação necessária',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'ACCESS_DENIED') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Permissões insuficientes',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 403 &&
          errorData?.cause === 'OWNER_OR_ADMIN_REQUIRED'
        ) {
          toast('Acesso negado', {
            className: '!bg-destructive !text-white !border-destructive',
            description:
              'Apenas o dono ou administradores da tabela podem editar registros',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 403 && errorData?.cause === 'TABLE_PRIVATE') {
          toast('Tabela privada', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'Esta tabela é privada e você não tem acesso',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 404 && errorData?.cause === 'ROW_NOT_FOUND') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Registro não encontrado',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          errorData?.code === 422 &&
          errorData?.cause === 'UNPROCESSABLE_ENTITY'
        ) {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Dados inválidos',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (errorData?.code === 500 && errorData?.cause === 'SERVER_ERROR') {
          toast('Erro ao atualizar o registro', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData?.message ?? 'Erro interno do servidor',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao atualizar o registro', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar o registro',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }
      console.error(error);
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
                  disabled={!canSubmit}
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
