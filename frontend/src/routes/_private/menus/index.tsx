import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { API } from '@/lib/api';
import { MetaDefault } from '@/lib/constant';
import { IMenu, Paginated } from '@/lib/interfaces';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import z from 'zod';
import { TableMenus } from './-table-menus';

export const Route = createFileRoute('/_private/menus/')({
  component: RouteComponent,
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const search = useSearch({ from: '/_private/menus/' });
  const sidebar = useSidebar();

  const menus = useQuery({
    queryKey: ['/menu/paginated', search],
    queryFn: async function () {
      const response = await API.get<Paginated<IMenu>>('/menu/paginated', {
        params: search,
      });
      return response.data;
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Gestão de Menus</h1>
        <Button
          onClick={() => {
            sidebar.setOpen(false);
          }}
          asChild
        >
          <Link to="/menus/create">
            <PlusIcon />
            <span>Novo Menu</span>
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableMenus data={menus.data?.data || []} />
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <Pagination meta={menus.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
