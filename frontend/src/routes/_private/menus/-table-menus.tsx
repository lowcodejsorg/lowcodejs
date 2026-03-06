import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataTable } from '@/hooks/use-data-table';
import { E_MENU_ITEM_TYPE } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

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
    header: 'Nome',
    meta: { label: 'Nome' },
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    header: 'Slug',
    meta: { label: 'Slug' },
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Tipo',
    meta: { label: 'Tipo' },
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
