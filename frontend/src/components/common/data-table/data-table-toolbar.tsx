import type { Table as TanstackTable } from '@tanstack/react-table';

import { DataTableColumnToggle } from './data-table-column-toggle';

interface DataTableToolbarProps<TData> {
  table: TanstackTable<TData>;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  children,
}: DataTableToolbarProps<TData>): React.JSX.Element {
  return (
    <div className="flex items-center justify-end gap-2 pb-2">
      {children}
      <DataTableColumnToggle table={table} />
    </div>
  );
}
