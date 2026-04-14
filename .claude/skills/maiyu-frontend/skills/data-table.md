---
name: maiyu:frontend-data-table
description: |
  Generates data table setups with TanStack Table for frontend projects.
  Use when: user asks to create a data table, table columns, column definitions,
  datagrid, table view, or mentions "data table" for tabular data display.
  Supports: TanStack Table v8, column definitions, cell renderers, virtualization.
  Frameworks: TanStack Start, React (Vite), Next.js, Next.js App Router, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Table lib**: `@tanstack/react-table`
   - **Virtualization**: `@tanstack/react-virtual`
   - **DnD**: `@dnd-kit/core` | `@dnd-kit/sortable`
3. Scan existing data table code to detect:
   - DataTable component (`components/common/data-table/`)
   - `useDataTable` hook (`hooks/use-data-table.ts`)
   - Column definition patterns
   - Cell renderer patterns (switch-case by type)
   - Persisted state patterns (`use-persisted-table-state.ts`)
4. If TanStack Table not found, suggest installing it

## Conventions

### Naming
- Hook: `src/hooks/use-data-table.ts`
- Component: `src/components/common/data-table/data-table.tsx`
- Column hook: `src/hooks/use-{entity}-columns.tsx`
- Cell renderers: switch-case function `RenderCell()`

### Rules
- Column definitions typed with `ColumnDef<TData, unknown>`
- Cell renderers use switch-case (no ternaries)
- Features are opt-in: virtualization, keyboard navigation, column dragging
- Persisted state via localStorage with debounced saves
- Manual sorting/filtering/pagination (server-side)
- Selection column (`_select`) and actions column (`_actions`) as first/last
- No ternary operators — use `{condition && <el>}`, if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### useDataTable Hook (Reference Implementation)

```typescript
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  Row,
  RowSelectionState,
  Table,
  TableMeta,
  VisibilityState,
} from '@tanstack/react-table';
import React from 'react';

import { usePersistedTableState } from './use-persisted-table-state';

interface UseDataTableOptions<TData> {
  data: Array<TData>;
  columns: Array<ColumnDef<TData, unknown>>;
  pageCount?: number;
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  enableColumnResizing?: boolean;
  initialColumnVisibility?: VisibilityState;
  initialColumnPinning?: ColumnPinningState;
  initialColumnOrder?: Array<string>;
  initialColumnSizing?: ColumnSizingState;
  persistKey?: string;
  meta?: TableMeta<TData>;
}

export function useDataTable<TData>({
  data,
  columns,
  pageCount,
  getRowId,
  enableRowSelection = false,
  enableColumnResizing = false,
  initialColumnVisibility = {},
  initialColumnPinning = {},
  initialColumnOrder = [],
  initialColumnSizing = {},
  persistKey,
  meta,
}: UseDataTableOptions<TData>): Table<TData> {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnPinning, setColumnPinning] =
    React.useState<ColumnPinningState>(initialColumnPinning);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
  } = usePersistedTableState({
    persistKey,
    initialColumnVisibility,
    initialColumnOrder,
    initialColumnSizing,
  });

  return useReactTable({
    data,
    columns,
    pageCount,
    getRowId,
    meta,
    state: {
      rowSelection,
      columnVisibility,
      columnPinning,
      columnOrder,
      columnSizing,
    },
    enableRowSelection,
    enableColumnResizing,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });
}
```

### Column Definitions with Cell Renderers

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';

import type { IField, IRow } from '@/lib/interfaces';
import { E_FIELD_TYPE } from '@/lib/constant';

// Cell renderer — switch-case by field type (NO ternaries)
function RenderCell({
  field,
  row,
}: {
  field: IField;
  row: IRow;
}): React.JSX.Element {
  if (!field || !(field.slug in row)) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return <TextShortCell field={field} row={row} />;
    case E_FIELD_TYPE.TEXT_LONG:
      return <TextLongCell field={field} row={row} />;
    case E_FIELD_TYPE.DATE:
      return <DateCell field={field} row={row} />;
    case E_FIELD_TYPE.DROPDOWN:
      return <DropdownCell field={field} row={row} />;
    case E_FIELD_TYPE.RELATIONSHIP:
      return <RelationshipCell field={field} row={row} />;
    case E_FIELD_TYPE.FILE:
      return <FileCell field={field} row={row} />;
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}

