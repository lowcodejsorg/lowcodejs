import {
  createLazyFileRoute,
  useParams,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import React from 'react';

import { CreateRowForm } from './-create-row-form';

import { LoadError } from '@/components/common/route-status/load-error';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="flex flex-col h-full overflow-hidden" data-test-id="create-row-page">
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
          <h1 className="text-xl font-medium">Novo registro</h1>
        </div>
      </div>

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
    </div>
  );
}
