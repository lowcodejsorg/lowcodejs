import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import React from 'react';

import { TableUpdateSchema, UpdateTableFormFields } from './-update-form';
import { UpdateTableFormSkeleton } from './-update-form-skeleton';
import { TableView } from './-view';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { handleApiError } from '@/lib/handle-api-error';
import type { ITable } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/tables/$slug/detail/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({ from: '/_private/tables/$slug/detail/' });
  const sidebar = useSidebar();
  const router = useRouter();
  const _read = useReadTable({ slug });
  const permission = useTablePermission(_read.data);

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  // Loading enquanto verifica permissão
  if (_read.status === 'pending' || permission.isLoading) {
    return <UpdateTableFormSkeleton />;
  }

  // Mostrar erro se não tem permissão
  if (!permission.can('UPDATE_TABLE')) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(true);
              router.navigate({
                to: '/tables',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">Detalhes da tabela</h1>
        </div>
        {_read.status === 'success' && mode === 'show' && (
          <div className="inline-flex items-center gap-2">
            {permission.can('UPDATE_TABLE') && (
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
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Erro ao buscar dados da tabela"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'success' && (
          <TableUpdateContent
            data={_read.data}
            mode={mode}
            setMode={setMode}
          />
        )}
      </div>
    </div>
  );
}

interface TableUpdateContentProps {
  data: ITable;
  mode: 'show' | 'edit';
  setMode: React.Dispatch<React.SetStateAction<'show' | 'edit'>>;
}

function TableUpdateContent({
  data,
  mode,
  setMode,
}: TableUpdateContentProps): React.JSX.Element {
  const _update = useUpdateTable({
    onSuccess() {
      toastSuccess(
        'Tabela atualizada',
        'Os dados da tabela foram atualizados com sucesso',
      );

      form.reset();
      setMode('show');
    },
    onError(error) {
      handleApiError(error, {
        context: 'Erro ao atualizar a tabela',
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      description: data.description ?? '',
      style: data.style,
      visibility: data.visibility,
      collaboration: data.collaboration,
      logo: data.logo?._id ?? null,
      logoFile: [] as Array<File>,
      administrators: data.administrators.map((admin) =>
        typeof admin === 'string' ? admin : admin._id,
      ),
      order:
        data.order?.field && data.order?.direction
          ? `${data.order.field}:${data.order.direction}`
          : 'none',
      layoutFields: {
        title: data.layoutFields?.title ?? '',
        description: data.layoutFields?.description ?? '',
        cover: data.layoutFields?.cover ?? '',
        category: data.layoutFields?.category ?? '',
        startDate: data.layoutFields?.startDate ?? '',
        endDate: data.layoutFields?.endDate ?? '',
        color: data.layoutFields?.color ?? '',
        participants: data.layoutFields?.participants ?? '',
        reminder: data.layoutFields?.reminder ?? '',
      },
    },
    // @ts-expect-error Zod Standard Schema type inference
    validators: { onChange: TableUpdateSchema, onSubmit: TableUpdateSchema },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      let orderPayload: { field: string; direction: 'asc' | 'desc' } | null =
        null;
      if (value.order && value.order !== 'none') {
        const [field, direction] = value.order.split(':');
        orderPayload = {
          field,
          direction: direction as 'asc' | 'desc',
        };
      }

      await _update.mutateAsync({
        slug: data.slug,
        name: value.name || data.name,
        description: value.description || null,
        logo: value.logo || data.logo?._id || null,
        visibility: value.visibility,
        style: value.style,
        collaboration: value.collaboration,
        fieldOrderList: data.fieldOrderList,
        fieldOrderForm: data.fieldOrderForm,
        administrators: value.administrators,
        methods: {
          ...data.methods,
        },
        order: orderPayload,
        layoutFields: {
          title: value.layoutFields.title || null,
          description: value.layoutFields.description || null,
          cover: value.layoutFields.cover || null,
          category: value.layoutFields.category || null,
          startDate: value.layoutFields.startDate || null,
          endDate: value.layoutFields.endDate || null,
          color: value.layoutFields.color || null,
          participants: value.layoutFields.participants || null,
          reminder: value.layoutFields.reminder || null,
        },
      });
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      {mode === 'show' && <TableView data={data} />}

      {mode === 'edit' && (
        <form
          id="table-update-form"
          className="flex-1 flex flex-col min-h-0 overflow-auto"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <UpdateTableFormFields
            form={form}
            isPending={isPending}
            mode={mode}
            tableData={data}
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
                  type="submit"
                  form="table-update-form"
                  size="sm"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={!canSubmit}
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
