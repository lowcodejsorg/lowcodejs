---
name: frontend-data-table
description: |
  Generates data table setups with TanStack Table for frontend projects.
  Use when: user asks to create a data table, table columns, column definitions,
  datagrid, table view, or mentions "data table" for tabular data display.
  Supports: TanStack Table v8, column definitions, cell renderers, virtualization.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
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
- Column definitions typed with `ColumnDef<TData, any>`
- Cell renderers use switch-case (no ternaries)
- Features are opt-in: virtualization, keyboard navigation, column dragging
- Persisted state via localStorage with debounced saves
- Manual sorting/filtering/pagination (server-side)
- Selection column (`_select`) and actions column (`_actions`) as first/last
- No ternary operators

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
  columns: Array<ColumnDef<TData, any>>;
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
}: UseColumnsOptions): Array<ColumnDef<IRow, any>> {
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
      (field): ColumnDef<IRow, any> => ({
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
export function getSelectColumn<TData>(): ColumnDef<TData, any> {
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
): ColumnDef<TData, any> {
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

function loadState(key: string): Record<string, unknown> {
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
  let initialPersisted = {};
  if (enabled) {
    initialPersisted = loadState(persistKey);
  }
  const persisted = React.useRef(initialPersisted);

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
      return persisted.current.columnOrder as ColumnOrderState;
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

## Checklist

- [ ] `useDataTable` hook with typed options
- [ ] Column definitions with `ColumnDef<TData>`
- [ ] Cell renderers use switch-case (no ternaries)
- [ ] Selection + actions columns
- [ ] Persisted state with debounced localStorage
- [ ] Server-side sorting/filtering/pagination (manual modes)
- [ ] No ternary operators