// Column definitions hook
interface UseColumnsOptions {
  fields: Array<IField>;
  fieldOrder: Array<string>;
}

export function useEntityColumns({
  fields,
  fieldOrder,
}: UseColumnsOptions): Array<ColumnDef<IRow, unknown>> {
  return React.useMemo(() => {
    function getIndex(idx: number): number {
      if (idx === -1) return Infinity;
      return idx;
    }

    const sorted = fields
      .filter((f) => f.showInList && !f.trashed)
      .sort((a, b) => {
        const idxA = fieldOrder.indexOf(a._id);
        const idxB = fieldOrder.indexOf(b._id);
        return (
          getIndex(idxA) - getIndex(idxB)
        );
      });

    return sorted.map(
      (field): ColumnDef<IRow, unknown> => ({
        id: field._id,
        accessorFn: (row) => row[field.slug],
        meta: { label: field.name, field },
        size: field.widthInList ?? undefined,
        header: () => <span className="font-medium">{field.name}</span>,
        cell: ({ row }) => (
          <RenderCell field={field} row={row.original} />
        ),
      }),
    );
  }, [fields, fieldOrder]);
}
```

### Selection Column + Actions Column

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

// Selection column (first)
export function getSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: '_select',
    size: 40,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(Boolean(value))
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Select row"
      />
    ),
  };
}

// Actions column (last)
export function getActionsColumn<TData>(
  onEdit: (row: TData) => void,
  onDelete: (row: TData) => void,
): ColumnDef<TData, unknown> {
  return {
    id: '_actions',
    size: 60,
    enableResizing: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(row.original)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  };
}
```

### Persisted Table State

```typescript
import type {
  ColumnOrderState,
  ColumnSizingState,
  VisibilityState,
} from '@tanstack/react-table';
import React from 'react';

const STORAGE_PREFIX = 'dt:';

interface PersistedTableState {
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnSizing?: ColumnSizingState;
}

function loadState(key: string): PersistedTableState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(key: string, state: Record<string, unknown>): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

interface UsePersistedTableStateOptions {
  persistKey?: string;
  initialColumnVisibility?: VisibilityState;
  initialColumnOrder?: ColumnOrderState;
  initialColumnSizing?: ColumnSizingState;
}

export function usePersistedTableState({
  persistKey,
  initialColumnVisibility = {},
  initialColumnOrder = [],
  initialColumnSizing = {},
}: UsePersistedTableStateOptions) {
  const enabled = !!persistKey;
  let initialPersisted: PersistedTableState = {};
  if (enabled) {
    initialPersisted = loadState(persistKey);
  }
  const persisted = React.useRef<PersistedTableState>(initialPersisted);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      const base = { ...initialColumnVisibility };
      if (enabled && persisted.current.columnVisibility) {
        Object.assign(base, persisted.current.columnVisibility);
      }
      return base;
    });

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() => {
    if (enabled && Array.isArray(persisted.current.columnOrder) && persisted.current.columnOrder.length) {
      return persisted.current.columnOrder;
    }
    return initialColumnOrder;
  });

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(() => {
    const base = { ...initialColumnSizing };
    if (enabled && persisted.current.columnSizing) {
      Object.assign(base, persisted.current.columnSizing);
    }
    return base;
  });

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveState(persistKey!, { columnVisibility, columnOrder, columnSizing });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, persistKey, columnVisibility, columnOrder, columnSizing]);

  return {
    columnVisibility, setColumnVisibility,
    columnOrder, setColumnOrder,
    columnSizing, setColumnSizing,
  };
}
```

