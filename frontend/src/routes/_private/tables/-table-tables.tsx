import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArchiveRestoreIcon,
  EllipsisIcon,
  ImageOffIcon,
  TrashIcon,
} from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import { TableDeleteDialog } from './-delete-dialog';
import { TableRemoveFromTrashDialog } from './-remove-from-trash-dialog';
import { TableSendToTrashDialog } from './-send-to-trash-dialog';

import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataTable } from '@/hooks/use-data-table';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_VISIBILITY } from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';
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
  [E_TABLE_VISIBILITY.PUBLIC]: { label: 'Publica', variant: 'outline' },
  [E_TABLE_VISIBILITY.FORM]: { label: 'Formulario', variant: 'secondary' },
};

function ActionsCell({ table }: { table: ITable }): React.JSX.Element {
  const tableDeleteButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const tableRemoveFromTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );
  const tableSendToTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );

  const permission = useTablePermission(table);

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
              !table.trashed && 'hidden',
              !permission.can('REMOVE_TABLE') && 'hidden',
            )}
            onClick={() => tableDeleteButtonRef.current?.click()}
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

      <TableDeleteDialog
        ref={tableDeleteButtonRef}
        slug={table.slug}
      />
      <TableRemoveFromTrashDialog
        ref={tableRemoveFromTrashButtonRef}
        slug={table.slug}
      />
      <TableSendToTrashDialog
        ref={tableSendToTrashButtonRef}
        slug={table.slug}
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
    cell: ({ getValue }) => (
      <code className="text-sm text-muted-foreground">
        /{getValue() as string}
      </code>
    ),
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: 'Visibilidade',
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
    header: 'Criado por',
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
}

export function TableTables({
  data,
  toolbarPortal,
}: Props): React.ReactElement {
  const sidebar = useSidebar();
  const router = useRouter();

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    enableColumnResizing: true,
    persistKey: 'admin:tables',
    initialColumnPinning: {
      right: ['actions'],
    },
  });

  return (
    <>
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
    </>
  );
}
