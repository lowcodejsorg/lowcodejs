import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { UpdateRowForm } from './-update-form';
import { UpdateRowFormSkeleton } from './-update-form-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { API } from '@/lib/api';
import type { IRow } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/$slug/row/$rowId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { slug, rowId } = useParams({
    from: '/_private/tables/$slug/row/$rowId/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const table = useReadTable({ slug });

  const _read = useQuery({
    queryKey: [
      '/tables/'.concat(slug).concat('/rows/').concat(rowId),
      rowId,
    ],
    queryFn: async () => {
      const response = await API.get<IRow>(
        `/tables/${slug}/rows/${rowId}`,
      );
      return response.data;
    },
    enabled: Boolean(slug) && Boolean(rowId),
  });

  const isLoading = table.status === 'pending' || _read.status === 'pending';
  const isError = table.status === 'error' || _read.status === 'error';
  const isSuccess = table.status === 'success' && _read.status === 'success';

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
          <h1 className="text-xl font-medium">Detalhes do registro</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {isError && (
          <LoadError
            message="Houve um erro ao buscar dados do registro"
            refetch={() => {
              table.refetch();
              _read.refetch();
            }}
          />
        )}
        {isLoading && <UpdateRowFormSkeleton />}
        {isSuccess && (
          <UpdateRowForm
            data={_read.data}
            table={table.data}
            key={_read.data._id}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2"></div>
    </div>
  );
}
