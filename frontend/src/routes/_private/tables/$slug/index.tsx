import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import z from 'zod';

import { TableConfigurationDropdown } from './-table-configuration';
import { TableListView } from './-table-list-view';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { useReadTableRowPaginated } from '@/integrations/tanstack-query/implementations/use-table-row-read-paginated';
import { MetaDefault } from '@/lib/constant';

export const Route = createFileRoute('/_private/tables/$slug/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
    })
    .catchall(z.enum(['asc', 'desc']).optional()),
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const table = useReadTable({ slug });
  const rows = useReadTableRowPaginated({ slug });

  const router = useRouter();
  const sidebar = useSidebar();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium ">{table.data?.name ?? ''}</h1>

        <div className="inline-flex items-center space-x-2">
          <TableConfigurationDropdown tableSlug={slug} />

          <Button
            disabled={rows.status === 'pending' || rows.status === 'error'}
            className="disabled:cursor-not-allowed shadow-none p-1 h-auto"
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug/row/create',
                replace: true,
                params: { slug },
              });
            }}
          >
            <PlusIcon />
            <span>Registro</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {/* {pagination.status === 'pending' && (
          <TableTablesSkeleton headers={headers} />
        )} */}

        {rows.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados de registros da tabela"
            refetch={rows.refetch}
          />
        )}

        {table.status === 'success' && rows.status === 'success' && (
          <TableListView
            headers={table.data.fields}
            order={table.data.configuration.fields.orderList}
            data={rows.data.data}
          />
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <Pagination meta={rows.data?.meta ?? MetaDefault} />
      </div>
    </div>
  );
}
