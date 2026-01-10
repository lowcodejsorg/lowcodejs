import { E_FIELD_FORMAT } from '@/lib/constant';
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
  const value = row[field.slug];
  const isRichText = field.configuration.format === E_FIELD_FORMAT.RICH_TEXT;

  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (isRichText) {
    return (
      <div
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <p className={cn('text-muted-foreground text-sm', className)}>{value}</p>
  );
}
