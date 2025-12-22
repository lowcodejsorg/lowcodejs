import type { IField, IRow } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowTextLongCellProps {
  row: IRow;
  field: IField;
  className?: string;
}

export function TableRowTextLongCell({
  field,
  row,
  className,
}: TableRowTextLongCellProps): React.JSX.Element {
  return (
    <p className={cn('text-muted-foreground text-sm', className)}>
      {row?.[field.slug] ?? '-'}
    </p>
  );
}