### Full Page Usage

```tsx
import { useDataTable } from '@/hooks/use-data-table';
import { useEntityColumns } from '@/hooks/use-entity-columns';
import { DataTable } from '@/components/common/data-table/data-table';

export function EntityListView({ data, fields, fieldOrder }: Props): React.JSX.Element {
  const columns = useEntityColumns({ fields, fieldOrder });

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    enableRowSelection: true,
    enableColumnResizing: true,
    persistKey: 'entity-list',
  });

  return (
    <DataTable
      table={table}
      stickyHeader
      enableVirtualization
      enableKeyboardNavigation
    />
  );
}
```

### Extended Cell Renderers

```tsx
// URL cell — truncated with clickable link
function UrlCell({ value }: { value: string }): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-primary underline truncate block max-w-48"
      title={value}
    >
      {value.replace(/^https?:\/\//, '').split('/')[0]}...
    </a>
  );
}

// Email cell — mailto link
function EmailCell({ value }: { value: string }): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <a href={`mailto:${value}`} className="text-sm text-primary underline truncate block">
      {value}
    </a>
  );
}

// Phone cell — tel link
function PhoneCell({ value }: { value: string }): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <a href={`tel:${value}`} className="text-sm text-primary">
      {value}
    </a>
  );
}

// Password cell — always masked
function PasswordCell(): React.JSX.Element {
  return <span className="text-sm tracking-widest">••••••</span>;
}

// Rating/stars cell
function RatingCell({ value, max = 5 }: { value: number; max?: number }): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            'text-sm',
            i < value && 'text-yellow-500',
            i >= value && 'text-muted-foreground/30',
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// Avatar + name cell
function UserCell({ name, avatar }: { name: string; avatar?: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {avatar && <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" />}
        {!avatar && name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm truncate">{name}</span>
    </div>
  );
}

// File cell — icon with filename
function FileLinkCell({ filename, url }: { filename: string; url?: string }): React.JSX.Element {
  if (!filename) return <span className="text-muted-foreground">-</span>;
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-primary underline truncate"
      >
        <FileIcon className="h-3 w-3 shrink-0" />
        {filename}
      </a>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm truncate">
      <FileIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
      {filename}
    </span>
  );
}

// Badge cell — colored dropdown option
function BadgeCell({
  label,
  color,
}: {
  label: string;
  color?: string;
}): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        ...(color && { backgroundColor: `${color}20`, color }),
      }}
    >
      {label}
    </span>
  );
}

// Rich text preview — stripped HTML
function RichTextPreviewCell({ html }: { html: string }): React.JSX.Element {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return (
    <span className="text-sm text-muted-foreground line-clamp-2">
      {text || '-'}
    </span>
  );
}
```

### Bulk Operations Bar

```tsx
import { Trash2, RotateCcw, Download, X } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';

interface BulkActionBarProps<TData> {
  table: Table<TData>;
  onBulkTrash?: (ids: Array<string>) => void;
  onBulkRestore?: (ids: Array<string>) => void;
  onBulkExport?: (ids: Array<string>) => void;
  getRowId: (row: TData) => string;
}

export function BulkActionBar<TData>({
  table,
  onBulkTrash,
  onBulkRestore,
  onBulkExport,
  getRowId,
}: BulkActionBarProps<TData>): React.JSX.Element | null {
  const selectedRows = table.getSelectedRowModel().rows;

  if (selectedRows.length === 0) return null;

  const selectedIds = selectedRows.map((row) => getRowId(row.original));

  function handleClearSelection(): void {
    table.toggleAllRowsSelected(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium">
        {selectedRows.length} selected
      </span>
      <div className="h-4 w-px bg-border" />
      {onBulkTrash && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkTrash(selectedIds)}
        >
          <Trash2 className="mr-1 h-3 w-3" /> Trash
        </Button>
      )}
      {onBulkRestore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkRestore(selectedIds)}
        >
          <RotateCcw className="mr-1 h-3 w-3" /> Restore
        </Button>
      )}
      {onBulkExport && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkExport(selectedIds)}
        >
          <Download className="mr-1 h-3 w-3" /> Export
        </Button>
      )}
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={handleClearSelection}>
        <X className="mr-1 h-3 w-3" /> Clear
      </Button>
    </div>
  );
}
```

