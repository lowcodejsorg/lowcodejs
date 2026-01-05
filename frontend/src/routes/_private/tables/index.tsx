import { createFileRoute, useRouter, useSearch } from '@tanstack/react-router';
import z from 'zod';

import { TableTables } from './-table-tables';
import { TableTablesSkeleton } from './-table-tables-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { SheetFilter } from '@/components/common/sheet-filter';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useTablesReadPaginated } from '@/hooks/tanstack-query/use-tables-read-paginated';
import { usePermission } from '@/hooks/use-table-permission';
import { FIELD_TYPE, MetaDefault } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

export const Route = createFileRoute('/_private/tables/')({
  component: RouteComponent,
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    name: z.string().optional(),
  }),
});

function RouteComponent(): React.JSX.Element {
  const search = useSearch({
    from: '/_private/tables/',
  });

  const sidebar = useSidebar();
  const router = useRouter();

  const pagination = useTablesReadPaginated(search);
  const permission = usePermission();

  const headers = ['Tabela', 'Link (slug)', 'Visibilidade', 'Criado em'];

  const fieldFilters: Array<IField> = [
    {
      _id: 'name',
      slug: 'name',
      name: 'Nome',
      type: FIELD_TYPE.TEXT_SHORT,
      trashed: false,
      trashedAt: null,
      createdAt: '',
      updatedAt: null,
      configuration: {
        format: null,
        category: null,
        defaultValue: null,
        dropdown: null,
        filtering: true,
        group: null,
        listing: true,
        multiple: false,
        relationship: null,
        required: false,
      },
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">Tabelas</h1>
        <div className="inline-flex items-center gap-2">
          <SheetFilter fields={fieldFilters} />
          {permission.can('CREATE_TABLE') && (
            <Button
              disabled={
                pagination.status === 'pending' || pagination.status === 'error'
              }
              className="disabled:cursor-not-allowed"
              size={'sm'}
              onClick={() => {
                sidebar.setOpen(false);
                router.navigate({
                  to: '/tables/create',
                  replace: true,
                });
              }}
            >
              <span>Nova Tabela</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {pagination.status === 'pending' && (
          <TableTablesSkeleton headers={headers} />
        )}

        {pagination.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados das tabelas"
            refetch={pagination.refetch}
          />
        )}

        {pagination.status === 'success' && (
          <TableTables
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
