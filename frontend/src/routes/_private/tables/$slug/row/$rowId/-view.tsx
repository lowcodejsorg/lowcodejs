import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftRightIcon,
} from 'lucide-react';
import React from 'react';

import { DataTable } from '@/components/common/data-table';
import { TableRowCategoryCell } from '@/components/common/dynamic-table/table-cells/table-row-category-cell';
import { TableRowDateCell } from '@/components/common/dynamic-table/table-cells/table-row-date-cell';
import { TableRowDropdownCell } from '@/components/common/dynamic-table/table-cells/table-row-dropdown-cell';
import { TableRowEvaluationCell } from '@/components/common/dynamic-table/table-cells/table-row-evaluation-cell';
import { TableRowFieldGroupCell } from '@/components/common/dynamic-table/table-cells/table-row-field-group-cell';
import { TableRowFileCell } from '@/components/common/dynamic-table/table-cells/table-row-file-cell';
import { TableRowReactionCell } from '@/components/common/dynamic-table/table-cells/table-row-reaction-cell';
import { TableRowRelationshipCell } from '@/components/common/dynamic-table/table-cells/table-row-relationship-cell';
import { TableRowTextLongCell } from '@/components/common/dynamic-table/table-cells/table-row-text-long-cell';
import { TableRowTextShortCell } from '@/components/common/dynamic-table/table-cells/table-row-text-short-cell';
import { TableRowUserCell } from '@/components/common/dynamic-table/table-cells/table-row-user-cell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDataTable } from '@/hooks/use-data-table';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, ITable } from '@/lib/interfaces';

interface RowViewProps {
  data: IRow;
  fields: Array<IField>;
  tableSlug: string;
  table?: ITable;
}

function renderCell(
  field: IField,
  row: IRow,
  tableSlug: string,
): React.JSX.Element {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
      return (
        <TableRowTextShortCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.TEXT_LONG:
      return (
        <TableRowTextLongCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.DATE:
      return (
        <TableRowDateCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.DROPDOWN:
      return (
        <TableRowDropdownCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.FILE:
      return (
        <TableRowFileCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.RELATIONSHIP:
      return (
        <TableRowRelationshipCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.CATEGORY:
      return (
        <TableRowCategoryCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.EVALUATION:
      return (
        <TableRowEvaluationCell
          row={row}
          field={field}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.REACTION:
      return (
        <TableRowReactionCell
          row={row}
          field={field}
          tableSlug={tableSlug}
        />
      );
    case E_FIELD_TYPE.USER:
      return (
        <TableRowUserCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.IDENTIFIER:
      return (
        <TableRowTextShortCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.CREATOR:
      return (
        <TableRowUserCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.CREATED_AT:
    case E_FIELD_TYPE.TRASHED_AT:
      return (
        <TableRowDateCell
          row={row}
          field={field}
        />
      );
    case E_FIELD_TYPE.TRASHED:
      return (
        <TableRowTextShortCell
          row={row}
          field={field}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          {String(row[field.slug] ?? '-')}
        </p>
      );
  }
}

export function RowView({
  data,
  fields,
  tableSlug,
  table,
}: RowViewProps): React.JSX.Element {
  const [sortState, setSortState] = React.useState<
    Record<string, 'asc' | 'desc' | undefined>
  >({});

  const visibleFields = React.useMemo(
    () => fields.filter((f) => f.showInDetail),
    [fields],
  );

  const mainFields = React.useMemo(
    () => visibleFields.filter((f) => f.type !== E_FIELD_TYPE.FIELD_GROUP),
    [visibleFields],
  );

  const groupFields = React.useMemo(
    () => visibleFields.filter((f) => f.type === E_FIELD_TYPE.FIELD_GROUP),
    [visibleFields],
  );

  const columns = React.useMemo((): Array<ColumnDef<IRow, any>> => {
    return mainFields.map((field) => ({
      id: field._id,
      accessorFn: (row) => row[field.slug],
      size: field.widthInList ?? undefined,
      header: (): React.JSX.Element => {
        const currentSort = sortState[field._id];
        return (
          <div className="inline-flex items-center">
            <Button
              className="h-auto px-2 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent cursor-default"
              variant="link"
            >
              {field.name}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-auto px-1 py-1 border-none shadow-none bg-transparent hover:bg-transparent dark:bg-transparent"
                  variant="outline"
                  size="sm"
                >
                  {currentSort === 'asc' && <ArrowUpIcon className="size-4" />}
                  {currentSort === 'desc' && (
                    <ArrowDownIcon className="size-4" />
                  )}
                  {!currentSort && (
                    <ChevronsLeftRightIcon className="size-4 rotate-90" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    setSortState((prev) => ({ ...prev, [field._id]: 'asc' }))
                  }
                >
                  <ArrowUpIcon />
                  <span>Crescente</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setSortState((prev) => ({ ...prev, [field._id]: 'desc' }))
                  }
                >
                  <ArrowDownIcon />
                  <span>Decrescente</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      cell: ({ row }) => renderCell(field, row.original, tableSlug),
    }));
  }, [mainFields, tableSlug, sortState]);

  const tableInstance = useDataTable({
    data: [data],
    columns,
    getRowId: (row) => row._id,
  });

  return (
    <section
      className="flex flex-col overflow-auto"
      data-test-id="row-detail-view"
    >
      <DataTable
        table={tableInstance}
        enableColumnDragging
      />

      {data.trashed && (
        <div className="rounded-md border border-amber-500 p-3 bg-amber-50 m-2">
          <p className="text-sm text-amber-700">
            Este registro está na lixeira
          </p>
        </div>
      )}

      {groupFields.length > 0 && (
        <div className="flex flex-col gap-6 pt-4 border-t">
          {groupFields.map((field) => (
            <TableRowFieldGroupCell
              key={field._id}
              row={data}
              field={field}
              tableSlug={tableSlug}
              table={table}
              variant="detail"
            />
          ))}
        </div>
      )}
    </section>
  );
}
