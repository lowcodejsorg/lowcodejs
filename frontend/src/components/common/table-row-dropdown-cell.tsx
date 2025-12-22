import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';

interface TableRowDropdownCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDropdownCell({
  field,
  row,
}: TableRowDropdownCellProps): React.JSX.Element {
  const values = Array.from<string>(row?.[field.slug] ?? []);

  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className="inline-flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={value} variant="outline" className="text-muted-foreground">
          {value}
        </Badge>
      ))}
    </div>
  );
}
