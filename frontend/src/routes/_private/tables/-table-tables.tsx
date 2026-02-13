import { useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArchiveRestoreIcon,
  EllipsisIcon,
  ImageOffIcon,
  TrashIcon,
} from 'lucide-react';
import React from 'react';

import { TableDeleteDialog } from './-delete-dialog';
import { TableRemoveFromTrashDialog } from './-remove-from-trash-dialog';
import { TableSendToTrashDialog } from './-send-to-trash-dialog';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTablePermission } from '@/hooks/use-table-permission';
import { E_TABLE_VISIBILITY } from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface Props {
  data: Array<ITable>;
  headers: Array<string>;
}

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

function TableTableRow({ table }: { table: ITable }): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  const tableDeleteButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const tableRemoveFromTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );
  const tableSendoToTrashButtonRef = React.useRef<HTMLButtonElement | null>(
    null,
  );

  const permission = useTablePermission(table);

  return (
    <TableRow
      key={table._id}
      className="cursor-pointer"
      // onClick={() => {
      //   sidebar.setOpen(false);
      //   router.navigate({
      //     to: '/tables/$slug',
      //     params: {
      //       slug: table.slug,
      //     },
      //   });
      // }}
    >
      <TableCell className="flex items-center space-x-2">
        <Avatar className="size-10 rounded-md border">
          <AvatarImage
            src={table.logo?.url}
            alt={`Logo da tabela ${table.name}`}
            className="object-cover"
          />
          <AvatarFallback className="rounded-md">
            <ImageOffIcon className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <span className="truncate font-medium">{table.name}</span>
      </TableCell>
      <TableCell>
        <code className="text-sm text-muted-foreground">/{table.slug}</code>
      </TableCell>

      <TableCell>
        <Badge variant={VISIBILITY_CONFIG[table.visibility].variant}>
          {VISIBILITY_CONFIG[table.visibility].label}
        </Badge>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {table.createdAt
          ? format(
              new Date(table.createdAt),
              "dd 'de' MMM 'de' yyyy 'às' HH:mm",
              {
                locale: ptBR,
              },
            )
          : 'N/A'}
      </TableCell>

      <TableCell className="w-20">
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
              className={cn(
                'inline-flex space-x-1 w-full cursor-pointer',
                table.trashed && 'hidden',
                !permission.can('REMOVE_TABLE') && 'hidden',
              )}
              onClick={() => {
                tableDeleteButtonRef.current?.click();
              }}
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
              onClick={() => {
                tableRemoveFromTrashButtonRef.current?.click();
              }}
            >
              <ArchiveRestoreIcon className="size-4" />
              <span>Restaurar</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className={cn(
                'inline-flex space-x-1 w-full cursor-pointer',
                !table.trashed && 'hidden',
                !permission.can('REMOVE_TABLE') && 'hidden',
              )}
              onClick={() => {
                tableSendoToTrashButtonRef.current?.click();
              }}
            >
              <TrashIcon className="size-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* sheets ou dialogs aqui */}

        <TableDeleteDialog
          ref={tableDeleteButtonRef}
          slug={table.slug}
        />

        <TableRemoveFromTrashDialog
          ref={tableRemoveFromTrashButtonRef}
          slug={table.slug}
        />

        <TableSendToTrashDialog
          ref={tableSendoToTrashButtonRef}
          slug={table.slug}
        />
      </TableCell>
    </TableRow>
  );
}

export function TableTables({ data, headers }: Props): React.ReactElement {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow className="">
          {headers.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((table) => (
          <TableTableRow
            table={table}
            key={table._id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
