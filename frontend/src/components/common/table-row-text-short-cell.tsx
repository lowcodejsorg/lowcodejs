import { E_FIELD_FORMAT } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';

interface TableRowTextShortCellProps {
  row: IRow;
  field: IField;
}

export function TableRowTextShortCell({
  field,
  row,
}: TableRowTextShortCellProps): React.JSX.Element {
  const value = row[field.slug];

  if (!value) {
    return <p className="text-muted-foreground text-sm max-w-sm truncate">-</p>;
  }

  if (field.format === E_FIELD_FORMAT.PASSWORD) {
    return (
      <p className="text-muted-foreground text-sm max-w-sm truncate">
        ••••••••
      </p>
    );
  }

  if (field.format === E_FIELD_FORMAT.EMAIL) {
    return (
      <a
        href={`mailto:${value}`}
        className="text-sm max-w-sm truncate text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }

  if (field.format === E_FIELD_FORMAT.URL) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm max-w-sm truncate text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }

  return (
    <p className="text-muted-foreground text-sm max-w-sm truncate">{value}</p>
  );
}
