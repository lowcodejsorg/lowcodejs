import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';
import { getCategoryItem } from '@/lib/table';

interface TableRowCategoryCellProps {
  row: IRow;
  field: IField;
}

export function TableRowCategoryCell({
  field,
  row,
}: TableRowCategoryCellProps): React.JSX.Element {
  const values = Array.from<string>(row[field.slug] ?? []);
  const items = values.map((value) => getCategoryItem(field.category, value));

  return (
    <TableRowBadgeList
      data-slot="table-row-category-cell"
      data-test-id="category-cell"
      values={items}
      renderLabel={(item) => item?.label}
      getKey={(item) => item?.id ?? ''}
    />
  );
}
