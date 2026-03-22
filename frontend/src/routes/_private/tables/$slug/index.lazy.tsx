import {
  createLazyFileRoute,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import type { AxiosError } from 'axios';
import {
  ArrowLeftIcon,
  DownloadIcon,
  PlusIcon,
  Share2Icon,
  ShieldXIcon,
} from 'lucide-react';
import React from 'react';

import { TableExportDialog } from '../-export-dialog';

import { TableCalendarViewSkeleton } from './-table-calendar-view-skeleton';
import { TableCardViewSkeleton } from './-table-card-view-skeleton';
import { TableConfigurationDropdown } from './-table-configuration';
import { TableDocumentViewSkeleton } from './-table-document-view-skeleton';
import { TableForumViewSkeleton } from './-table-forum-view-skeleton';
import { TableGanttViewSkeleton } from './-table-gantt-view-skeleton';
import { TableGridViewSkeleton } from './-table-grid-view-skeleton';
import { TableKanbanViewSkeleton } from './-table-kanban-view-skeleton';
import { TableListViewSkeleton } from './-table-list-view-skeleton';
import { TableMosaicViewSkeleton } from './-table-mosaic-view-skeleton';
import { TableSkeleton } from './-table-skeleton';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatTrigger } from '@/components/chat/chat-trigger';
import { getActiveFiltersCount } from '@/components/common/filter-fields';
import { FilterSidebar } from '@/components/common/filter-sidebar';
import { FilterTrigger } from '@/components/common/filter-trigger';
import { LoadError } from '@/components/common/load-error';
import { LoginButton } from '@/components/common/login-button';
import { Pagination } from '@/components/common/pagination';
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
import { useChatSidebar } from '@/hooks/use-chat-sidebar';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_STYLE, MetaDefault } from '@/lib/constant';
import { toastInfo } from '@/lib/toast';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/tables/$slug/')({
  component: RouteComponent,
});

const VIEW_MAP: Record<
  string,
  {
    skeleton: React.ComponentType;
    view: React.LazyExoticComponent<React.ComponentType<any>>;
    extraProps?: boolean;
  }
> = {
  [E_TABLE_STYLE.LIST]: {
    skeleton: TableListViewSkeleton,
    view: React.lazy(() =>
      import('./-table-list-view').then((m) => ({ default: m.TableListView })),
    ),
  },
  [E_TABLE_STYLE.GALLERY]: {
    skeleton: TableGridViewSkeleton,
    view: React.lazy(() =>
      import('./-table-grid-view').then((m) => ({ default: m.TableGridView })),
    ),
  },
  [E_TABLE_STYLE.DOCUMENT]: {
    skeleton: TableDocumentViewSkeleton,
    view: React.lazy(() =>
      import('./-table-document-view').then((m) => ({
        default: m.TableDocumentView,
      })),
    ),
    extraProps: true,
  },
  [E_TABLE_STYLE.CARD]: {
    skeleton: TableCardViewSkeleton,
    view: React.lazy(() =>
      import('./-table-card-view').then((m) => ({ default: m.TableCardView })),
    ),
  },
  [E_TABLE_STYLE.MOSAIC]: {
    skeleton: TableMosaicViewSkeleton,
    view: React.lazy(() =>
      import('./-table-mosaic-view').then((m) => ({
        default: m.TableMosaicView,
      })),
    ),
  },
  [E_TABLE_STYLE.KANBAN]: {
    skeleton: TableKanbanViewSkeleton,
    view: React.lazy(() =>
      import('./-table-kanban-view').then((m) => ({
        default: m.TableKanbanView,
      })),
    ),
    extraProps: true,
  },
  [E_TABLE_STYLE.FORUM]: {
    skeleton: TableForumViewSkeleton,
    view: React.lazy(() =>
      import('./-table-forum-view').then((m) => ({
        default: m.TableForumView,
      })),
    ),
    extraProps: true,
  },
  [E_TABLE_STYLE.CALENDAR]: {
    skeleton: TableCalendarViewSkeleton,
    view: React.lazy(() =>
      import('./-table-calendar-view').then((m) => ({
        default: m.TableCalendarView,
      })),
    ),
    extraProps: true,
  },
  [E_TABLE_STYLE.GANTT]: {
    skeleton: TableGanttViewSkeleton,
    view: React.lazy(() =>
      import('./-table-gantt-view').then((m) => ({
        default: m.TableGanttView,
      })),
    ),
    extraProps: true,
  },
};

