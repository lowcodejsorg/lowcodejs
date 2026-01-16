import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';
import { getDropdownItem } from '@/lib/utils';

interface TableRowDropdownCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDropdownCell({
  field,
  row,
}: TableRowDropdownCellProps): React.JSX.Element {
  const values = Array.from<string>(row[field.slug] ?? []);

  const items = values.map((value) =>
    getDropdownItem(field.configuration.dropdown, value),
  );

  console.log(field.configuration.dropdown);

  return (
    <TableRowBadgeList
      values={items}
      renderLabel={(value) => value?.label}
      getKey={(value) => value?.id ?? ''}
      getColor={(value) => value?.color ?? null}
    />
  );
}
