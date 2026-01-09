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
import {
  E_USER_STATUS,
  USER_GROUP_MAPPER,
  USER_STATUS_MAPPER,
} from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface Props {
  data: Array<IUser>;
  headers: Array<string>;
}

function TableUserRow({ user }: { user: IUser }): React.JSX.Element {
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
        {user.group.slug in USER_GROUP_MAPPER &&
          USER_GROUP_MAPPER[user.group.slug as keyof typeof USER_GROUP_MAPPER]}
        {!(user.group.slug in USER_GROUP_MAPPER) && user.group.slug}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'font-semibold border-transparent',
            user.status === E_USER_STATUS.ACTIVE &&
              'bg-green-100 text-green-700',
            user.status === E_USER_STATUS.INACTIVE &&
              'bg-destructive/10 text-destructive',
          )}
        >
          {user.status in USER_STATUS_MAPPER && USER_STATUS_MAPPER[user.status]}
          {!(user.status in USER_STATUS_MAPPER) && user.status}
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
          {headers.map((head) => (
            <TableHead key={head}>
              <span>{head}</span>
            </TableHead>
          ))}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user) => (
          <TableUserRow
            user={user}
            key={user._id}
          />
        ))}
      </TableBody>
    </Table>
  );
}
