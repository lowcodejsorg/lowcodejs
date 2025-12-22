import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { TableMenus } from './-table-menus';
import { TableMenusSkeleton } from './-table-menus-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import { MetaDefault } from '@/lib/constant';
import type { IMenu, Paginated } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/menus/')({
  component: RouteComponent,
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({ from: '/_private/menus/' });
  const sidebar = useSidebar();
  const router = useRouter();

  const pagination = useQuery({
    queryKey: ['/menu/paginated', search],
    queryFn: async function () {
      const response = await API.get<Paginated<IMenu>>('/menu/paginated', {
        params: search,
      });
      return response.data;
    },
  });

  const headers = ['Nome', 'Slug', 'Tipo'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Gestão de Menus</h1>
        <Button
          disabled={
            pagination.status === 'pending' || pagination.status === 'error'
          }
          className="disabled:cursor-not-allowed"
          onClick={() => {
            sidebar.setOpen(false);
            router.navigate({
              to: '/menus/create',
              replace: true,
            });
          }}
        >
          <span>Novo Menu</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && (
          <TableMenusSkeleton headers={headers} />
        )}

        {pagination.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados dos menus"
            refetch={pagination.refetch}
          />
        )}

        {pagination.status === 'success' && (
          <TableMenus data={pagination.data.data} />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
