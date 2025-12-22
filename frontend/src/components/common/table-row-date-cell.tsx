import type { IField, IRow } from '@/lib/interfaces';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TableRowDateCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDateCell({
  field,
  row,
}: TableRowDateCellProps): React.JSX.Element {
  const value = row?.[field.slug];
  const dateFormat = field.configuration.format ?? 'dd/MM/yyyy';

  return (
    <p className="text-muted-foreground text-sm">
      {value ? format(value, dateFormat, { locale: ptBR }) : '-'}
    </p>
  );
}
