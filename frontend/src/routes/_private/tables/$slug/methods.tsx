import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  MethodsFormFields,
  tableMethodsFormDefaultValues,
} from './-methods-form';

import { AccessDenied } from '@/components/common/access-denied';
import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useUpdateTable } from '@/hooks/tanstack-query/use-table-update';
import { useTablePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { ITable } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/methods')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({ from: '/_private/tables/$slug/methods' });
  const sidebar = useSidebar();
  const router = useRouter();
  const table = useReadTable({ slug });
  const permission = useTablePermission(table.data);

  // Loading enquanto verifica permissão
  if (table.status === 'pending' || permission.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-75 w-full" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
    );
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
          <h1 className="text-xl font-medium">Métodos da tabela</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {table.status === 'error' && (
          <LoadError
            message="Erro ao buscar dados da tabela"
            refetch={table.refetch}
          />
        )}
        {table.status === 'success' && (
          <MethodsFormContent
            data={table.data}
            tableSlug={slug}
          />
        )}
      </div>
    </div>
  );
}

interface MethodsFormContentProps {
  data: ITable;
  tableSlug: string;
}

function MethodsFormContent({
  data,
  tableSlug,
}: MethodsFormContentProps): React.JSX.Element {
  const { queryClient } = getContext();
  const table = useReadTable({ slug: tableSlug });
  const permission = useTablePermission(table.data);
  const canEdit = permission.can('UPDATE_TABLE');

  const _update = useUpdateTable({
    onSuccess(response) {
      queryClient.setQueryData<ITable>(
        ['/tables/'.concat(tableSlug), tableSlug],
        response,
      );

      toast('Métodos atualizados', {
        className: '!bg-primary !text-primary-foreground !border-primary',
        description: 'Os métodos da tabela foram atualizados com sucesso',
        descriptionClassName: '!text-primary-foreground',
        closeButton: true,
      });
    },
    onError(error) {
      console.error(error);
      toast('Erro ao atualizar métodos', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Não foi possível atualizar os métodos da tabela',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const form = useAppForm({
    defaultValues: {
      ...tableMethodsFormDefaultValues,
      onLoad: data.methods.onLoad.code ?? '',
      beforeSave: data.methods.beforeSave.code ?? '',
      afterSave: data.methods.afterSave.code ?? '',
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      await _update.mutateAsync({
        slug: tableSlug,
        methods: {
          onLoad: {
            code: value.onLoad || null,
          },
          beforeSave: {
            code: value.beforeSave || null,
          },
          afterSave: {
            code: value.afterSave || null,
          },
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
        <MethodsFormFields
          form={form}
          isPending={isPending}
          table={data}
        />
      </form>

      {/* Footer com botões */}
      {canEdit && (
        <div className="shrink-0 border-t p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="w-full max-w-3xs"
                  disabled={!canSubmit}
                  onClick={() => form.handleSubmit()}
                >
                  {isSubmitting && <Spinner />}
                  <span>Salvar Métodos</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </>
  );
}