function RouteComponent(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(user);

  const { slug } = useParams({
    from: '/_private/tables/$slug/',
  });

  const search = useSearch({
    from: '/_private/tables/$slug/',
  });
  const table = useReadTable({ slug });
  const tableStyle = table.data?.style;
  const shouldDisablePagination =
    tableStyle === E_TABLE_STYLE.KANBAN ||
    tableStyle === E_TABLE_STYLE.DOCUMENT ||
    tableStyle === E_TABLE_STYLE.FORUM ||
    tableStyle === E_TABLE_STYLE.CALENDAR ||
    tableStyle === E_TABLE_STYLE.GANTT;
  const rowsSearch = React.useMemo(() => {
    const base = shouldDisablePagination
      ? {
          ...search,
          page: 1,
          perPage: 100,
        }
      : search;

    return {
      ...base,
      // Force refetch when switching view styles (forum requires populated data).
      viewStyle: tableStyle ?? E_TABLE_STYLE.LIST,
    };
  }, [search, shouldDisablePagination, tableStyle]);
  const rows = useReadTableRowPaginated({ slug, search: rowsSearch });
  const permission = useTablePermission(table.data);

  const router = useRouter();
  const sidebar = useSidebar();

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

  const filterFields = table.data?.fields.filter((f) => f.showInFilter) ?? [];
  const activeFiltersCount = getActiveFiltersCount(filterFields, search);

  const { open: chatOpen, onOpenChange: handleChatOpenChange } =
    useChatSidebar();

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

          {table.status === 'pending' && <Skeleton className="h-8 w-40" />}

          {table.status === 'success' && (
            <h1 className="text-2xl font-medium">{table.data.name}</h1>
          )}

          <Button
            variant="outline"
            className="shadow-none p-1 h-auto"
            // size="icon-sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toastInfo(
                'Link da tabela copiado',
                'O link da tabela foi copiado para a área de transferência',
              );
            }}
          >
            <Share2Icon />
            <span className="sr-only">Compartilhar</span>
          </Button>
        </div>

        <div className="inline-flex items-center space-x-2">
          {table.status === 'success' && filterFields.length > 0 && (
            <FilterTrigger
              activeFiltersCount={activeFiltersCount}
              onClick={() => handleFilterOpenChange(!filterOpen)}
              isOpen={filterOpen}
            />
          )}
          {permission.can('UPDATE_ROW') && <TrashButton />}

          <TableStyleViewDropdown slug={slug} />
          <TableExportDialog
            slug={slug}
            tableName={table.data?.name ?? slug}
          >
            <Button
              variant="outline"
              className="shadow-none p-1 h-auto"
            >
              <DownloadIcon className="size-4" />
              <span>Exportar</span>
            </Button>
          </TableExportDialog>
          <TableConfigurationDropdown tableSlug={slug} />
          <ChatTrigger
            onClick={() => handleChatOpenChange(!chatOpen)}
            isOpen={chatOpen}
          />

          {permission.can('CREATE_ROW') &&
            (table.data?.fields?.filter((f) => !f.native)?.length ?? 0) > 0 && (
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

      <div className="flex-1 flex flex-row min-h-0">
        {table.status === 'success' && filterFields.length > 0 && (
          <FilterSidebar
            fields={filterFields}
            open={filterOpen}
            onOpenChange={handleFilterOpenChange}
          />
        )}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          {table.status === 'pending' && <TableSkeleton />}
          {table.status === 'success' &&
            rows.status === 'pending' &&
            ((): React.JSX.Element | null => {
              const entry = VIEW_MAP[table.data.style];
              if (!entry) return null;
              const SkeletonComponent = entry.skeleton;
              return <SkeletonComponent />;
            })()}

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
                error.response?.status === 403 ||
                error.response?.status === 401
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
                      {!isAuthenticated && (
                        <div className="mt-4">
                          <LoginButton />
                        </div>
                      )}
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
            rows.status === 'success' &&
            ((): React.JSX.Element | null => {
              const entry = VIEW_MAP[table.data.style];
              if (!entry) return null;
              const ViewComponent = entry.view;
              const SkeletonComponent = entry.skeleton;
              const baseProps = {
                headers: table.data.fields,
                order: table.data.fieldOrderList ?? [],
                data: rows.data.data,
                layoutFields: table.data.layoutFields,
              };
              return (
                <React.Suspense fallback={<SkeletonComponent />}>
                  {entry.extraProps ? (
                    <ViewComponent
                      {...baseProps}
                      tableSlug={slug}
                      table={table.data}
                    />
                  ) : (
                    <ViewComponent {...baseProps} />
                  )}
                </React.Suspense>
              );
            })()}
        </div>
        <ChatSidebar
          open={chatOpen}
          onOpenChange={handleChatOpenChange}
        />
      </div>

      {!shouldDisablePagination && (
        <div className="shrink-0 border-t p-2">
          <Pagination
            meta={rows.data?.meta ?? MetaDefault}
            page={search.page}
            perPage={search.perPage}
            onPageChange={(newPage) => {
              void router.navigate({
                to: '.',
                search: {
                  page: String(newPage),
                  perPage: String(search.perPage),
                },
              });
            }}
            onPerPageChange={(newPerPage) => {
              void router.navigate({
                to: '.',
                search: {
                  page: String(1),
                  perPage: String(newPerPage),
                },
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
