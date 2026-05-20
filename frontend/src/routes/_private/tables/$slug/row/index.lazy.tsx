import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import React from 'react';

import { AutoSaveRowForm } from './-auto-save-row-form';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { LoadError } from '@/components/common/route-status/load-error';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';

export const Route = createLazyFileRoute('/_private/tables/$slug/row/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/row/',
  });

  const table = useReadTable({ slug });

  const goBack = (): void => {
    sidebar.setOpen(false);
    router.navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  const isLoading = table.status === 'pending';

  return (
    <PageShell data-test-id="create-row-page">
      <PageShell.Header borderBottom={false}>
        <PageHeader
          onBack={goBack}
          title="Novo registro"
        />
      </PageShell.Header>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {!isLoading && table.status === 'error' && (
        <LoadError
          refetch={table.refetch}
          message="Erro ao carregar dados da tabela"
        />
      )}

      {!isLoading && table.status === 'success' && (
        <AutoSaveRowForm
          table={table.data}
          onBack={goBack}
        />
      )}
    </PageShell>
  );
}
