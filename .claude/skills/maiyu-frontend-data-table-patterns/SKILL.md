---
name: maiyu:frontend-data-table-patterns
description: |
  Generates generic DataTable component with TanStack Table, virtualization,
  column drag-and-drop, keyboard navigation, and URL-driven pagination.
  Use when: user asks to create data tables, table components, sortable tables,
  or mentions "data table", "tanstack table", "virtual table".
  Supports: TanStack Table v8, TanStack Virtual, dnd-kit, URL pagination.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### DataTable Component (Generic)

```tsx
import {
  type ColumnDef,
  type Table as TanstackTable,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps<TData> {
  table: TanstackTable<TData>
  enableVirtualization?: boolean
}

export function DataTable<TData>({
  table,
  enableVirtualization = false,
}: DataTableProps<TData>): React.JSX.Element {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    enabled: enableVirtualization,
  })

  return (
    <div ref={tableContainerRef} className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-10 px-3 text-left font-medium text-muted-foreground"
                  style={{ width: header.getSize() }}
                >
                  {!header.isPlaceholder &&
                    flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {(() => {
            if (enableVirtualization) {
              return virtualizer.getVirtualItems()
            }
            return rows.map((_, i) => ({ index: i }))
          })().map(
            (virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-10 px-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            },
          )}
        </tbody>
      </table>
    </div>
  )
}
```

### Column Header (Sortable)

```tsx
import { type Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>): React.JSX.Element {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => column.toggleSorting()}
    >
      {title}
      {sorted === 'asc' && <ArrowUp className="ml-1 h-3 w-3" />}
      {sorted === 'desc' && <ArrowDown className="ml-1 h-3 w-3" />}
      {!sorted && <ArrowUpDown className="ml-1 h-3 w-3" />}
    </Button>
  )
}
```

### useDataTable Hook

```typescript
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type VisibilityState,
  type ColumnOrderState,
  type ColumnSizingState,
} from '@tanstack/react-table'
import { useState } from 'react'

interface UseDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  persistKey?: string
}

export function useDataTable<TData>({
  data,
  columns,
  persistKey,
}: UseDataTableProps<TData>): { table: TanstackTable<TData> } {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility, columnOrder, columnSizing },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  })

  return { table }
}
```

### URL-Driven Pagination

```tsx
interface PaginationProps {
  meta: { total: number; page: number; perPage: number; lastPage: number }
}

export function Pagination({ meta }: PaginationProps): React.JSX.Element {
  // TanStack Router:
  // const navigate = useNavigate()
  // const search = useSearch()
  // Next.js:
  // const router = useRouter()
  // const searchParams = useSearchParams()

  function goToPage(page: number) {
    // Update URL search params with new page
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {meta.total} registros
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>
          Anterior
        </Button>
        <span className="text-sm">
          {meta.page} de {meta.lastPage}
        </span>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.lastPage} onClick={() => goToPage(meta.page + 1)}>
          Proximo
        </Button>
      </div>
    </div>
  )
}
```

## Checklist

- [ ] Generic over TData (works with any data type)
- [ ] Manual sorting/filtering/pagination (server-side)
- [ ] Column visibility toggle
- [ ] Column resize via CSS variables
- [ ] Sticky header
- [ ] Virtualization optional (for large datasets)
- [ ] URL-driven pagination
