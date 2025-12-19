import { Pagination } from '@/components/common/pagination';
import { API } from '@/lib/api';
import { IGroup, Paginated } from '@/lib/interfaces';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { MetaDefault } from '@/lib/constant';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import z from 'zod';
import { TableGroups } from './-table-groups';

export const Route = createFileRoute('/_private/groups/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const search = useSearch({
    from: '/_private/groups/',
  });

  const sidebar = useSidebar();

  const pagination = useQuery({
    queryKey: ['/user-group/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<IGroup>>('/user-group/paginated', {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  const headers = ['Nome', 'Slug', 'Descrição'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Grupos</h1>
        <Button
          onClick={() => {
            sidebar.setOpen(false);
          }}
          asChild
        >
          <Link to="/groups/create" replace>
            Novo Grupo
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'success' && (
          <TableGroups headers={headers as string[]} data={pagination.data?.data || []} />
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
