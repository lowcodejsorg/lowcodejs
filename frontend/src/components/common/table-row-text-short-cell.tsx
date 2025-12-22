import type { IField, IRow } from '@/lib/interfaces';

interface TableRowTextShortCellProps {
  row: IRow;
  field: IField;
}

export function TableRowTextShortCell({
  field,
  row,
}: TableRowTextShortCellProps): React.JSX.Element {
  return (
    <p className="text-muted-foreground text-sm max-w-sm truncate">
      {row?.[field.slug] ?? '-'}
    </p>
  );
}
