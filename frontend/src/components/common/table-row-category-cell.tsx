import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';
import { getCategoryItem } from '@/lib/utils';

interface TableRowCategoryCellProps {
  row: IRow;
  field: IField;
}

export function TableRowCategoryCell({
  field,
  row,
}: TableRowCategoryCellProps): React.JSX.Element {
  const values = Array.from<string>(row?.[field.slug] ?? []);
  const items = values.map((value) =>
    getCategoryItem(field.configuration.category ?? [], value),
  );

  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className="inline-flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item?.id} variant="outline" className="text-muted-foreground">
          {item?.label}
        </Badge>
      ))}
    </div>
  );
}
