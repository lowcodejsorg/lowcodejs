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
  const rawValues = Array.isArray(rawValue)
    ? rawValue
    : rawValue
      ? [rawValue]
      : [];

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
