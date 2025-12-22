import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';

interface TableRowRelationshipCellProps {
  row: IRow;
  field: IField;
}

export function TableRowRelationshipCell({
  field,
  row,
}: TableRowRelationshipCellProps): React.JSX.Element {
  const relationshipFieldSlug = field.configuration.relationship?.field?.slug;
  const rawValues = Array.from(row?.[field.slug] ?? []);

  const values = rawValues.map<string>((item) => {
    if (typeof item === 'object' && item !== null && relationshipFieldSlug) {
      return (item as Record<string, string>)[relationshipFieldSlug];
    }
    return String(item);
  });

  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className="inline-flex flex-wrap gap-1">
      {values.map((value, index) => (
        <Badge key={index} variant="outline" className="text-muted-foreground">
          {value}
        </Badge>
      ))}
    </div>
  );
}
