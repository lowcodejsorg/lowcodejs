import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArchiveRestoreIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  EyeIcon,
  ImageOffIcon,
  LoaderCircleIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import { TableExportDialog } from './-export-dialog';

import { ActionDialog } from '@/components/common/action-dialog';
import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { PermanentDeleteConfirmDialog } from '@/components/common/permanent-delete-confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useSidebar } from '@/components/ui/sidebar';
import { queryKeys } from '@/hooks/tanstack-query/_query-keys';
import { useDataTable } from '@/hooks/use-data-table';
import {
  usePermission,
  useTablePermission,
} from '@/hooks/use-table-permission';
import { API } from '@/lib/api';
import { E_TABLE_VISIBILITY } from '@/lib/constant';
import { handleApiError } from '@/lib/handle-api-error';
import type { ITable } from '@/lib/interfaces';
import { QueryClient } from '@/lib/query-client';
import { toastInfo, toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';

const ROUTE_ID = '/_private/tables/';

const VISIBILITY_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
  }
> = {
  [E_TABLE_VISIBILITY.PRIVATE]: { label: 'Privada', variant: 'destructive' },
  [E_TABLE_VISIBILITY.RESTRICTED]: { label: 'Restrita', variant: 'secondary' },
  [E_TABLE_VISIBILITY.OPEN]: { label: 'Aberta', variant: 'default' },
  [E_TABLE_VISIBILITY.PUBLIC]: { label: 'Pública', variant: 'outline' },
  [E_TABLE_VISIBILITY.FORM]: { label: 'Formulário', variant: 'secondary' },
};

function ActionsCell({ table }: { table: ITable }): React.JSX.Element {
  const tableRemoveFromTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );
  const tableSendToTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );
  const tableExportButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const permission = useTablePermission(table);
  const router = useRouter();
  const sidebar = useSidebar();
  const [hardDeleteOpen, setHardDeleteOpen] = React.useState(false);

  const hardDelete = useMutation({
    mutationFn: async function () {
      await API.delete('/tables/'.concat(table.slug));
    },
    onSuccess() {
      setHardDeleteOpen(false);
      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(table.slug),
      });
      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });
      toastSuccess(
        'Tabela excluída permanentemente!',
        'A tabela foi excluída permanentemente',
      );
      router.navigate({
        to: '/tables',
        replace: true,
        search: { page: 1, perPage: 50 },
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao excluir tabela' });
    },
  });

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
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full cursor-pointer"
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug',
                params: { slug: table.slug },
              });
            }}
          >
            <EyeIcon className="size-4" />
            <span>Visualizar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              !permission.can('UPDATE_TABLE') && 'hidden',
            )}
            onClick={() => {
              sidebar.setOpen(false);
              router.navigate({
                to: '/tables/$slug/detail',
                params: { slug: table.slug },
              });
            }}
          >
            <PencilIcon className="size-4" />
            <span>Editar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full cursor-pointer"
            onClick={() => {
              const url = `${window.location.origin}/tables/${table.slug}`;
              navigator.clipboard.writeText(url);
              toastInfo('Link da tabela copiado');
            }}
          >
            <Share2Icon className="size-4" />
            <span>Compartilhar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              table.trashed && 'hidden',
            )}
            onClick={() => tableExportButtonRef.current?.click()}
          >
            <DownloadIcon className="size-4" />
            <span>Exportar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              !table.trashed && 'hidden',
              !permission.can('REMOVE_TABLE') && 'hidden',
            )}
            onClick={() => setHardDeleteOpen(true)}
          >
            <TrashIcon className="size-4" />
            <span>Excluir</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              !table.trashed && 'hidden',
              !permission.can('UPDATE_TABLE') && 'hidden',
            )}
            onClick={() => tableRemoveFromTrashButtonRef.current?.click()}
          >
            <ArchiveRestoreIcon className="size-4" />
            <span>Restaurar</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'inline-flex space-x-1 w-full cursor-pointer',
              table.trashed && 'hidden',
              !permission.can('REMOVE_TABLE') && 'hidden',
            )}
            onClick={() => tableSendToTrashButtonRef.current?.click()}
          >
            <TrashIcon className="size-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TableExportDialog
        ref={tableExportButtonRef}
        slug={table.slug}
        tableName={table.name}
      />
      <PermanentDeleteConfirmDialog
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="Excluir tabela permanentemente"
        description="Essa ação é irreversível. A tabela será excluída permanentemente e não poderá ser recuperada."
        itemsCount={1}
        isPending={hardDelete.isPending}
        onConfirm={() => hardDelete.mutate()}
        testId="delete-table-dialog"
      />
      <ActionDialog
        ref={tableRemoveFromTrashButtonRef}
        config={{
          mutationFn: async function () {
            await API.patch('/tables/'.concat(table.slug).concat('/restore'));
          },
          invalidateKeys: [
            queryKeys.tables.detail(table.slug),
            queryKeys.tables.lists(),
          ],
          toast: {
            title: 'Tabela restaurada!',
            description: 'A tabela foi restaurada da lixeira',
          },
          errorContext: 'Erro ao restaurar tabela da lixeira',
          title: 'Restaurar tabela da lixeira',
          description:
            'Ao confirmar essa ação, a tabela será restaurada da lixeira',
          testId: 'restore-table-dialog',
          confirmTestId: 'restore-table-confirm-btn',
        }}
      />
      <ActionDialog
        ref={tableSendToTrashButtonRef}
        config={{
          mutationFn: async function () {
            await API.patch('/tables/'.concat(table.slug).concat('/trash'));
          },
          invalidateKeys: [
            queryKeys.tables.detail(table.slug),
            queryKeys.tables.lists(),
          ],
          toast: {
            title: 'Tabela enviada para lixeira!',
            description: 'A tabela foi movida para a lixeira',
          },
          navigation: { to: '/tables', search: { page: 1, perPage: 50 } },
          errorContext: 'Erro ao enviar tabela para lixeira',
          title: 'Enviar tabela para a lixeira',
          description:
            'Ao confirmar essa ação, a tabela será enviada para a lixeira',
          testId: 'trash-table-dialog',
          confirmTestId: 'trash-table-confirm-btn',
        }}
      />
    </div>
  );
}

