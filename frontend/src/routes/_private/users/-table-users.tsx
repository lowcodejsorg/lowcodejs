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
import { IUser } from '@/lib/interfaces';
import { cn } from '@/lib/utils';
import { useRouter } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

interface Props {
  data: IUser[];
  headers: string[];
}

const RoleMapper = {
  administrator: 'Administrador',
  registered: 'Registrado',
  manager: 'Gerente',
  master: 'Dono',
};

const StatusMapper = {
  active: 'Ativo',
  inactive: 'Inativo',
};

function TableUserRow({ user }: { user: IUser }) {
  const sidebar = useSidebar();
  const router = useRouter();

  return (
    <TableRow
      key={user._id}
      className="cursor-pointer"
      onClick={() => {
        sidebar.setOpen(false);
        router.navigate({
          to: '/users/$userId',
          params: {
            userId: user._id,
          },
        });
      }}
    >
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        {RoleMapper[user?.group?.slug as keyof typeof RoleMapper] || 'N/A'}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'font-semibold border-transparent',
            user.status === 'active' && 'bg-green-100 text-green-700',
            user.status === 'inactive' && 'bg-destructive/10 text-destructive',
          )}
        >
          {StatusMapper[user?.status] || 'N/A'}
        </Badge>
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

export function TableUsers({ data, headers }: Props): React.ReactElement {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow className="">
          {headers?.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data
          .filter((u) => u.group.slug !== 'master')
          .map((user) => (
            <TableUserRow
              user={user}
              key={user?._id}
            />
          ))}
      </TableBody>
    </Table>
  );
}
