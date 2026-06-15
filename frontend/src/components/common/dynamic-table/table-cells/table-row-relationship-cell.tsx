import { Badge } from '@/components/ui/badge';
import type { IField, IRow } from '@/lib/interfaces';

interface TableRowRelationshipCellProps {
  row: IRow;
  field: IField;
}

// Exibe só a contagem de registros relacionados (badge), não os rótulos/ids.
// Os vínculos vivem nos links e são geridos no detalhe; na listagem basta o
// número, evitando rótulos que cairiam no _id quando não resolvem.
export function TableRowRelationshipCell({
  field,
  row,
}: TableRowRelationshipCellProps): React.JSX.Element {
  const raw = row[field.slug];
  let total = 0;
  if (Array.isArray(raw)) total = raw.length;

  if (total === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <Badge
      data-slot="table-row-relationship-cell"
      data-test-id="relationship-cell"
      variant="secondary"
    >
      {total} {total === 1 && 'registro'}
      {total !== 1 && 'registros'}
    </Badge>
  );
}
