import { Badge } from '@/components/ui/badge';

interface TableRowBadgeListProps<T> {
  values: Array<T>;
  renderLabel: (value: T, index: number) => React.ReactNode;
  getKey?: (value: T, index: number) => string | number;
}

export function TableRowBadgeList<T>({
  values,
  renderLabel,
  getKey = (_, i) => i,
}: TableRowBadgeListProps<T>): React.JSX.Element {
  if (values.length === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <div className="inline-flex flex-wrap gap-1">
      {values.map((value, index) => (
        <Badge
          key={getKey(value, index)}
          variant="outline"
          className="text-muted-foreground"
        >
          {renderLabel(value, index)}
        </Badge>
      ))}
    </div>
  );
}
