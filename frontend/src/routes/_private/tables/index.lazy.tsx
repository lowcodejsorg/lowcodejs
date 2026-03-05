import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';

import { TableTables } from './-table-tables';

import { Pagination } from '@/components/common/pagination';
import { SheetFilter } from '@/components/common/sheet-filter';
import { TrashButton } from '@/components/common/trash-button';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { tableListOptions } from '@/hooks/tanstack-query/_query-options';
import { usePermission } from '@/hooks/use-table-permission';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

export const Route = createLazyFileRoute('/_private/tables/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/tables/',
  });

  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate({ from: '/tables' });

  const { data } = useSuspenseQuery(tableListOptions(search));
  const permission = usePermission();

  const headers = [
    'Tabela',
    'Link (slug)',
    'Visibilidade',
    'Criado por',
    'Criado em',
  ];

  const fieldFilters: Array<IField> = [
    {
      _id: 'name',
      slug: 'name',
      name: 'Nome',
      type: E_FIELD_TYPE.TEXT_SHORT,
      trashed: false,
      trashedAt: null,
      createdAt: '',
      updatedAt: null,
      format: null,
      category: [],
      defaultValue: null,
      dropdown: [],
      showInFilter: true,
      showInForm: true,
      showInDetail: true,
      showInList: true,
      group: null,
      multiple: false,
      relationship: null,
      required: false,
      locked: false,
      widthInForm: null,
      widthInList: null,
      native: false,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Tabelas</h1>
        <div className="inline-flex items-center gap-2">
          {permission.can('REMOVE_TABLE') && <TrashButton />}
          <SheetFilter fields={fieldFilters} />
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
      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <TableTables
          headers={headers}
          data={data.data}
        />
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
