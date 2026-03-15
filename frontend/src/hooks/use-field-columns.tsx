import { useParams, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
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

const ROUTE_ID = '/_private/tables/$slug/';

function RenderCell({
  field,
  row,
  tableSlug,
}: {
  field: IField;
  row: IRow;
  tableSlug: string;
}): React.JSX.Element {
  if (!field || !(field.slug in row)) {
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
          className="max-w-sm truncate"
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
    case E_FIELD_TYPE.FIELD_GROUP:
      return (
        <TableRowFieldGroupCell
          field={field}
          row={row}
          tableSlug={tableSlug}
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
    case E_FIELD_TYPE.USER:
      return (
        <TableRowUserCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.IDENTIFIER:
      return (
        <TableRowTextShortCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.CREATOR:
      return (
        <TableRowUserCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.CREATED_AT:
    case E_FIELD_TYPE.TRASHED_AT:
      return (
        <TableRowDateCell
          field={field}
          row={row}
        />
      );
    case E_FIELD_TYPE.TRASHED:
      return (
        <TableRowTextShortCell
          field={field}
          row={row}
        />
      );
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}

interface UseFieldColumnsOptions {
  fields: Array<IField>;
  fieldOrder: Array<string>;
  tableSlug: string;
  canEditField: boolean;
}

export function useFieldColumns({
  fields,
  fieldOrder,
  tableSlug,
  canEditField,
}: UseFieldColumnsOptions): Array<ColumnDef<IRow, any>> {
  const router = useRouter();
  const { slug } = useParams({ from: ROUTE_ID });

  return React.useMemo(() => {
    const sorted = fields
      .filter((f) => f.showInList && !f.trashed)
      .sort((a, b) => {
        const idxA = fieldOrder.indexOf(a._id);
        const idxB = fieldOrder.indexOf(b._id);
        return (
          (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB)
        );
      });

    return sorted.map(
      (field): ColumnDef<IRow, any> => ({
        id: field._id,
        accessorFn: (row) => row[field.slug],
        meta: { label: field.name, field },
        size: field.widthInList ?? undefined,
        header: () => (
          <DataTableColumnHeader
            title={field.name}
            orderKey={
              field.type !== E_FIELD_TYPE.FIELD_GROUP
                ? 'order-'.concat(field.slug)
                : undefined
            }
            routeId={ROUTE_ID}
            canNavigate={canEditField}
            onTitleClick={
              canEditField
                ? (): void => {
                    router.navigate({
                      to: '/tables/$slug/field/$fieldId',
                      params: { fieldId: field._id, slug },
                    });
                  }
                : undefined
            }
          />
        ),
        cell: ({ row }) => (
          <RenderCell
            field={field}
            row={row.original}
            tableSlug={tableSlug}
          />
        ),
      }),
    );
  }, [fields, fieldOrder, tableSlug, canEditField, router, slug]);
}
