import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import React from 'react';

import { TableUsers } from './-table-users';

import { getActiveFiltersCount } from '@/components/common/filters/filter-fields';
import { FilterSidebar } from '@/components/common/filters/filter-sidebar';
import { FilterTrigger } from '@/components/common/filters/filter-trigger';
import { PageShell } from '@/components/common/page-shell';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { userListOptions } from '@/hooks/tanstack-query/_query-options';
import { E_FIELD_TYPE, E_ROLE } from '@/lib/constant';
import type { IFilterField } from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/users/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(
    null,
  );
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
      role: E_ROLE.ADMINISTRATOR,
    }),
  );

  const [filterOpen, setFilterOpen] = React.useState(() => {
    try {
      return localStorage.getItem('filter-sidebar-open') === 'true';
    } catch {
      return false;
    }
  });

  const handleFilterOpenChange = React.useCallback((open: boolean) => {
    setFilterOpen(open);
    try {
      localStorage.setItem('filter-sidebar-open', String(open));
    } catch {}
  }, []);

  const fieldFilters: Array<IFilterField> = [
    {
      slug: 'search',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      multiple: false,
    },
  ];

  const activeFiltersCount = getActiveFiltersCount(fieldFilters, search);

  return (
    <PageShell data-test-id="users-page">
      <PageShell.Header>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <div ref={setToolbarNode} />
          <FilterTrigger
            activeFiltersCount={activeFiltersCount}
            onClick={() => handleFilterOpenChange(!filterOpen)}
            isOpen={filterOpen}
          />
          <Button
            data-test-id="create-user-btn"
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
      </PageShell.Header>

      <div className="flex-1 flex flex-row min-h-0">
        <FilterSidebar
          fields={fieldFilters}
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
        />
        <PageShell.Content>
          <TableUsers
            data={data.data}
            toolbarPortal={toolbarNode}
          />
        </PageShell.Content>
      </div>

      <PageShell.Footer>
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
      </PageShell.Footer>
    </PageShell>
  );
}
