import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { UpdateTableForm } from './-update-form';
import { UpdateTableFormSkeleton } from './-update-form-skeleton';

export const Route = createFileRoute('/_private/tables/$slug/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({ from: '/_private/tables/$slug/' });
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
        {_read.status === 'success' && (
          <UpdateTableForm
            data={_read.data}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
