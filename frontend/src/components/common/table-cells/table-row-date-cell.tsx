import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { IField, IRow } from '@/lib/interfaces';

interface TableRowDateCellProps {
  row: IRow;
  field: IField;
}

export function TableRowDateCell({
  field,
  row,
}: TableRowDateCellProps): React.JSX.Element {
  const value = row[field.slug];
  const dateFormat = field.format || 'dd/MM/yyyy';

  let displayValue = '-';
  if (value) {
    displayValue = format(value, dateFormat, { locale: ptBR });
  }

  return (
    <p
      data-slot="table-row-date-cell"
      className="text-muted-foreground text-sm"
    >
      {displayValue}
    </p>
  );
}