### Inline Editing Cell

```tsx
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => void;
  editable?: boolean;
}

export function InlineEditCell({
  value,
  onSave,
  editable = true,
}: InlineEditCellProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!editable || !isEditing) {
    return (
      <span
        className="text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-muted min-w-8 inline-block"
        onDoubleClick={() => {
          if (editable) {
            setDraft(value);
            setIsEditing(true);
          }
        }}
      >
        {value || <span className="text-muted-foreground">-</span>}
      </span>
    );
  }

  function handleSave(): void {
    setIsEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  }

  return (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
          setDraft(value);
          setIsEditing(false);
        }
      }}
      className="h-7 text-sm px-1"
    />
  );
}
```

### Keyboard Navigation Hook

```typescript
import { useCallback, useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

interface UseTableKeyboardNavOptions<TData> {
  table: Table<TData>;
  containerRef: React.RefObject<HTMLElement | null>;
  onRowActivate?: (row: TData) => void;
}

export function useTableKeyboardNavigation<TData>({
  table,
  containerRef,
  onRowActivate,
}: UseTableKeyboardNavOptions<TData>): void {
  const activeCell = useRef<{ row: number; col: number }>({ row: 0, col: 0 });

  const focusCell = useCallback(
    (row: number, col: number) => {
      const container = containerRef.current;
      if (!container) return;
      const cell = container.querySelector(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell instanceof HTMLElement) {
        cell.focus();
        activeCell.current = { row, col };
      }
    },
    [containerRef],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent): void {
      const { row, col } = activeCell.current;
      const rows = table.getRowModel().rows;
      const cols = table.getVisibleFlatColumns();

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (row < rows.length - 1) focusCell(row + 1, col);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (row > 0) focusCell(row - 1, col);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (col < cols.length - 1) focusCell(row, col + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (col > 0) focusCell(row, col - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (onRowActivate && rows[row]) {
            onRowActivate(rows[row].original);
          }
          break;
        case ' ':
          e.preventDefault();
          if (rows[row]) {
            rows[row].toggleSelected();
          }
          break;
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [table, containerRef, focusCell, onRowActivate]);
}
```

### Next.js App Router DataTable

**Server Component wrapper:**
```tsx
// app/{entities}/_components/{entity}-table.tsx (Server Component)
import { DataTable } from '@/components/data-table'
import { columns } from './columns'

interface Props {
  data: I{Entity}[]
  meta: Meta
}

export function {Entity}Table({ data, meta }: Props) {
  return <DataTable columns={columns} data={data} meta={meta} />
}
```

**Client-side with TanStack Query:**
```tsx
'use client'
import { DataTable } from '@/components/data-table'
import { columns } from './columns'
import { use{Entity}List } from '@/hooks/use-{entity}-list'

export function {Entity}DataTable() {
  const { data } = use{Entity}List()
  return <DataTable columns={columns} data={data.data} meta={data.meta} />
}
```

## Checklist

- [ ] `useDataTable` hook with typed options
- [ ] Column definitions with `ColumnDef<TData>`
- [ ] Cell renderers use switch-case (no ternaries)
- [ ] Selection + actions columns
- [ ] Persisted state with debounced localStorage
- [ ] Server-side sorting/filtering/pagination (manual modes)
- [ ] Extended cell renderers: URL (truncated), email, phone, password, rating, user avatar, file, badge, rich text preview
- [ ] Bulk operations bar with trash/restore/export actions
- [ ] Inline editing cell with double-click + Enter/Escape
- [ ] Keyboard navigation (arrows + Enter + Space)
- [ ] No ternary operators
