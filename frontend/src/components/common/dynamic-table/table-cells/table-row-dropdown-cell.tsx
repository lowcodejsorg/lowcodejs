import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';
import { getDropdownItem } from '@/lib/table';

import { getDropdownContrastStyle } from './utils';

interface TableRowDropdownCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDropdownCell({
  field,
  row,
}: TableRowDropdownCellProps): React.JSX.Element {
  const values = Array.from<string>(row[field.slug] ?? []);

  const items = values.map((value) => getDropdownItem(field.dropdown, value));

  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div
      data-slot="table-row-dropdown-cell"
      data-test-id="dropdown-cell"
      className="inline-flex flex-wrap gap-1"
    >
      {items.map((item, index) => {
        const style = getDropdownContrastStyle(item?.color);
        return (
          <Badge
            key={item?.id ?? index}
            variant="outline"
            className={style ? undefined : 'text-muted-foreground'}
            style={style}
          >
            {item?.label}
          </Badge>
        );
      })}
    </div>
  );
}
