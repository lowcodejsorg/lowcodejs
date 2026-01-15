import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';
import { getCategoryItem } from '@/lib/utils';

interface TableRowCategoryCellProps {
  row: IRow;
  field: IField;
}

export function TableRowCategoryCell({
  field,
  row,
}: TableRowCategoryCellProps): React.JSX.Element {
  const values = Array.from<string>(row[field.slug] ?? []);
  const items = values.map((value) =>
    getCategoryItem(field.configuration.category, value),
  );

  return (
    <TableRowBadgeList
      values={items}
      renderLabel={(item) => item?.label}
      getKey={(item) => item?.id ?? ''}
    />
  );
}
