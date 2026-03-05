import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';

import { TableMenus } from './-table-menus';

import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { menuListOptions } from '@/hooks/tanstack-query/_query-options';
import { MetaDefault } from '@/lib/constant';

export const Route = createLazyFileRoute('/_private/menus/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({ from: '/_private/menus/' });
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate({ from: '/menus' });

  const { data } = useSuspenseQuery(menuListOptions(search));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Gestão de Menus</h1>
        <Button
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
        <TableMenus data={data.data} />
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-2">
        <Pagination
          meta={data.meta ?? MetaDefault}
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
