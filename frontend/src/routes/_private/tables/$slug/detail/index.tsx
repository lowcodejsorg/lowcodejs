import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { TableUpdateSchema, UpdateTableFormFields } from './-update-form';
import { UpdateTableFormSkeleton } from './-update-form-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { useUpdateTable } from '@/integrations/tanstack-query/implementations/use-table-update';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { MetaDefault } from '@/lib/constant';
import type { ITable, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/detail/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({ from: '/_private/tables/$slug/detail/' });
  const sidebar = useSidebar();
  const router = useRouter();
  const _read = useReadTable({ slug });

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
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {_read.status === 'error' && (
          <LoadError
            message="Erro ao buscar dados da tabela"
            refetch={_read.refetch}
          />
        )}
        {_read.status === 'pending' && <UpdateTableFormSkeleton />}
        {_read.status === 'success' && <TableUpdateContent data={_read.data} />}
      </div>
    </div>
  );
}

function TableUpdateContent({ data }: { data: ITable }): React.JSX.Element {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');

  const _update = useUpdateTable({
    onSuccess(updatedData) {
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(updatedData.slug), updatedData.slug],
        updatedData,
      );
      queryClient.setQueryData<Paginated<ITable>>(
        ['/tables/paginated', { page: 1, perPage: 50 }],
        (cached) => {
          if (!cached) {
            return {
              meta: MetaDefault,
              data: [updatedData],
            };
          }

          return {
            meta: cached.meta,
            data: cached.data.map((item) => {
              if (item._id === updatedData._id) {
                return {
                  ...item,
                  ...updatedData,
                };
              }

              return item;
            }),
          };
        },
      );

      toast('Tabela atualizada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'Os dados da tabela foram atualizados com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        toast('Erro ao atualizar a tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData?.message ?? 'Erro ao atualizar a tabela',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: data.name,
      description: data.description ?? '',
      style: data.configuration.style,
      visibility: data.configuration.visibility,
      collaboration: data.configuration.collaboration,
      logo: data.logo?._id ?? null,
      logoFile: [] as Array<File>,
    },
    onSubmit: async ({ value }) => {
      const validation = TableUpdateSchema.safeParse(value);
      if (!validation.success) return;

      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        slug: data.slug,
        name: value.name || data.name,
        description: value.description || null,
        logo: value.logo || data.logo?._id || null,
        configuration: {
          ...data.configuration,
          visibility: value.visibility,
          style: value.style,
          collaboration: value.collaboration,
          administrators: [],
        },
        methods: {
          ...data.methods,
        },
      });
    },
  });

  const isPending = _update.status === 'pending';

  return (
    <>
      <form
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

      {/* Footer com botões */}
      <div className="shrink-0 border-t p-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex justify-end space-x-2">
              {mode === 'show' && (
                <Button
                  type="button"
                  className="w-full max-w-3xs"
                  onClick={() => setMode('edit')}
                >
                  <span>Editar</span>
                </Button>
              )}

              {mode === 'edit' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full max-w-3xs"
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
                    className="w-full max-w-3xs"
                    disabled={!canSubmit}
                    onClick={() => form.handleSubmit()}
                  >
                    {isSubmitting && <Spinner />}
                    <span>Salvar</span>
                  </Button>
                </>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
}
