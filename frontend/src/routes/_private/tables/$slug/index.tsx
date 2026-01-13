import {
  createFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import { ArrowLeftIcon, PlusIcon, ShieldXIcon } from 'lucide-react';
import z from 'zod';

import { TableConfigurationDropdown } from './-table-configuration';
import { TableDocumentView } from './-table-document-view';
import { TableDocumentViewSkeleton } from './-table-document-view-skeleton';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useReadTableRowPaginated } from '@/hooks/tanstack-query/use-table-row-read-paginated';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_STYLE, MetaDefault } from '@/lib/constant';
import { useAuthenticationStore } from '@/stores/authentication';
import { TableCardView } from './-table-card-view';
import { TableMosaicView } from './-table-mosaic-view';
import { TableCardViewSkeleton } from './-table-card-view-skeleton';
import { TableMosaicViewSkeleton } from './-table-mosaic-view-skeleton';

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
  const authentication = useAuthenticationStore().authenticated;
  const isAuthenticated = Boolean(authentication?.role);

  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const search = useSearch({
    from: '/_private/tables/$slug/',
  });

  const table = useReadTable({ slug });
  const rows = useReadTableRowPaginated({ slug, search });
  const permission = useTablePermission(table.data);

  const router = useRouter();
  const sidebar = useSidebar();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <div className="inline-flex items-center space-x-2">
          {isAuthenticated && (
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
          )}
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

          {permission.can('CREATE_ROW') && (
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
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        {table.status === 'pending' && <TableSkeleton />}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === E_TABLE_STYLE.LIST && (
            <TableListViewSkeleton />
          )}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === E_TABLE_STYLE.GALLERY && (
            <TableGridViewSkeleton />
          )}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === E_TABLE_STYLE.DOCUMENT && (
            <TableDocumentViewSkeleton />
          )}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === E_TABLE_STYLE.CARD && (
            <TableCardViewSkeleton />
          )}
        {table.status === 'success' &&
          rows.status === 'pending' &&
          table.data.configuration.style === E_TABLE_STYLE.MOSAIC && (
            <TableMosaicViewSkeleton />
          )}

        {rows.status === 'error' &&
          ((): React.JSX.Element => {
            const error = rows.error as AxiosError<{
              code: number;
              cause: string;
            }>;
            const cause = error.response?.data.cause;

            // Erros de permissão - sem botão de refetch
            if (
              cause === 'TABLE_PRIVATE' ||
              cause === 'FORM_VIEW_RESTRICTED' ||
              error.response?.status === 403
            ) {
              const message =
                cause === 'TABLE_PRIVATE'
                  ? 'Esta tabela é privada'
                  : cause === 'FORM_VIEW_RESTRICTED'
                    ? 'Apenas o dono pode visualizar tabelas de formulário'
                    : 'Você não tem permissão para acessar esta tabela';

              return (
                <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShieldXIcon />
                    </EmptyMedia>
                    <EmptyTitle>Acesso negado</EmptyTitle>
                    <EmptyDescription>{message}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              );
            }

            // Outros erros - com botão de refetch
            return (
              <LoadError
                message="Houve um erro ao buscar dados de registros da tabela"
                refetch={rows.refetch}
              />
            );
          })()}

        {table.status === 'success' &&
          table.data.configuration.style === E_TABLE_STYLE.LIST &&
          rows.status === 'success' && (
            <TableListView
              headers={table.data.fields}
              order={table.data.configuration.fields.orderList}
              data={rows.data.data}
            />
          )}
        {table.status === 'success' &&
          table.data.configuration.style === E_TABLE_STYLE.GALLERY &&
          rows.status === 'success' && (
            <TableGridView
              headers={table.data.fields}
              order={table.data.configuration.fields.orderList}
              data={rows.data.data}
            />
          )}
        {table.status === 'success' &&
          table.data.configuration.style === E_TABLE_STYLE.DOCUMENT &&
          rows.status === 'success' && (
            <TableDocumentView
              headers={table.data.fields}
              order={table.data.configuration.fields.orderList}
              data={rows.data.data}
              tableSlug={slug}
            />
          )}
        {table.status === 'success' &&
          table.data.configuration.style === E_TABLE_STYLE.CARD &&
          rows.status === 'success' && (
            <TableCardView
              headers={table.data.fields}
              order={table.data.configuration.fields.orderList}
              data={rows.data.data}
            />
          )}
        {table.status === 'success' &&
          table.data.configuration.style === E_TABLE_STYLE.MOSAIC &&
          rows.status === 'success' && (
            <TableMosaicView
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
