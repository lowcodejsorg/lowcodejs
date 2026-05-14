import {
  createLazyFileRoute,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ActivityIcon,
  CalendarClockIcon,
  DownloadIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileJsonIcon,
  FilterIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { FilterTrigger } from '@/components/common/filters';
import { PageHeader, PageShell } from '@/components/common/page-shell';
import { Pagination } from '@/components/common/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLoggerReadPaginated } from '@/hooks/tanstack-query/use-logger-read-paginated';
import { useDataTable } from '@/hooks/use-data-table';
import { useFilterSidebar } from '@/hooks/use-filter-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
  E_ROLE,
  LOGGER_ACTION_LABEL,
  LOGGER_OBJECT_LABEL,
  MetaDefault,
} from '@/lib/constant';
import type { ILogger, ValueOf } from '@/lib/interfaces';
import { resolveLoggerNavigateTarget } from '@/lib/logger-route';
import { toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/history/')({
  component: RouteComponent,
});

const ROUTE_ID = '/_private/history/';

type ActionType = ValueOf<typeof E_LOGGER_ACTION_TYPE>;
type ObjectType = ValueOf<typeof E_LOGGER_OBJECT_TYPE>;

const ACTION_OPTIONS = Object.values(E_LOGGER_ACTION_TYPE) as Array<ActionType>;
const OBJECT_OPTIONS = Object.values(E_LOGGER_OBJECT_TYPE) as Array<ObjectType>;

const ACTION_META: Record<
  ActionType,
  { icon: typeof PlusIcon; className: string }
> = {
  CREATE: { icon: PlusIcon, className: 'bg-green-100 text-green-700' },
  UPDATE: { icon: PencilIcon, className: 'bg-yellow-100 text-yellow-700' },
  VIEW: { icon: EyeIcon, className: 'bg-blue-100 text-blue-700' },
  DELETE: { icon: TrashIcon, className: 'bg-red-100 text-red-700' },
};

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function entriesToCsv(entries: Array<ILogger>): string {
  const header = [
    'createdAt',
    'user_id',
    'user_email',
    'action',
    'object',
    'object_id',
    'url',
    'content',
  ];
  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.user?._id ?? '',
    entry.user?.email ?? '',
    entry.action,
    entry.object ?? '',
    entry.object_id ?? '',
    entry.url,
    JSON.stringify(entry.content ?? {}),
  ]);
  const escape = (cell: string): string => {
    const needsQuote = /[",\n]/.test(cell);
    const safe = cell.replace(/"/g, '""');
    return needsQuote ? `"${safe}"` : safe;
  };
  return [header, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(','))
    .join('\n');
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsvList<T extends string>(
  raw: string | undefined,
  whitelist: ReadonlyArray<T>,
): Array<T> {
  if (!raw) return [];
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter((token): token is T => whitelist.includes(token as T));
}

interface FiltersState {
  search: string;
  actions: Array<ActionType>;
  objects: Array<ObjectType>;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  actions: [],
  objects: [],
  dateFrom: '',
  dateTo: '',
};

interface HistoryFiltersFormProps {
  draft: FiltersState;
  setDraft: React.Dispatch<React.SetStateAction<FiltersState>>;
}

function HistoryFiltersForm({
  draft,
  setDraft,
}: HistoryFiltersFormProps): React.JSX.Element {
  const toggleAction = (action: ActionType): void => {
    setDraft((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  const toggleObject = (type: ObjectType): void => {
    setDraft((prev) => ({
      ...prev,
      objects: prev.objects.includes(type)
        ? prev.objects.filter((t) => t !== type)
        : [...prev.objects, type],
    }));
  };

  return (
    <section
      data-slot="filter-fields"
      className="flex flex-col gap-4 w-full"
    >
      <Field>
        <FieldLabel>Buscar</FieldLabel>
        <Input
          placeholder="Filtrar por URL, ID do objeto, ação..."
          value={draft.search}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, search: e.target.value }))
          }
        />
      </Field>

      <Field>
        <FieldLabel>Ação</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_OPTIONS.map((action) => {
            const Icon = ACTION_META[action].icon;
            const checked = draft.actions.includes(action);
            return (
              <label
                key={action}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm transition-colors',
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleAction(action)}
                />
                <Icon className="size-4" />
                {LOGGER_ACTION_LABEL[action]}
              </label>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>Tipo de objeto</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {OBJECT_OPTIONS.map((type) => {
            const checked = draft.objects.includes(type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => toggleObject(type)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent',
                )}
              >
                {LOGGER_OBJECT_LABEL[type]}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>De</FieldLabel>
          <Input
            type="date"
            value={draft.dateFrom}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
          />
        </Field>
        <Field>
          <FieldLabel>Até</FieldLabel>
          <Input
            type="date"
            value={draft.dateTo}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dateTo: e.target.value }))
            }
          />
        </Field>
      </div>
    </section>
  );
}

interface HistoryFilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FiltersState;
  onApply: (filters: FiltersState) => void;
  onClear: () => void;
}

