import type { IField, IRow, IUser } from '@/lib/interfaces';

interface TableRowUserCellProps {
  row: IRow;
  field: IField;
}

export function TableRowUserCell({
  field,
  row,
}: TableRowUserCellProps): React.JSX.Element {
  const rawValue = row[field.slug];
  let rawValues: Array<unknown> = [];
  if (Array.isArray(rawValue)) {
    rawValues = rawValue;
  } else if (rawValue) {
    rawValues = [rawValue];
  }

  const values = rawValues.map<string>((item) => {
    if (typeof item === 'object' && item !== null) {
      const user = item as IUser;
      return user.name || user.email || user._id;
    }
    return String(item);
  });

  return (
    <p
      data-slot="table-row-user-cell"
      data-test-id="user-cell"
      className="text-muted-foreground text-sm max-w-sm truncate"
    >
      {values.length > 0 && values.join(', ')}
      {values.length === 0 && '-'}
    </p>
  );
}
