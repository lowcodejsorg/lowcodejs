import {
  createLazyFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import React from 'react';

import { AutoSaveRowForm } from './-auto-save-row-form';
import { ExistingRowView } from './-existing-row-view';

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

  const { slug } = useParams({ from: '/_private/tables/$slug/row/' });
  const search = useSearch({ from: '/_private/tables/$slug/row/' });

  const rowId = search._id;

  const goBack = (): void => {
    sidebar.setOpen(false);
    router.navigate({
      to: '/tables/$slug',
      replace: true,
      params: { slug },
    });
  };

  if (!rowId) {
    return (
      <CreateRowView
        slug={slug}
        initialCategory={search.category}
        onBack={goBack}
      />
    );
  }

  return (
    <ExistingRowView
      slug={slug}
      rowId={rowId}
      mode={search.mode}
      onBack={goBack}
    />
  );
}

interface CreateRowViewProps {
  slug: string;
  initialCategory?: string;
  onBack: () => void;
}

function CreateRowView({
  slug,
  initialCategory,
  onBack,
}: CreateRowViewProps): React.JSX.Element {
  const table = useReadTable({ slug });

  const isLoading = !table.data && table.status === 'pending';

  const backGuardRef = React.useRef<(() => void) | null>(null);
  const handleHeaderBack = (): void => {
    const guard = backGuardRef.current;
    if (guard) {
      guard();
      return;
    }
    onBack();
  };

  return (
    <PageShell data-test-id="create-row-page">
      <PageShell.Header borderBottom={false}>
        <PageHeader
          onBack={handleHeaderBack}
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
          initialCategory={initialCategory}
          onBack={onBack}
          backGuardRef={backGuardRef}
        />
      )}
    </PageShell>
  );
}
