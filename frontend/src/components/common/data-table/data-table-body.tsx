import { flexRender } from '@tanstack/react-table';
import type { Table as TanstackTable } from '@tanstack/react-table';
import React from 'react';

import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableBodyProps<TData> {
  table: TanstackTable<TData>;
  onRowClick?: (row: TData) => void;
  emptyMessage: string;
}

function DataTableBodyInner<TData>({
  table,
  onRowClick,
  emptyMessage,
}: DataTableBodyProps<TData>): React.JSX.Element {
  return (
    <TableBody>
      {table.getRowModel().rows.length === 0 && (
        <TableRow>
          <TableCell
            colSpan={table.getAllColumns().length}
            className="text-center py-8 text-muted-foreground"
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      )}
      {table.getRowModel().rows.map((row) => (
        <TableRow
          key={row.id}
          className={cn(onRowClick && 'cursor-pointer')}
          data-state={row.getIsSelected() ? 'selected' : undefined}
          onClick={() => onRowClick?.(row.original)}
        >
          {row.getVisibleCells().map((cell) => {
            const isPinned = cell.column.getIsPinned();
            return (
              <TableCell
                key={cell.id}
                style={{
                  width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                  position: isPinned ? 'sticky' : undefined,
                  left:
                    isPinned === 'left'
                      ? `${cell.column.getStart('left')}px`
                      : undefined,
                  right:
                    isPinned === 'right'
                      ? `${cell.column.getAfter('right')}px`
                      : undefined,
                  zIndex: isPinned ? 10 : undefined,
                }}
                className={cn(isPinned && 'bg-background')}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}

export const DataTableBody = React.memo(
  DataTableBodyInner,
) as typeof DataTableBodyInner;
