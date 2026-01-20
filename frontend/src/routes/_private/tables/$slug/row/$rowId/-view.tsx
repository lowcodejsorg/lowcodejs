import { TableRowCategoryCell } from '@/components/common/table-row-category-cell';
import { TableRowDateCell } from '@/components/common/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/table-row-dropdown-cell';
import { TableRowEvaluationCell } from '@/components/common/table-row-evaluation-cell';
import { TableRowFieldGroupCell } from '@/components/common/table-row-field-group-cell';
import { TableRowFileCell } from '@/components/common/table-row-file-cell';
import { TableRowReactionCell } from '@/components/common/table-row-reaction-cell';
import { TableRowRelationshipCell } from '@/components/common/table-row-relationship-cell';
import { TableRowTextLongCell } from '@/components/common/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/table-row-text-short-cell';
import { TableRowUserCell } from '@/components/common/table-row-user-cell';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow } from '@/lib/interfaces';

interface RowViewProps {
  data: IRow;
  fields: Array<IField>;
  tableSlug: string;
}

export function RowView({
  data,
  fields,
  tableSlug,
}: RowViewProps): React.JSX.Element {
  const renderFieldValue = (field: IField): React.JSX.Element => {
    switch (field.type) {
      case E_FIELD_TYPE.TEXT_SHORT:
        return (
          <TableRowTextShortCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.TEXT_LONG:
        return (
          <TableRowTextLongCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.DATE:
        return (
          <TableRowDateCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.DROPDOWN:
        return (
          <TableRowDropdownCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.FILE:
        return (
          <TableRowFileCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.RELATIONSHIP:
        return (
          <TableRowRelationshipCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.CATEGORY:
        return (
          <TableRowCategoryCell
            row={data}
            field={field}
          />
        );
      case E_FIELD_TYPE.EVALUATION:
        return (
          <TableRowEvaluationCell
            row={data}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.REACTION:
        return (
          <TableRowReactionCell
            row={data}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.FIELD_GROUP:
        return (
          <TableRowFieldGroupCell
            row={data}
            field={field}
            tableSlug={tableSlug}
          />
        );
      case E_FIELD_TYPE.USER:
        return (
          <TableRowUserCell
            row={data}
            field={field}
          />
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            {data[field.slug] ?? '-'}
          </p>
        );
    }
  };

  return (
    <section className="space-y-4 p-2">
      {fields.map((field) => (
        <div
          key={field._id}
          className="space-y-1"
        >
          <p className="text-sm font-medium">{field.name}</p>
          {renderFieldValue(field)}
        </div>
      ))}

      {/* Informações do registro */}
      {data.trashed && (
        <div className="rounded-md border border-amber-500 p-3 bg-amber-50">
          <p className="text-sm text-amber-700">
            Este registro está na lixeira
          </p>
        </div>
      )}
    </section>
  );
}
