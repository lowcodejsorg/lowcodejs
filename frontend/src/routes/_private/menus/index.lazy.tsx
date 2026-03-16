import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import React from 'react';

import { TableMenus } from './-table-menus';

import { getActiveFiltersCount } from '@/components/common/filter-fields';
import { FilterSidebar } from '@/components/common/filter-sidebar';
import { FilterTrigger } from '@/components/common/filter-trigger';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { menuListOptions } from '@/hooks/tanstack-query/_query-options';
import { E_FIELD_TYPE, MetaDefault } from '@/lib/constant';
import type { IFilterField } from '@/lib/interfaces';

export const Route = createLazyFileRoute('/_private/menus/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(
    null,
  );
  const search = useSearch({ from: '/_private/menus/' });
  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate({ from: '/menus' });

  const { data } = useSuspenseQuery(menuListOptions(search));

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">Gestão de Menus</h1>
        <div className="inline-flex items-center gap-2">
          <div ref={setToolbarNode} />
          <FilterTrigger
            activeFiltersCount={activeFiltersCount}
            onClick={() => handleFilterOpenChange(!filterOpen)}
            isOpen={filterOpen}
          />
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
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-row min-h-0">
        <FilterSidebar
          fields={fieldFilters}
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <TableMenus
            data={data.data}
            toolbarPortal={toolbarNode}
          />
        </div>
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
