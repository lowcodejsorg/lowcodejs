import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';
import { getDropdownItem } from '@/lib/table';

export function getDropdownContrastStyle(
  color?: string | null,
): React.CSSProperties | undefined {
  if (!color) return undefined;
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
    color.trim(),
  );
  if (!match) return undefined;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const factor = Math.max(0.15, 0.5 - luminance * 0.45);
  const tr = Math.round(r * factor);
  const tg = Math.round(g * factor);
  const tb = Math.round(b * factor);

  return {
    color: `rgb(${tr}, ${tg}, ${tb})`,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.32)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.65)`,
    fontWeight: 600,
  };
}

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
