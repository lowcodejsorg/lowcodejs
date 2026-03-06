import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import React from 'react';

import { TableTables } from './-table-tables';

import { getActiveFiltersCount } from '@/components/common/filter-fields';
import { FilterSidebar } from '@/components/common/filter-sidebar';
import { FilterTrigger } from '@/components/common/filter-trigger';
import { Pagination } from '@/components/common/pagination';
import { TrashButton } from '@/components/common/trash-button';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { tableListOptions } from '@/hooks/tanstack-query/_query-options';
import { usePermission } from '@/hooks/use-table-permission';
import { E_FIELD_TYPE, TABLE_VISIBILITY_OPTIONS } from '@/lib/constant';
import type { IFilterField } from '@/lib/interfaces';

export const Route = createLazyFileRoute('/_private/tables/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(null);
  const search = useSearch({
    from: '/_private/tables/',
  });

  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate({ from: '/tables' });

  const { data } = useSuspenseQuery(tableListOptions(search));
  const permission = usePermission();

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
      slug: 'name',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      multiple: false,
    },
    {
      slug: 'visibility',
      name: 'Visibilidade',
      type: E_FIELD_TYPE.DROPDOWN,
      multiple: true,
      dropdown: TABLE_VISIBILITY_OPTIONS.map((o) => ({
        id: o.value,
        label: o.label,
        color: null,
      })),
    },
    {
      slug: 'owner',
      name: 'Criado por',
      type: E_FIELD_TYPE.TEXT_SHORT,
      multiple: false,
    },
  ];

  const activeFiltersCount = getActiveFiltersCount(fieldFilters, search);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Tabelas</h1>
        <div className="inline-flex items-center gap-2">
          <div ref={setToolbarNode} />
          {permission.can('REMOVE_TABLE') && <TrashButton />}
          <FilterTrigger
            activeFiltersCount={activeFiltersCount}
            onClick={() => handleFilterOpenChange(!filterOpen)}
            isOpen={filterOpen}
          />
          {permission.can('CREATE_TABLE') && (
            <Button
              className="disabled:cursor-not-allowed"
              size={'sm'}
              onClick={() => {
                sidebar.setOpen(false);
                router.navigate({
                  to: '/tables/new',
                  replace: true,
                });
              }}
            >
              <span>Nova Tabela</span>
            </Button>
          )}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 flex flex-row min-h-0">
        <FilterSidebar
          fields={fieldFilters}
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <TableTables data={data.data} toolbarPortal={toolbarNode} />
        </div>
      </div>

      {/* footer */}
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
