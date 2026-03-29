import { GroupRowsDataTable } from '../group-rows/group-rows-data-table';

import { Badge } from '@/components/ui/badge';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import type { IField, IRow, ITable } from '@/lib/interfaces';

interface TableRowFieldGroupCellProps {
  row: IRow;
  field: IField;
  tableSlug: string;
  table?: ITable;
  variant?: 'cell' | 'detail';
}

export function TableRowFieldGroupCell({
  field,
  row,
  tableSlug,
  table: tableProp,
  variant = 'cell',
}: TableRowFieldGroupCellProps): React.JSX.Element {
  if (!field) return <span className="text-muted-foreground text-sm">-</span>;

  const groupSlug = field.group?.slug;

  const tableQuery = useReadTable({ slug: tableSlug });
  const table = tableProp ?? tableQuery.data;

  if (!groupSlug || !table) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (variant === 'detail') {
    return (
      <GroupRowsDataTable
        tableSlug={tableSlug}
        rowId={row._id}
        field={field}
        table={table}
      />
    );
  }

  // Cell variant: badge with count
  const groupData = row?.[field.slug] ?? [];
  let total = 0;
  if (Array.isArray(groupData)) {
    total = groupData.length;
  }

  if (total === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <Badge
      data-slot="table-row-field-group-cell"
      data-test-id="field-group-cell"
      variant="secondary"
    >
      {total} {total === 1 && 'item'}
      {total !== 1 && 'itens'}
    </Badge>
  );
}
