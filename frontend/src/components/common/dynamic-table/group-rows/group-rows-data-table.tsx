import { useQuery } from '@tanstack/react-query';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { TableRowCategoryCell } from '../table-cells/table-row-category-cell';
import { TableRowDateCell } from '../table-cells/table-row-date-cell';
import { TableRowDropdownCell } from '../table-cells/table-row-dropdown-cell';
import { TableRowFileCell } from '../table-cells/table-row-file-cell';
import { TableRowRelationshipCell } from '../table-cells/table-row-relationship-cell';
import { TableRowTextLongCell } from '../table-cells/table-row-text-long-cell';
import { TableRowTextShortCell } from '../table-cells/table-row-text-short-cell';
import { TableRowUserCell } from '../table-cells/table-row-user-cell';

import { GroupRowDeleteDialog } from './group-row-delete-dialog';
import { GroupRowFormDialog } from './group-row-form-dialog';

import { ExportCsvButton } from '@/components/common/export-csv-button';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { groupRowListOptions } from '@/hooks/tanstack-query/_query-options';
import { useGroupRowsExportCsv } from '@/hooks/tanstack-query/use-group-rows-export-csv';
import { E_FIELD_TYPE, E_ROLE } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type {
  IField,
  IGroupConfiguration,
  IRow,
  ITable,
} from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

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

  const auth = useAuthStore();
  const canExportCsv =
    auth.user?.group?.slug === E_ROLE.MASTER ||
    auth.user?.group?.slug === E_ROLE.ADMINISTRATOR;
  const exportCsv = useGroupRowsExportCsv({
    onError(error) {
      handleApiError(error, { context: 'Erro ao exportar CSV' });
    },
  });

  const formFields = React.useMemo(
    () =>
      group?.fields.filter(
        (f): f is IField =>
          !!f && f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.trashed,
      ) ?? [],
    [group],
  );

  const columnFields = React.useMemo(
    () => formFields.filter((f) => f.showInList),
    [formFields],
  );

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
    <div
      data-slot="group-rows-data-table"
      data-test-id="group-rows-table"
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium ml-2">{field.name}</span>
        <div className="inline-flex items-center gap-2">
          {canExportCsv && groupSlug && items.length > 0 && (
            <ExportCsvButton
              testId="export-group-rows-csv-btn"
              isPending={exportCsv.isPending}
              onClick={() =>
                exportCsv.mutate({
                  slug: tableSlug,
                  rowId,
                  groupSlug,
                })
              }
            />
          )}
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
      </div>

      <div className="w-full overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {columnFields.map((gf) => (
                <th
                  key={gf._id}
                  className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                >
                  {gf.name}
                </th>
              ))}
              <th className="w-20 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columnFields.length + 1}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum item encontrado
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item._id}
                className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setEditItem(item);
                  setFormOpen(true);
                }}
              >
                {columnFields.map((gf) => (
                  <td
                    key={gf._id}
                    className="px-4 py-2"
                  >
                    <RenderGroupCell
                      field={gf}
                      row={item}
                    />
                  </td>
                ))}
                <td
                  className="w-20 px-4 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditItem(item);
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
                        setDeleteItem(item);
                      }}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GroupRowFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditItem(null);
        }}
        tableSlug={tableSlug}
        rowId={rowId}
        groupSlug={groupSlug}
        groupFields={formFields}
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
    case E_FIELD_TYPE.CREATOR:
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
    case E_FIELD_TYPE.CREATED_AT:
      return (
        <TableRowDateCell
          field={field}
          row={row}
        />
      );
    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
