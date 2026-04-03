import { TableRowBadgeList } from './table-row-badge-list';

import type { IField, IRow } from '@/lib/interfaces';

interface RelationshipItem {
  _id: string;
  label: string;
  tableSlug: string | null;
}

interface TableRowRelationshipCellProps {
  row: IRow;
  field: IField;
}

export function TableRowRelationshipCell({
  field,
  row,
}: TableRowRelationshipCellProps): React.JSX.Element {
  const relConfig = field.relationship;
  if (!relConfig?.field?.slug) {
    return (
      <TableRowBadgeList
        values={[]}
        renderLabel={(v) => v}
      />
    );
  }
  const relationshipFieldSlug = relConfig.field.slug;
  const tableSlug = relConfig.table?.slug ?? null;

  const rawValues = Array.from(row[field.slug] ?? []);

  const values = rawValues.map<RelationshipItem>((item) => {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, string>;
      return {
        _id: obj._id ?? '',
        label: obj[relationshipFieldSlug] ?? String(obj._id ?? ''),
        tableSlug,
      };
    }
    return { _id: String(item), label: String(item), tableSlug };
  });

  return (
    <TableRowBadgeList
      data-slot="table-row-relationship-cell"
      data-test-id="relationship-cell"
      values={values}
      getKey={(item) => item._id}
      renderLabel={(item) => {
        if (item.tableSlug && item._id) {
          return (
            <a
              href={`/tables/${item.tableSlug}/row/${item._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {item.label}
            </a>
          );
        }
        return item.label;
      }}
    />
  );
}
