import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { DataTable } from './data-table/data-table';
import { GroupRowDeleteDialog } from './group-row-delete-dialog';
import { GroupRowFormDialog } from './group-row-form-dialog';
import { TableRowCategoryCell } from './table-row-category-cell';
import { TableRowDateCell } from './table-row-date-cell';
import { TableRowDropdownCell } from './table-row-dropdown-cell';
import { TableRowFileCell } from './table-row-file-cell';
import { TableRowRelationshipCell } from './table-row-relationship-cell';
import { TableRowTextLongCell } from './table-row-text-long-cell';
import { TableRowTextShortCell } from './table-row-text-short-cell';
import { TableRowUserCell } from './table-row-user-cell';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { groupRowListOptions } from '@/hooks/tanstack-query/_query-options';
import { useDataTable } from '@/hooks/use-data-table';
import { E_FIELD_TYPE } from '@/lib/constant';
import type {
  IField,
  IGroupConfiguration,
  IRow,
  ITable,
} from '@/lib/interfaces';

interface GroupRowsDataTableProps {
  tableSlug: string;
  rowId: string;
  field: IField;
  table: ITable;
}

export function GroupRowsDataTable({
  tableSlug,
  rowId,
  field,
  table,
}: GroupRowsDataTableProps): React.JSX.Element {
  const groupSlug = field.group?.slug;

  const group: IGroupConfiguration | undefined = table.groups?.find(
    (g) => g?.slug === groupSlug,
  );

  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<IRow | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<IRow | null>(null);

  const { data: items = [], status } = useQuery(
    groupRowListOptions(tableSlug, rowId, groupSlug ?? ''),
  );

  const groupFields = React.useMemo(
    () =>
      group?.fields.filter(
        (f): f is IField =>
          !!f && f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.trashed && !f.native,
      ) ?? [],
    [group],
  );

  const columns = React.useMemo<Array<ColumnDef<IRow, any>>>(
    () => [
      ...groupFields.map(
        (gf): ColumnDef<IRow, any> => ({
          id: gf._id,
          accessorFn: (row) => row[gf.slug],
          header: () => <span className="text-xs font-medium">{gf.name}</span>,
          cell: ({ row }) => (
            <RenderGroupCell
              field={gf}
              row={row.original}
            />
          ),
        }),
      ),
      {
        id: '_actions',
        size: 80,
        enableHiding: false,
        enableResizing: false,
        header: () => <span className="text-xs font-medium">Ações</span>,
        cell: ({ row }): React.JSX.Element => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditItem(row.original);
                setFormOpen(true);
              }}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteItem(row.original);
              }}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [groupFields],
  );

  const dataTable = useDataTable({
    data: items,
    columns,
    getRowId: (row) => row._id,
  });

  if (!groupSlug || !group) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium ml-2">{field.name}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditItem(null);
            setFormOpen(true);
          }}
          disabled={field.multiple === false && items.length >= 1}
        >
          <PlusIcon className="size-4" />
          <span>Adicionar item</span>
        </Button>
      </div>

      <DataTable
        table={dataTable}
        stickyHeader={false}
        emptyMessage="Nenhum item encontrado"
        onRowClick={(row) => {
          setEditItem(row);
          setFormOpen(true);
        }}
      />

      <GroupRowFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
        tableSlug={tableSlug}
        rowId={rowId}
        groupSlug={groupSlug}
        groupFields={groupFields}
        editItem={editItem}
      />

      {deleteItem && (
        <GroupRowDeleteDialog
          open={Boolean(deleteItem)}
          onOpenChange={(open) => {
            if (!open) setDeleteItem(null);
          }}
          tableSlug={tableSlug}
          rowId={rowId}
          groupSlug={groupSlug}
          itemId={deleteItem._id}
        />
      )}
    </div>
  );
}

function RenderGroupCell({
  field,
  row,
}: {
  field: IField;
  row: IRow;
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
    case E_FIELD_TYPE.USER:
      return (
        <TableRowUserCell
          field={field}
          row={row}
        />
      );
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
