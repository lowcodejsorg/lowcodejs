import { createFileRoute, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  CloneTableBodySchema,
  CloneTableFormFields,
  cloneTableFormDefaultValues,
} from './-clone-form';

import { AccessDenied } from '@/components/common/access-denied';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useCloneTable } from '@/hooks/tanstack-query/use-clone-table';
import { usePermission } from '@/hooks/use-table-permission';
import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import type { IHTTPExeptionError } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/clone/')({
  component: RouteComponent,
});

function CloneFormSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function RouteComponent(): React.JSX.Element {
  const { queryClient } = getContext();
  const sidebar = useSidebar();
  const router = useRouter();
  const permission = usePermission();

  const _clone = useCloneTable({
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: ['/tables'],
      });

      queryClient.invalidateQueries({
        queryKey: ['/tables/paginated'],
      });

      toast('Tabela clonada', {
        className: '!bg-green-600 !text-white !border-green-600',
        description: 'A tabela foi clonada com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      sidebar.setOpen(true);

      router.navigate({
        to: '/tables/$slug',
        params: {
          slug: data.slug,
        },
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as IHTTPExeptionError<{
          name?: string;
          baseTableId?: string;
        }>;

        if (errorData.cause === 'TABLE_NOT_FOUND' && errorData.code === 404) {
          toast('Modelo não encontrado', {
            className: '!bg-destructive !text-white !border-destructive',
            description: 'A tabela modelo selecionada não foi encontrada',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        if (
          (errorData.cause === 'INVALID_PAYLOAD_FORMAT' ||
            errorData.cause === 'VALIDATION_ERROR') &&
          errorData.code === 400
        ) {
          toast('Erro de validação', {
            className: '!bg-destructive !text-white !border-destructive',
            description: errorData.message || 'Verifique os dados informados',
            descriptionClassName: '!text-white',
            closeButton: true,
          });
          return;
        }

        toast('Erro ao clonar tabela', {
          className: '!bg-destructive !text-white !border-destructive',
          description: errorData.message || 'Erro ao clonar a tabela',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
        return;
      }

      toast('Erro ao clonar tabela', {
        className: '!bg-destructive !text-white !border-destructive',
        description: 'Houve um erro interno ao clonar a tabela',
        descriptionClassName: '!text-white',
        closeButton: true,
      });
    },
  });

  const form = useAppForm({
    defaultValues: cloneTableFormDefaultValues,
    validators: {
      onSubmit: CloneTableBodySchema,
    },
    onSubmit: async ({ value }) => {
      if (_clone.status === 'pending') return;

      await _clone.mutateAsync({
        baseTableId: value.MODEL_CLONE_TABLES,
        name: value.name.trim(),
      });
    },
  });

  const isPending = _clone.status === 'pending';

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
                to: '/tables/new',
                replace: true,
                search: { page: 1, perPage: 50 },
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <h1 className="text-xl font-medium">
            Criar nova tabela utilizando modelo
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {permission.isLoading && <CloneFormSkeleton />}
        {!permission.isLoading && !permission.can('CREATE_TABLE') && (
          <AccessDenied />
        )}
        {!permission.isLoading && permission.can('CREATE_TABLE') && (
          <form
            className="flex-1 flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <CloneTableFormFields
              form={form}
              isPending={isPending}
            />
          </form>
        )}
      </div>

      {/* Footer com botões */}
      {!permission.isLoading && permission.can('CREATE_TABLE') && (
        <div className="shrink-0 border-t p-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full max-w-3xs"
                  disabled={isSubmitting}
                  onClick={() => {
                    router.navigate({ to: '/tables/new' });
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
                  <span>Criar</span>
                </Button>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
