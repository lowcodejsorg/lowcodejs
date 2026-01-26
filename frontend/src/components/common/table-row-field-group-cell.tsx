import { TableRowCategoryCell } from './table-row-category-cell';
import { TableRowDateCell } from './table-row-date-cell';
import { TableRowDropdownCell } from './table-row-dropdown-cell';
import { TableRowEvaluationCell } from './table-row-evaluation-cell';
import { TableRowFileCell } from './table-row-file-cell';
import { TableRowReactionCell } from './table-row-reaction-cell';
import { TableRowRelationshipCell } from './table-row-relationship-cell';
import { TableRowTextLongCell } from './table-row-text-long-cell';
import { TableRowTextShortCell } from './table-row-text-short-cell';

import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { E_FIELD_TYPE } from '@/lib/constant';
import type {
  IField,
  IGroupConfiguration,
  IRow,
  ITable,
} from '@/lib/interfaces';

interface TableRowFieldGroupCellProps {
  row: IRow;
  field: IField;
  tableSlug: string;
  table?: ITable; // Tabela pai com groups
}

export function TableRowFieldGroupCell({
  field,
  row,
  tableSlug,
  table: tableProp,
}: TableRowFieldGroupCellProps): React.JSX.Element {
  const groupSlug = field.configuration.group?.slug;

  // Usa useReadTable como fallback quando table não é passada
  const tableQuery = useReadTable({ slug: tableSlug });
  const table = tableProp ?? tableQuery.data;

  // Busca os campos do grupo em groups
  const group: IGroupConfiguration | undefined = table?.groups.find(
    (g) => g.slug === groupSlug,
  );

  if (!groupSlug || !group) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const groupData = row[field.slug] ?? [];
  const total = groupData.length || 0;

  if (total === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const groupFields = group.fields.filter(
    (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.trashed,
  );

  return (
    <div className="flex flex-col gap-2">
      {groupData.map((groupRow: IRow, index: number) => (
        <div
          key={groupRow._id || index}
          className="grid grid-cols-2 gap-2"
        >
          {groupFields.map((groupField) => (
            <div
              key={groupField._id}
              className="flex flex-col gap-0.5"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {groupField.name}
              </span>
              <RenderGroupFieldCell
                field={groupField}
                row={groupRow}
                tableSlug={tableSlug}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function RenderGroupFieldCell({
  field,
  row,
  tableSlug,
}: {
  field: IField;
  row: IRow;
  tableSlug: string;
}): React.JSX.Element {
  if (!(field.slug in row)) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return (
        <TableRowTextShortCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.TEXT_LONG:
      return (
        <TableRowTextLongCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.DATE:
      return (
        <TableRowDateCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.DROPDOWN:
      return (
        <TableRowDropdownCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.CATEGORY:
      return (
        <TableRowCategoryCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.RELATIONSHIP:
      return (
        <TableRowRelationshipCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.FILE:
      return (
        <TableRowFileCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.REACTION:
      return (
        <TableRowReactionCell
          field={field}
          row={row}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.EVALUATION:
      return (
        <TableRowEvaluationCell
          field={field}
          row={row}
          tableSlug={tableSlug}
        />
      );
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
