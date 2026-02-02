import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow, IUser } from '@/lib/interfaces';

interface TableRowUserCellProps {
  row: IRow;
  field: IField;
}

export function TableRowUserCell({
  field,
  row,
}: TableRowUserCellProps): React.JSX.Element {
  const rawValues = Array.from(row[field.slug] ?? []);

  const values = rawValues.map<string>((item) => {
    if (typeof item === 'object' && item !== null) {
      const user = item as IUser;
      return user.name || user.email || user._id;
    }
    return String(item);
  });

  return (
    <p className="text-muted-foreground text-sm max-w-sm truncate">
      {values.length > 0 ? values.join(', ') : '-'}
    </p>
  );
}
