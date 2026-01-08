import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';

interface TableRowRelationshipCellProps {
  row: IRow;
  field: IField;
}

export function TableRowRelationshipCell({
  field,
  row,
}: TableRowRelationshipCellProps): React.JSX.Element {
  const relationshipFieldSlug = field.configuration.relationship?.field.slug;
  const rawValues = Array.from(row[field.slug] ?? []);

  const values = rawValues.map<string>((item) => {
    if (typeof item === 'object' && item !== null && relationshipFieldSlug) {
      return (item as Record<string, string>)[relationshipFieldSlug];
    }
    return String(item);
  });

  return (
    <TableRowBadgeList
      values={values}
      renderLabel={(value) => value}
    />
  );
}
