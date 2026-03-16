import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataTable } from '@/hooks/use-data-table';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const ROUTE_ID = '/_private/menus/';

const TypeMapper = {
  [E_MENU_ITEM_TYPE.PAGE]: 'Pagina',
  [E_MENU_ITEM_TYPE.TABLE]: 'Tabela',
  [E_MENU_ITEM_TYPE.FORM]: 'Formulario',
  [E_MENU_ITEM_TYPE.EXTERNAL]: 'Link Externo',
  [E_MENU_ITEM_TYPE.SEPARATOR]: 'Separador',
};

const columns: Array<ColumnDef<IMenu, any>> = [
  {
    id: 'name',
    accessorKey: 'name',
    meta: { label: 'Nome' },
    header: () => (
      <DataTableColumnHeader
        title="Nome"
        orderKey="order-name"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    meta: { label: 'Slug' },
    header: () => (
      <DataTableColumnHeader
        title="Slug"
        orderKey="order-slug"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    id: 'type',
    accessorKey: 'type',
    meta: { label: 'Tipo' },
    header: () => (
      <DataTableColumnHeader
        title="Tipo"
        orderKey="order-type"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement => {
      const type = getValue() as string;
      return (
        <Badge
          className={cn(
            'font-semibold border-transparent',
            type === E_MENU_ITEM_TYPE.PAGE && 'bg-green-100 text-green-700',
            type === E_MENU_ITEM_TYPE.TABLE && 'bg-yellow-100 text-yellow-700',
            type === E_MENU_ITEM_TYPE.FORM && 'bg-blue-100 text-blue-700',
            type === E_MENU_ITEM_TYPE.EXTERNAL &&
              'bg-violet-100 text-violet-700',
            type === E_MENU_ITEM_TYPE.SEPARATOR && 'bg-gray-100 text-gray-700',
          )}
        >
          {TypeMapper[type as keyof typeof TypeMapper] || 'N/A'}
        </Badge>
      );
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
    cell: () => (
      <Button
        variant="ghost"
        size="icon-sm"
      >
        <ArrowRightIcon />
      </Button>
    ),
  },
];

interface TableMenusProps {
  data: Array<IMenu>;
  toolbarPortal: HTMLDivElement | null;
}

export function TableMenus({
  data,
  toolbarPortal,
}: TableMenusProps): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    persistKey: 'admin:menus',
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
        onRowClick={(menu) => {
          sidebar.setOpen(false);
          router.navigate({
            to: '/menus/$menuId',
            params: { menuId: menu._id },
          });
        }}
        emptyMessage="Nenhum item de menu encontrado"
      />
    </>
  );
}
