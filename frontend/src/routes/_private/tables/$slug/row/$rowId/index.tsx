import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon, PencilIcon, Share2Icon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { RowRemoveFromTrashDialog } from './-remove-from-trash-dialog';
import { RowSendToTrashDialog } from './-send-to-trash-dialog';
import {
  UpdateRowFormFields,
  buildDefaultValuesFromRow,
  buildPayload,
} from './-update-form';
import { UpdateRowFormSkeleton } from './-update-form-skeleton';
import { RowView } from './-view';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useReadTableRow } from '@/hooks/tanstack-query/use-table-row-read';
import { useUpdateTableRow } from '@/hooks/tanstack-query/use-table-row-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import type { IRow, ITable } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/row/$rowId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug, rowId } = useParams({
    from: '/_private/tables/$slug/row/$rowId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const table = useReadTable({ slug });
  const row = useReadTableRow({ slug, rowId });
  const permission = useTablePermission(table.data);

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const isLoading = table.status === 'pending' || row.status === 'pending';
  const isError = table.status === 'error' || row.status === 'error';
  const isSuccess = table.status === 'success' && row.status === 'success';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug',
                replace: true,
                params: { slug },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes do registro</h1>
          <Button
            variant="outline"
            className="shadow-none p-1 h-auto"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast('Link do registro copiado', {
                className:
                  '!bg-primary !text-primary-foreground !border-primary',
                description:
                  'O link do registro foi copiado para a área de transferência',
                closeButton: true,
              });
            }}
          >
            <Share2Icon />
            <span className="sr-only">Compartilhar</span>
          </Button>
        </div>
        <div className="inline-flex items-center space-x-2">
          {isSuccess && !row.data.trashed && permission.can('REMOVE_ROW') && (
            <RowSendToTrashDialog
              rowId={rowId}
              slug={slug}
            />
          )}
          {isSuccess && row.data.trashed && permission.can('REMOVE_ROW') && (
            <RowRemoveFromTrashDialog
              rowId={rowId}
              slug={slug}
            />
          )}
          {isSuccess && mode === 'show' && permission.can('UPDATE_ROW') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMode('edit')}
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              <span>Editar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {isError && (
          <LoadError
            message="Houve um erro ao buscar dados do registro"
            refetch={() => {
              table.refetch();
              row.refetch();
            }}
          />
        )}
        {isLoading && <UpdateRowFormSkeleton />}
        {isSuccess && (
          <RowUpdateContent
            data={row.data}
            table={table.data}
            slug={slug}
            rowId={rowId}
            mode={mode}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

interface RowUpdateContentProps {
  data: IRow;
  table: ITable;
  slug: string;
  rowId: string;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function RowUpdateContent({
  data,
  table,
  slug,
  rowId,
  mode,
  setMode,
}: RowUpdateContentProps): React.JSX.Element {
  const activeFields = React.useMemo(() => {
    const order = table.configuration.fields.orderList;
    const orderedFields = table.fields
      .filter((f) => !f.trashed)
      .sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id));

    return orderedFields;
  }, [table.fields]);

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
        const errorData = error.response?.data;

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

  const form = useAppForm({
    defaultValues: buildDefaultValuesFromRow(data, activeFields),
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const payload = buildPayload(value, activeFields);
      await _update.mutateAsync({
        slug,
        rowId,
        data: payload,
      });
    },
  });

  const isDisabled = mode === 'show' || _update.status === 'pending';

  return (
    <>
      {mode === 'show' && (
        <RowView
          data={data}
          fields={activeFields}
          tableSlug={slug}
        />
      )}

      {mode === 'edit' && (
        <form
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateRowFormFields
            form={form}
            activeFields={activeFields}
            disabled={isDisabled}
            tableSlug={slug}
          />
        </form>
      )}

      {/* Footer */}
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
                  className="disabled:cursor-not-allowed"
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
                  className="disabled:cursor-not-allowed"
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
    </>
  );
}