function HistoryFilterSidebar({
  open,
  onOpenChange,
  value,
  onApply,
  onClear,
}: HistoryFilterSidebarProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [draft, setDraft] = React.useState<FiltersState>(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSubmit = (): void => {
    onApply(draft);
  };

  const handleClear = (): void => {
    setDraft(DEFAULT_FILTERS);
    onClear();
  };

  if (isMobile) {
    return (
      <Sheet
        data-slot="filter-sidebar"
        data-test-id="filter-sidebar"
        open={open}
        onOpenChange={onOpenChange}
      >
        <SheetContent
          side="left"
          className="flex flex-col py-4 px-6 gap-5 overflow-y-auto"
        >
          <SheetHeader className="px-0">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <FilterIcon className="size-4" />
              Filtros
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 w-full flex-1">
            <HistoryFiltersForm
              draft={draft}
              setDraft={setDraft}
            />
          </div>

          <SheetFooter className="flex-row w-full justify-end gap-4 px-0">
            <Button
              data-test-id="filter-clear-btn"
              onClick={() => {
                handleClear();
                onOpenChange(false);
              }}
              type="button"
              className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
            >
              Limpar
            </Button>
            <Button
              data-test-id="filter-submit-btn"
              onClick={() => {
                handleSubmit();
                onOpenChange(false);
              }}
            >
              Pesquisar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      data-slot="filter-sidebar"
      data-test-id="filter-sidebar"
      className={cn(
        'shrink-0 transition-[width] duration-200 ease-linear overflow-hidden border-r',
        open && 'w-70',
        !open && 'w-0 border-r-0',
      )}
    >
      <div className="w-70 h-full flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FilterIcon className="size-4" />
            Filtros
          </h2>
          <Button
            data-test-id="filter-close-btn"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <HistoryFiltersForm
            draft={draft}
            setDraft={setDraft}
          />
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-4 py-3 border-t">
          <Button
            data-test-id="filter-clear-btn"
            onClick={handleClear}
            type="button"
            size="sm"
            className="shadow-none border bg-transparent border-destructive text-destructive hover:bg-destructive/20"
          >
            Limpar
          </Button>
          <Button
            data-test-id="filter-submit-btn"
            onClick={handleSubmit}
            size="sm"
          >
            Pesquisar
          </Button>
        </div>
      </div>
    </div>
  );
}

interface JsonDialogProps {
  entry: ILogger | null;
  onClose: () => void;
}

function JsonDialog({ entry, onClose }: JsonDialogProps): React.JSX.Element {
  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJsonIcon className="size-4" />
            Conteúdo da ação
          </DialogTitle>
          <DialogDescription>
            {entry && (
              <span className="font-mono text-xs">
                {entry.action} · {entry.object ?? '—'} ·{' '}
                {entry.object_id ?? '—'}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {entry && (
          <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            {formatJson(entry.content ?? {})}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof ActivityIcon;
  accentClass?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: StatCardProps): React.JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-md',
            accentClass ?? 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionBadge({ action }: { action: ActionType }): React.JSX.Element {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <Badge
      className={cn('font-semibold border-transparent gap-1', meta.className)}
    >
      <Icon className="size-3" />
      {LOGGER_ACTION_LABEL[action]}
    </Badge>
  );
}

interface ActionsCellProps {
  entry: ILogger;
  onOpenJson: (entry: ILogger) => void;
  onNavigate: (entry: ILogger) => void;
  canNavigate: boolean;
}

function ActionsCell({
  entry,
  onOpenJson,
  onNavigate,
  canNavigate,
}: ActionsCellProps): React.JSX.Element {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        dir="ltr"
        modal={false}
      >
        <DropdownMenuTrigger className="p-1 rounded-full">
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="mr-10">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full cursor-pointer"
            onClick={() => onOpenJson(entry)}
          >
            <FileJsonIcon className="size-4" />
            <span>Visualizar JSON</span>
          </DropdownMenuItem>

          {canNavigate && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full cursor-pointer"
              onClick={() => onNavigate(entry)}
            >
              <ExternalLinkIcon className="size-4" />
              <span>Abrir destino</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function buildColumns(params: {
  currentUserId: string;
  onOpenJson: (entry: ILogger) => void;
  onNavigate: (entry: ILogger) => void;
  canNavigate: (entry: ILogger) => boolean;
}): Array<ColumnDef<ILogger, unknown>> {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      meta: { label: 'Data' },
      header: () => (
        <DataTableColumnHeader
          title="Data"
          orderKey="order-created-at"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }): React.ReactElement => {
        const date = row.original.createdAt;
        return (
          <span className="text-sm text-muted-foreground">
            {date
              ? format(new Date(date), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })
              : 'N/A'}
          </span>
        );
      },
    },
    {
      id: 'user',
      accessorKey: 'user',
      meta: { label: 'Usuário' },
      header: () => (
        <DataTableColumnHeader
          title="Usuário"
          orderKey="order-user"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) {
          return (
            <span className="text-xs italic text-muted-foreground">
              Anônimo
            </span>
          );
        }
        const isMine = user._id === params.currentUserId;
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-medium',
              isMine && 'text-primary',
            )}
            title={user.email}
          >
            {user.name}
            {isMine && (
              <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
                Você
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      id: 'action',
      accessorKey: 'action',
      meta: { label: 'Ação' },
      header: () => (
        <DataTableColumnHeader
          title="Ação"
          orderKey="order-action"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }) => <ActionBadge action={row.original.action} />,
    },
    {
      id: 'object',
      accessorKey: 'object',
      meta: { label: 'Tipo de objeto' },
      header: () => (
        <DataTableColumnHeader
          title="Tipo de objeto"
          orderKey="order-object"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }): React.ReactElement => {
        const object = row.original.object;
        return (
          <Badge className="font-semibold border-transparent bg-gray-100 text-gray-700">
            {object ? LOGGER_OBJECT_LABEL[object] : '—'}
          </Badge>
        );
      },
    },
    {
      id: 'object_id',
      accessorKey: 'object_id',
      meta: { label: 'ID do objeto' },
      header: () => (
        <DataTableColumnHeader
          title="ID do objeto"
          orderKey="order-object-id"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }) => {
        const id = row.original.object_id;
        if (!id) return <span className="text-muted-foreground">—</span>;
        return (
          <span
            className="text-sm text-muted-foreground"
            title={id}
          >
            {id.length > 18 ? `${id.slice(0, 16)}…` : id}
          </span>
        );
      },
    },
    {
      id: 'url',
      accessorKey: 'url',
      meta: { label: 'URL' },
      header: () => (
        <DataTableColumnHeader
          title="URL"
          orderKey="order-url"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }) => {
        const entry = row.original;
        if (!params.canNavigate(entry)) {
          return (
            <span className="text-sm text-muted-foreground break-all">
              {entry.url}
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              params.onNavigate(entry);
            }}
            className="text-left text-sm text-sky-600 hover:underline break-all cursor-pointer dark:text-sky-400"
          >
            {entry.url}
          </button>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      enableResizing: false,
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          entry={row.original}
          onOpenJson={params.onOpenJson}
          onNavigate={params.onNavigate}
          canNavigate={params.canNavigate(row.original)}
        />
      ),
    },
  ];
}

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const navigate = useNavigate({ from: '/history' });
  const search = useSearch({ from: ROUTE_ID });
  const auth = useAuthStore();
  const role = auth.user?.group?.slug?.toUpperCase();
  const isPrivileged = role === E_ROLE.MASTER || role === E_ROLE.ADMINISTRATOR;
  const currentUserId = auth.user?._id ?? '';

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

  const activeFilterCount =
    filters.actions.length +
    filters.objects.length +
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const handleNavigate = React.useCallback(
    (entry: ILogger) => {
      const target = resolveLoggerNavigateTarget(entry);
      if (!target) return;
      router.navigate({
        to: target.to,
        params: target.params,
      } as Parameters<typeof router.navigate>[0]);
    },
    [router],
  );

  const canNavigate = React.useCallback(
    (entry: ILogger): boolean => resolveLoggerNavigateTarget(entry) !== null,
    [],
  );

  const columns = React.useMemo(
    () =>
      buildColumns({
        currentUserId,
        onOpenJson: setJsonEntry,
        onNavigate: handleNavigate,
        canNavigate,
      }),
    [currentUserId, handleNavigate, canNavigate],
  );

  const table = useDataTable({
    data: entries,
    columns,
    getRowId: (row) => row._id,
    persistKey: 'admin:history',
    enableColumnResizing: true,
    initialColumnPinning: {
      right: ['actions'],
    },
  });

  const handleApplyFilters = (next: FiltersState): void => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        search: next.search || undefined,
        actions: next.actions.length > 0 ? next.actions.join(',') : undefined,
        objects: next.objects.length > 0 ? next.objects.join(',') : undefined,
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
    toastSuccess(
      'CSV exportado',
      `${entries.length} registro${entries.length === 1 ? '' : 's'} no arquivo`,
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
          {toolbarNode &&
            createPortal(<DataTableColumnToggle table={table} />, toolbarNode)}
          <DataTable
            data-test-id="history-table"
            table={table}
            onRowClick={(entry) => setJsonEntry(entry)}
            emptyMessage={
              isLoading ? 'Carregando...' : 'Nenhum registro encontrado'
            }
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
