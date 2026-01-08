import { useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRightIcon, ImageOffIcon } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { E_VISIBILITY } from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';

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
  [E_VISIBILITY.PRIVATE]: { label: 'Privada', variant: 'destructive' },
  [E_VISIBILITY.RESTRICTED]: { label: 'Restrita', variant: 'secondary' },
  [E_VISIBILITY.OPEN]: { label: 'Aberta', variant: 'default' },
  [E_VISIBILITY.PUBLIC]: { label: 'Pública', variant: 'outline' },
  [E_VISIBILITY.FORM]: { label: 'Formulário', variant: 'secondary' },
};

function TableTableRow({ table }: { table: ITable }): React.JSX.Element {
  const sidebar = useSidebar();
  const router = useRouter();

  return (
    <TableRow
      key={table._id}
      className="cursor-pointer"
      onClick={() => {
        sidebar.setOpen(false);
        router.navigate({
          to: '/tables/$slug',
          params: {
            slug: table.slug,
          },
        });
      }}
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
        <Badge
          variant={VISIBILITY_CONFIG[table.configuration.visibility].variant}
        >
          {VISIBILITY_CONFIG[table.configuration.visibility].label}
        </Badge>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {table.createdAt
          ? format(new Date(table.createdAt), 'dd/MM/yyyy HH:mm', {
              locale: ptBR,
            })
          : 'N/A'}
      </TableCell>

      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
        >
          <ArrowRightIcon />
        </Button>
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
