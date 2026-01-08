import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';

interface TableRowDropdownCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDropdownCell({
  field,
  row,
}: TableRowDropdownCellProps): React.JSX.Element {
  const values = Array.from<string>(row[field.slug] ?? []);

  return (
    <TableRowBadgeList
      values={values}
      renderLabel={(value) => value}
      getKey={(value) => value}
    />
  );
}
