import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import {
  DataTable,
  DataTableColumnToggle,
} from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataTable } from '@/hooks/use-data-table';
import { USER_GROUP_MAPPER } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

const ROUTE_ID = '/_private/groups/';

interface Props {
  data: Array<IGroup>;
  toolbarPortal: HTMLDivElement | null;
}

const columns: Array<ColumnDef<IGroup, any>> = [
  {
    id: 'name',
    accessorFn: (row) => row,
    meta: { label: 'Nome' },
    header: () => (
      <DataTableColumnHeader
        title="Nome"
        orderKey="order-name"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement => {
      const group = getValue() as IGroup;
      return (
        <>
          {group.slug in USER_GROUP_MAPPER &&
            USER_GROUP_MAPPER[group.slug as keyof typeof USER_GROUP_MAPPER]}
          {!(group.slug in USER_GROUP_MAPPER) && group.name}
        </>
      );
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    meta: { label: 'Descricao' },
    header: () => (
      <DataTableColumnHeader
        title="Descricao"
        orderKey="order-description"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }) => (
      <span className="truncate max-w-xs block">
        {(getValue() as string) || 'N/A'}
      </span>
    ),
  },
  {
    id: 'actions',
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
  },
];

export function TableGroups({
  data,
  toolbarPortal,
}: Props): React.ReactElement {
  const sidebar = useSidebar();
  const router = useRouter();

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    persistKey: 'admin:groups',
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
        onRowClick={(group) => {
          sidebar.setOpen(false);
          router.navigate({
            to: '/groups/$groupId',
            params: { groupId: group._id },
          });
        }}
      />
    </>
  );
}
