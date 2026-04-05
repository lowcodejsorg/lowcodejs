import { createLazyFileRoute, useRouter } from '@tanstack/react-router';

import {
  CloneTableBodySchema,
  CloneTableFormFields,
  cloneTableFormDefaultValues,
} from './-clone-form';

import { FormFooter } from '@/components/common/form-footer';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { AccessDenied } from '@/components/common/route-status/access-denied';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
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
      onChange: CloneTableBodySchema,
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

  const goBack = (): void => {
    sidebar.setOpen(true);
    router.navigate({
      to: '/tables/new',
      replace: true,
      search: { page: 1, perPage: 50 },
    });
  };

  return (
    <PageShell data-test-id="clone-table-page">
      {/* Header */}
      <PageShell.Header borderBottom={false}>
        <PageHeader
          title="Criar nova tabela utilizando modelo"
          onBack={goBack}
        />
      </PageShell.Header>

      {/* Content */}
      <PageShell.Content>
        {permission.isLoading && <CloneFormSkeleton />}
        {!permission.isLoading && !permission.can('CREATE_TABLE') && (
          <AccessDenied />
        )}
        {!permission.isLoading && permission.can('CREATE_TABLE') && (
          <form
            className="flex-1 flex flex-col"
            data-test-id="clone-table-form"
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
      </PageShell.Content>

      {/* Footer com botões */}
      {!permission.isLoading && permission.can('CREATE_TABLE') && (
        <PageShell.Footer>
          <FormFooter
            form={form}
            cancelTestId="clone-table-cancel-btn"
            submitTestId="clone-table-submit-btn"
            submitLabel="Criar"
            onCancel={() => {
              router.navigate({ to: '/tables/new' });
            }}
          />
        </PageShell.Footer>
      )}
    </PageShell>
  );
}
