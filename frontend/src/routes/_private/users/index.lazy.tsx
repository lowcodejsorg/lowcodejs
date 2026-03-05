import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';

import { TableUsers } from './-table-users';

import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { userListOptions } from '@/hooks/tanstack-query/_query-options';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/users/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const auth = useAuthStore();

  const search = useSearch({
    from: '/_private/users/',
  });

  const router = useRouter();
  const navigate = useNavigate({ from: '/users' });

  const sidebar = useSidebar();

  const { data } = useSuspenseQuery(
    userListOptions({
      ...search,
      authenticated: auth.user?._id,
    }),
  );

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
        >
          <span>Novo Usuário</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableUsers
          headers={headers}
          data={data.data}
        />
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination
          meta={data.meta}
          page={search.page}
          perPage={search.perPage}
          onPageChange={(page) =>
            navigate({ search: (prev) => ({ ...prev, page }) })
          }
          onPerPageChange={(perPage) =>
            navigate({ search: (prev) => ({ ...prev, perPage, page: 1 }) })
          }
        />
      </div>
    </div>
  );
}
