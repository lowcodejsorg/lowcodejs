import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { ArrowLeftIcon, PlusIcon } from 'lucide-react';
import z from 'zod';

import { TableConfigurationDropdown } from './-table-configuration';
import { TableGridView } from './-table-grid-view';
import { TableGridViewSkeleton } from './-table-grid-view-skeleton';
import { TableListView } from './-table-list-view';
import { TableListViewSkeleton } from './-table-list-view-skeleton';
import { TableSkeleton } from './-table-skeleton';

import { LoadError } from '@/components/common/load-error';
import { Pagination } from '@/components/common/pagination';
import { SheetFilter } from '@/components/common/sheet-filter';
import { TableStyleViewDropdown } from '@/components/common/table-style-view';
import { TrashButton } from '@/components/common/trash-button';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { useReadTableRowPaginated } from '@/integrations/tanstack-query/implementations/use-table-row-read-paginated';
import { MetaDefault } from '@/lib/constant';

export const Route = createFileRoute('/_private/tables/$slug/')({
  component: RouteComponent,
  validateSearch: z
    .object({
      page: z.coerce.number().default(1),
      perPage: z.coerce.number().default(50),
      trashed: z.coerce.boolean().optional(),
    })
    .catchall(
      z.union([z.enum(['asc', 'desc']).optional(), z.string().optional()]),
    ),
});

function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const search = useSearch({
    from: '/_private/tables/$slug/',
  });

  const table = useReadTable({ slug });
  const rows = useReadTableRowPaginated({ slug, search });

  const router = useRouter();
  const sidebar = useSidebar();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <div className="inline-flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sidebar.setOpen(true);
              router.navigate({
                to: '/tables',
                replace: true,
              });
            }}
          >
            <ArrowLeftIcon />
          </Button>
          {table.status === 'pending' ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <h1 className="text-2xl font-medium">{table.data?.name ?? ''}</h1>
          )}
        </div>

        <div className="inline-flex items-center space-x-2">
          {table.status === 'success' && (
            <SheetFilter
              fields={table.data.fields.filter(
                (f) => f.configuration.filtering,
              )}
            />
          )}
          <TrashButton />
          <TableStyleViewDropdown slug={slug} />
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
        {table.status === 'pending' && <TableSkeleton />}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === 'list' && (
            <TableListViewSkeleton />
          )}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === 'gallery' && (
            <TableGridViewSkeleton />
          )}

        {rows.status === 'error' && (
          <LoadError
            message="Houve um erro ao buscar dados de registros da tabela"
            refetch={rows.refetch}
          />
        )}

        {table.status === 'success' &&
          table.data.configuration.style === 'list' &&
          rows.status === 'success' && (
            <TableListView
              headers={table.data.fields}
              order={table.data.configuration.fields.orderList}
              data={rows.data.data}
            />
          )}
        {table.status === 'success' &&
          table.data.configuration.style === 'gallery' &&
          rows.status === 'success' && (
            <TableGridView
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
