import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter, useSearch } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArchiveRestoreIcon,
  ArrowRightIcon,
  EllipsisIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import React from 'react';

import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useReadTable } from '@/hooks/tanstack-query/use-table-read';
import { useDataTable } from '@/hooks/use-data-table';
import { useFieldColumns } from '@/hooks/use-field-columns';
import { useTablePermission } from '@/hooks/use-table-permission';
import { API } from '@/lib/api';
import type { IField, IRow } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';

function RowActionsCell({
  row,
  slug,
  canUpdateRow,
  canRemoveRow,
}: {
  row: IRow;
  slug: string;
  canUpdateRow: boolean;
  canRemoveRow: boolean;
}): React.JSX.Element {
  const [dialogType, setDialogType] = React.useState<
    'trash' | 'restore' | 'delete' | null
  >(null);

  const trashMutation = useMutation({
    mutationFn: async () => {
      await API.patch(`/tables/${slug}/rows/${row._id}/trash`);
    },
    onSuccess() {
      setDialogType(null);
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess('Registro enviado para lixeira!');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      await API.patch(`/tables/${slug}/rows/${row._id}/restore`);
    },
    onSuccess() {
      setDialogType(null);
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess('Registro restaurado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await API.delete(`/tables/${slug}/rows/${row._id}`);
    },
    onSuccess() {
      setDialogType(null);
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess('Registro excluido permanentemente!');
    },
  });

  const activeMutation =
    dialogType === 'trash'
      ? trashMutation
      : dialogType === 'restore'
        ? restoreMutation
        : deleteMutation;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        dir="ltr"
        modal={false}
      >
        <DropdownMenuTrigger className="p-1 rounded-full">
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="mr-10">
          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              (row.trashed || !canUpdateRow) && 'hidden',
            )}
            onClick={() => setDialogType('trash')}
          >
            <TrashIcon className="size-4" />
            <span>Enviar para lixeira</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              (!row.trashed || !canUpdateRow) && 'hidden',
            )}
            onClick={() => setDialogType('restore')}
          >
            <ArchiveRestoreIcon className="size-4" />
            <span>Restaurar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              (!row.trashed || !canRemoveRow) && 'hidden',
            )}
            onClick={() => setDialogType('delete')}
          >
            <Trash2Icon className="size-4" />
            <span>Excluir permanentemente</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        modal
        open={dialogType !== null}
        onOpenChange={(open) => {
          if (!open) setDialogType(null);
        }}
      >
        <DialogContent className="py-4 px-6">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'trash' && 'Enviar para lixeira'}
              {dialogType === 'restore' && 'Restaurar da lixeira'}
              {dialogType === 'delete' && 'Excluir permanentemente'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'trash' &&
                'Ao confirmar essa acao, o registro sera enviado para a lixeira.'}
              {dialogType === 'restore' &&
                'Ao confirmar essa acao, o registro sera restaurado da lixeira.'}
              {dialogType === 'delete' &&
                'Ao confirmar essa acao, o registro sera excluido permanentemente. Essa acao nao pode ser desfeita.'}
            </DialogDescription>
          </DialogHeader>
          <section>
            <form className="pt-4 pb-2">
              <DialogFooter className="inline-flex w-full gap-2 justify-end">
                <DialogClose asChild>
                  <Button className="bg-destructive hover:bg-destructive">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={activeMutation.status === 'pending'}
                  onClick={() => activeMutation.mutateAsync()}
                >
                  {activeMutation.status === 'pending' && (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  )}
                  {activeMutation.status !== 'pending' && (
                    <span>Confirmar</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </section>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TableListViewProps {
  data: Array<IRow>;
  headers: Array<IField>;
  order: Array<string>;
}

export function TableListView({
  data,
  headers,
  order,
}: TableListViewProps): React.ReactElement {
  const router = useRouter();
  const { slug } = useParams({ from: '/_private/tables/$slug/' });
  const search = useSearch({ from: '/_private/tables/$slug/' });
  const isTrashView = search.trashed === true;

  const table_ = useReadTable({ slug });
  const permission = useTablePermission(table_.data);

  const canCreateField = permission.can('CREATE_FIELD');
  const canEditField = permission.can('UPDATE_FIELD');
  const canTrashRow = permission.can('UPDATE_ROW');
  const canRemoveRow = permission.can('REMOVE_ROW');

  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const fieldColumns = useFieldColumns({
    fields: headers,
    fieldOrder: order,
    tableSlug: slug,
    canEditField,
  });

  const columns = React.useMemo(() => {
    const cols: Array<ColumnDef<IRow, any>> = [];

    if (canTrashRow) {
      cols.push({
        id: '_select',
        enableHiding: false,
        enableResizing: false,
        size: 40,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={`Selecionar registro ${row.id}`}
            />
          </div>
        ),
      });
    }

    cols.push(...fieldColumns);

    if (canTrashRow || canRemoveRow) {
      cols.push({
        id: '_actions',
        enableHiding: false,
        enableResizing: false,
        size: 80,
        header: canCreateField
          ? (): React.ReactElement => (
              <Button
                variant="outline"
                className="cursor-pointer size-6"
                onClick={() => {
                  router.navigate({
                    to: '/tables/$slug/field/create',
                    replace: true,
                    params: { slug },
                  });
                }}
              >
                <PlusIcon className="size-4" />
              </Button>
            )
          : undefined,
        cell: ({ row }) => (
          <RowActionsCell
            row={row.original}
            slug={slug}
            canUpdateRow={canTrashRow}
            canRemoveRow={canRemoveRow}
          />
        ),
      });
    }

    if (!(canTrashRow || canRemoveRow) && canCreateField) {
      cols.push({
        id: '_create_field',
        enableHiding: false,
        enableResizing: false,
        size: 50,
        header: () => (
          <Button
            variant="outline"
            className="cursor-pointer size-6"
            onClick={() => {
              router.navigate({
                to: '/tables/$slug/field/create',
                replace: true,
                params: { slug },
              });
            }}
          >
            <PlusIcon className="size-4" />
          </Button>
        ),
        cell: () => null,
      });
    } else if (!(canTrashRow || canRemoveRow)) {
      cols.push({
        id: '_navigate',
        enableHiding: false,
        enableResizing: false,
        size: 50,
        cell: () => (
          <Button
            variant="ghost"
            size="icon-sm"
          >
            <ArrowRightIcon />
          </Button>
        ),
      });
    }

    return cols;
  }, [canTrashRow, canRemoveRow, canCreateField, fieldColumns, router, slug]);

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    enableRowSelection: canTrashRow,
    enableColumnResizing: true,
    persistKey: `list-view:${slug}`,
    initialColumnPinning: {
      left: canTrashRow ? ['_select'] : [],
      right: [
        canTrashRow || canRemoveRow
          ? '_actions'
          : canCreateField
            ? '_create_field'
            : '_navigate',
      ],
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((r) => r.id);

  const bulkTrash = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const route = '/tables/'.concat(slug).concat('/rows/bulk-trash');
      const response = await API.patch<{ modified: number }>(route, { ids });
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess(
        result.modified === 1
          ? '1 registro enviado para lixeira!'
          : `${result.modified} registros enviados para lixeira!`,
        'Os registros foram movidos para a lixeira',
      );
    },
  });

  const bulkRestore = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const route = '/tables/'.concat(slug).concat('/rows/bulk-restore');
      const response = await API.patch<{ modified: number }>(route, { ids });
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess(
        result.modified === 1
          ? '1 registro restaurado!'
          : `${result.modified} registros restaurados!`,
        'Os registros foram restaurados da lixeira',
      );
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const route = '/tables/'.concat(slug).concat('/rows/bulk-delete');
      const response = await API.delete<{ deleted: number }>(route, {
        data: { ids },
      });
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.rows.lists(slug),
      });
      toastSuccess(
        result.deleted === 1
          ? '1 registro excluído permanentemente!'
          : `${result.deleted} registros excluídos permanentemente!`,
      );
    },
  });

  const [dialogAction, setDialogAction] = React.useState<
    'trash' | 'restore' | 'delete'
  >('trash');

  return (
    <div data-test-id="table-list-view">
      <DataTable
        table={table}
        enableVirtualization
        enableColumnDragging
        enableKeyboardNavigation
        onRowClick={(row) => {
          router.navigate({
            to: '/tables/$slug/row/$rowId',
            params: { slug, rowId: row._id },
          });
        }}
      />

      {selectedCount > 0 && (
        <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">
            {selectedCount === 1
              ? '1 registro selecionado'
              : `${selectedCount} registros selecionados`}
          </span>
          {isTrashView ? (
            <React.Fragment>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDialogAction('restore');
                  setShowConfirmDialog(true);
                }}
              >
                <ArchiveRestoreIcon className="size-4" />
                <span>Restaurar</span>
              </Button>
              {canRemoveRow && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDialogAction('delete');
                    setShowConfirmDialog(true);
                  }}
                >
                  <Trash2Icon className="size-4" />
                  <span>Excluir permanentemente</span>
                </Button>
              )}
            </React.Fragment>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDialogAction('trash');
                setShowConfirmDialog(true);
              }}
            >
              <Trash2Icon className="size-4" />
              <span>Enviar para lixeira</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => table.resetRowSelection()}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      )}

      <Dialog
        modal
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      >
        <DialogContent className="py-4 px-6">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'trash' && 'Enviar registros para a lixeira'}
              {dialogAction === 'restore' && 'Restaurar registros da lixeira'}
              {dialogAction === 'delete' && 'Excluir registros permanentemente'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'trash' &&
                (selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 registro será enviado para a lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} registros serão enviados para a lixeira.`)}
              {dialogAction === 'restore' &&
                (selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 registro será restaurado da lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} registros serão restaurados da lixeira.`)}
              {dialogAction === 'delete' &&
                (selectedCount === 1
                  ? 'Essa ação é irreversível. 1 registro será excluído permanentemente.'
                  : `Essa ação é irreversível. ${selectedCount} registros serão excluídos permanentemente.`)}
            </DialogDescription>
          </DialogHeader>
          <section>
            <form className="pt-4 pb-2">
              <DialogFooter className="inline-flex w-full gap-2 justify-end">
                <DialogClose asChild>
                  <Button className="bg-destructive hover:bg-destructive">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={
                    bulkTrash.status === 'pending' ||
                    bulkRestore.status === 'pending' ||
                    bulkDelete.status === 'pending'
                  }
                  onClick={() => {
                    if (dialogAction === 'trash') {
                      bulkTrash.mutateAsync(selectedIds);
                    }
                    if (dialogAction === 'restore') {
                      bulkRestore.mutateAsync(selectedIds);
                    }
                    if (dialogAction === 'delete') {
                      bulkDelete.mutateAsync(selectedIds);
                    }
                  }}
                >
                  {(bulkTrash.status === 'pending' ||
                    bulkRestore.status === 'pending' ||
                    bulkDelete.status === 'pending') && (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  )}
                  {!(
                    bulkTrash.status === 'pending' ||
                    bulkRestore.status === 'pending' ||
                    bulkDelete.status === 'pending'
                  ) && <span>Confirmar</span>}
                </Button>
              </DialogFooter>
            </form>
          </section>
        </DialogContent>
      </Dialog>
    </div>
  );
}
