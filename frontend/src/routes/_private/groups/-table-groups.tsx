import { useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

import { DataTable, DataTableToolbar } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataTable } from '@/hooks/use-data-table';
import { USER_GROUP_MAPPER } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

interface Props {
  data: Array<IGroup>;
}

const columns: Array<ColumnDef<IGroup, any>> = [
  {
    id: 'name',
    accessorFn: (row) => row,
    header: 'Nome',
    meta: { label: 'Nome' },
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
    header: 'Descricao',
    meta: { label: 'Descricao' },
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

export function TableGroups({ data }: Props): React.ReactElement {
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
      <DataTableToolbar table={table} />
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
