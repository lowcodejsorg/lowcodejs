import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import React from 'react';

import { CreateRowForm } from './-create-row-form';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { LoadError } from '@/components/common/route-status/load-error';
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/_private/tables/$slug/row/create/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const { slug } = useParams({
    from: '/_private/tables/$slug/row/create/',
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

  return (
    <PageShell data-test-id="create-row-page">
      {/* Header */}
      <PageShell.Header borderBottom={false}>
        <PageHeader
          onBack={goBack}
          title="Novo registro"
        />
      </PageShell.Header>

      {/* Content */}
      <div
        className={cn(
          ['pending', 'error'].includes(table.status) &&
            'flex-1 flex flex-col min-h-0 overflow-auto relative',
        )}
      >
        {table.status === 'pending' && <Spinner />}
        {table.status === 'error' && (
          <LoadError
            refetch={table.refetch}
            message={'Erro ao carregar dados da tabela'}
          />
        )}
      </div>

      {table.status === 'success' && <CreateRowForm table={table.data} />}
    </PageShell>
  );
}
