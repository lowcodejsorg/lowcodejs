import { ContentViewer } from '@/components/common/editor';
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
  const isRenderedMarkdown =
    field.format === E_FIELD_FORMAT.RICH_TEXT ||
    field.format === E_FIELD_FORMAT.MARKDOWN;

  if (!value) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (isRenderedMarkdown) {
    return <ContentViewer content={value} />;
  }

  return (
    <p className={cn('text-muted-foreground text-sm', className)}>{value}</p>
  );
}