const columns: Array<ColumnDef<ITable, any>> = [
  {
    id: 'name',
    accessorKey: 'name',
    meta: { label: 'Tabela' },
    header: () => (
      <DataTableColumnHeader
        title="Tabela"
        orderKey="order-name"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Avatar className="size-10 rounded-md border">
          <AvatarImage
            src={row.original.logo?.url}
            alt={`Logo da tabela ${row.original.name}`}
            className="object-cover"
          />
          <AvatarFallback className="rounded-md">
            <ImageOffIcon className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <span className="truncate font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    meta: { label: 'Link (slug)' },
    header: () => (
      <DataTableColumnHeader
        title="Link (slug)"
        orderKey="order-link"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement => {
      const slug = getValue() as string;
      return (
        <div className="flex items-center space-x-1">
          <code className="text-sm text-muted-foreground">/{slug}</code>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/tables/${slug}`;
              navigator.clipboard.writeText(url);
              toastInfo('Link da tabela copiado');
            }}
          >
            <CopyIcon className="size-3" />
            <span className="sr-only">Copiar link</span>
          </Button>
        </div>
      );
    },
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: () => (
      <DataTableColumnHeader
        title="Visibilidade"
        orderKey="order-visibility"
        routeId={ROUTE_ID}
      />
    ),
    meta: { label: 'Visibilidade' },
    cell: ({ getValue }): React.ReactElement | null => {
      const visibility = getValue() as string;
      const config = VISIBILITY_CONFIG[visibility];
      return config ? (
        <Badge variant={config.variant}>{config.label}</Badge>
      ) : null;
    },
  },
  {
    id: 'owner',
    accessorFn: (row) => row.owner?.name,
    header: () => (
      <DataTableColumnHeader
        title="Criado por"
        orderKey="order-owner"
        routeId={ROUTE_ID}
      />
    ),
    meta: { label: 'Criado por' },
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    meta: { label: 'Criado em' },
    header: () => (
      <DataTableColumnHeader
        title="Criado em"
        orderKey="order-created-at"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement => {
      const date = getValue() as string | undefined;
      return (
        <span className="text-sm text-muted-foreground">
          {date
            ? format(new Date(date), "dd 'de' MMM 'de' yyyy 'as' HH:mm", {
                locale: ptBR,
              })
            : 'N/A'}
        </span>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    enableResizing: false,
    size: 80,
    cell: ({ row }) => <ActionsCell table={row.original} />,
  },
];

interface Props {
  data: Array<ITable>;
  toolbarPortal: HTMLDivElement | null;
  isTrashView: boolean;
}

export function TableTables({
  data,
  toolbarPortal,
  isTrashView,
}: Props): React.ReactElement {
  const sidebar = useSidebar();
  const router = useRouter();
  const permission = usePermission();
  const canRemoveTable = permission.can('REMOVE_TABLE');
  const canUpdateTable = permission.can('UPDATE_TABLE');
  const canSelect = canRemoveTable || canUpdateTable;

  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [dialogAction, setDialogAction] = React.useState<
    'trash' | 'restore' | 'delete'
  >('trash');

  const allColumns = React.useMemo(() => {
    const cols: Array<ColumnDef<ITable, any>> = [];

    if (canSelect) {
      cols.push({
        id: '_select',
        size: 40,
        enableResizing: false,
        enableHiding: false,
        header: ({ table: t }) => (
          <Checkbox
            checked={
              t.getIsAllPageRowsSelected() ||
              (t.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => t.toggleAllPageRowsSelected(!!value)}
            aria-label="Selecionar todas"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Selecionar linha"
            />
          </div>
        ),
      });
    }

    cols.push(...columns);
    return cols;
  }, [canSelect]);

  const table = useDataTable({
    data,
    columns: allColumns,
    getRowId: (row) => row._id,
    enableRowSelection: canSelect,
    enableColumnResizing: true,
    persistKey: 'admin:tables',
    initialColumnPinning: {
      left: canSelect ? ['_select'] : [],
      right: ['actions'],
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((r) => r.id);

  const bulkTrash = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const response = await API.patch<{ modified: number }>(
        '/tables/bulk-trash',
        { ids },
      );
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });
      toastSuccess(
        result.modified === 1
          ? '1 tabela enviada para lixeira!'
          : `${result.modified} tabelas enviadas para lixeira!`,
        'As tabelas foram movidas para a lixeira',
      );
    },
  });

  const bulkRestore = useMutation({
    mutationFn: async function (ids: Array<string>) {
      const response = await API.patch<{ modified: number }>(
        '/tables/bulk-restore',
        { ids },
      );
      return response.data;
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });
      toastSuccess(
        result.modified === 1
          ? '1 tabela restaurada!'
          : `${result.modified} tabelas restauradas!`,
        'As tabelas foram restauradas da lixeira',
      );
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async function (slugs: Array<string>) {
      let deleted = 0;
      for (const slug of slugs) {
        await API.delete('/tables/'.concat(slug));
        deleted++;
      }
      return { deleted };
    },
    onSuccess(result) {
      setShowConfirmDialog(false);
      table.resetRowSelection();
      QueryClient.invalidateQueries({
        queryKey: queryKeys.tables.lists(),
      });
      toastSuccess(
        result.deleted === 1
          ? '1 tabela excluída permanentemente!'
          : `${result.deleted} tabelas excluídas permanentemente!`,
      );
    },
  });

  const selectedSlugs = selectedRows.map((r) => r.original.slug);

  return (
    <div data-test-id="tables-table">
      {toolbarPortal &&
        createPortal(<DataTableColumnToggle table={table} />, toolbarPortal)}
      <DataTable
        table={table}
        onRowClick={(t) => {
          sidebar.setOpen(false);
          router.navigate({
            to: '/tables/$slug',
            params: { slug: t.slug },
          });
        }}
      />

      {selectedCount > 0 && (
        <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">
            {selectedCount === 1
              ? '1 tabela selecionada'
              : `${selectedCount} tabelas selecionadas`}
          </span>
          {isTrashView ? (
            <React.Fragment>
              {canUpdateTable && (
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
              )}
              {canRemoveTable && (
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
            canRemoveTable && (
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
            )
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
        open={showConfirmDialog && dialogAction !== 'delete'}
        onOpenChange={setShowConfirmDialog}
      >
        <DialogContent className="py-4 px-6">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'trash' && 'Enviar tabelas para a lixeira'}
              {dialogAction === 'restore' && 'Restaurar tabelas da lixeira'}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'trash' &&
                (selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 tabela será enviada para a lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} tabelas serão enviadas para a lixeira.`)}
              {dialogAction === 'restore' &&
                (selectedCount === 1
                  ? 'Ao confirmar essa ação, 1 tabela será restaurada da lixeira.'
                  : `Ao confirmar essa ação, ${selectedCount} tabelas serão restauradas da lixeira.`)}
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
                    bulkRestore.status === 'pending'
                  }
                  onClick={() => {
                    if (dialogAction === 'trash') {
                      bulkTrash.mutateAsync(selectedIds);
                    }
                    if (dialogAction === 'restore') {
                      bulkRestore.mutateAsync(selectedIds);
                    }
                  }}
                >
                  {(bulkTrash.status === 'pending' ||
                    bulkRestore.status === 'pending') && (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  )}
                  {!(
                    bulkTrash.status === 'pending' ||
                    bulkRestore.status === 'pending'
                  ) && <span>Confirmar</span>}
                </Button>
              </DialogFooter>
            </form>
          </section>
        </DialogContent>
      </Dialog>

      <PermanentDeleteConfirmDialog
        open={showConfirmDialog && dialogAction === 'delete'}
        onOpenChange={setShowConfirmDialog}
        title="Excluir tabelas permanentemente"
        description="Essa ação é irreversível. As tabelas selecionadas serão excluídas permanentemente, incluindo seus campos e registros."
        itemsCount={selectedCount}
        isPending={bulkDelete.status === 'pending'}
        onConfirm={() => bulkDelete.mutateAsync(selectedSlugs)}
        testId="bulk-delete-tables-dialog"
      />
    </div>
  );
}
