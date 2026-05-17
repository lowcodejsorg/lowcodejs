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
import { useDataTable } from '@/hooks/use-data-table';
import { useFilterSidebar } from '@/hooks/use-filter-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { E_ROLE } from '@/lib/constant';
import type { Meta } from '@/lib/interfaces';
import { toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authentication';

export const Route = createLazyFileRoute('/_private/history/')({
  component: RouteComponent,
});

const ROUTE_ID = '/_private/history/';

// --- Tipos do mock ---

type ActionType = 'add' | 'edit' | 'view' | 'delete';
type ObjectType = 'item' | 'user' | 'field' | 'table' | 'menu';

interface HistoryEntry {
  id: string;
  date: string;
  user_id: string;
  action: ActionType;
  object_type: ObjectType;
  object_id: string;
  url: string;
  content: Record<string, unknown>;
}

// --- Configuração visual ---

const ACTION_META: Record<
  ActionType,
  { label: string; icon: typeof PlusIcon; className: string }
> = {
  add: {
    label: 'Criação',
    icon: PlusIcon,
    className: 'bg-green-100 text-green-700',
  },
  edit: {
    label: 'Edição',
    icon: PencilIcon,
    className: 'bg-yellow-100 text-yellow-700',
  },
  view: {
    label: 'Visualização',
    icon: EyeIcon,
    className: 'bg-blue-100 text-blue-700',
  },
  delete: {
    label: 'Exclusão',
    icon: TrashIcon,
    className: 'bg-red-100 text-red-700',
  },
};

const OBJECT_META: Record<ObjectType, string> = {
  item: 'Item',
  user: 'Usuário',
  field: 'Campo',
  table: 'Tabela',
  menu: 'Menu',
};

const ACTION_OPTIONS: Array<ActionType> = ['add', 'edit', 'view', 'delete'];
const OBJECT_OPTIONS: Array<ObjectType> = [
  'item',
  'user',
  'field',
  'table',
  'menu',
];

// --- Mock data ---

const MOCK_ENTRIES: Array<HistoryEntry> = [
  {
    id: '1',
    date: '2026-09-01T09:08:01',
    user_id: 'Yfadpf0a7usdf720;adfp90',
    action: 'add',
    object_type: 'item',
    object_id: 'fjapoidfa0dfa8y0dafha09i',
    url: '/tables/produtos/row/create',
    content: {
      name: 'Caderno Universitário',
      price: 29.9,
      stock: 120,
    },
  },
  {
    id: '2',
    date: '2026-09-01T09:08:01',
    user_id: 'opfaidfh2238fhfask8fah9',
    action: 'view',
    object_type: 'user',
    object_id: 'asdfpoai29ahzdfapdf89ah',
    url: '/users',
    content: { filter: 'role=ADMINISTRATOR' },
  },
  {
    id: '3',
    date: '2026-09-01T09:08:01',
    user_id: 'moalif9afku278sfhafa9jho',
    action: 'edit',
    object_type: 'field',
    object_id: 'posifaa299hasdfo9ah9akd',
    url: '/tables/estoque/field/69ae824d666208b6d9f40fb2?mode=edit',
    content: {
      slug: 'quantidade',
      type: 'NUMBER',
      required: true,
    },
  },
  {
    id: '4',
    date: '2026-08-31T18:42:11',
    user_id: 'Yfadpf0a7usdf720;adfp90',
    action: 'delete',
    object_type: 'item',
    object_id: 'oa9sdf80a9sdf80sdfa90asd',
    url: '/tables/produtos/row/oa9sdf80a9sdf80sdfa90asd',
    content: { reason: 'duplicado', soft: true },
  },
  {
    id: '5',
    date: '2026-08-31T17:22:00',
    user_id: 'aklsdfj923fkjsdf923klsdf',
    action: 'add',
    object_type: 'menu',
    object_id: 'mn09asdf23ksdfa09kjsdfa9',
    url: '/menus/create',
    content: { name: 'Relatórios', type: 'PAGE', position: 'top' },
  },
  {
    id: '6',
    date: '2026-08-31T15:10:35',
    user_id: 'opfaidfh2238fhfask8fah9',
    action: 'edit',
    object_type: 'table',
    object_id: 'tb09asdf09asd0f9asdf90as',
    url: '/tables/clientes',
    content: { visibility: 'RESTRICTED', collaboration: 'OPEN' },
  },
  {
    id: '7',
    date: '2026-08-31T14:01:02',
    user_id: 'moalif9afku278sfhafa9jho',
    action: 'view',
    object_type: 'item',
    object_id: 'iz0a9sdf80a9sdf80sdfa90a',
    url: '/tables/pedidos/row/iz0a9sdf80a9sdf80sdfa90a',
    content: {},
  },
  {
    id: '8',
    date: '2026-08-30T22:13:45',
    user_id: 'Yfadpf0a7usdf720;adfp90',
    action: 'edit',
    object_type: 'item',
    object_id: 'fjapoidfa0dfa8y0dafha09i',
    url: '/tables/produtos/row/fjapoidfa0dfa8y0dafha09i?mode=edit',
    content: { price: 31.5 },
  },
  {
    id: '9',
    date: '2026-08-30T11:48:09',
    user_id: 'aklsdfj923fkjsdf923klsdf',
    action: 'delete',
    object_type: 'menu',
    object_id: 'mn09asdf23ksdfa09kjsdfa9',
    url: '/menus',
    content: { confirmed: true },
  },
  {
    id: '10',
    date: '2026-08-30T09:15:00',
    user_id: 'opfaidfh2238fhfask8fah9',
    action: 'add',
    object_type: 'user',
    object_id: 'us8a7sdf6a5sdf4a3sdf2a1s',
    url: '/users/create',
    content: { name: 'João Silva', role: 'REGISTERED' },
  },
  {
    id: '11',
    date: '2026-08-29T19:55:21',
    user_id: 'moalif9afku278sfhafa9jho',
    action: 'view',
    object_type: 'table',
    object_id: 'tb22asdf09asd0f9asdf90as',
    url: '/tables/agenda',
    content: {},
  },
  {
    id: '12',
    date: '2026-08-29T16:33:10',
    user_id: 'Yfadpf0a7usdf720;adfp90',
    action: 'add',
    object_type: 'field',
    object_id: 'fl11sdfa09sdfa09sdfa09sd',
    url: '/tables/produtos/field/create',
    content: { slug: 'categoria', type: 'DROPDOWN' },
  },
  {
    id: '13',
    date: '2026-08-29T10:02:48',
    user_id: 'opfaidfh2238fhfask8fah9',
    action: 'edit',
    object_type: 'user',
    object_id: 'us8a7sdf6a5sdf4a3sdf2a1s',
    url: '/users/us8a7sdf6a5sdf4a3sdf2a1s',
    content: { status: 'ACTIVE' },
  },
  {
    id: '14',
    date: '2026-08-28T20:11:00',
    user_id: 'aklsdfj923fkjsdf923klsdf',
    action: 'view',
    object_type: 'item',
    object_id: 'iz77a9sdf80a9sdf80sdfa90',
    url: '/tables/pedidos',
    content: { search: 'pendentes' },
  },
  {
    id: '15',
    date: '2026-08-28T13:09:18',
    user_id: 'moalif9afku278sfhafa9jho',
    action: 'delete',
    object_type: 'field',
    object_id: 'fl12sdfa09sdfa09sdfa09sd',
    url: '/tables/clientes/field/fl12sdfa09sdfa09sdfa09sd',
    content: { reason: 'campo obsoleto' },
  },
];

const ME_USER_IDS = new Set([
  'Yfadpf0a7usdf720;adfp90',
  'moalif9afku278sfhafa9jho',
]);

// --- Helpers ---

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function entriesToCsv(entries: Array<HistoryEntry>): string {
  const header = [
    'date',
    'user_id',
    'action',
    'object_type',
    'object_id',
    'url',
    'content',
  ];
  const rows = entries.map((entry) => [
    entry.date,
    entry.user_id,
    entry.action,
    entry.object_type,
    entry.object_id,
    entry.url,
    JSON.stringify(entry.content),
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

// --- Estado dos filtros ---

interface FiltersState {
  search: string;
  actions: Array<ActionType>;
  objectTypes: Array<ObjectType>;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  actions: [],
  objectTypes: [],
  dateFrom: '',
  dateTo: '',
};

// --- Conteúdo dos filtros (compartilhado entre painel e Sheet) ---

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

  const toggleObjectType = (type: ObjectType): void => {
    setDraft((prev) => ({
      ...prev,
      objectTypes: prev.objectTypes.includes(type)
        ? prev.objectTypes.filter((t) => t !== type)
        : [...prev.objectTypes, type],
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
          placeholder="Filtrar por user_id, object_id ou URL..."
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
                {ACTION_META[action].label}
              </label>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>Tipo de objeto</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {OBJECT_OPTIONS.map((type) => {
            const checked = draft.objectTypes.includes(type);
            return (
              <button
                type="button"
                key={type}
                onClick={() => toggleObjectType(type)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent',
                )}
              >
                {OBJECT_META[type]}
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

// --- Sidebar lateral (estilo FilterSidebar do projeto) ---

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

// --- JSON Dialog ---

interface JsonDialogProps {
  entry: HistoryEntry | null;
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
                {entry.action} · {entry.object_type} · {entry.object_id}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {entry && (
          <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            {formatJson(entry.content)}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Stat Card ---

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

// --- Action Badge ---

function ActionBadge({ action }: { action: ActionType }): React.JSX.Element {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <Badge
      className={cn('font-semibold border-transparent gap-1', meta.className)}
    >
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  );
}

// --- Actions Cell ---

interface ActionsCellProps {
  entry: HistoryEntry;
  onOpenJson: (entry: HistoryEntry) => void;
  onNavigate: (url: string) => void;
}

function ActionsCell({
  entry,
  onOpenJson,
  onNavigate,
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

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full cursor-pointer"
            onClick={() => onNavigate(entry.url)}
          >
            <ExternalLinkIcon className="size-4" />
            <span>Abrir URL</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// --- Colunas do DataTable ---

function buildColumns(params: {
  currentUserId: string;
  onOpenJson: (entry: HistoryEntry) => void;
  onNavigate: (url: string) => void;
}): Array<ColumnDef<HistoryEntry, unknown>> {
  return [
    {
      id: 'date',
      accessorKey: 'date',
      meta: { label: 'Data' },
      header: () => (
        <DataTableColumnHeader
          title="Data"
          orderKey="order-date"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }): React.JSX.Element => {
        const date = row.original.date;
        if (!date) {
          return <span className="text-sm text-muted-foreground">N/A</span>;
        }
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss.SSS", {
              locale: ptBR,
            })}
          </span>
        );
      },
    },
    {
      id: 'user_id',
      accessorKey: 'user_id',
      meta: { label: 'Usuário' },
      header: () => (
        <DataTableColumnHeader
          title="Usuário"
          orderKey="order-user"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }): React.JSX.Element => {
        const isMine = row.original.user_id === params.currentUserId;
        let display = row.original.user_id;
        if (row.original.user_id.length > 18) {
          display = `${row.original.user_id.slice(0, 16)}…`;
        }
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-medium',
              isMine && 'text-primary',
            )}
            title={row.original.user_id}
          >
            {display}
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
      id: 'object_type',
      accessorKey: 'object_type',
      meta: { label: 'Tipo de objeto' },
      header: () => (
        <DataTableColumnHeader
          title="Tipo de objeto"
          orderKey="order-object-type"
          routeId={ROUTE_ID}
        />
      ),
      cell: ({ row }): React.ReactElement => (
        <Badge className="font-semibold border-transparent bg-gray-100 text-gray-700">
          {OBJECT_META[row.original.object_type]}
        </Badge>
      ),
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
      cell: ({ row }): React.JSX.Element => {
        const id = row.original.object_id;
        let display = id;
        if (id.length > 18) {
          display = `${id.slice(0, 16)}…`;
        }
        return (
          <span
            className="text-sm text-muted-foreground"
            title={id}
          >
            {display}
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
      cell: ({ row }): React.JSX.Element => (
        <a
          href={row.original.url}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            params.onNavigate(row.original.url);
          }}
          className="text-sm text-sky-600 hover:underline break-all dark:text-sky-400"
        >
          {row.original.url}
        </a>
      ),
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
        />
      ),
    },
  ];
}

// --- Ordenação client-side ---

type OrderField =
  | 'order-date'
  | 'order-user'
  | 'order-action'
  | 'order-object-type'
  | 'order-object-id'
  | 'order-url';

const ORDER_KEY_MAP: Record<OrderField, keyof HistoryEntry> = {
  'order-date': 'date',
  'order-user': 'user_id',
  'order-action': 'action',
  'order-object-type': 'object_type',
  'order-object-id': 'object_id',
  'order-url': 'url',
};

function applySort(
  entries: Array<HistoryEntry>,
  orderField: OrderField | null,
  direction: 'asc' | 'desc',
): Array<HistoryEntry> {
  if (!orderField) return entries;
  const key = ORDER_KEY_MAP[orderField];
  const factor = direction === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => {
    const av = String(a[key] ?? '');
    const bv = String(b[key] ?? '');
    return av.localeCompare(bv) * factor;
  });
}

// --- Componente principal ---

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const navigate = useNavigate({ from: '/history/' });
  const search = useSearch({ from: ROUTE_ID });
  const auth = useAuthStore();
  const role = auth.user?.group?.slug?.toUpperCase();
  const isPrivileged = role === E_ROLE.MASTER || role === E_ROLE.ADMINISTRATOR;
  const currentUserId = auth.user?._id ?? '';

  const filterSidebar = useFilterSidebar();
  const [jsonEntry, setJsonEntry] = React.useState<HistoryEntry | null>(null);
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(
    null,
  );

  // Filtros derivados dos search params
  const filters: FiltersState = React.useMemo(
    () => ({
      search: search.search ?? '',
      actions: parseCsvList(search.actions, ACTION_OPTIONS),
      objectTypes: parseCsvList(search.objectTypes, OBJECT_OPTIONS),
      dateFrom: search['date-from'] ?? '',
      dateTo: search['date-to'] ?? '',
    }),
    [search],
  );

  const personalizedEntries = React.useMemo<Array<HistoryEntry>>(() => {
    if (isPrivileged || !currentUserId) return MOCK_ENTRIES;
    return MOCK_ENTRIES.map((entry) =>
      ME_USER_IDS.has(entry.user_id)
        ? { ...entry, user_id: currentUserId }
        : entry,
    );
  }, [isPrivileged, currentUserId]);

  const visibleByRole = React.useMemo(() => {
    if (isPrivileged) return personalizedEntries;
    return personalizedEntries.filter(
      (entry) => entry.user_id === currentUserId,
    );
  }, [personalizedEntries, isPrivileged, currentUserId]);

  const filtered = React.useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return visibleByRole.filter((entry) => {
      if (filters.actions.length > 0 && !filters.actions.includes(entry.action))
        return false;
      if (
        filters.objectTypes.length > 0 &&
        !filters.objectTypes.includes(entry.object_type)
      )
        return false;
      if (filters.dateFrom && entry.date < filters.dateFrom) return false;
      if (filters.dateTo && entry.date.slice(0, 10) > filters.dateTo)
        return false;

      if (term.length === 0) return true;
      const haystack = [
        entry.user_id,
        entry.action,
        entry.object_type,
        entry.object_id,
        entry.url,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [visibleByRole, filters]);

  // Ordenação: aplica o primeiro orderKey ativo encontrado
  const sorted = React.useMemo(() => {
    const orderFields: Array<OrderField> = [
      'order-date',
      'order-user',
      'order-action',
      'order-object-type',
      'order-object-id',
      'order-url',
    ];
    for (const field of orderFields) {
      const direction = (search as Record<string, unknown>)[field] as
        | 'asc'
        | 'desc'
        | undefined;
      if (direction) return applySort(filtered, field, direction);
    }
    return filtered;
  }, [filtered, search]);

  // Paginação client-side
  const meta: Meta = React.useMemo(() => {
    const total = sorted.length;
    const lastPage = Math.max(1, Math.ceil(total / search.perPage));
    return {
      total,
      page: search.page,
      perPage: search.perPage,
      lastPage,
      firstPage: 1,
    };
  }, [sorted.length, search.page, search.perPage]);

  const paginated = React.useMemo(() => {
    const start = (search.page - 1) * search.perPage;
    return sorted.slice(start, start + search.perPage);
  }, [sorted, search.page, search.perPage]);

  const stats = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const total = visibleByRole.length;
    const todayCount = visibleByRole.filter((entry) =>
      entry.date.startsWith(today),
    ).length;
    const counts = visibleByRole.reduce<Record<ActionType, number>>(
      (acc, entry) => {
        acc[entry.action] = (acc[entry.action] ?? 0) + 1;
        return acc;
      },
      { add: 0, edit: 0, view: 0, delete: 0 },
    );
    return { total, todayCount, counts };
  }, [visibleByRole]);

  const activeFilterCount =
    filters.actions.length +
    filters.objectTypes.length +
    (filters.search ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const handleNavigate = React.useCallback(
    (url: string) => {
      router.navigate({ to: url });
    },
    [router],
  );

  const columns = React.useMemo(
    () =>
      buildColumns({
        currentUserId,
        onOpenJson: setJsonEntry,
        onNavigate: handleNavigate,
      }),
    [currentUserId, handleNavigate],
  );

  const table = useDataTable({
    data: paginated,
    columns,
    getRowId: (row) => row.id,
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
        objectTypes:
          next.objectTypes.length > 0 ? next.objectTypes.join(',') : undefined,
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
    const csv = entriesToCsv(sorted);
    const stamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    downloadCsv(csv, `historico-acoes_${stamp}.csv`);
    toastSuccess(
      'CSV exportado',
      `${sorted.length} registro${sorted.length === 1 ? '' : 's'} no arquivo`,
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
              {sorted.length} de {visibleByRole.length}
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
              disabled={sorted.length === 0}
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
            value={stats.total}
            icon={ActivityIcon}
          />
          <StatCard
            label="Hoje"
            value={stats.todayCount}
            icon={CalendarClockIcon}
            accentClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
          />
          <StatCard
            label="Edições"
            value={stats.counts.edit}
            icon={PencilIcon}
            accentClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
          />
          <StatCard
            label="Adições"
            value={stats.counts.add}
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
            emptyMessage="Nenhum registro encontrado"
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
