import { TableRowBadgeList } from './table-row-badge-list';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import type { IField, IRow } from '@/lib/interfaces';
import { resolveRelationshipLabel } from '@/lib/relationship-label';

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
  // Carrega a tabela relacionada para resolver labels de DROPDOWN (id → label)
  // e títulos compostos. Cacheado por slug, sem custo por linha.
  const relatedTable = useReadTable({ slug: relConfig?.table?.slug ?? '' });

  if (!relConfig?.field?.slug) {
    return (
      <TableRowBadgeList
        values={[]}
        renderLabel={(v) => v}
      />
    );
  }
  const tableSlug = relConfig.table?.slug ?? null;
  const relatedFields = relatedTable.data?.fields;

  const rawValues = Array.from(row[field.slug] ?? []);

  const values = rawValues.map<RelationshipItem>((item) => {
    if (typeof item === 'object' && item !== null) {
      const obj = item as IRow;
      return {
        _id: String(obj._id ?? ''),
        label: resolveRelationshipLabel(obj, relConfig, relatedFields),
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
              href={`/tables/${item.tableSlug}/row?_id=${item._id}`}
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
