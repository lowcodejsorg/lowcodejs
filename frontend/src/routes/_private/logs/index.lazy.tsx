import {
  createLazyFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  ActivityIcon,
  CalendarClockIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import React from 'react';

import {
  ACTION_OPTIONS,
  OBJECT_OPTIONS,
  ROUTE_ID,
  parseCsvList,
} from './-constants';
import type { ActionType, FiltersState } from './-constants';
import { downloadCsv, entriesToCsv } from './-csv';
import { HistoryFilterSidebar } from './-filter-sidebar';
import { JsonDialog } from './-json-dialog';
import { StatCard } from './-stat-card';
import { TableHistory } from './-table-history';

import { FilterTrigger } from '@/components/common/filters';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { Pagination } from '@/components/common/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useLoggerReadPaginated } from '@/hooks/tanstack-query/use-logger-read-paginated';
import { useFilterSidebar } from '@/hooks/use-filter-sidebar';
import { E_ROLE, MetaDefault } from '@/lib/constant';
import type { ILogger } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/logs/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  const navigate = useNavigate({ from: '/logs/' });
  const search = useSearch({ from: ROUTE_ID });
  const auth = useAuthStore();
  const role = auth.user?.group?.slug?.toUpperCase();
  const isPrivileged = role === E_ROLE.MASTER || role === E_ROLE.ADMINISTRATOR;

  const filterSidebar = useFilterSidebar();
  const [jsonEntry, setJsonEntry] = React.useState<ILogger | null>(null);
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(
    null,
  );

  const filters: FiltersState = React.useMemo(
    () => ({
      search: search.search ?? '',
      actions: parseCsvList(search.actions, ACTION_OPTIONS),
      objects: parseCsvList(search.objects, OBJECT_OPTIONS),
      dateFrom: search['date-from'] ?? '',
      dateTo: search['date-to'] ?? '',
    }),
    [search],
  );

  const queryParams = React.useMemo(() => {
    const orderKeys = [
      'order-created-at',
      'order-user',
      'order-action',
      'order-object',
      'order-object-id',
      'order-url',
    ] as const;
    const orderEntries: Record<string, 'asc' | 'desc'> = {};
    for (const key of orderKeys) {
      const value = search[key];
      if (value) orderEntries[key] = value;
    }

    return {
      page: search.page,
      perPage: search.perPage,
      ...(filters.search && { search: filters.search }),
      ...(filters.actions.length > 0 && {
        actions: filters.actions.join(','),
      }),
      ...(filters.objects.length > 0 && {
        objects: filters.objects.join(','),
      }),
      ...(filters.dateFrom && {
        'date-from': new Date(`${filters.dateFrom}T00:00:00`).toISOString(),
      }),
      ...(filters.dateTo && {
        'date-to': new Date(`${filters.dateTo}T23:59:59.999`).toISOString(),
      }),
      ...orderEntries,
    };
  }, [search, filters]);

  const { data, isLoading } = useLoggerReadPaginated(queryParams);

  const entries = data?.data ?? [];
  const meta = data?.meta ?? MetaDefault;

  const stats = React.useMemo(() => {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const counts: Record<ActionType, number> = {
      CREATE: 0,
      UPDATE: 0,
      VIEW: 0,
      DELETE: 0,
    };
    let todayCount = 0;
    for (const entry of entries) {
      counts[entry.action] += 1;
      if (entry.createdAt?.startsWith(todayPrefix)) todayCount += 1;
    }
    return { todayCount, counts };
  }, [entries]);

  let activeFilterCount = filters.actions.length + filters.objects.length;
  if (filters.search) activeFilterCount += 1;
  if (filters.dateFrom) activeFilterCount += 1;
  if (filters.dateTo) activeFilterCount += 1;

  const handleApplyFilters = (next: FiltersState): void => {
    let actionsParam: string | undefined;
    if (next.actions.length > 0) {
      actionsParam = next.actions.join(',');
    }
    let objectsParam: string | undefined;
    if (next.objects.length > 0) {
      objectsParam = next.objects.join(',');
    }
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        search: next.search || undefined,
        actions: actionsParam,
        objects: objectsParam,
        'date-from': next.dateFrom || undefined,
        'date-to': next.dateTo || undefined,
      }),
    });
  };

  const handleClearFilters = (): void => {
    navigate({
      search: (prev) => ({
        page: 1,
        perPage: prev.perPage,
      }),
    });
  };

  const handleQuickSearchChange = (value: string): void => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        search: value || undefined,
      }),
    });
  };

  const handleExport = (): void => {
    const csv = entriesToCsv(entries);
    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    downloadCsv(csv, `historico-acoes_${stamp}.csv`);
    let plural = 's';
    if (entries.length === 1) {
      plural = '';
    }
    toastSuccess(
      'CSV exportado',
      `${entries.length} registro${plural} no arquivo`,
    );
  };

  return (
    <PageShell data-test-id="history-page">
      <PageShell.Header className="flex-col items-stretch gap-3">
        <div className="flex items-center justify-between gap-2">
          <PageHeader title="Histórico de ações">
            <Badge
              variant="outline"
              data-test-id="history-count-badge"
            >
              {entries.length} de {meta.total}
            </Badge>
          </PageHeader>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
          <div className="lg:w-96">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                data-test-id="history-search-input"
                placeholder="Pesquisar no histórico..."
                value={filters.search}
                onChange={(e) => handleQuickSearchChange(e.target.value)}
                className="shadow-none"
              />
              {filters.search.length > 0 && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Limpar busca"
                    onClick={() => handleQuickSearchChange('')}
                    className="cursor-pointer"
                  >
                    <XIcon className="size-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <div className="inline-flex items-center gap-2">
            <div ref={setToolbarNode} />
            <FilterTrigger
              activeFiltersCount={activeFilterCount}
              onClick={() => filterSidebar.onOpenChange(!filterSidebar.open)}
              isOpen={filterSidebar.open}
            />
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={entries.length === 0}
              data-test-id="history-export-btn"
              className="cursor-pointer"
            >
              <DownloadIcon className="size-4" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="Total"
            value={meta.total}
            icon={ActivityIcon}
          />
          <StatCard
            label="Hoje (página)"
            value={stats.todayCount}
            icon={CalendarClockIcon}
            accentClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
          />
          <StatCard
            label="Edições (página)"
            value={stats.counts.UPDATE}
            icon={PencilIcon}
            accentClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
          />
          <StatCard
            label="Adições (página)"
            value={stats.counts.CREATE}
            icon={PlusIcon}
            accentClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          />
        </div>

        {!isPrivileged && (
          <div className="text-xs text-muted-foreground">
            <UserIcon className="inline size-3 mr-1" />
            Você está visualizando apenas as suas próprias ações.
          </div>
        )}
      </PageShell.Header>

      <div className="flex-1 flex flex-row min-h-0">
        <HistoryFilterSidebar
          open={filterSidebar.open}
          onOpenChange={filterSidebar.onOpenChange}
          value={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
        <PageShell.Content>
          <TableHistory
            data={entries}
            toolbarPortal={toolbarNode}
            onOpenJson={setJsonEntry}
            isLoading={isLoading}
          />
        </PageShell.Content>
      </div>

      <PageShell.Footer>
        <Pagination
          meta={meta}
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

      <JsonDialog
        entry={jsonEntry}
        onClose={() => setJsonEntry(null)}
      />
    </PageShell>
  );
}
