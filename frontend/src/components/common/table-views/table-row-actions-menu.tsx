import { useRouter } from '@tanstack/react-router';
import { EllipsisIcon, EyeIcon, PencilIcon } from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTablePermission } from '@/hooks/use-table-permission';
import type { IRow, ITable } from '@/lib/interfaces';

interface Props {
  slug: string;
  row: IRow;
  table?: ITable;
}

export function TableRowActionsMenu({
  slug,
  row,
  table,
}: Props): React.JSX.Element {
  const router = useRouter();
  const permission = useTablePermission(table);
  const canEdit = permission.can('UPDATE_ROW') && !row.trashed;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        dir="ltr"
        modal={false}
      >
        <DropdownMenuTrigger className="p-1 rounded-full hover:bg-muted cursor-pointer">
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="inline-flex space-x-1 w-full cursor-pointer"
            onClick={() =>
              router.navigate({
                to: '/tables/$slug/row/$rowId',
                params: { slug, rowId: row._id },
              })
            }
          >
            <EyeIcon className="size-4" />
            <span>Visualizar</span>
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem
              className="inline-flex space-x-1 w-full cursor-pointer"
              onClick={() =>
                router.navigate({
                  to: '/tables/$slug/row/$rowId',
                  params: { slug, rowId: row._id },
                  search: { mode: 'edit' },
                })
              }
            >
              <PencilIcon className="size-4" />
              <span>Editar</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
