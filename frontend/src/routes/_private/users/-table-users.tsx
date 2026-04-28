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
import {
  E_USER_STATUS,
  USER_GROUP_MAPPER,
  USER_STATUS_MAPPER,
} from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

const ROUTE_ID = '/_private/users/';

const columns: Array<ColumnDef<IUser, any>> = [
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
  },
  {
    id: 'email',
    accessorKey: 'email',
    meta: { label: 'E-mail' },
    header: () => (
      <DataTableColumnHeader
        title="E-mail"
        orderKey="order-email"
        routeId={ROUTE_ID}
      />
    ),
  },
  {
    id: 'group',
    accessorFn: (row) => row.group,
    meta: { label: 'Grupo' },
    header: () => (
      <DataTableColumnHeader
        title="Grupo"
        orderKey="order-group"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement | string => {
      const group = getValue() as IUser['group'];
      if (group.slug in USER_GROUP_MAPPER) {
        return USER_GROUP_MAPPER[group.slug as keyof typeof USER_GROUP_MAPPER];
      }
      return group.slug;
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    meta: { label: 'Status' },
    header: () => (
      <DataTableColumnHeader
        title="Status"
        orderKey="order-status"
        routeId={ROUTE_ID}
      />
    ),
    cell: ({ getValue }): React.ReactElement => {
      const status = getValue() as string;
      return (
        <Badge
          variant="outline"
          className={cn(
            'font-semibold border-transparent',
            status === E_USER_STATUS.ACTIVE && 'bg-green-100 text-green-700',
            status === E_USER_STATUS.INACTIVE &&
              'bg-destructive/10 text-destructive',
          )}
        >
          {status in USER_STATUS_MAPPER
            ? USER_STATUS_MAPPER[status as keyof typeof USER_STATUS_MAPPER]
            : status}
        </Badge>
      );
    },
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

interface Props {
  data: Array<IUser>;
  toolbarPortal: HTMLDivElement | null;
}

export function TableUsers({ data, toolbarPortal }: Props): React.ReactElement {
  const sidebar = useSidebar();
  const router = useRouter();

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row._id,
    persistKey: 'admin:users',
    initialColumnPinning: {
      right: ['actions'],
    },
  });

  return (
    <>
      {toolbarPortal &&
        createPortal(<DataTableColumnToggle table={table} />, toolbarPortal)}
      <DataTable
        data-test-id="users-table"
        table={table}
        onRowClick={(user) => {
          sidebar.setOpen(false);
          router.navigate({
            to: '/users/$userId',
            params: { userId: user._id },
          });
        }}
      />
    </>
  );
}
