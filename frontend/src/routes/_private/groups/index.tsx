import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { TableGroups } from './-table-groups';
import { TableGroupsSkeleton } from './-table-groups-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useGroupReadPaginated } from '@/hooks/tanstack-query/use-group-read-paginated';
import { MetaDefault } from '@/lib/constant';

export const Route = createFileRoute('/_private/groups/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/groups/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const pagination = useGroupReadPaginated(search);

  const headers = ['Nome', 'Slug', 'Descrição'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Grupos</h1>
        <Button
          disabled={
            pagination.status === 'pending' || pagination.status === 'error'
          }
          className="disabled:cursor-not-allowed"
          onClick={() => {
            sidebar.setOpen(false);
            router.navigate({
              to: '/groups/create',
              replace: true,
            });
          }}
        >
          <span>Novo Grupo</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && (
          <TableGroupsSkeleton headers={headers} />
        )}

        {pagination.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados dos grupos"
            refetch={pagination.refetch}
          />
        )}

        {pagination.status === 'success' && (
          <TableGroups
            headers={headers}
            data={pagination.data.data}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
