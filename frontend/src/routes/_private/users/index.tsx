import { Pagination } from '@/components/common/pagination';
// import { useI18n } from '@/hooks/i18.hook';
import { API } from '@/lib/api';
import { IUser, Paginated } from '@/lib/interfaces';
// import type { Paginated, User } from '@/lib/entity';
// import { MetaDefault } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { MetaDefault } from '@/lib/constant';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import z from 'zod';
import { TableUsers } from './-table-users';
// import { SheetUserCreate } from './-components/sheet-user-create';
// import { TableUsers } from './-components/table-user';

export const Route = createFileRoute('/_private/users/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent() {
  const search = useSearch({
    from: '/_private/users/',
  });

  const sidebar = useSidebar();

  const pagination = useQuery({
    queryKey: ['/users/paginated', search],
    queryFn: async () => {
      const response = await API.get<Paginated<IUser>>('/users/paginated', {
        params: {
          ...search,
        },
      });
      return response.data;
    },
  });

  const headers = ['Nome', 'E-mail', 'Papel', 'Status'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Usuários</h1>
        <Button
          onClick={() => {
            sidebar.setOpen(false);
          }}
          asChild
        >
          <Link
            to="/users/create"
            replace
          >
            Novo Usuário
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'success' && (
          <TableUsers
            headers={headers as string[]}
            data={pagination.data?.data || []}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={pagination?.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
