import { useRouter } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

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
import { E_ROLE } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

interface Props {
  data: Array<IGroup>;
  headers: Array<string>;
}

const RoleMapper = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Dono',
};

function TableGroupRow({ group }: { group: IGroup }) {
  const sidebar = useSidebar();
  const router = useRouter();

  return (
    <TableRow
      key={group._id}
      className="cursor-pointer"
      onClick={() => {
        sidebar.setOpen(false);
        router.navigate({
          to: '/groups/$groupId',
          params: {
            groupId: group._id,
          },
        });
      }}
    >
      <TableCell>{group.name}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {RoleMapper[group.slug as keyof typeof RoleMapper] || group.slug}
        </Badge>
      </TableCell>
      <TableCell className="truncate max-w-xs">
        {group.description || 'N/A'}
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

export function TableGroups({ data, headers }: Props): React.ReactElement {
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
        {data.map((group) => (
          <TableGroupRow
            group={group}
            key={group._id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
