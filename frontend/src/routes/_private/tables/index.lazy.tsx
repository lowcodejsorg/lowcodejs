import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createLazyFileRoute,
  getRouteApi,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { UploadIcon } from 'lucide-react';
import React from 'react';

import { TableEmptyTrashDialog } from './-empty-trash-dialog';
import { TableImportDialog } from './-import-dialog';
import { TableTables } from './-table-tables';

import { ChatSidebar } from '@/components/common/chat/chat-sidebar';
import { ChatTrigger } from '@/components/common/chat/chat-trigger';
import { getActiveFiltersCount } from '@/components/common/filters/filter-fields';
import { FilterSidebar } from '@/components/common/filters/filter-sidebar';
import { FilterTrigger } from '@/components/common/filters/filter-trigger';
import { PageShell } from '@/components/common/page-shell';
import { Pagination } from '@/components/common/pagination';
import { TrashButton } from '@/components/common/trash-button';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { tableListOptions } from '@/hooks/tanstack-query/_query-options';
import { useChatSidebar } from '@/hooks/use-chat-sidebar';
import { useFilterSidebar } from '@/hooks/use-filter-sidebar';
import { usePermission } from '@/hooks/use-table-permission';
import { useToolbarPortal } from '@/hooks/use-toolbar-portal';
import { E_FIELD_TYPE, TABLE_VISIBILITY_OPTIONS } from '@/lib/constant';
import type { IFilterField } from '@/lib/interfaces';

const rootApi = getRouteApi('__root__');

export const Route = createLazyFileRoute('/_private/tables/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const { aiAssistantEnabled } = rootApi.useLoaderData();
  const { toolbarRef, toolbarNode } = useToolbarPortal();
  const search = useSearch({
    from: '/_private/tables/',
  });

  const sidebar = useSidebar();
  const router = useRouter();
  const navigate = useNavigate({ from: '/tables' });

  const { data } = useSuspenseQuery(tableListOptions(search));
  const permission = usePermission();

  const { open: filterOpen, onOpenChange: handleFilterOpenChange } =
    useFilterSidebar();

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

  const { open: chatOpen, onOpenChange: handleChatOpenChange } =
    useChatSidebar();

  return (
    <PageShell data-test-id="tables-page">
      {/* Header */}
      <PageShell.Header>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Tabelas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as tabelas dinâmicas da plataforma</p>
        </div>
        <div className="inline-flex items-center gap-2">
          <div ref={toolbarRef} />
          {permission.can('REMOVE_TABLE') && search.trashed && (
            <TableEmptyTrashDialog />
          )}
          {permission.can('REMOVE_TABLE') && <TrashButton />}
          <FilterTrigger
            activeFiltersCount={activeFiltersCount}
            onClick={() => handleFilterOpenChange(!filterOpen)}
            isOpen={filterOpen}
          />
          {permission.can('CREATE_TABLE') && (
            <TableImportDialog>
              <Button
                variant="outline"
                size={'sm'}
              >
                <UploadIcon className="size-4" />
                <span>Importar</span>
              </Button>
            </TableImportDialog>
          )}

          {aiAssistantEnabled && (
            <ChatTrigger
              onClick={() => handleChatOpenChange(!chatOpen)}
              isOpen={chatOpen}
            />
          )}

          {permission.can('CREATE_TABLE') && (
            <Button
              className="disabled:cursor-not-allowed"
              size={'sm'}
              data-test-id="create-table-btn"
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
      </PageShell.Header>

      {/* content */}
      <div className="flex-1 flex flex-row min-h-0">
        <FilterSidebar
          fields={fieldFilters}
          open={filterOpen}
          onOpenChange={handleFilterOpenChange}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
          <TableTables
            data={data.data}
            toolbarPortal={toolbarNode}
            isTrashView={Boolean(search.trashed)}
          />
        </div>
        {aiAssistantEnabled && (
          <ChatSidebar
            open={chatOpen}
            onOpenChange={handleChatOpenChange}
          />
        )}
      </div>

      {/* footer */}
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
