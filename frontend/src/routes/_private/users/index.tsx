import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { TableUsers } from './-table-users';
import { TableUsersSkeleton } from './-table-users-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import { MetaDefault } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_private/users/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
  }),
});

function RouteComponent(): React.JSX.Element {
  const authenticated = useAuthenticationStore();

  const search = useSearch({
    from: '/_private/users/',
  });

  const router = useRouter();

  const sidebar = useSidebar();

  const pagination = useUserReadPaginated({
    ...search,
    authenticated: authenticated.authenticated?.sub,
  });

  const headers = ['Nome', 'E-mail', 'Papel', 'Status'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Usuários</h1>
        <Button
          onClick={() => {
            sidebar.setOpen(false);
            router.navigate({
              to: '/users/create',
              replace: true,
            });
          }}
          className="disabled:cursor-not-allowed"
          disabled={
            pagination.status === 'pending' || pagination.status === 'error'
          }
        >
          <span>Novo Usuário</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && (
          <TableUsersSkeleton headers={headers} />
        )}

        {pagination.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados dos usuários"
            refetch={pagination.refetch}
          />
        )}

        {pagination.status === 'success' && (
          <TableUsers
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
