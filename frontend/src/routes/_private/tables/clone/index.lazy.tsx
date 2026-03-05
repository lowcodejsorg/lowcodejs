import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

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
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export const Route = createLazyFileRoute('/_private/tables/clone/')({
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
  const sidebar = useSidebar();
  const router = useRouter();
  const permission = usePermission();

  const _clone = useCloneTable({
    onSuccess(data) {
      toastSuccess('Tabela clonada', 'A tabela foi clonada com sucesso');

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
      handleApiError(error, {
        context: 'Erro ao clonar tabela',
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
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
                  disabled={isSubmitting}
                  onClick={() => {
                    router.navigate({ to: '/tables/new' });
                  }}
                >
                  <span>Cancelar</span>
                </Button>
                <Button
                  type="button"
                  className="disabled:cursor-not-allowed px-2 cursor-pointer max-w-40 w-full"
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
